import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { events, requests } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CODE_REGEX, SESSION_KEY } from '$lib/types';
import { getId } from '$lib/random';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
	const eventCode = params.eventCode;
	if (eventCode === 'browse') {
		return { isActive: true, eventName: 'Browse Song List', requests: [], readonly: true };
	}
	if (!CODE_REGEX.test(eventCode)) {
		error(404, 'Event not found.');
	}
	let sessionId = cookies.get(SESSION_KEY);
	if (!sessionId) {
		sessionId = getId();
		cookies.set(SESSION_KEY, sessionId, { path: '/' });
		return { requests: [] };
	}
	const [eventinfo, myrequests] = await locals.db.batch([
		locals.db.select().from(events).where(eq(events.code, eventCode)),
		locals.db
			.select()
			.from(requests)
			.where(and(eq(requests.sessionId, sessionId), eq(requests.eventCode, eventCode)))
			.orderBy(desc(requests.createdAt)),
	]);

	if (!eventinfo || !eventinfo[0]) {
		error(404, 'Event not found.');
	}

	return {
		isActive: eventinfo[0].status === 'active',
		eventName: eventinfo[0].name,
		requests: myrequests,
		readonly: false,
	};
};

export const actions = {
	default: async ({ request, locals, cookies, params }) => {
		const eventCode = params.eventCode;
		if (!CODE_REGEX.test(eventCode)) {
			error(404, 'Event not found.');
		}
		const formData = await request.formData();
		const sessionId = cookies.get(SESSION_KEY);
		const name = (formData.get('name') as string)?.trim();
		const song = (formData.get('song') as string)?.trim();
		const [title, artist] = JSON.parse(song || '[]') as [string, string];

		if (!sessionId || !name || !title || !artist) {
			return fail(400, { error: 'Missing required fields' });
		}

		await locals.db.$client
			.prepare(
				`
      INSERT INTO requests (session_id, name, title, artist, event_code)
      SELECT ?, ?, ?, ?, e.code FROM events e
      WHERE e.code = ? AND e.status = 'active';
		`
			)
			.bind(sessionId, name, title, artist, eventCode)
			.run();

		return { success: true };
	},
} satisfies Actions;

import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import {
	eventRandomLists,
	events,
	randomListEntries,
	randomLists,
	requests,
} from '$lib/server/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { CODE_REGEX, SESSION_KEY } from '$lib/types';
import { getId } from '$lib/random';
import { songValue, type RandomPickerList } from '$lib/random-lists';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
	const eventCode = params.eventCode;
	if (eventCode === 'browse') {
		return {
			isActive: true,
			eventName: 'Browse Song List',
			requests: [],
			randomLists: [],
			readonly: true,
		};
	}
	if (!CODE_REGEX.test(eventCode)) {
		error(404, 'Event not found.');
	}
	let sessionId = cookies.get(SESSION_KEY);
	if (!sessionId) {
		sessionId = getId();
		cookies.set(SESSION_KEY, sessionId, { path: '/' });
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

	const listRows = await locals.db
		.select({
			listId: randomLists.id,
			title: randomLists.title,
			note: randomLists.note,
			kind: randomLists.kind,
			entryId: randomListEntries.id,
			entryTitle: randomListEntries.title,
			entryArtist: randomListEntries.artist,
		})
		.from(eventRandomLists)
		.innerJoin(randomLists, eq(randomLists.id, eventRandomLists.listId))
		.innerJoin(randomListEntries, eq(randomListEntries.listId, randomLists.id))
		.where(eq(eventRandomLists.eventCode, eventCode))
		.orderBy(asc(randomLists.title), asc(randomListEntries.sortOrder), asc(randomListEntries.id));

	const randomListsForEvent: RandomPickerList[] = [];
	for (const row of listRows) {
		let list = randomListsForEvent.find((item) => item.id === row.listId);
		if (!list) {
			list = {
				id: row.listId,
				title: row.title,
				note: row.note,
				kind: row.kind,
				items: [],
			};
			randomListsForEvent.push(list);
		}

		list.items.push({
			label: row.entryTitle,
			value:
				row.kind === 'song' ? songValue(row.entryTitle, row.entryArtist ?? '') : row.entryTitle,
			detail: row.kind === 'song' ? (row.entryArtist ?? '') : undefined,
		});
	}

	return {
		isActive: eventinfo[0].status === 'active',
		eventName: eventinfo[0].name,
		requests: myrequests,
		randomLists: randomListsForEvent,
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

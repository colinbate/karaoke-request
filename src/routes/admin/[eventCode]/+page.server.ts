import type { PageServerLoad, Actions } from './$types';
import { events, requests } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { CODE_REGEX } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const eventCode = params.eventCode;
	if (!CODE_REGEX.test(eventCode)) {
		error(404, 'Event not found.');
	}
	const [eventRequests, eventinfo] = await locals.db.batch([
		locals.db
			.select()
			.from(requests)
			.where(eq(requests.eventCode, eventCode))
			.orderBy(requests.createdAt),
		locals.db.select().from(events).where(eq(events.code, eventCode)),
	]);
	if (!eventinfo || !eventinfo[0]) {
		error(404, 'Event not found.');
	}
	return { eventRequests, eventinfo: eventinfo[0] };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const status = formData.get('status');

		if (!id || (status !== 'done' && status !== 'pending')) return { error: 'Invalid parameters' };

		await locals.db.update(requests).set({ status }).where(eq(requests.id, id));

		return { success: true };
	},
} satisfies Actions;

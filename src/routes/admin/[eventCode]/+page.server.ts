import type { PageServerLoad, Actions } from './$types';
import {
	eventRandomLists,
	events,
	randomListEntries,
	randomLists,
	requests,
} from '$lib/server/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { CODE_REGEX } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const eventCode = params.eventCode;
	if (!CODE_REGEX.test(eventCode)) {
		error(404, 'Event not found.');
	}
	const [pending, done, eventinfo, lists, linkedLists] = await locals.db.batch([
		locals.db
			.select()
			.from(requests)
			.where(and(eq(requests.eventCode, eventCode), eq(requests.status, 'pending')))
			.orderBy(requests.createdAt),
		locals.db
			.select()
			.from(requests)
			.where(and(eq(requests.eventCode, eventCode), eq(requests.status, 'done')))
			.orderBy(desc(requests.updatedAt)),
		locals.db.select().from(events).where(eq(events.code, eventCode)),
		locals.db
			.select({
				id: randomLists.id,
				title: randomLists.title,
				note: randomLists.note,
				kind: randomLists.kind,
				entryCount: sql<number>`COUNT(${randomListEntries.id})`.as('entryCount'),
			})
			.from(randomLists)
			.leftJoin(randomListEntries, eq(randomListEntries.listId, randomLists.id))
			.groupBy(randomLists.id, randomLists.title, randomLists.note, randomLists.kind)
			.orderBy(asc(randomLists.title)),
		locals.db.select().from(eventRandomLists).where(eq(eventRandomLists.eventCode, eventCode)),
	]);
	if (!eventinfo || !eventinfo[0]) {
		error(404, 'Event not found.');
	}

	const linkedListIds = new Set(linkedLists.map((link) => link.listId));

	return {
		pending,
		done,
		eventinfo: eventinfo[0],
		randomLists: lists.map((list) => ({ ...list, active: linkedListIds.has(list.id) })),
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const status = formData.get('status');

		if (!id || (status !== 'done' && status !== 'pending')) return { error: 'Invalid parameters' };
		const updatedAt = new Date().toISOString();
		await locals.db.update(requests).set({ status, updatedAt }).where(eq(requests.id, id));

		return { success: true };
	},

	linkList: async ({ request, locals, params }) => {
		const eventCode = params.eventCode;
		const formData = await request.formData();
		const listId = Number(formData.get('listId'));

		if (!CODE_REGEX.test(eventCode) || !listId) {
			return fail(400, { error: 'Invalid parameters' });
		}

		const [existing] = await locals.db
			.select()
			.from(eventRandomLists)
			.where(and(eq(eventRandomLists.eventCode, eventCode), eq(eventRandomLists.listId, listId)));

		if (!existing) {
			await locals.db.insert(eventRandomLists).values({ eventCode, listId });
		}

		return { success: true };
	},

	unlinkList: async ({ request, locals, params }) => {
		const eventCode = params.eventCode;
		const formData = await request.formData();
		const listId = Number(formData.get('listId'));

		if (!CODE_REGEX.test(eventCode) || !listId) {
			return fail(400, { error: 'Invalid parameters' });
		}

		await locals.db
			.delete(eventRandomLists)
			.where(and(eq(eventRandomLists.eventCode, eventCode), eq(eventRandomLists.listId, listId)));

		return { success: true };
	},
} satisfies Actions;

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
import { songValue, type RandomPickerList } from '$lib/random-lists';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const eventCode = params.eventCode;
	if (!CODE_REGEX.test(eventCode)) {
		error(404, 'Event not found.');
	}
	const [pending, done, eventinfo, lists, linkedLists, activeSongListEntries] =
		await locals.db.batch([
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
					adminOnly: randomLists.adminOnly,
					entryCount: sql<number>`COUNT(${randomListEntries.id})`.as('entryCount'),
				})
				.from(randomLists)
				.leftJoin(randomListEntries, eq(randomListEntries.listId, randomLists.id))
				.groupBy(
					randomLists.id,
					randomLists.title,
					randomLists.note,
					randomLists.kind,
					randomLists.adminOnly
				)
				.orderBy(asc(randomLists.title)),
			locals.db.select().from(eventRandomLists).where(eq(eventRandomLists.eventCode, eventCode)),
			locals.db
				.select({
					listId: randomLists.id,
					title: randomLists.title,
					note: randomLists.note,
					kind: randomLists.kind,
					entryTitle: sql<string>`${randomListEntries.title}`.as('entryTitle'),
					entryArtist: sql<string | null>`${randomListEntries.artist}`.as('entryArtist'),
				})
				.from(eventRandomLists)
				.innerJoin(randomLists, eq(randomLists.id, eventRandomLists.listId))
				.innerJoin(randomListEntries, eq(randomListEntries.listId, randomLists.id))
				.where(and(eq(eventRandomLists.eventCode, eventCode), eq(randomLists.kind, 'song')))
				.orderBy(
					asc(randomLists.title),
					asc(randomListEntries.sortOrder),
					asc(randomListEntries.id)
				),
		]);
	if (!eventinfo || !eventinfo[0]) {
		error(404, 'Event not found.');
	}

	const linkedListIds = new Set(linkedLists.map((link) => link.listId));
	const adminSongLists: RandomPickerList[] = [];
	for (const row of activeSongListEntries) {
		let list = adminSongLists.find((item) => item.id === row.listId);
		if (!list) {
			list = {
				id: row.listId,
				title: row.title,
				note: row.note,
				kind: row.kind,
				items: [],
			};
			adminSongLists.push(list);
		}

		list.items.push({
			label: row.entryTitle,
			value: songValue(row.entryTitle, row.entryArtist ?? ''),
			detail: row.entryArtist ?? undefined,
		});
	}

	return {
		pending,
		done,
		eventinfo: eventinfo[0],
		requestUrl: new URL(`/event/${eventCode}`, url).toString(),
		randomLists: lists.map((list) => ({ ...list, active: linkedListIds.has(list.id) })),
		adminSongLists,
	};
};

export const actions: Actions = {
	manualRequest: async ({ request, locals, params }) => {
		const eventCode = params.eventCode;
		const formData = await request.formData();
		const name = (formData.get('name') as string | null)?.trim();
		const title = (formData.get('title') as string | null)?.trim();
		const artist = (formData.get('artist') as string | null)?.trim();

		if (!CODE_REGEX.test(eventCode) || !name || !title || !artist) {
			return fail(400, { error: 'Missing required fields' });
		}

		const [eventinfo] = await locals.db.select().from(events).where(eq(events.code, eventCode));
		if (!eventinfo) {
			return fail(404, { error: 'Event not found' });
		}

		await locals.db.insert(requests).values({
			sessionId: `admin:${eventCode}`,
			name,
			title,
			artist,
			eventCode,
		});

		return { success: true };
	},

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

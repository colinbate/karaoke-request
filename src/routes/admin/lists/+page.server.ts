import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { eventRandomLists, randomListEntries, randomLists } from '$lib/server/db/schema';
import { asc, eq, sql } from 'drizzle-orm';
import type { RandomListKind } from '$lib/random-lists';

function isRandomListKind(value: FormDataEntryValue | null): value is RandomListKind {
	return value === 'song' || value === 'artist';
}

function parseSongLine(line: string) {
	const separators = [' by ', ' - ', '\t'];
	for (const separator of separators) {
		const index = line.indexOf(separator);
		if (index > 0) {
			const title = line.slice(0, index).trim();
			const artist = line.slice(index + separator.length).trim();
			if (title && artist) {
				return { title, artist };
			}
		}
	}

	return null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const [lists, entries] = await locals.db.batch([
		locals.db.select().from(randomLists).orderBy(asc(randomLists.title)),
		locals.db
			.select()
			.from(randomListEntries)
			.orderBy(
				asc(randomListEntries.listId),
				asc(randomListEntries.sortOrder),
				asc(randomListEntries.id)
			),
	]);

	return {
		lists: lists.map((list) => ({
			...list,
			entries: entries.filter((entry) => entry.listId === list.id),
		})),
	};
};

export const actions = {
	createList: async ({ request, locals }) => {
		const formData = await request.formData();
		const title = (formData.get('title') as string)?.trim();
		const note = ((formData.get('note') as string) ?? '').trim();
		const kind = formData.get('kind');
		const adminOnly = formData.get('adminOnly') === 'on';

		if (!title || !isRandomListKind(kind)) {
			return fail(400, { error: 'Title and type are required' });
		}

		await locals.db.insert(randomLists).values({ title, note, kind, adminOnly });
		return { success: true };
	},

	updateList: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const title = (formData.get('title') as string)?.trim();
		const note = ((formData.get('note') as string) ?? '').trim();
		const adminOnly = formData.get('adminOnly') === 'on';

		if (!id || !title) {
			return fail(400, { error: 'List and title are required' });
		}

		await locals.db
			.update(randomLists)
			.set({ title, note, adminOnly, updatedAt: new Date().toISOString() })
			.where(eq(randomLists.id, id));

		return { success: true };
	},

	addEntries: async ({ request, locals }) => {
		const formData = await request.formData();
		const listId = Number(formData.get('listId'));
		const entriesText = ((formData.get('entries') as string) ?? '').trim();

		if (!listId || !entriesText) {
			return fail(400, { error: 'List and entries are required' });
		}

		const [list] = await locals.db.select().from(randomLists).where(eq(randomLists.id, listId));
		if (!list) {
			return fail(404, { error: 'List not found' });
		}

		const rows = entriesText
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

		const entryValues = rows
			.map((line) => {
				if (list.kind === 'artist') {
					return { title: line, artist: null };
				}

				return parseSongLine(line);
			})
			.filter((entry): entry is { title: string; artist: string | null } => entry !== null);

		if (entryValues.length === 0) {
			return fail(400, { error: 'No valid entries found' });
		}

		const [maxOrder] = await locals.db
			.select({ value: sql<number>`COALESCE(MAX(${randomListEntries.sortOrder}), 0)` })
			.from(randomListEntries)
			.where(eq(randomListEntries.listId, listId));

		const start = maxOrder?.value ?? 0;
		await locals.db.insert(randomListEntries).values(
			entryValues.map((entry, index) => ({
				listId,
				title: entry.title,
				artist: entry.artist,
				sortOrder: start + index + 1,
			}))
		);

		await locals.db
			.update(randomLists)
			.set({ updatedAt: new Date().toISOString() })
			.where(eq(randomLists.id, listId));

		return { success: true };
	},

	deleteEntry: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) {
			return fail(400, { error: 'Entry is required' });
		}

		await locals.db.delete(randomListEntries).where(eq(randomListEntries.id, id));
		return { success: true };
	},

	deleteList: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) {
			return fail(400, { error: 'List is required' });
		}

		await locals.db.delete(eventRandomLists).where(eq(eventRandomLists.listId, id));
		await locals.db.delete(randomListEntries).where(eq(randomListEntries.listId, id));
		await locals.db.delete(randomLists).where(eq(randomLists.id, id));
		return { success: true };
	},
} satisfies Actions;

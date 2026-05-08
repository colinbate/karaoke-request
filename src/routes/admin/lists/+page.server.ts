import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { eventRandomLists, randomListEntries, randomLists } from '$lib/server/db/schema';
import { asc, eq, sql } from 'drizzle-orm';
import type { RandomListKind } from '$lib/random-lists';

type SongEntry = { title: string; artist: string | null };

const MAX_ENTRY_INSERT_ROWS = 24;

function isRandomListKind(value: FormDataEntryValue | null): value is RandomListKind {
	return value === 'song' || value === 'artist';
}

function parseSongLine(line: string): SongEntry | null {
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

function countDelimitedFields(line: string, delimiter: string) {
	let count = 1;
	let inQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === delimiter && !inQuotes) {
			count += 1;
		}
	}

	return count;
}

function detectCsvDelimiter(csv: string) {
	const firstLine = csv.split(/\r?\n/, 1)[0] ?? '';
	const delimiters = [';', ',', '\t'];

	return delimiters.reduce((best, delimiter) =>
		countDelimitedFields(firstLine, delimiter) > countDelimitedFields(firstLine, best)
			? delimiter
			: best
	);
}

function parseDelimitedRows(csv: string) {
	const delimiter = detectCsvDelimiter(csv);
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let index = 0; index < csv.length; index += 1) {
		const char = csv[index];

		if (char === '"') {
			if (inQuotes && csv[index + 1] === '"') {
				field += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			row.push(field.trim());
			field = '';
		} else if ((char === '\n' || char === '\r') && !inQuotes) {
			if (char === '\r' && csv[index + 1] === '\n') {
				index += 1;
			}
			row.push(field.trim());
			if (row.some(Boolean)) {
				rows.push(row);
			}
			row = [];
			field = '';
		} else {
			field += char;
		}
	}

	row.push(field.trim());
	if (row.some(Boolean)) {
		rows.push(row);
	}

	return rows;
}

function parseKarafunCsv(csv: string): SongEntry[] {
	const rows = parseDelimitedRows(csv);
	const [headers, ...body] = rows;
	if (!headers) {
		return [];
	}

	const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());
	const titleIndex = normalizedHeaders.findIndex((header) => header === 'title');
	const artistIndex = normalizedHeaders.findIndex((header) => header === 'artist');

	if (titleIndex === -1 || artistIndex === -1) {
		return [];
	}

	return body.flatMap((row) => {
		const title = row[titleIndex]?.trim();
		const artist = row[artistIndex]?.trim();

		if (!title || !artist) {
			return [];
		}

		return [{ title, artist }];
	});
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
		const playlistCsv = formData.get('playlistCsv');
		const hasPlaylistCsv =
			playlistCsv !== null && typeof playlistCsv !== 'string' && playlistCsv.size > 0;

		if (!listId || (!entriesText && !hasPlaylistCsv)) {
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

		const pastedEntries = rows
			.map((line) => {
				if (list.kind === 'artist') {
					return { title: line, artist: null };
				}

				return parseSongLine(line);
			})
			.filter((entry): entry is SongEntry => entry !== null);

		let csvEntries: SongEntry[] = [];
		if (hasPlaylistCsv) {
			if (list.kind !== 'song') {
				return fail(400, { error: 'KaraFun CSV imports can only be added to song lists' });
			}

			csvEntries = parseKarafunCsv(await playlistCsv.text());
		}

		const entryValues = [...pastedEntries, ...csvEntries];

		if (entryValues.length === 0) {
			return fail(400, { error: 'No valid entries found' });
		}

		const [maxOrder] = await locals.db
			.select({ value: sql<number>`COALESCE(MAX(${randomListEntries.sortOrder}), 0)` })
			.from(randomListEntries)
			.where(eq(randomListEntries.listId, listId));

		const start = maxOrder?.value ?? 0;
		const newEntries = entryValues.map((entry, index) => ({
			listId,
			title: entry.title,
			artist: entry.artist,
			sortOrder: start + index + 1,
		}));

		type BatchQueries = Parameters<typeof locals.db.batch>[0];
		type BatchQuery = BatchQueries[number];

		const mutations: BatchQuery[] = [];
		for (let index = 0; index < newEntries.length; index += MAX_ENTRY_INSERT_ROWS) {
			mutations.push(
				locals.db
					.insert(randomListEntries)
					.values(newEntries.slice(index, index + MAX_ENTRY_INSERT_ROWS))
			);
		}

		mutations.push(
			locals.db
				.update(randomLists)
				.set({ updatedAt: new Date().toISOString() })
				.where(eq(randomLists.id, listId))
		);

		await locals.db.batch(mutations as [BatchQuery, ...BatchQuery[]]);

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

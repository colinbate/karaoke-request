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

type RandomRequestSource = {
	fromRandomList: 0 | 1;
	randomListTitle: string | null;
	randomListKind: 'song' | 'artist' | null;
};

const noRandomSource: RandomRequestSource = {
	fromRandomList: 0,
	randomListTitle: null,
	randomListKind: null,
};

function parseSongValue(value: string | undefined): [string, string] | null {
	try {
		const parsed: unknown = JSON.parse(value || '[]');
		if (
			Array.isArray(parsed) &&
			parsed.length === 2 &&
			typeof parsed[0] === 'string' &&
			typeof parsed[1] === 'string'
		) {
			return [parsed[0], parsed[1]];
		}
	} catch {
		return null;
	}

	return null;
}

function randomListKind(value: FormDataEntryValue | null): 'song' | 'artist' | null {
	if (value === 'song' || value === 'artist') {
		return value;
	}

	return null;
}

function randomListId(value: FormDataEntryValue | null) {
	if (typeof value !== 'string') {
		return null;
	}

	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
}

async function getRandomRequestSource(
	db: App.Locals['db'],
	eventCode: string,
	formData: FormData,
	title: string,
	artist: string
): Promise<RandomRequestSource> {
	const listId = randomListId(formData.get('randomListId'));
	const listKind = randomListKind(formData.get('randomListKind'));

	if (!listId || !listKind) {
		return noRandomSource;
	}

	const [list] = await db
		.select({
			id: randomLists.id,
			title: randomLists.title,
			kind: randomLists.kind,
		})
		.from(eventRandomLists)
		.innerJoin(randomLists, eq(randomLists.id, eventRandomLists.listId))
		.where(
			and(
				eq(eventRandomLists.eventCode, eventCode),
				eq(randomLists.id, listId),
				eq(randomLists.kind, listKind),
				eq(randomLists.adminOnly, false)
			)
		);

	if (!list) {
		return noRandomSource;
	}

	const rolledArtist = formData.get('randomRolledArtist');
	if (list.kind === 'artist' && rolledArtist !== artist) {
		return noRandomSource;
	}

	const [matchingEntry] = await db
		.select({ id: randomListEntries.id })
		.from(randomListEntries)
		.where(
			list.kind === 'song'
				? and(
						eq(randomListEntries.listId, list.id),
						eq(randomListEntries.title, title),
						eq(randomListEntries.artist, artist)
					)
				: and(eq(randomListEntries.listId, list.id), eq(randomListEntries.title, artist))
		);

	if (!matchingEntry) {
		return noRandomSource;
	}

	return {
		fromRandomList: 1,
		randomListTitle: list.title,
		randomListKind: list.kind,
	};
}

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
		.where(and(eq(eventRandomLists.eventCode, eventCode), eq(randomLists.adminOnly, false)))
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
		const parsedSong = parseSongValue(song);

		if (!sessionId || !name || !parsedSong) {
			return fail(400, { error: 'Missing required fields' });
		}

		const [title, artist] = parsedSong;
		if (!title.trim() || !artist.trim()) {
			return fail(400, { error: 'Missing required fields' });
		}

		const randomSource = await getRandomRequestSource(
			locals.db,
			eventCode,
			formData,
			title,
			artist
		);

		await locals.db.$client
			.prepare(
				`
      INSERT INTO requests (
        session_id,
        name,
        title,
        artist,
        event_code,
        from_random_list,
        random_list_title,
        random_list_kind
      )
      SELECT ?, ?, ?, ?, e.code, ?, ?, ? FROM events e
      WHERE e.code = ? AND e.status = 'active';
		`
			)
			.bind(
				sessionId,
				name,
				title,
				artist,
				randomSource.fromRandomList,
				randomSource.randomListTitle,
				randomSource.randomListKind,
				eventCode
			)
			.run();

		return { success: true };
	},
} satisfies Actions;

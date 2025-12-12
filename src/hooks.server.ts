import { getDb } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.platform?.env.DB) {
		return error(500, 'No database available');
	}
	const db = getDb(event.platform.env.DB);
	event.locals.db = db;
	return resolve(event);
};

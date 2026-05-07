import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { events } from '$lib/server/db/schema';
import { CODE_REGEX } from '$lib/types';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const eventCode = params.eventCode;
	if (!CODE_REGEX.test(eventCode)) {
		error(404, 'Event not found.');
	}

	const [eventinfo] = await locals.db.select().from(events).where(eq(events.code, eventCode));
	if (!eventinfo) {
		error(404, 'Event not found.');
	}

	return {
		eventCode,
		eventName: eventinfo.name,
		requestUrl: new URL(`/event/${eventCode}`, url).toString(),
	};
};

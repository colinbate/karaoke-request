import type { PageServerLoad } from './$types';
import { events } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const activeEvents = await locals.db
		.select()
		.from(events)
		.where(eq(events.status, 'active'))
		.all();

	return { events: activeEvents };
};

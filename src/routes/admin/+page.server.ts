import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { events, requests } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { randomid } from '$lib/random';
import { isEventStatus } from '$lib/statuses';

export const load: PageServerLoad = async ({ locals }) => {
	const doneCount = sql<number>`
    COALESCE(SUM(CASE WHEN ${requests.status} = 'done' THEN 1 ELSE 0 END), 0)
  `.as('doneCount');

	const pendingCount = sql<number>`
    COALESCE(SUM(CASE WHEN ${requests.status} = 'pending' THEN 1 ELSE 0 END), 0)
  `.as('pendingCount');

	const rows = await locals.db
		.select({
			id: events.id,
			code: events.code,
			name: events.name,
			status: events.status,
			eventDate: events.eventDate,
			createdAt: events.createdAt,
			doneCount,
			pendingCount,
		})
		.from(events)
		.leftJoin(requests, eq(requests.eventCode, events.code))
		.groupBy(events.id, events.code, events.name, events.status, events.eventDate, events.createdAt)
		.orderBy(desc(events.eventDate));

	return { events: rows };
};

export const actions = {
	create: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const eventDate = formData.get('eventDate') as string;

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		const code = randomid();

		await locals.db.insert(events).values({
			code,
			name,
			eventDate: eventDate || new Date().toISOString().slice(0, 10),
		});

		return { success: true, code };
	},

	updateStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = formData.get('code') as string;
		const status = formData.get('status') as string;

		if (!code || !status || !isEventStatus(status)) {
			return fail(400, { error: 'Missing fields' });
		}

		await locals.db.update(events).set({ status }).where(eq(events.code, code));

		return { success: true };
	},
} satisfies Actions;

import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { events } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomid } from '$lib/random';

export const load: PageServerLoad = async ({ locals }) => {
	const allEvents = await locals.db.select().from(events).orderBy(desc(events.createdAt)).all();

	return { events: allEvents };
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

		if (!code || !status) {
			return fail(400, { error: 'Missing fields' });
		}

		await locals.db.update(events).set({ status }).where(eq(events.code, code));

		return { success: true };
	},
} satisfies Actions;

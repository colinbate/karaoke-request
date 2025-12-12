import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const events = sqliteTable('events', {
	id: integer('id').primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	status: text('status').notNull().default('upcoming'),
	eventDate: text('event_date')
		.notNull()
		.default(sql`(date('now')`),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(strftime('%FT%H:%M:%fZ', 'now'))`),
});

export const requests = sqliteTable('requests', {
	id: integer('id').primaryKey(),
	sessionId: text('session_id').notNull(),
	name: text('name').notNull(),
	title: text('title').notNull(),
	artist: text('artist').notNull(),
	status: text('status').notNull().default('pending'),
	eventCode: text('event_code')
		.notNull()
		.references(() => events.code),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(strftime('%FT%H:%M:%fZ', 'now'))`),
});

export type KaraokeEvent = typeof events.$inferSelect;
export type NewKaraokeEvent = typeof events.$inferInsert;
export type KaraokeRequest = typeof requests.$inferSelect;
export type NewKaraokeRequest = typeof requests.$inferInsert;

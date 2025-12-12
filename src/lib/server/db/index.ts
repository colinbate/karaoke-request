import { drizzle } from 'drizzle-orm/d1';

export function getDb(binding: D1Database) {
	return drizzle(binding, { logger: true });
}

export type ORM = ReturnType<typeof getDb>;

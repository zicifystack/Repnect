import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Upvote counts — one row per project slug
export const upvotes = sqliteTable('upvotes', {
	slug: text('slug').primaryKey(),
	count: integer('count').notNull().default(0)
});

// Better-auth tables (generated — do not edit manually)
export * from './auth.schema';

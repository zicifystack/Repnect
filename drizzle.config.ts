import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	migrations: {
		table: '__drizzle_migrations',
		schema: 'public'
	},
	dbCredentials: {
		url: process.env.DATABASE_URL ?? '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/local.sqlite'
	},
	verbose: true,
	strict: true,
	out: './drizzle'
});

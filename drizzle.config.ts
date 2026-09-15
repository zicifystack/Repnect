import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	// For local dev: use wrangler's local D1 file.
	// In CI/production migrations are applied via `wrangler d1 migrations apply`.
	dbCredentials: {
		url: process.env.DATABASE_URL ?? '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/local.sqlite'
	},
	verbose: true,
	strict: true,
	out: './drizzle'
});

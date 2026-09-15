/**
 * Remote functions for project upvotes.
 *
 * These always execute on the server — the SvelteKit build pipeline
 * automatically transforms browser calls into typed fetch requests.
 *
 * @see https://svelte.dev/docs/kit/remote-functions
 */
import { query, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index';
import { upvotes } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// ── Shared validation ────────────────────────────────────────────────────────

const SlugSchema = z.object({
	slug: z.string().min(1).max(100)
});

const VoteSchema = z.object({
	slug: z.string().min(1).max(100),
	action: z.enum(['upvote', 'unvote'])
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function resolveDb() {
	const event = getRequestEvent();
	const d1 = (event.platform as App.Platform | undefined)?.env?.DB;
	if (!d1) error(500, 'D1 binding not available');
	return getDb(d1);
}

// ── Remote functions ─────────────────────────────────────────────────────────

/**
 * Fetch the current upvote count for a project slug.
 *
 * Client usage:
 * ```svelte
 * import { getUpvoteCount } from '$lib/upvote.remote';
 * const count = await getUpvoteCount({ slug: 'my-project' });
 * ```
 */
export const getUpvoteCount = query(SlugSchema, async ({ slug }) => {
	const db = await resolveDb();
	const row = await db.select().from(upvotes).where(eq(upvotes.slug, slug)).get();
	return { slug, count: row?.count ?? 0 };
});

/**
 * Upvote or un-vote a project.
 *
 * Client usage:
 * ```svelte
 * import { voteProject } from '$lib/upvote.remote';
 * const result = await voteProject({ slug: 'my-project', action: 'upvote' });
 * ```
 */
export const voteProject = command(VoteSchema, async ({ slug, action }) => {
	const db = await resolveDb();
	const delta = action === 'upvote' ? 1 : -1;

	await db
		.insert(upvotes)
		.values({ slug, count: delta === 1 ? 1 : 0 })
		.onConflictDoUpdate({
			target: upvotes.slug,
			set: { count: sql`MAX(0, ${upvotes.count} + ${delta})` }
		});

	const row = await db.select().from(upvotes).where(eq(upvotes.slug, slug)).get();
	return { slug, count: row?.count ?? 0, action };
});

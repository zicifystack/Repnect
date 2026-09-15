import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index';
import { upvotes } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export function _validateSlug(slug: string): boolean {
	return typeof slug === 'string' && slug.length > 0 && slug.length <= 100;
}

async function getCount(d1: D1Database, slug: string): Promise<number> {
	const db = getDb(d1);
	const row = await db.select().from(upvotes).where(eq(upvotes.slug, slug)).get();
	return row?.count ?? 0;
}

async function upsertCount(d1: D1Database, slug: string, delta: 1 | -1): Promise<number> {
	const db = getDb(d1);
	await db
		.insert(upvotes)
		.values({ slug, count: delta === 1 ? 1 : 0 })
		.onConflictDoUpdate({
			target: upvotes.slug,
			set: { count: sql`MAX(0, ${upvotes.count} + ${delta})` }
		});
	const row = await db.select().from(upvotes).where(eq(upvotes.slug, slug)).get();
	return row?.count ?? 0;
}

export const GET: RequestHandler = async ({ url, platform }) => {
	const slug = url.searchParams.get('slug') ?? '';
	if (!_validateSlug(slug)) error(400, 'Invalid slug');
	if (!platform?.env?.DB) error(500, 'D1 binding not available');
	try {
		const count = await getCount(platform.env.DB, slug);
		return json({ slug, count });
	} catch {
		error(500, 'Database error');
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const { slug, action } = await request.json() as { slug: string; action: string };
	if (!_validateSlug(slug)) error(400, 'Invalid slug');
	if (action !== 'upvote' && action !== 'unvote') error(400, 'action must be "upvote" or "unvote"');
	if (!platform?.env?.DB) error(500, 'D1 binding not available');
	try {
		const delta = action === 'upvote' ? 1 : -1;
		const count = await upsertCount(platform.env.DB, slug, delta as 1 | -1);
		return json({ slug, count, action });
	} catch {
		error(500, 'Database error');
	}
};

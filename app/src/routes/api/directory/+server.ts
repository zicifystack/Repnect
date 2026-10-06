import { json } from '@sveltejs/kit';
import { createCtx } from '$lib/server/ctx';
import { httpError } from '$lib/server/errors';
import { listDirectoryItems } from '$lib/server/directory/service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const ctx = createCtx(platform);
		const search = url.searchParams.get('search') ?? undefined;
		const category = url.searchParams.get('category') ?? undefined;
		const state = url.searchParams.get('state') ?? undefined;
		const connection = url.searchParams.get('connection') ?? undefined;
		const verifiedOnly = url.searchParams.get('verified') === 'true';
		const goodFirstIssuesOnly = url.searchParams.get('issues') === 'true';
		const minStars = url.searchParams.has('minStars')
			? Number(url.searchParams.get('minStars'))
			: undefined;

		const items = await listDirectoryItems(ctx, {
			search,
			category,
			state,
			connection,
			verifiedOnly,
			goodFirstIssuesOnly,
			minStars
		});

		return json({ items });
	} catch (e) {
		httpError(e);
	}
};

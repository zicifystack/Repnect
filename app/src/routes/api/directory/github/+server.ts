import { json } from '@sveltejs/kit';
import { createCtx } from '$lib/server/ctx';
import { AppError, httpError } from '$lib/server/errors';
import { fetchGitHubRepoDetails } from '$lib/server/directory/service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	const repo = url.searchParams.get('repo');
	if (!repo) {
		httpError(new AppError('invalid', 'Missing repo query parameter'));
	}

	try {
		const ctx = createCtx(platform);
		const details = await fetchGitHubRepoDetails(ctx, repo);
		return json({ ok: true, details });
	} catch (e) {
		httpError(e);
	}
};

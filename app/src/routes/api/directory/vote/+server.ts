import { json } from '@sveltejs/kit';
import { createCtx } from '$lib/server/ctx';
import { AppError, httpError } from '$lib/server/errors';
import { castVote, getVoteStats } from '$lib/server/directory/votes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
	const projectId = url.searchParams.get('projectId');
	if (!projectId) {
		httpError(new AppError('invalid', 'Missing projectId parameter'));
	}

	const voterId = cookies.get('voter_id');
	try {
		const ctx = createCtx(platform);
		const stats = await getVoteStats(ctx, projectId, voterId);
		return json({ ok: true, ...stats });
	} catch (e) {
		httpError(e);
	}
};

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
	let body: { projectId?: string; type?: 'up' | 'down' };
	try {
		body = await request.json();
	} catch {
		httpError(new AppError('invalid', 'Request body must be JSON'));
	}

	if (!body.projectId || (body.type !== 'up' && body.type !== 'down')) {
		httpError(new AppError('invalid', 'projectId and valid type ("up" | "down") are required'));
	}

	let voterId = cookies.get('voter_id');
	if (!voterId) {
		voterId = crypto.randomUUID();
		cookies.set('voter_id', voterId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 365 * 24 * 60 * 60
		});
	}

	try {
		const ctx = createCtx(platform);
		const stats = await castVote(ctx, voterId, body.projectId, body.type);
		return json({ ok: true, ...stats });
	} catch (e) {
		httpError(e);
	}
};

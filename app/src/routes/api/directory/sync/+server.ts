import { json } from '@sveltejs/kit';
import { createCtx } from '$lib/server/ctx';
import { AppError, httpError } from '$lib/server/errors';
import { syncDirectoryItems } from '$lib/server/directory/service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const authHeader = request.headers.get('authorization') ?? '';
	const token = authHeader.replace(/^Bearer\s+/i, '');
	const expected = platform?.env?.SYNC_SECRET;

	if (expected && token !== expected) {
		httpError(new AppError('unauthorized', 'Invalid sync token'));
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		httpError(new AppError('invalid', 'Request body must be JSON'));
	}

	try {
		const ctx = createCtx(platform);
		const result = await syncDirectoryItems(ctx, Array.isArray(body) ? body : [body]);
		return json({ ok: true, ...result });
	} catch (e) {
		httpError(e);
	}
};

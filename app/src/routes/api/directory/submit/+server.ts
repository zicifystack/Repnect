import { json } from '@sveltejs/kit';
import { createCtx } from '$lib/server/ctx';
import { AppError, httpError } from '$lib/server/errors';
import { submitProject } from '$lib/server/directory/service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		httpError(new AppError('invalid', 'Request body must be JSON'));
	}

	try {
		const ctx = createCtx(platform);
		const result = await submitProject(ctx, ip, body);
		return json({ ok: true, ...result }, { status: 201 });
	} catch (e) {
		httpError(e);
	}
};

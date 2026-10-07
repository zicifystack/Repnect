import { json } from '@sveltejs/kit';
import { createCtx } from '$lib/server/ctx';
import { httpError } from '$lib/server/errors';
import { trackOutboundClick, trackProjectView, trackSearch } from '$lib/server/directory/analytics';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: {
		type?: string;
		projectId?: string;
		destination?: 'website' | 'github';
		query?: string;
		resultCount?: number;
	};

	try {
		body = await request.json();
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	try {
		const ctx = createCtx(platform);

		if (body.type === 'view' && body.projectId) {
			ctx.waitUntil(trackProjectView(ctx, body.projectId));
		} else if (body.type === 'click' && body.projectId && body.destination) {
			ctx.waitUntil(trackOutboundClick(ctx, body.projectId, body.destination));
		} else if (body.type === 'search' && body.query) {
			ctx.waitUntil(trackSearch(ctx, body.query, body.resultCount ?? 0));
		}

		return json({ ok: true });
	} catch (e) {
		httpError(e);
	}
};

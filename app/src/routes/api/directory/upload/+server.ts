import { json } from '@sveltejs/kit';
import { createCtx } from '$lib/server/ctx';
import { AppError, httpError } from '$lib/server/errors';
import type { RequestHandler } from './$types';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const MAX_BYTES = 2 * 1024 * 1024;

export const POST: RequestHandler = async ({ request, platform }) => {
	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

	try {
		const ctx = createCtx(platform);

		const { success } = await ctx.rateLimiter.limit(`upload:${ip}`);
		if (!success) {
			throw new AppError('rate_limited', 'Too many upload attempts. Please wait a minute.');
		}

		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File)) {
			throw new AppError('invalid', 'No file uploaded');
		}

		if (!ALLOWED_TYPES.has(file.type)) {
			throw new AppError('invalid', 'Only PNG, JPEG, WebP, and SVG images are allowed');
		}

		if (file.size > MAX_BYTES) {
			throw new AppError('invalid', 'Image file must be under 2MB');
		}

		const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
		const id = crypto.randomUUID().slice(0, 8);
		const key = `logos/${Date.now()}-${id}.${ext}`;

		const arrayBuffer = await file.arrayBuffer();
		await ctx.storage.put(key, arrayBuffer, { contentType: file.type });

		const url = ctx.storage.getPublicUrl(key) ?? `/uploads/${key}`;

		return json({ ok: true, key, url }, { status: 201 });
	} catch (e) {
		httpError(e);
	}
};

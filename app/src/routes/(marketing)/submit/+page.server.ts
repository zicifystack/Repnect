import { fail } from '@sveltejs/kit';
import { createCtx } from '$lib/server/ctx';
import { submitProject } from '$lib/server/directory/service';
import {
	CATEGORIES,
	NIGERIAN_STATES,
	NIGERIA_CONNECTIONS,
	submitProjectSchema
} from '$lib/server/directory/validation';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
	return {
		categories: CATEGORIES,
		states: NIGERIAN_STATES,
		connections: NIGERIA_CONNECTIONS
	};
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
		const formData = await request.formData();

		const rawTags = (formData.get('tags') as string) || '';
		const tags = rawTags
			.split(',')
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);

		const normalizeUrl = (url: unknown) => {
			if (!url || typeof url !== 'string') return undefined;
			const trimmed = url.trim();
			if (!trimmed) return undefined;
			if (!/^https?:\/\//i.test(trimmed)) {
				return `https://${trimmed}`;
			}
			return trimmed;
		};

		const normalizeGithub = (repo: unknown) => {
			if (!repo || typeof repo !== 'string') return undefined;
			const trimmed = repo.trim();
			if (!trimmed) return undefined;
			const match =
				trimmed.match(
					/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/i
				) || trimmed.match(/^([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)$/);
			return match ? match[1].replace(/\.git$/i, '') : trimmed;
		};

		const rawData = {
			id: String(formData.get('id') || '').trim(),
			name: String(formData.get('name') || '').trim(),
			description: String(formData.get('description') || '').trim(),
			website_url: normalizeUrl(formData.get('website_url')) || '',
			logo_url: normalizeUrl(formData.get('logo_url')) || '',
			github_repo: normalizeGithub(formData.get('github_repo')) || '',
			primary_language: String(formData.get('primary_language') || '').trim(),
			category: formData.get('category'),
			tags,
			location_city: String(formData.get('location_city') || '').trim(),
			location_state: String(formData.get('location_state') || '').trim(),
			nigeria_connection: formData.get('nigeria_connection'),
			nigeria_connection_details: String(formData.get('nigeria_connection_details') || '').trim()
		};

		const parsed = submitProjectSchema.safeParse(rawData);
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Invalid input',
				values: rawData
			});
		}

		try {
			const ctx = createCtx(platform);
			const result = await submitProject(ctx, ip, parsed.data);
			return { success: true, item: result.item, yamlPreview: result.yamlPreview };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Submission failed';
			return fail(400, { error: message, values: rawData });
		}
	}
};

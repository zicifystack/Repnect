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

		const rawData = {
			id: formData.get('id'),
			name: formData.get('name'),
			description: formData.get('description'),
			website_url: formData.get('website_url'),
			logo_url: formData.get('logo_url') || undefined,
			github_repo: formData.get('github_repo') || undefined,
			category: formData.get('category'),
			tags,
			location_city: formData.get('location_city'),
			location_state: formData.get('location_state'),
			nigeria_connection: formData.get('nigeria_connection'),
			nigeria_connection_details: formData.get('nigeria_connection_details')
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

import { redirect } from '@sveltejs/kit';
import { completeOnboarding, storageConfigured } from '$lib/server/account/service';
import { createCtx } from '$lib/server/ctx';
import { httpError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const user = locals.user;
	if (!user) redirect(302, '/login');
	if (user.onboardedAt) redirect(302, '/app');

	return {
		uploadEnabled: storageConfigured(platform!.env)
	};
};

export const actions: Actions = {
	finish: async ({ platform, locals }) => {
		const user = locals.user;
		if (!user) redirect(302, '/login');
		const ctx = createCtx(platform);

		try {
			await completeOnboarding(ctx, { id: user.id });
		} catch (e) {
			httpError(e);
		}
		redirect(303, '/app');
	}
};

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (!user.onboardedAt) redirect(302, '/app/onboarding');

	return { user };
};

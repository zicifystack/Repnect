import type { LayoutServerLoad } from './$types';

// The handle hook in hooks.server.ts already verifies the session cookie
// and populates event.locals.user. We just forward it to all pages.
export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: locals.user ?? null };
};

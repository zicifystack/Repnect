import { DEFAULT_PROJECTS } from '$lib/server/directory/defaults';
import { CATEGORIES, NIGERIAN_STATES } from '$lib/server/directory/validation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	featured: [...DEFAULT_PROJECTS].sort((a, b) => b.stars - a.stars).slice(0, 3),
	stats: {
		states: NIGERIAN_STATES.length,
		categories: CATEGORIES.length,
		projects: DEFAULT_PROJECTS.length
	}
});

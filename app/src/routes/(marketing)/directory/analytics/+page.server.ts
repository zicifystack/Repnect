import { createCtx } from '$lib/server/ctx';
import {
	getDirectoryDataAnalytics,
	getGlobalMetrics
} from '$lib/server/directory/analytics';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ platform }) => {
	const ctx = createCtx(platform);
	const analytics = await getDirectoryDataAnalytics(ctx);
	const globalMetrics = await getGlobalMetrics(ctx);

	return {
		analytics,
		metrics: globalMetrics
	};
};

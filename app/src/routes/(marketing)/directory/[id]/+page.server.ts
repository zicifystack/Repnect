import { createCtx } from '$lib/server/ctx';
import { getDirectoryItem } from '$lib/server/directory/service';
import { getProjectMetrics, trackProjectView } from '$lib/server/directory/analytics';
import { getVoteStats } from '$lib/server/directory/votes';
import { httpError } from '$lib/server/errors';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params, platform, cookies }) => {
	try {
		const ctx = createCtx(platform);
		const item = await getDirectoryItem(ctx, params.id);
		ctx.waitUntil(trackProjectView(ctx, params.id));
		const metrics = await getProjectMetrics(ctx, params.id);
		const voterId = cookies.get('voter_id');
		const voteStats = await getVoteStats(ctx, params.id, voterId);
		return { item, metrics, voteStats };
	} catch (e) {
		httpError(e);
	}
};

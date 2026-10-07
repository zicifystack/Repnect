import { createCtx } from '$lib/server/ctx';
import { AppError, httpError } from '$lib/server/errors';
import {
	getDirectoryItem,
	listDirectoryItems,
	fetchGitHubRepoLanguages,
	type LanguageBreakdown
} from '$lib/server/directory/service';
import { getProjectMetrics, trackProjectView } from '$lib/server/directory/analytics';
import { getVoteStats } from '$lib/server/directory/votes';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params, platform, cookies }) => {
	const ctx = createCtx(platform);
	let item;
	try {
		item = await getDirectoryItem(ctx, params.id);
	} catch {
		httpError(new AppError('not_found', 'Project not found in directory'));
	}

	if (!item) {
		httpError(new AppError('not_found', 'Project not found in directory'));
	}

	try {
		ctx.waitUntil(trackProjectView(ctx, params.id));
	} catch {}

	let metrics = { views: 0, clicks: 0 };
	try {
		metrics = await getProjectMetrics(ctx, params.id);
	} catch {}

	const voterId = cookies.get('voter_id');
	let voteStats = { upvotes: 0, downvotes: 0, score: 0, userVote: null as 'up' | 'down' | null };
	try {
		voteStats = await getVoteStats(ctx, params.id, voterId);
	} catch {}

	let relatedProjects: any[] = [];
	try {
		const allItems = await listDirectoryItems(ctx);
		const filtered = allItems
			.filter((p) => p.id !== item.id)
			.filter((p) => p.category === item.category || p.tags.some((t) => item.tags.includes(t)))
			.slice(0, 3);

		relatedProjects = await Promise.all(
			filtered.map(async (p) => {
				try {
					const stats = await getVoteStats(ctx, p.id, voterId);
					return { ...p, voteScore: stats.score, userVote: stats.userVote };
				} catch {
					return { ...p, voteScore: 0, userVote: null };
				}
			})
		);
	} catch {}

	let languages: LanguageBreakdown[] = [];
	if (item.github_repo) {
		try {
			languages = await fetchGitHubRepoLanguages(ctx, item.github_repo);
		} catch {}
	}

	return { item, metrics, voteStats, relatedProjects, languages };
};

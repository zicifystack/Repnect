import { createCtx } from '$lib/server/ctx';
import { listDirectoryItems } from '$lib/server/directory/service';
import { getVoteStats } from '$lib/server/directory/votes';
import { CATEGORIES, NIGERIAN_STATES } from '$lib/server/directory/validation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const ctx = createCtx(platform);
	const voterId = cookies.get('voter_id');

	let allProjects = [];
	try {
		allProjects = await listDirectoryItems(ctx);
	} catch {}

	const topProjects = [...allProjects].sort((a, b) => b.stars - a.stars).slice(0, 3);

	const featured = await Promise.all(
		topProjects.map(async (project) => {
			try {
				const stats = await getVoteStats(ctx, project.id, voterId);
				return {
					...project,
					voteScore: stats.score,
					userVote: stats.userVote
				};
			} catch {
				return { ...project, voteScore: 0, userVote: null };
			}
		})
	);

	const tagCounts = new Map<string, number>();
	for (const p of allProjects) {
		for (const t of p.tags ?? []) {
			const tag = t.toLowerCase().trim();
			if (tag) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
		}
	}

	const topTags = Array.from(tagCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 15)
		.map(([name, count]) => ({ name, count }));

	return {
		featured,
		tags: topTags,
		stats: {
			states: NIGERIAN_STATES.length,
			categories: CATEGORIES.length,
			projects: allProjects.length
		}
	};
};

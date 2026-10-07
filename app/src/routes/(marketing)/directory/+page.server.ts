import { createCtx } from '$lib/server/ctx';
import { listDirectoryItems } from '$lib/server/directory/service';
import { getVoteStats } from '$lib/server/directory/votes';
import { NIGERIAN_STATES, CATEGORIES, NIGERIA_CONNECTIONS } from '$lib/server/directory/validation';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ platform, url, cookies }) => {
	const search = url.searchParams.get('q') ?? undefined;
	const category = url.searchParams.get('category') ?? undefined;
	const state = url.searchParams.get('state') ?? undefined;
	const connection = url.searchParams.get('connection') ?? undefined;
	const verifiedOnly = url.searchParams.get('verified') === 'true';
	const goodFirstIssuesOnly = url.searchParams.get('issues') === 'true';
	const minStars = url.searchParams.has('minStars')
		? Number(url.searchParams.get('minStars'))
		: undefined;
	const sortBy =
		(url.searchParams.get('sortBy') as 'stars' | 'newest' | 'name' | 'votes') ?? 'stars';

	const ctx = createCtx(platform);

	let items: any[] = [];
	try {
		items = await listDirectoryItems(ctx, {
			search,
			category,
			state,
			connection,
			verifiedOnly,
			goodFirstIssuesOnly,
			minStars,
			sortBy
		});
	} catch {}

	const voterId = cookies.get('voter_id');
	let itemsWithVotes: any[] = items;
	try {
		itemsWithVotes = await Promise.all(
			items.map(async (item) => {
				try {
					const stats = await getVoteStats(ctx, item.id, voterId);
					return {
						...item,
						voteScore: stats?.score ?? 0,
						userVote: stats?.userVote ?? null
					};
				} catch {
					return {
						...item,
						voteScore: 0,
						userVote: null
					};
				}
			})
		);
	} catch {}

	return {
		items: itemsWithVotes,
		states: NIGERIAN_STATES,
		categories: CATEGORIES,
		connections: NIGERIA_CONNECTIONS,
		filters: {
			search: search ?? '',
			category: category ?? '',
			state: state ?? '',
			connection: connection ?? '',
			verifiedOnly,
			goodFirstIssuesOnly,
			minStars: minStars ?? 0,
			sortBy
		}
	};
};

import { AppError } from '../errors';
import type { Ctx } from '../ctx';

export type VoteType = 'up' | 'down';

export type VoteStats = {
	upvotes: number;
	downvotes: number;
	score: number;
	userVote: VoteType | null;
};

export async function getVoteStats(
	ctx: Ctx,
	projectId: string,
	voterId?: string
): Promise<VoteStats> {
	const upvotes = Number((await ctx.store.get(`vote:up:${projectId}`)) ?? 0);
	const downvotes = Number((await ctx.store.get(`vote:down:${projectId}`)) ?? 0);
	const score = upvotes - downvotes;

	let userVote: VoteType | null = null;
	if (voterId) {
		const raw = await ctx.store.get<string>(`vote:user:${voterId}:${projectId}`);
		if (raw === 'up' || raw === 'down') {
			userVote = raw;
		}
	}

	return { upvotes, downvotes, score, userVote };
}

export async function castVote(
	ctx: Ctx,
	voterId: string,
	projectId: string,
	type: VoteType
): Promise<VoteStats> {
	const { success } = await ctx.rateLimiter.limit(`vote:${voterId}`);
	if (!success) {
		throw new AppError('rate_limited', 'Too many votes. Please wait a moment.');
	}

	const existing = await ctx.store.get<string>(`vote:user:${voterId}:${projectId}`);

	let upvotes = Number((await ctx.store.get(`vote:up:${projectId}`)) ?? 0);
	let downvotes = Number((await ctx.store.get(`vote:down:${projectId}`)) ?? 0);

	let newUserVote: VoteType | null = type;

	if (existing === type) {
		if (type === 'up') upvotes = Math.max(0, upvotes - 1);
		if (type === 'down') downvotes = Math.max(0, downvotes - 1);
		await ctx.store.delete(`vote:user:${voterId}:${projectId}`);
		newUserVote = null;
	} else if (existing) {
		if (type === 'up') {
			upvotes += 1;
			downvotes = Math.max(0, downvotes - 1);
		} else {
			downvotes += 1;
			upvotes = Math.max(0, upvotes - 1);
		}
		await ctx.store.put(`vote:user:${voterId}:${projectId}`, type);
	} else {
		if (type === 'up') upvotes += 1;
		if (type === 'down') downvotes += 1;
		await ctx.store.put(`vote:user:${voterId}:${projectId}`, type);
	}

	await ctx.store.put(`vote:up:${projectId}`, String(upvotes));
	await ctx.store.put(`vote:down:${projectId}`, String(downvotes));
	await ctx.store.put(`vote:score:${projectId}`, String(upvotes - downvotes));

	await ctx.analytics.capture('directory.voted', {
		distinctId: voterId,
		properties: { projectId, voteType: newUserVote, upvotes, downvotes }
	});

	return {
		upvotes,
		downvotes,
		score: upvotes - downvotes,
		userVote: newUserVote
	};
}

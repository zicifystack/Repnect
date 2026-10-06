import { describe, expect, it } from 'vitest';
import { createWorkerCtx } from '../ctx';
import { castVote, getVoteStats } from './votes';

describe('Directory voting service', () => {
	it('returns initial zero vote stats', async () => {
		const ctx = createWorkerCtx({} as Env);
		const stats = await getVoteStats(ctx, 'proj-1', 'voter-1');
		expect(stats.score).toBe(0);
		expect(stats.upvotes).toBe(0);
		expect(stats.downvotes).toBe(0);
		expect(stats.userVote).toBeNull();
	});

	it('handles upvoting a project', async () => {
		const ctx = createWorkerCtx({} as Env);

		const result = await castVote(ctx, 'voter-1', 'proj-1', 'up');
		expect(result.score).toBe(1);
		expect(result.upvotes).toBe(1);
		expect(result.downvotes).toBe(0);
		expect(result.userVote).toBe('up');

		const fetched = await getVoteStats(ctx, 'proj-1', 'voter-1');
		expect(fetched.score).toBe(1);
		expect(fetched.userVote).toBe('up');
	});

	it('toggles vote off when same vote is cast again', async () => {
		const ctx = createWorkerCtx({} as Env);

		await castVote(ctx, 'voter-1', 'proj-2', 'up');
		const toggled = await castVote(ctx, 'voter-1', 'proj-2', 'up');

		expect(toggled.score).toBe(0);
		expect(toggled.upvotes).toBe(0);
		expect(toggled.userVote).toBeNull();
	});

	it('handles switching from upvote to downvote', async () => {
		const ctx = createWorkerCtx({} as Env);

		await castVote(ctx, 'voter-1', 'proj-3', 'up');
		const switched = await castVote(ctx, 'voter-1', 'proj-3', 'down');

		expect(switched.score).toBe(-1);
		expect(switched.upvotes).toBe(0);
		expect(switched.downvotes).toBe(1);
		expect(switched.userVote).toBe('down');
	});

	it('aggregates multiple independent voters', async () => {
		const ctx = createWorkerCtx({} as Env);

		await castVote(ctx, 'alice', 'proj-multi', 'up');
		await castVote(ctx, 'bob', 'proj-multi', 'up');
		const final = await castVote(ctx, 'charlie', 'proj-multi', 'down');

		expect(final.score).toBe(1);
		expect(final.upvotes).toBe(2);
		expect(final.downvotes).toBe(1);
	});
});

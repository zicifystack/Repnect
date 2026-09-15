// Feature: fosswe-svelte-rebuild
// Component tests for ProjectUpvote: loading state, optimistic update, revert on error
//
// Since ProjectUpvote now uses remote functions ($lib/upvote.remote) instead of
// raw fetch, we mock the remote module with vi.mock so that tests remain fast
// and isolated from the Cloudflare D1 / server environment.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';

// Mock the remote module BEFORE importing the component.
// This intercepts calls to getUpvoteCount / voteProject in the test environment.
vi.mock('$lib/upvote.remote', () => ({
	getUpvoteCount: vi.fn(),
	voteProject: vi.fn()
}));

import ProjectUpvote from '../components/ProjectUpvote.svelte';
import { getUpvoteCount, voteProject } from '$lib/upvote.remote';

const mockGetCount = vi.mocked(getUpvoteCount);
const mockVote = vi.mocked(voteProject);

// Stub localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => { store[k] = v; },
		removeItem: (k: string) => { delete store[k]; },
		clear: () => { store = {}; }
	};
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('ProjectUpvote', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('shows loading skeleton on initial render before fetch completes', () => {
		// Never resolves — simulates loading
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockGetCount.mockReturnValue(new Promise(() => {}) as any);

		render(ProjectUpvote, { props: { slug: 'test-slug', initialCount: 5 } });

		// Upvote button should not be visible while loading
		expect(screen.queryByRole('button', { name: /upvote/i })).toBeNull();
	});

	it('shows upvote button after remote query resolves', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockGetCount.mockResolvedValue({ slug: 'test-slug', count: 7 } as any);

		render(ProjectUpvote, { props: { slug: 'test-slug', initialCount: 5 } });

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /upvote/i })).toBeTruthy();
		});
	});

	it('displays fetched count after load', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockGetCount.mockResolvedValue({ slug: 'test-slug', count: 99 } as any);

		render(ProjectUpvote, { props: { slug: 'test-slug', initialCount: 0 } });

		await waitFor(() => {
			expect(screen.getByText('99')).toBeTruthy();
		});
	});

	it('optimistically increments count on click', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockGetCount.mockResolvedValue({ slug: 'test-slug', count: 10 } as any);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockVote.mockResolvedValue({ slug: 'test-slug', count: 11, action: 'upvote' } as any);

		render(ProjectUpvote, { props: { slug: 'test-slug', initialCount: 10 } });

		await waitFor(() => screen.getByRole('button', { name: /upvote/i }));

		const btn = screen.getByRole('button', { name: /upvote/i });
		await fireEvent.click(btn);

		// After optimistic update + server confirmation, count should be 11
		await waitFor(() => {
			expect(screen.getByText('11')).toBeTruthy();
		});
	});

	it('reverts count and localStorage on command error', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		mockGetCount.mockResolvedValue({ slug: 'err-slug', count: 5 } as any);
		mockVote.mockRejectedValue(new Error('Network error'));

		render(ProjectUpvote, { props: { slug: 'err-slug', initialCount: 5 } });

		await waitFor(() => screen.getByRole('button', { name: /upvote/i }));

		const btn = screen.getByRole('button', { name: /upvote/i });
		await fireEvent.click(btn);

		// After error, should revert to 5
		await waitFor(() => {
			expect(screen.getByText('5')).toBeTruthy();
		});

		// localStorage should not persist the vote
		expect(localStorageMock.getItem('upvote-err-slug')).toBeNull();
	});
});

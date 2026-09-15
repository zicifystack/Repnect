// Feature: fosswe-svelte-rebuild
// Component tests for ProjectUpvote: loading state, optimistic update, revert on error

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import ProjectUpvote from '../components/ProjectUpvote.svelte';

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
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		localStorageMock.clear();
		fetchMock = vi.fn();
		globalThis.fetch = fetchMock as unknown as typeof fetch;
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('shows loading skeleton on initial render before fetch completes', () => {
		// Never resolves — simulates loading
		fetchMock.mockReturnValue(new Promise(() => {}));

		render(ProjectUpvote, { props: { slug: 'test-slug', initialCount: 5 } });

		// Upvote button should not be visible while loading
		expect(screen.queryByRole('button', { name: /upvote/i })).toBeNull();
	});

	it('shows upvote button after fetch resolves', async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => ({ count: 7 })
		});

		render(ProjectUpvote, { props: { slug: 'test-slug', initialCount: 5 } });

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /upvote/i })).toBeTruthy();
		});
	});

	it('displays fetched count after load', async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => ({ count: 99 })
		});

		render(ProjectUpvote, { props: { slug: 'test-slug', initialCount: 0 } });

		await waitFor(() => {
			expect(screen.getByText('99')).toBeTruthy();
		});
	});

	it('optimistically increments count on click', async () => {
		// First call: GET (initial fetch)
		// Second call: POST (upvote)
		fetchMock
			.mockResolvedValueOnce({ ok: true, json: async () => ({ count: 10 }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ count: 11, action: 'upvote' }) });

		render(ProjectUpvote, { props: { slug: 'test-slug', initialCount: 10 } });

		await waitFor(() => screen.getByRole('button', { name: /upvote/i }));

		const btn = screen.getByRole('button', { name: /upvote/i });
		await fireEvent.click(btn);

		// After optimistic update, count should be 11
		await waitFor(() => {
			expect(screen.getByText('11')).toBeTruthy();
		});
	});

	it('reverts count and localStorage on API error', async () => {
		fetchMock
			.mockResolvedValueOnce({ ok: true, json: async () => ({ count: 5 }) })
			.mockResolvedValueOnce({ ok: false }); // POST fails

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

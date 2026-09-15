// Feature: fosswe-svelte-rebuild
// Tests: Property 8 — Search results are always a subset of the full project list
// Tests: Property 9 — Empty query returns all projects

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createFuse } from '../search.js';
import type { SearchIndexItem } from '../schema.js';

// ---------------------------------------------------------------------------
// Arbitrary: generates valid SearchIndexItem objects
// ---------------------------------------------------------------------------
const searchItemArbitrary: fc.Arbitrary<SearchIndexItem> = fc.record({
	slug: fc.stringMatching(/^[a-z][a-z0-9-]{1,19}$/),
	name: fc
		.string({ minLength: 2, maxLength: 80 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	short_desc: fc
		.string({ minLength: 10, maxLength: 160 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(10, 'a')),
	category: fc.constantFrom('tools', 'libraries', 'apps', 'infrastructure'),
	tags: fc.array(fc.constantFrom('open-source', 'rust', 'web', 'cli', 'api'), {
		minLength: 1,
		maxLength: 5
	}),
	stars: fc.nat(10000),
	primary_lang: fc.constantFrom('TypeScript', 'Python', 'Rust', 'Go', 'JavaScript'),
	verified: fc.boolean(),
	added_at: fc
		.tuple(
			fc.integer({ min: 2020, max: 2030 }),
			fc.integer({ min: 1, max: 12 }),
			fc.integer({ min: 1, max: 28 })
		)
		.map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
	looking_for_contributors: fc.boolean(),
	location_city: fc
		.string({ minLength: 2, maxLength: 100 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	location_nigerian_state: fc
		.string({ minLength: 2, maxLength: 100 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a'))
});

// ---------------------------------------------------------------------------
// Property 8 — Search results are always a subset of the full project list
// Validates: Requirements 6.4, 6.8
// ---------------------------------------------------------------------------
describe('Property 8 — Search results are always a subset of the full project list', () => {
	it('every result returned by fuse.search() has a slug present in the original items', () => {
		/**
		 * **Validates: Requirements 6.4, 6.8**
		 *
		 * For any non-empty array of SearchIndexItems and any query string,
		 * every item returned by the Fuse search must have a slug that exists
		 * in the original items array. Fuse cannot invent items out of thin air.
		 */
		fc.assert(
			fc.property(
				fc.array(searchItemArbitrary, { minLength: 1 }),
				fc.string(),
				(items, query) => {
					const fuse = createFuse(items);
					const results = fuse.search(query).map((r) => r.item);

					const originalSlugs = new Set(items.map((item) => item.slug));

					for (const result of results) {
						expect(originalSlugs.has(result.slug)).toBe(true);
					}
				}
			)
		);
	});
});

// ---------------------------------------------------------------------------
// Property 9 — Empty query returns all projects
// Validates: Requirements 6.2
// ---------------------------------------------------------------------------

/**
 * Mirrors the app-level search logic from ProjectGrid.svelte:
 *
 *   const searchResults = debouncedQuery.trim()
 *     ? fuse.search(debouncedQuery).map((r) => r.item)
 *     : initialProjects
 *
 * Fuse.js itself returns [] for an empty query; the app layer bypasses Fuse
 * when the (trimmed) query is empty and returns the full project list.
 */
function appSearch(items: SearchIndexItem[], query: string): SearchIndexItem[] {
	const fuse = createFuse(items);
	return query.trim() ? fuse.search(query).map((r) => r.item) : items;
}

describe('Property 9 — Empty query returns all projects', () => {
	it('returns the full items array unchanged when query is empty string', () => {
		/**
		 * **Validates: Requirements 6.2**
		 *
		 * For any array of SearchIndexItems and an empty query string,
		 * the app-level search logic returns all items (no filtering applied).
		 */
		fc.assert(
			fc.property(fc.array(searchItemArbitrary), (items) => {
				const results = appSearch(items, '');
				expect(results).toEqual(items);
			})
		);
	});

	it('returns the full items array unchanged when query is whitespace-only', () => {
		/**
		 * **Validates: Requirements 6.2**
		 *
		 * Whitespace-only queries (spaces, tabs, newlines) are treated as
		 * empty after trimming, so all projects must be returned.
		 */
		fc.assert(
			fc.property(
				fc.array(searchItemArbitrary),
				// Generate whitespace-only strings: one or more of space/tab/newline
				fc
					.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 })
					.map((chars) => chars.join('')),
				(items, query) => {
					const results = appSearch(items, query);
					expect(results).toEqual(items);
				}
			)
		);
	});
});

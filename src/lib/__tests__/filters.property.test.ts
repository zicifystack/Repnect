// Feature: fosswe-svelte-rebuild
// Tests: Property 10 — Category filter invariant — all results match selected category
// Tests: Property 11 — Filter+sort results are always a subset of the full search index

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterByCategory, sortItems } from '../filters.js';
import type { SearchIndexItem } from '../schema.js';
import type { SortOrder } from '../filters.js';

// ---------------------------------------------------------------------------
// Arbitrary: generates valid SearchIndexItem objects
// (mirrors the one in search.property.test.ts)
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
		.integer({ min: 2020, max: 2030 })
		.chain((year) =>
			fc
				.integer({ min: 1, max: 12 })
				.chain((month) =>
					fc
						.integer({ min: 1, max: 28 })
						.map(
							(day) =>
								`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
						)
				)
		),
	looking_for_contributors: fc.boolean(),
	location_city: fc
		.string({ minLength: 2, maxLength: 100 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	location_nigerian_state: fc
		.string({ minLength: 2, maxLength: 100 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a'))
});

// ---------------------------------------------------------------------------
// Property 10 — Category filter invariant — all results match selected category
// Validates: Requirements 7.3, 7.6
// ---------------------------------------------------------------------------
describe('Property 10 — Category filter invariant — all results match selected category', () => {
	it('every item returned by filterByCategory has category === selectedCategory', () => {
		/**
		 * **Validates: Requirements 7.3, 7.6**
		 *
		 * For any array of SearchIndexItems and any category string,
		 * every item returned by filterByCategory must have its category
		 * field equal to the selected category. The filter cannot return
		 * items belonging to a different category.
		 */

		// P10: every item returned by filterByCategory has category === selectedCategory
		fc.assert(
			fc.property(
				fc.array(searchItemArbitrary),
				fc.string(),
				(items, selectedCategory) => {
					const results = filterByCategory(items, selectedCategory);

					// Every returned item must match the selected category
					const allMatch = results.every((item) => item.category === selectedCategory);
					expect(allMatch).toBe(true);
				}
			)
		);
	});

	it('when category is "all", all original items are returned unchanged', () => {
		/**
		 * **Validates: Requirements 7.3**
		 *
		 * The special 'all' category is a pass-through — the function must
		 * return the exact same array reference (no filtering applied).
		 */
		fc.assert(
			fc.property(fc.array(searchItemArbitrary), (items) => {
				const results = filterByCategory(items, 'all');
				expect(results).toBe(items);
			})
		);
	});
});

// ---------------------------------------------------------------------------
// Property 11 — Filter+sort results are always a subset of the full search index
// Validates: Requirements 7.3, 7.6, 7.7
// ---------------------------------------------------------------------------
describe('Property 11 — Filter+sort results are always a subset of the full search index', () => {
	it('sortItems result slugs are always a subset of the original items slugs', () => {
		/**
		 * **Validates: Requirements 7.3, 7.6, 7.7**
		 *
		 * For any array of SearchIndexItems and any sort order,
		 * the resulting set of slugs must be a subset of the original slugs.
		 * sortItems cannot introduce items that were not in the input.
		 */

		// P11: sortItems result is always a subset of the original items
		fc.assert(
			fc.property(
				fc.array(searchItemArbitrary),
				fc.constantFrom<SortOrder>('recent', 'stars', 'alpha'),
				(items, order) => {
					const results = sortItems(items, order);

					const originalSlugs = new Set(items.map((item) => item.slug));

					expect(results).toHaveLength(items.length);

					for (const result of results) {
						expect(originalSlugs.has(result.slug)).toBe(true);
					}
				}
			)
		);
	});

	it('combined filterByCategory + sortItems result is always a subset of the original items', () => {
		/**
		 * **Validates: Requirements 7.3, 7.6, 7.7**
		 *
		 * Composing filterByCategory and sortItems must still produce a subset
		 * of the original SearchIndexItem array. No item can appear in the
		 * result that was not in the original input.
		 */
		fc.assert(
			fc.property(
				fc.array(searchItemArbitrary),
				fc.constantFrom('tools', 'libraries', 'apps', 'infrastructure', 'all'),
				fc.constantFrom<SortOrder>('recent', 'stars', 'alpha'),
				(items, category, order) => {
					const filtered = filterByCategory(items, category);
					const sorted = sortItems(filtered, order);

					const originalSlugs = new Set(items.map((item) => item.slug));

					for (const result of sorted) {
						expect(originalSlugs.has(result.slug)).toBe(true);
					}
				}
			)
		);
	});
});

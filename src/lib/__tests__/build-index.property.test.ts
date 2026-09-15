// Feature: fosswe-svelte-rebuild
// Tests: Property 4 — Search index contains exactly the required fields per item

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { expect } from 'vitest';
import { validProjectArbitrary } from './schema.property.test.js';
import { buildIndex } from '../../../scripts/build-index.js';

// ---------------------------------------------------------------------------
// Property 4 — SearchIndexItem contains exactly the required fields
// Validates: Requirements 2.2
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = [
	'slug',
	'name',
	'short_desc',
	'category',
	'tags',
	'stars',
	'primary_lang',
	'verified',
	'added_at',
	'looking_for_contributors',
	'location_city',
	'location_nigerian_state'
].sort();

describe('Property 4 — Search index contains exactly the required fields per item', () => {
	it('every output item has exactly the 12 required fields and no others', () => {
		fc.assert(
			fc.property(
				fc.array(validProjectArbitrary, { minLength: 1 }),
				(projects) => {
					const index = buildIndex(projects);

					for (const item of index) {
						const keys = Object.keys(item).sort();
						expect(keys).toEqual(REQUIRED_FIELDS);
					}
				}
			)
		);
	});
});

// Tests: Property 5 — Build index sort order is deterministic and stable
// Validates: Requirements 2.3, 2.6

/** A fixed repnect project injected into every Property 5 test run. */
const repnectBase = {
	slug: 'repnect',
	name: 'Repnect',
	short_desc: 'The Repnect project itself.',
	repo: 'https://github.com/repnect/repnect',
	license: 'MIT',
	added_at: '2024-01-01',
	primary_lang: 'TypeScript',
	category: 'tools',
	tags: ['open-source'] as string[],
	looking_for_contributors: false,
	location_city: 'Mumbai',
	location_nigerian_state: 'Maharashtra',
	stars: 0,
	verified: false,
	good_first_issues: 0
};

/** Safe arbitrary: filters out any generated project whose slug is 'repnect'
 *  and guards against invalid Date generation in the underlying arbitrary. */
const nonRepnectArbitrary = validProjectArbitrary.filter((p) => {
	if (p.slug === 'repnect') return false;
	// Guard: added_at must be a valid YYYY-MM-DD string (the arbitrary's date
	// mapper can produce 'Invalid Date' strings during fast-check shrinking)
	return /^\d{4}-\d{2}-\d{2}$/.test(p.added_at);
});

/**
 * A self-contained project arbitrary for sort-order tests.
 * Uses integer-based date generation to avoid Invalid Date issues during shrinking.
 * Excludes 'repnect' slug so the repnect sentinel can be injected cleanly.
 */
const sortTestProjectArbitrary = fc.record({
	slug: fc
		.stringMatching(/^[a-z][a-z0-9-]{1,59}$/)
		.filter((s) => !['repnect', 'new', 'admin', 'api', 'auth', 'projects', 'tags', 'search', 'submit', 'about', 'privacy', 'terms'].includes(s)),
	name: fc.string({ minLength: 2, maxLength: 80 }).map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	short_desc: fc.string({ minLength: 10, maxLength: 160 }).map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(10, 'a')),
	repo: fc.constantFrom('https://github.com/owner/repo', 'https://github.com/org/project'),
	license: fc.constantFrom('MIT', 'Apache-2.0'),
	// Use integer year/month/day to avoid fc.date() Invalid Date during shrinking
	added_at: fc.tuple(
		fc.integer({ min: 2020, max: 2030 }),
		fc.integer({ min: 1, max: 12 }),
		fc.integer({ min: 1, max: 28 })
	).map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
	primary_lang: fc.constantFrom('TypeScript', 'Python', 'Rust', 'Go'),
	category: fc.constantFrom('tools', 'libraries', 'apps'),
	tags: fc.array(fc.constantFrom('open-source', 'web', 'cli', 'api'), { minLength: 1, maxLength: 5 }),
	looking_for_contributors: fc.boolean(),
	location_city: fc.string({ minLength: 2, maxLength: 50 }).map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	location_nigerian_state: fc.string({ minLength: 2, maxLength: 50 }).map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	stars: fc.integer({ min: 0, max: 9999 }),
	verified: fc.boolean(),
	good_first_issues: fc.integer({ min: 0, max: 100 })
});

describe('Property 5 — Build index sort order is deterministic and stable', () => {
	it('repnect is always at index 0 when present', () => {
		fc.assert(
			fc.property(
				fc.array(sortTestProjectArbitrary),
				(projects) => {
					const input = [...projects, { ...repnectBase }] as import('../schema.js').Project[];
					const result = buildIndex(input);
					expect(result[0].slug).toBe('repnect');
				}
			)
		);
	});

	it('remaining items after repnect are alphabetically sorted by name', () => {
		fc.assert(
			fc.property(
				fc.array(sortTestProjectArbitrary, { minLength: 1 }),
				(projects) => {
					const input = [...projects, { ...repnectBase }] as import('../schema.js').Project[];
					const result = buildIndex(input);
					// index 0 is repnect; check the rest are sorted by name
					const rest = result.slice(1);
					for (let i = 0; i < rest.length - 1; i++) {
						expect(rest[i].name.localeCompare(rest[i + 1].name)).toBeLessThanOrEqual(0);
					}
				}
			)
		);
	});

	it('two calls on the same input produce byte-identical JSON output', () => {
		fc.assert(
			fc.property(
				fc.array(sortTestProjectArbitrary, { minLength: 1 }),
				(projects) => {
					const result1 = buildIndex(projects);
					const result2 = buildIndex(projects);
					expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
				}
			)
		);
	});
});

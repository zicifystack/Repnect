// Feature: fosswe-svelte-rebuild
// Tests: Property 12 — Similar projects never include the current project
// Tests: Property 13 — Similar projects count never exceeds 4

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { findSimilarProjects } from '../similar.js';
import type { Project } from '../schema.js';

// A minimal project arbitrary for similar-projects tests
const projectArbitrary: fc.Arbitrary<Project> = fc.record({
	slug: fc.stringMatching(/^[a-z][a-z0-9-]{1,19}$/),
	name: fc
		.string({ minLength: 2, maxLength: 80 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	short_desc: fc
		.string({ minLength: 10, maxLength: 160 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(10, 'a')),
	repo: fc.constantFrom('https://github.com/owner/repo', 'https://github.com/org/proj'),
	license: fc.constantFrom('MIT', 'Apache-2.0'),
	added_at: fc
		.tuple(fc.integer({ min: 2020, max: 2030 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }))
		.map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
	primary_lang: fc.constantFrom('TypeScript', 'Python', 'Rust'),
	category: fc.constantFrom('tools', 'libraries', 'apps'),
	tags: fc.array(fc.constantFrom('open-source', 'web', 'cli', 'api'), { minLength: 1, maxLength: 5 }),
	looking_for_contributors: fc.boolean(),
	location_city: fc
		.string({ minLength: 2, maxLength: 50 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	location_nigerian_state: fc
		.string({ minLength: 2, maxLength: 50 })
		.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
	stars: fc.nat(1000),
	good_first_issues: fc.nat(100),
	verified: fc.boolean()
});

describe('Property 12 — Similar projects never include the current project', () => {
	it('findSimilarProjects never returns the current project', () => {
		fc.assert(
			fc.property(
				projectArbitrary,
				fc.array(projectArbitrary, { maxLength: 50 }),
				(current, others) => {
					const all = [...others, current];
					const results = findSimilarProjects(current, all, 4);
					const hasSelf = results.some((p) => p.slug === current.slug);
					expect(hasSelf).toBe(false);
				}
			)
		);
	});
});

describe('Property 13 — Similar projects count never exceeds 4', () => {
	it('findSimilarProjects returns at most 4 results regardless of list size', () => {
		fc.assert(
			fc.property(
				projectArbitrary,
				fc.array(projectArbitrary, { maxLength: 1000 }),
				(current, others) => {
					const results = findSimilarProjects(current, others, 4);
					expect(results.length).toBeLessThanOrEqual(4);
				}
			)
		);
	});
});

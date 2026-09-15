// Feature: fosswe-svelte-rebuild
// Tests: Property 6 — Validate script correctly identifies allowlist violations

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Hoist the process.exit mock so it is in place before validate.ts's
// top-level `main()` call fires on module import, preventing it from
// crashing the test runner via `process.exit(1)`.
const exitSpy = vi.hoisted(() => vi.spyOn(process, 'exit').mockImplementation((() => {}) as never));

import { checkAllowlists } from '../../../scripts/validate.js';
import type { Project } from '../schema.js';

// ---------------------------------------------------------------------------
// Allowlists — representative samples used as the reference sets
// ---------------------------------------------------------------------------
const KNOWN_CATEGORIES = ['tools', 'libraries', 'apps', 'infrastructure', 'frameworks', 'devtools'];
const KNOWN_TAGS = ['open-source', 'typescript', 'python', 'rust', 'react', 'svelte', 'cli', 'api'];
const KNOWN_LICENSES = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-2-Clause', 'ISC', 'MPL-2.0'];

// ---------------------------------------------------------------------------
// Base valid project fixture — fields are allowlist-compliant
// ---------------------------------------------------------------------------
const validProject: Project = {
	slug: 'my-project',
	name: 'My Project',
	short_desc: 'A short description here.',
	repo: 'https://github.com/owner/repo',
	license: 'MIT',
	added_at: '2024-01-01',
	primary_lang: 'TypeScript',
	category: 'tools',
	tags: ['open-source'],
	looking_for_contributors: false,
	location_city: 'Lagos',
	location_nigerian_state: 'Lagos State',
	stars: 0,
	good_first_issues: 0,
	verified: false
};

// ---------------------------------------------------------------------------
// Property 6 — Validate script correctly identifies allowlist violations
// Validates: Requirements 3.2, 3.3, 3.4
// ---------------------------------------------------------------------------
describe('Property 6 — Validate script correctly identifies allowlist violations', () => {
	// -------------------------------------------------------------------------
	// 6a. Category violation — any category NOT in the allowlist produces errors
	// -------------------------------------------------------------------------
	it('returns a non-empty error array when category is not in the allowlist', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => !KNOWN_CATEGORIES.includes(s)),
				(invalidCategory) => {
					const project: Project = { ...validProject, category: invalidCategory };
					const errors = checkAllowlists(project, KNOWN_CATEGORIES, KNOWN_TAGS, KNOWN_LICENSES);
					expect(errors.length).toBeGreaterThan(0);
				}
			)
		);
	});

	// -------------------------------------------------------------------------
	// 6b. Tag violation — any tag NOT in the allowlist produces errors
	// -------------------------------------------------------------------------
	it('returns a non-empty error array when at least one tag is not in the allowlist', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => !KNOWN_TAGS.includes(s)),
				(invalidTag) => {
					const project: Project = { ...validProject, tags: [invalidTag] };
					const errors = checkAllowlists(project, KNOWN_CATEGORIES, KNOWN_TAGS, KNOWN_LICENSES);
					expect(errors.length).toBeGreaterThan(0);
				}
			)
		);
	});

	// -------------------------------------------------------------------------
	// 6c. Tag violation — an array containing multiple invalid tags produces errors
	// -------------------------------------------------------------------------
	it('returns a non-empty error array when multiple tags are not in the allowlist', () => {
		fc.assert(
			fc.property(
				fc
					.array(fc.string({ minLength: 1 }).filter((s) => !KNOWN_TAGS.includes(s)), {
						minLength: 2,
						maxLength: 5
					}),
				(invalidTags) => {
					const project: Project = { ...validProject, tags: invalidTags };
					const errors = checkAllowlists(project, KNOWN_CATEGORIES, KNOWN_TAGS, KNOWN_LICENSES);
					expect(errors.length).toBeGreaterThan(0);
				}
			)
		);
	});

	// -------------------------------------------------------------------------
	// 6d. License violation — any license NOT in the allowlist produces errors
	// -------------------------------------------------------------------------
	it('returns a non-empty error array when license is not in the allowlist', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => !KNOWN_LICENSES.includes(s)),
				(invalidLicense) => {
					const project: Project = { ...validProject, license: invalidLicense };
					const errors = checkAllowlists(project, KNOWN_CATEGORIES, KNOWN_TAGS, KNOWN_LICENSES);
					expect(errors.length).toBeGreaterThan(0);
				}
			)
		);
	});

	// -------------------------------------------------------------------------
	// 6e. All three violations simultaneously also produce errors
	// -------------------------------------------------------------------------
	it('returns errors for simultaneous category, tag, and license violations', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => !KNOWN_CATEGORIES.includes(s)),
				fc.string({ minLength: 1 }).filter((s) => !KNOWN_TAGS.includes(s)),
				fc.string({ minLength: 1 }).filter((s) => !KNOWN_LICENSES.includes(s)),
				(invalidCategory, invalidTag, invalidLicense) => {
					const project: Project = {
						...validProject,
						category: invalidCategory,
						tags: [invalidTag],
						license: invalidLicense
					};
					const errors = checkAllowlists(project, KNOWN_CATEGORIES, KNOWN_TAGS, KNOWN_LICENSES);
					expect(errors.length).toBeGreaterThanOrEqual(3);
				}
			)
		);
	});

	// -------------------------------------------------------------------------
	// 6f. Valid values — no errors for any value sampled from the allowlists
	// -------------------------------------------------------------------------
	it('returns an empty error array when all fields are from the allowlists', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(...(KNOWN_CATEGORIES as [string, ...string[]])),
				fc.array(fc.constantFrom(...(KNOWN_TAGS as [string, ...string[]])), {
					minLength: 1,
					maxLength: 5
				}),
				fc.constantFrom(...(KNOWN_LICENSES as [string, ...string[]])),
				(category, tags, license) => {
					const project: Project = { ...validProject, category, tags, license };
					const errors = checkAllowlists(project, KNOWN_CATEGORIES, KNOWN_TAGS, KNOWN_LICENSES);
					expect(errors).toHaveLength(0);
				}
			)
		);
	});

	// -------------------------------------------------------------------------
	// 6g. Error messages reference the project slug and violating values
	// -------------------------------------------------------------------------
	it('error messages mention the project slug when a violation is found', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }).filter((s) => !KNOWN_CATEGORIES.includes(s)),
				(invalidCategory) => {
					const project: Project = { ...validProject, category: invalidCategory };
					const errors = checkAllowlists(project, KNOWN_CATEGORIES, KNOWN_TAGS, KNOWN_LICENSES);
					// At least one error should reference the project slug
					const mentionsSlug = errors.some((e) => e.includes(validProject.slug));
					expect(mentionsSlug).toBe(true);
				}
			)
		);
	});
});

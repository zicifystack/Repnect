// Feature: fosswe-svelte-rebuild
// Tests: Property 1 — Schema validation rejects invalid field values
// Property-based tests for ProjectSchema

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ZodError } from 'zod';
import { ProjectSchema, RESERVED_SLUGS } from '../schema';

// Minimal valid project — used as a baseline to isolate the field under test
const validProject = {
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
	location_nigerian_state: 'Lagos State'
};

// ---------------------------------------------------------------------------
// Property 1 — Schema validation rejects invalid field values
// Validates: Requirements 1.1, 1.3
// ---------------------------------------------------------------------------
describe('Property 1 — Schema validation rejects invalid field values', () => {
	// slug: too long (> 60 chars)
	it('rejects slug that exceeds 60 characters', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 61, max: 120 }).map((len) => 'a'.repeat(len)),
				(slug) => {
					const result = ProjectSchema.safeParse({ ...validProject, slug });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// slug: too short (< 2 chars) — single character strings
	it('rejects slug that is shorter than 2 characters', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('a', 'b', 'z', '0', '1', '9'),
				(slug) => {
					const result = ProjectSchema.safeParse({ ...validProject, slug });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// slug: contains invalid characters (uppercase, spaces, special chars)
	it('rejects slug containing characters outside [a-z0-9-]', () => {
		fc.assert(
			fc.property(
				// Generate a 2+ char string that contains at least one forbidden character
				fc.string({ minLength: 2 }).filter((s) => /[^a-z0-9-]/.test(s)),
				(slug) => {
					const result = ProjectSchema.safeParse({ ...validProject, slug });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// slug: reserved words are rejected
	it('rejects every reserved slug', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(...(RESERVED_SLUGS as [string, ...string[]])),
				(slug) => {
					const result = ProjectSchema.safeParse({ ...validProject, slug });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// name: too short (< 2 chars)
	it('rejects name shorter than 2 characters', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('', 'a', 'b', 'z'),
				(name) => {
					const result = ProjectSchema.safeParse({ ...validProject, name });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// name: too long (> 80 chars)
	it('rejects name longer than 80 characters', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 81, max: 200 }).map((len) => 'a'.repeat(len)),
				(name) => {
					const result = ProjectSchema.safeParse({ ...validProject, name });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// short_desc: too short (< 10 chars)
	it('rejects short_desc shorter than 10 characters', () => {
		fc.assert(
			fc.property(
				fc.string({ maxLength: 9 }),
				(short_desc) => {
					const result = ProjectSchema.safeParse({ ...validProject, short_desc });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// short_desc: too long (> 160 chars)
	it('rejects short_desc longer than 160 characters', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 161, max: 300 }).map((len) => 'a'.repeat(len)),
				(short_desc) => {
					const result = ProjectSchema.safeParse({ ...validProject, short_desc });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// repo: not a GitHub HTTPS URL — use a fixed set of known-invalid values
	it('rejects repo that is not a valid GitHub HTTPS URL', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(
					'',
					'not-a-url',
					'http://github.com/owner/repo', // http not https
					'https://gitlab.com/owner/repo', // not github
					'https://github.com/only-owner', // missing repo segment
					'https://github.com/owner/repo/tree/main', // extra path segments
					'ftp://github.com/owner/repo', // wrong protocol
					'github.com/owner/repo' // no protocol
				),
				(repo) => {
					const result = ProjectSchema.safeParse({ ...validProject, repo });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// license: empty string (min 1 required)
	it('rejects empty license', () => {
		fc.assert(
			fc.property(fc.constant(''), (license) => {
				const result = ProjectSchema.safeParse({ ...validProject, license });
				expect(result.success).toBe(false);
			})
		);
	});

	// added_at: does not match YYYY-MM-DD format
	it('rejects added_at that does not match YYYY-MM-DD format', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(
					'',
					'2024/01/01',
					'01-01-2024',
					'January 1 2024',
					'2024-1-1',
					'2024-01',
					'not-a-date'
				),
				(added_at) => {
					const result = ProjectSchema.safeParse({ ...validProject, added_at });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// primary_lang: empty string (min 1 required)
	it('rejects empty primary_lang', () => {
		fc.assert(
			fc.property(fc.constant(''), (primary_lang) => {
				const result = ProjectSchema.safeParse({ ...validProject, primary_lang });
				expect(result.success).toBe(false);
			})
		);
	});

	// category: empty string (min 1 required)
	it('rejects empty category', () => {
		fc.assert(
			fc.property(fc.constant(''), (category) => {
				const result = ProjectSchema.safeParse({ ...validProject, category });
				expect(result.success).toBe(false);
			})
		);
	});

	// tags: empty array (min 1 required)
	it('rejects tags array with 0 elements', () => {
		fc.assert(
			fc.property(fc.constant([] as string[]), (tags) => {
				const result = ProjectSchema.safeParse({ ...validProject, tags });
				expect(result.success).toBe(false);
			})
		);
	});

	// tags: more than 10 elements
	it('rejects tags array with more than 10 elements', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 11, max: 30 }).map((n) =>
					Array.from({ length: n }, (_, i) => `tag${i}`)
				),
				(tags) => {
					const result = ProjectSchema.safeParse({ ...validProject, tags });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// looking_for_contributors: non-boolean value
	it('rejects looking_for_contributors that is not a boolean', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('true', 'false', 0, 1, null as unknown),
				(looking_for_contributors) => {
					const result = ProjectSchema.safeParse({
						...validProject,
						looking_for_contributors
					});
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// location_city: too short (< 2 chars)
	it('rejects location_city shorter than 2 characters', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('', 'A', 'B', 'Z'),
				(location_city) => {
					const result = ProjectSchema.safeParse({ ...validProject, location_city });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// location_city: too long (> 100 chars)
	it('rejects location_city longer than 100 characters', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 101, max: 200 }).map((len) => 'a'.repeat(len)),
				(location_city) => {
					const result = ProjectSchema.safeParse({ ...validProject, location_city });
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// location_nigerian_state: too short (< 2 chars)
	it('rejects location_nigerian_state shorter than 2 characters', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('', 'A', 'B', 'Z'),
				(location_nigerian_state) => {
					const result = ProjectSchema.safeParse({
						...validProject,
						location_nigerian_state
					});
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// location_nigerian_state: too long (> 100 chars)
	it('rejects location_nigerian_state longer than 100 characters', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 101, max: 200 }).map((len) => 'a'.repeat(len)),
				(location_nigerian_state) => {
					const result = ProjectSchema.safeParse({
						...validProject,
						location_nigerian_state
					});
					expect(result.success).toBe(false);
				}
			)
		);
	});

	// Composite: ProjectSchema.parse() throws ZodError (not just returns false)
	it('throws ZodError (not a generic error) when any required field violates its constraint', () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 61, max: 100 }).map((len) => 'a'.repeat(len)),
				(slug) => {
					try {
						ProjectSchema.parse({ ...validProject, slug });
						expect.fail('Expected ProjectSchema.parse() to throw a ZodError');
					} catch (err) {
						expect(err).toBeInstanceOf(ZodError);
					}
				}
			)
		);
	});
});

// Tests: Property 2 — Logo path pattern enforcement
// Validates: Requirements 1.5

const LOGO_PATTERN = /^\/logos\/[^/]+\.(svg|png|jpg|jpeg|webp)$/;

describe('Property 2 — Logo path pattern enforcement', () => {
	it('accepts any logo value that matches the pattern', () => {
		fc.assert(
			fc.property(
				fc.stringMatching(/^\/logos\/[^/]+\.(svg|png|jpg|jpeg|webp)$/),
				(logo) => {
					const result = ProjectSchema.safeParse({ ...validProject, logo });
					expect(result.success).toBe(true);
				}
			)
		);
	});

	it('rejects any logo value that does not match the pattern', () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => !LOGO_PATTERN.test(s)),
				(logo) => {
					const result = ProjectSchema.safeParse({ ...validProject, logo });
					expect(result.success).toBe(false);
				}
			)
		);
	});
});

// Tests: Property 3 — TOML round-trip preserves project data
// Validates: Requirements 1.6
import { stringify } from 'smol-toml';
import { parseProjectFile } from '../projects.js';

/**
 * Generates valid Project objects constrained to well-formed field values.
 * Exported so other test files can reuse this arbitrary.
 */
export const validProjectArbitrary = fc.record({
	slug: fc
		.stringMatching(/^[a-z][a-z0-9-]{1,59}$/)
		.filter((s) => !RESERVED_SLUGS.includes(s)),
	// Constrain text fields to printable ASCII to avoid TOML encoding edge-cases
	name: fc.string({ minLength: 2, maxLength: 80 }).map((s) =>
		s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')
	),
	short_desc: fc.string({ minLength: 10, maxLength: 160 }).map((s) =>
		s.replace(/[^\x20-\x7E]/g, 'a').padEnd(10, 'a')
	),
	repo: fc.constantFrom(
		'https://github.com/owner/repo',
		'https://github.com/org/project',
		'https://github.com/user/my-app'
	),
	license: fc.constantFrom('MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-2-Clause'),
	added_at: fc
		.tuple(
			fc.integer({ min: 2020, max: 2030 }),
			fc.integer({ min: 1, max: 12 }),
			fc.integer({ min: 1, max: 28 })
		)
		.map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
	primary_lang: fc.constantFrom('TypeScript', 'Python', 'Rust', 'Go', 'JavaScript'),
	category: fc.constantFrom('tools', 'libraries', 'apps', 'infrastructure'),
	tags: fc.array(
		fc
			.string({ minLength: 1, maxLength: 30 })
			.map((s) => s.replace(/[^\x20-\x7E]/g, 'a').replace(/\s+/g, '-') || 'tag')
			.filter((s) => s.length >= 1),
		{ minLength: 1, maxLength: 10 }
	),
	looking_for_contributors: fc.boolean(),
	location_city: fc.string({ minLength: 2, maxLength: 100 }).map((s) =>
		s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')
	),
	location_nigerian_state: fc.string({ minLength: 2, maxLength: 100 }).map((s) =>
		s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')
	),
	stars: fc.integer({ min: 0, max: 9999 }),
	verified: fc.boolean(),
	good_first_issues: fc.integer({ min: 0, max: 100 })
});

describe('Property 3 — TOML round-trip preserves project data', () => {
	it('serialising a valid Project to TOML and parsing it back yields the original data', () => {
		fc.assert(
			fc.property(validProjectArbitrary, (project) => {
				// Serialise to TOML
				const toml = stringify(project as unknown as Record<string, unknown>);

				// Re-parse using the canonical parser (enforces filename–slug invariant)
				const reparsed = parseProjectFile(toml, project.slug + '.toml');

				// The schema applies defaults for optional fields (good_first_issues, stars,
				// verified) that are absent from the generated object.  Normalise the
				// original by merging those same defaults before comparing.
				const expected = { ...project };

				expect(reparsed).toEqual(expected);
			})
		);
	});
});

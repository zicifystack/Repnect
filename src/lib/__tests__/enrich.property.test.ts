// Feature: fosswe-svelte-rebuild
// Tests: Property 7 — Enrich script preserves non-target TOML fields

import { vi } from 'vitest';

// Mock process.exit BEFORE importing enrich.ts, because the module calls
// process.exit(1) at load time when GITHUB_TOKEN is not set.
const exitSpy = vi.hoisted(() =>
	vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)
);

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parse, stringify } from 'smol-toml';

import { updateProjectFields } from '../../../scripts/enrich.js';
import { validProjectArbitrary } from './schema.property.test.js';

// ---------------------------------------------------------------------------
// Property 7 — Enrich script preserves non-target TOML fields
// Validates: Requirements 4.2, 24.5
// ---------------------------------------------------------------------------

/**
 * Fields that updateProjectFields is allowed (and expected) to change.
 */
const TARGET_FIELDS = new Set(['stars', 'good_first_issues', 'verified']);

describe('Property 7 — Enrich script preserves non-target TOML fields', () => {
	it('updateProjectFields only modifies stars, good_first_issues, and verified; all other fields are byte-identical', () => {
		fc.assert(
			fc.property(
				validProjectArbitrary,
				fc.integer({ min: 0, max: 1_000_000 }), // stars
				fc.integer({ min: 0, max: 500 }),        // good_first_issues
				fc.boolean(),                             // verified
				(project, stars, good_first_issues, verified) => {
					// Serialise the project to TOML (as the enrich script would read it from disk)
					const originalToml = stringify(project as unknown as Record<string, unknown>);

					// Run the field-update step
					const updatedToml = updateProjectFields(originalToml, {
						stars,
						good_first_issues,
						verified
					});

					// Parse both versions so we can compare field-by-field
					const original = parse(originalToml) as Record<string, unknown>;
					const updated = parse(updatedToml) as Record<string, unknown>;

					// 1. Target fields must carry the new values
					expect(updated.stars).toBe(stars);
					expect(updated.good_first_issues).toBe(good_first_issues);
					expect(updated.verified).toBe(verified);

					// 2. Every non-target field present in the original must be
					//    byte-identical (same value) in the updated output.
					for (const [key, value] of Object.entries(original)) {
						if (TARGET_FIELDS.has(key)) continue;

						expect(updated[key]).toEqual(value);
					}

					// 3. No extra non-target keys should have been introduced.
					for (const key of Object.keys(updated)) {
						if (TARGET_FIELDS.has(key)) continue;

						expect(original).toHaveProperty(key);
					}
				}
			)
		);
	});
});

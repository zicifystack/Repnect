// Feature: fosswe-svelte-rebuild
// Tests: Property 17 — Canonical URL matches expected pattern for all project slugs

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { canonicalUrl, RESERVED_SLUGS } from '../seo.js';

describe('Property 17 — Canonical URL matches expected pattern for all project slugs', () => {
	it('canonicalUrl returns the expected URL for any valid slug', () => {
		fc.assert(
			fc.property(
				fc.stringMatching(/^[a-z0-9-]{2,60}$/).filter((s) => !RESERVED_SLUGS.includes(s)),
				(slug) => {
					expect(canonicalUrl(slug)).toBe(`https://repnect.dev/projects/${slug}`);
				}
			)
		);
	});
});

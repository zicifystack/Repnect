// Feature: fosswe-svelte-rebuild
// Tests: Property 15 — Geographic state project counts sum to total

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { groupByState } from '../radar.js';
import type { Project } from '../schema.js';

const projectArbitrary: fc.Arbitrary<Project> = fc.record({
  slug: fc.stringMatching(/^[a-z][a-z0-9-]{1,19}$/),
  name: fc.string({ minLength: 2, maxLength: 80 }).map(s => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
  short_desc: fc.string({ minLength: 10, maxLength: 160 }).map(s => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(10, 'a')),
  repo: fc.constantFrom('https://github.com/owner/repo', 'https://github.com/org/proj'),
  license: fc.constantFrom('MIT', 'Apache-2.0'),
  added_at: fc.tuple(fc.integer({min:2020,max:2030}), fc.integer({min:1,max:12}), fc.integer({min:1,max:28}))
    .map(([y,m,d]) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`),
  primary_lang: fc.constantFrom('TypeScript', 'Python'),
  category: fc.constantFrom('tools', 'libraries'),
  tags: fc.array(fc.constantFrom('web', 'cli'), { minLength: 1, maxLength: 3 }),
  looking_for_contributors: fc.boolean(),
  location_city: fc.string({ minLength: 2, maxLength: 50 }).map(s => s.replace(/[^\x20-\x7E]/g, 'a').padEnd(2, 'a')),
  location_nigerian_state: fc.constantFrom('Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu'),
  stars: fc.nat(1000),
  good_first_issues: fc.nat(100),
  verified: fc.boolean(),
});

describe('Property 15 — Geographic state project counts sum to total', () => {
  it('sum of all group lengths equals total project count', () => {
    fc.assert(fc.property(
      fc.array(projectArbitrary),
      (projects) => {
        const groups = groupByState(projects);
        const total = Object.values(groups).reduce((sum, g) => sum + g.length, 0);
        expect(total).toBe(projects.length);
      }
    ));
  });
});

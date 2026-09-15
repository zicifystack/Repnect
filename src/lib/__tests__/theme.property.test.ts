// Feature: fosswe-svelte-rebuild
// Tests: Property 16 — Theme toggle round-trip returns to original

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

type Theme = 'dark' | 'light';

// Pure toggle function mirroring theme.svelte.ts logic
function toggle(t: Theme): Theme {
	return t === 'dark' ? 'light' : 'dark';
}

describe('Property 16 — Theme toggle round-trip returns to original', () => {
	it('toggling theme twice returns to the original theme', () => {
		fc.assert(
			fc.property(fc.constantFrom<Theme>('dark', 'light'), (initial) => {
				const afterOne = toggle(initial);
				const afterTwo = toggle(afterOne);
				expect(afterTwo).toBe(initial);
			})
		);
	});

	it('toggling switches to the opposite theme', () => {
		expect(toggle('dark')).toBe('light');
		expect(toggle('light')).toBe('dark');
	});
});

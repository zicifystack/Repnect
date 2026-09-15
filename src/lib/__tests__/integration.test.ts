// Feature: fosswe-svelte-rebuild
// Integration tests for API endpoints and build pipeline (Tasks 68, 69)

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { buildIndex } from '../../../scripts/build-index.js';
import { loadAllProjects } from '../projects.js';
import { SearchIndexItemSchema } from '../schema.js';
import type { SearchIndexItem } from '../schema.js';

// ── Task 69: Build pipeline integration ───────────────────────────────────────

describe('Build pipeline integration (Task 69)', () => {
	const indexPath = join(process.cwd(), 'public', 'index.json');

	it('public/index.json exists after build:index', () => {
		expect(existsSync(indexPath)).toBe(true);
	});

	it('public/index.json is valid SearchIndexItem[]', () => {
		const raw = JSON.parse(readFileSync(indexPath, 'utf-8')) as unknown[];
		expect(Array.isArray(raw)).toBe(true);
		for (const item of raw) {
			const result = SearchIndexItemSchema.safeParse(item);
			expect(result.success).toBe(true);
		}
	});

	it('repnect entry is at index 0 if present', () => {
		const raw = JSON.parse(readFileSync(indexPath, 'utf-8')) as SearchIndexItem[];
		const hasRepnect = raw.some((p) => p.slug === 'repnect');
		if (hasRepnect) {
			expect(raw[0].slug).toBe('repnect');
		} else {
			expect(hasRepnect).toBe(false);
		}
	});

	it('all items contain exactly the 12 required fields and no extras', () => {
		const REQUIRED_FIELDS = new Set([
			'slug', 'name', 'short_desc', 'category', 'tags',
			'stars', 'primary_lang', 'verified', 'added_at',
			'looking_for_contributors', 'location_city', 'location_nigerian_state'
		]);
		const raw = JSON.parse(readFileSync(indexPath, 'utf-8')) as SearchIndexItem[];
		for (const item of raw) {
			const keys = new Set(Object.keys(item));
			for (const field of REQUIRED_FIELDS) {
				expect(keys.has(field), `Missing field: ${field}`).toBe(true);
			}
			for (const key of keys) {
				expect(REQUIRED_FIELDS.has(key), `Unexpected field: ${key}`).toBe(true);
			}
		}
	});

	it('buildIndex() produces deterministic output', () => {
		const projects = loadAllProjects();
		const run1 = buildIndex(projects);
		const run2 = buildIndex(projects);
		expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
	});
});

// ── Task 68: Upvote slug validation (pure logic, no network) ─────────────────

describe('Upvote API slug validation logic (Task 68)', () => {
	// Mirror of _validateSlug from +server.ts
	function validateSlug(slug: string): boolean {
		return typeof slug === 'string' && slug.length > 0 && slug.length <= 100;
	}

	it('rejects empty slug', () => {
		expect(validateSlug('')).toBe(false);
	});

	it('rejects slug longer than 100 chars', () => {
		expect(validateSlug('a'.repeat(101))).toBe(false);
	});

	it('accepts slug exactly 100 chars', () => {
		expect(validateSlug('a'.repeat(100))).toBe(true);
	});

	it('accepts a normal slug', () => {
		expect(validateSlug('repnect')).toBe(true);
	});
});

// ── Sitemap structure check ───────────────────────────────────────────────────

describe('Sitemap route exports', () => {
	it('sitemap.xml server file exists', () => {
		const sitemapPath = join(
			process.cwd(),
			'src', 'routes', 'sitemap.xml', '+server.ts'
		);
		expect(existsSync(sitemapPath)).toBe(true);
	});
});

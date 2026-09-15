import { describe, it, expect } from 'vitest';
import { buildIndex } from '../../../scripts/build-index.js';
import type { Project } from '../schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeProject = (overrides: Partial<Project> = {}): Project => ({
	slug: 'test-project',
	name: 'Test Project',
	short_desc: 'A test project description.',
	repo: 'https://github.com/owner/test-project',
	license: 'MIT',
	added_at: '2024-01-01',
	primary_lang: 'TypeScript',
	category: 'tools',
	tags: ['testing'],
	looking_for_contributors: false,
	location_city: 'Lagos',
	location_nigerian_state: 'Lagos State',
	stars: 0,
	good_first_issues: 0,
	verified: false,
	...overrides
});

// ---------------------------------------------------------------------------
// Field mapping — Requirement 2.2
// ---------------------------------------------------------------------------

describe('buildIndex – field mapping', () => {
	it('maps every required SearchIndexItem field from a Project', () => {
		const project = makeProject({
			slug: 'my-oss',
			name: 'My OSS',
			short_desc: 'A short description of my OSS project.',
			category: 'libraries',
			tags: ['typescript', 'open-source'],
			stars: 42,
			primary_lang: 'TypeScript',
			verified: true,
			added_at: '2023-06-15',
			looking_for_contributors: true,
			location_city: 'Lagos',
			location_nigerian_state: 'Lagos State'
		});

		const [item] = buildIndex([project]);

		expect(item.slug).toBe('my-oss');
		expect(item.name).toBe('My OSS');
		expect(item.short_desc).toBe('A short description of my OSS project.');
		expect(item.category).toBe('libraries');
		expect(item.tags).toEqual(['typescript', 'open-source']);
		expect(item.stars).toBe(42);
		expect(item.primary_lang).toBe('TypeScript');
		expect(item.verified).toBe(true);
		expect(item.added_at).toBe('2023-06-15');
		expect(item.looking_for_contributors).toBe(true);
		expect(item.location_city).toBe('Lagos');
		expect(item.location_nigerian_state).toBe('Lagos State');
	});

	it('defaults stars to 0 when project.stars is undefined', () => {
		const project = makeProject({ stars: undefined });
		const [item] = buildIndex([project]);
		expect(item.stars).toBe(0);
	});

	it('defaults verified to false when project.verified is undefined', () => {
		const project = makeProject({ verified: undefined });
		const [item] = buildIndex([project]);
		expect(item.verified).toBe(false);
	});

	it('does not include fields not in SearchIndexItem (e.g. repo, license)', () => {
		const [item] = buildIndex([makeProject()]);
		expect(item).not.toHaveProperty('repo');
		expect(item).not.toHaveProperty('license');
		expect(item).not.toHaveProperty('website');
		expect(item).not.toHaveProperty('good_first_issues');
	});
});

// ---------------------------------------------------------------------------
// Sort order — Requirement 2.3
// ---------------------------------------------------------------------------

describe('buildIndex – sort order', () => {
	it('places the repnect project first regardless of input order', () => {
		const projects = [
			makeProject({ slug: 'zebra-tool', name: 'Zebra Tool' }),
			makeProject({ slug: 'alpha-lib', name: 'Alpha Lib' }),
			makeProject({ slug: 'repnect', name: 'Repnect' })
		];

		const result = buildIndex(projects);

		expect(result[0].slug).toBe('repnect');
	});

	it('sorts remaining entries alphabetically by name', () => {
		const projects = [
			makeProject({ slug: 'zebra-tool', name: 'Zebra Tool' }),
			makeProject({ slug: 'mango-app', name: 'Mango App' }),
			makeProject({ slug: 'alpha-lib', name: 'Alpha Lib' }),
			makeProject({ slug: 'repnect', name: 'Repnect' })
		];

		const result = buildIndex(projects);
		const names = result.map((r) => r.name);

		expect(names[0]).toBe('Repnect');
		expect(names.slice(1)).toEqual(['Alpha Lib', 'Mango App', 'Zebra Tool']);
	});

	it('sorts alphabetically by name when repnect is absent', () => {
		const projects = [
			makeProject({ slug: 'zebra-tool', name: 'Zebra Tool' }),
			makeProject({ slug: 'alpha-lib', name: 'Alpha Lib' }),
			makeProject({ slug: 'mango-app', name: 'Mango App' })
		];

		const result = buildIndex(projects);
		const names = result.map((r) => r.name);

		expect(names).toEqual(['Alpha Lib', 'Mango App', 'Zebra Tool']);
	});

	it('returns an empty array for empty input', () => {
		expect(buildIndex([])).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// Determinism — Requirement 2.6
// ---------------------------------------------------------------------------

describe('buildIndex – determinism', () => {
	it('produces identical output for two calls on the same input', () => {
		const projects = [
			makeProject({ slug: 'zebra-tool', name: 'Zebra Tool' }),
			makeProject({ slug: 'alpha-lib', name: 'Alpha Lib' }),
			makeProject({ slug: 'repnect', name: 'Repnect' }),
			makeProject({ slug: 'mango-app', name: 'Mango App' })
		];

		const first = buildIndex(projects);
		const second = buildIndex(projects);

		expect(first).toEqual(second);
	});

	it('serialises to identical JSON strings on repeated calls', () => {
		const projects = [
			makeProject({ slug: 'bravo-tool', name: 'Bravo Tool' }),
			makeProject({ slug: 'alpha-lib', name: 'Alpha Lib' })
		];

		const json1 = JSON.stringify(buildIndex(projects));
		const json2 = JSON.stringify(buildIndex(projects));

		expect(json1).toBe(json2);
	});

	it('does not mutate the original input array order', () => {
		const projects = [
			makeProject({ slug: 'zebra-tool', name: 'Zebra Tool' }),
			makeProject({ slug: 'alpha-lib', name: 'Alpha Lib' })
		];
		const originalSlugs = projects.map((p) => p.slug);

		buildIndex(projects);

		expect(projects.map((p) => p.slug)).toEqual(originalSlugs);
	});
});

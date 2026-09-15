import { describe, it, expect } from 'vitest';
import { ProjectSchema, RESERVED_SLUGS } from '../schema';

// A minimal valid project object used as a baseline for individual field tests.
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
	location_city: 'Mumbai',
	location_nigerian_state: 'Maharashtra'
};

// Helper to override a single field
function withField(overrides: Record<string, unknown>) {
	return { ...validProject, ...overrides };
}

// ---------------------------------------------------------------------------
// Required field enforcement
// ---------------------------------------------------------------------------
describe('ProjectSchema — required fields', () => {
	it('accepts a fully valid project', () => {
		expect(() => ProjectSchema.parse(validProject)).not.toThrow();
	});

	const requiredFields: (keyof typeof validProject)[] = [
		'slug',
		'name',
		'short_desc',
		'repo',
		'license',
		'added_at',
		'primary_lang',
		'category',
		'tags',
		'looking_for_contributors',
		'location_city',
		'location_nigerian_state'
	];

	for (const field of requiredFields) {
		it(`rejects a project missing the required field: ${field}`, () => {
			const data = { ...validProject } as Record<string, unknown>;
			delete data[field];
			expect(() => ProjectSchema.parse(data)).toThrow();
		});
	}
});

// ---------------------------------------------------------------------------
// slug boundary values and character rules (Requirement 1.1)
// ---------------------------------------------------------------------------
describe('ProjectSchema — slug validation', () => {
	it('accepts slug of length 2 (minimum boundary)', () => {
		expect(() => ProjectSchema.parse(withField({ slug: 'ab' }))).not.toThrow();
	});

	it('accepts slug of length 60 (maximum boundary)', () => {
		const slug = 'a'.repeat(60);
		expect(() => ProjectSchema.parse(withField({ slug }))).not.toThrow();
	});

	it('rejects slug of length 1 (below minimum)', () => {
		expect(() => ProjectSchema.parse(withField({ slug: 'a' }))).toThrow();
	});

	it('rejects slug of length 61 (above maximum)', () => {
		const slug = 'a'.repeat(61);
		expect(() => ProjectSchema.parse(withField({ slug }))).toThrow();
	});

	it('accepts slug with lowercase letters, digits, and hyphens', () => {
		expect(() =>
			ProjectSchema.parse(withField({ slug: 'abc-123-xyz' }))
		).not.toThrow();
	});

	it('rejects slug with uppercase letters', () => {
		expect(() => ProjectSchema.parse(withField({ slug: 'MyProject' }))).toThrow();
	});

	it('rejects slug with spaces', () => {
		expect(() => ProjectSchema.parse(withField({ slug: 'my project' }))).toThrow();
	});

	it('rejects slug with special characters (underscore)', () => {
		expect(() => ProjectSchema.parse(withField({ slug: 'my_project' }))).toThrow();
	});

	it('rejects slug with special characters (dot)', () => {
		expect(() => ProjectSchema.parse(withField({ slug: 'my.project' }))).toThrow();
	});
});

// ---------------------------------------------------------------------------
// Reserved slug rejection (Requirement 1.1)
// ---------------------------------------------------------------------------
describe('ProjectSchema — reserved slugs', () => {
	for (const reserved of RESERVED_SLUGS) {
		it(`rejects reserved slug: "${reserved}"`, () => {
			expect(() => ProjectSchema.parse(withField({ slug: reserved }))).toThrow();
		});
	}

	it('accepts a slug that is not reserved', () => {
		expect(() =>
			ProjectSchema.parse(withField({ slug: 'unique-project-slug' }))
		).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// name boundary values (Requirement 1.1)
// ---------------------------------------------------------------------------
describe('ProjectSchema — name validation', () => {
	it('accepts name of length 2 (minimum boundary)', () => {
		expect(() => ProjectSchema.parse(withField({ name: 'ab' }))).not.toThrow();
	});

	it('accepts name of length 80 (maximum boundary)', () => {
		const name = 'a'.repeat(80);
		expect(() => ProjectSchema.parse(withField({ name }))).not.toThrow();
	});

	it('rejects name of length 1 (below minimum)', () => {
		expect(() => ProjectSchema.parse(withField({ name: 'a' }))).toThrow();
	});

	it('rejects name of length 81 (above maximum)', () => {
		const name = 'a'.repeat(81);
		expect(() => ProjectSchema.parse(withField({ name }))).toThrow();
	});

	it('rejects empty name', () => {
		expect(() => ProjectSchema.parse(withField({ name: '' }))).toThrow();
	});
});

// ---------------------------------------------------------------------------
// short_desc boundary values (Requirement 1.1)
// ---------------------------------------------------------------------------
describe('ProjectSchema — short_desc validation', () => {
	it('accepts short_desc of length 10 (minimum boundary)', () => {
		expect(() =>
			ProjectSchema.parse(withField({ short_desc: 'a'.repeat(10) }))
		).not.toThrow();
	});

	it('accepts short_desc of length 160 (maximum boundary)', () => {
		expect(() =>
			ProjectSchema.parse(withField({ short_desc: 'a'.repeat(160) }))
		).not.toThrow();
	});

	it('rejects short_desc of length 9 (below minimum)', () => {
		expect(() =>
			ProjectSchema.parse(withField({ short_desc: 'a'.repeat(9) }))
		).toThrow();
	});

	it('rejects short_desc of length 161 (above maximum)', () => {
		expect(() =>
			ProjectSchema.parse(withField({ short_desc: 'a'.repeat(161) }))
		).toThrow();
	});

	it('rejects empty short_desc', () => {
		expect(() => ProjectSchema.parse(withField({ short_desc: '' }))).toThrow();
	});
});

// ---------------------------------------------------------------------------
// repo URL validation (Requirement 1.1)
// ---------------------------------------------------------------------------
describe('ProjectSchema — repo URL validation', () => {
	it('accepts a valid HTTPS GitHub URL', () => {
		expect(() =>
			ProjectSchema.parse(withField({ repo: 'https://github.com/owner/repo' }))
		).not.toThrow();
	});

	it('accepts a valid HTTPS GitHub URL with trailing slash', () => {
		expect(() =>
			ProjectSchema.parse(withField({ repo: 'https://github.com/owner/repo/' }))
		).not.toThrow();
	});

	it('rejects an HTTP (non-HTTPS) GitHub URL', () => {
		expect(() =>
			ProjectSchema.parse(withField({ repo: 'http://github.com/owner/repo' }))
		).toThrow();
	});

	it('rejects a non-GitHub URL', () => {
		expect(() =>
			ProjectSchema.parse(withField({ repo: 'https://gitlab.com/owner/repo' }))
		).toThrow();
	});

	it('rejects a GitHub URL without an owner segment', () => {
		expect(() =>
			ProjectSchema.parse(withField({ repo: 'https://github.com/repo' }))
		).toThrow();
	});

	it('rejects a plain string (not a URL)', () => {
		expect(() =>
			ProjectSchema.parse(withField({ repo: 'not-a-url' }))
		).toThrow();
	});

	it('rejects a GitHub URL with extra path segments', () => {
		expect(() =>
			ProjectSchema.parse(withField({ repo: 'https://github.com/owner/repo/tree/main' }))
		).toThrow();
	});
});

// ---------------------------------------------------------------------------
// logo optional field — path pattern enforcement (Requirement 1.5)
// ---------------------------------------------------------------------------
describe('ProjectSchema — logo validation', () => {
	it('accepts undefined logo (optional field)', () => {
		const { logo: _logo, ...withoutLogo } = { ...validProject, logo: undefined };
		expect(() => ProjectSchema.parse(withoutLogo)).not.toThrow();
	});

	it('accepts a valid SVG logo path', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/myproject.svg' }))
		).not.toThrow();
	});

	it('accepts a valid PNG logo path', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/myproject.png' }))
		).not.toThrow();
	});

	it('accepts a valid JPG logo path', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/myproject.jpg' }))
		).not.toThrow();
	});

	it('accepts a valid JPEG logo path', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/myproject.jpeg' }))
		).not.toThrow();
	});

	it('accepts a valid WEBP logo path', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/myproject.webp' }))
		).not.toThrow();
	});

	it('rejects logo without /logos/ prefix', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: 'myproject.svg' }))
		).toThrow();
	});

	it('rejects logo with subdirectory inside /logos/', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/sub/myproject.svg' }))
		).toThrow();
	});

	it('rejects logo with an unsupported extension (gif)', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/myproject.gif' }))
		).toThrow();
	});

	it('rejects logo with an unsupported extension (bmp)', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/myproject.bmp' }))
		).toThrow();
	});

	it('rejects logo with no extension', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/logos/myproject' }))
		).toThrow();
	});

	it('rejects an absolute path not starting with /logos/', () => {
		expect(() =>
			ProjectSchema.parse(withField({ logo: '/images/myproject.png' }))
		).toThrow();
	});
});

// ---------------------------------------------------------------------------
// Optional fields accept undefined gracefully (Requirement 1.2)
// ---------------------------------------------------------------------------
describe('ProjectSchema — optional fields', () => {
	it('accepts a project with no optional fields provided', () => {
		expect(() => ProjectSchema.parse(validProject)).not.toThrow();
	});

	it('accepts website as undefined', () => {
		expect(() => ProjectSchema.parse(withField({ website: undefined }))).not.toThrow();
	});

	it('accepts logo as undefined', () => {
		expect(() => ProjectSchema.parse(withField({ logo: undefined }))).not.toThrow();
	});

	it('accepts good_first_issues as undefined (defaults to 0)', () => {
		const result = ProjectSchema.parse(withField({ good_first_issues: undefined }));
		expect(result.good_first_issues).toBe(0);
	});

	it('accepts stars as undefined (defaults to 0)', () => {
		const result = ProjectSchema.parse(withField({ stars: undefined }));
		expect(result.stars).toBe(0);
	});

	it('accepts verified as undefined (defaults to false)', () => {
		const result = ProjectSchema.parse(withField({ verified: undefined }));
		expect(result.verified).toBe(false);
	});

	it('accepts nigeria_connection as undefined', () => {
		expect(() =>
			ProjectSchema.parse(withField({ nigeria_connection: undefined }))
		).not.toThrow();
	});

	it('accepts nigeria_connection_details as undefined', () => {
		expect(() =>
			ProjectSchema.parse(withField({ nigeria_connection_details: undefined }))
		).not.toThrow();
	});

	it('accepts all optional fields populated together', () => {
		expect(() =>
			ProjectSchema.parse(
				withField({
					website: 'https://example.com',
					logo: '/logos/example.svg',
					good_first_issues: 5,
					stars: 100,
					verified: true,
					nigeria_connection: 'founder',
					nigeria_connection_details: 'Founded in Bengaluru.'
				})
			)
		).not.toThrow();
	});

	it('rejects an invalid website URL', () => {
		expect(() =>
			ProjectSchema.parse(withField({ website: 'not-a-url' }))
		).toThrow();
	});

	it('rejects nigeria_connection with an invalid enum value', () => {
		expect(() =>
			ProjectSchema.parse(withField({ nigeria_connection: 'invalid-value' }))
		).toThrow();
	});

	it('accepts all valid nigeria_connection enum values', () => {
		for (const value of ['founder', 'organization', 'community', 'contributor']) {
			expect(() =>
				ProjectSchema.parse(withField({ nigeria_connection: value }))
			).not.toThrow();
		}
	});
});

// ---------------------------------------------------------------------------
// tags array constraints (Requirement 1.1)
// ---------------------------------------------------------------------------
describe('ProjectSchema — tags validation', () => {
	it('accepts tags array with exactly 1 tag (minimum)', () => {
		expect(() =>
			ProjectSchema.parse(withField({ tags: ['web'] }))
		).not.toThrow();
	});

	it('accepts tags array with exactly 10 tags (maximum)', () => {
		const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`);
		expect(() => ProjectSchema.parse(withField({ tags }))).not.toThrow();
	});

	it('rejects empty tags array', () => {
		expect(() => ProjectSchema.parse(withField({ tags: [] }))).toThrow();
	});

	it('rejects tags array with 11 items (above maximum)', () => {
		const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
		expect(() => ProjectSchema.parse(withField({ tags }))).toThrow();
	});
});

// ---------------------------------------------------------------------------
// added_at date format (Requirement 1.1)
// ---------------------------------------------------------------------------
describe('ProjectSchema — added_at validation', () => {
	it('accepts a valid YYYY-MM-DD date', () => {
		expect(() =>
			ProjectSchema.parse(withField({ added_at: '2024-06-15' }))
		).not.toThrow();
	});

	it('rejects a date in DD/MM/YYYY format', () => {
		expect(() =>
			ProjectSchema.parse(withField({ added_at: '15/06/2024' }))
		).toThrow();
	});

	it('rejects a date with only year and month', () => {
		expect(() =>
			ProjectSchema.parse(withField({ added_at: '2024-06' }))
		).toThrow();
	});

	it('rejects a free-form date string', () => {
		expect(() =>
			ProjectSchema.parse(withField({ added_at: 'January 1 2024' }))
		).toThrow();
	});
});

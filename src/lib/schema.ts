import { z } from 'zod';

export const RESERVED_SLUGS = [
	'new',
	'admin',
	'api',
	'auth',
	'projects',
	'tags',
	'search',
	'submit',
	'about',
	'privacy',
	'terms'
];

export const ProjectSchema = z.object({
	// Required fields
	slug: z
		.string()
		.regex(/^[a-z0-9-]+$/)
		.min(2)
		.max(60)
		.refine((s) => !RESERVED_SLUGS.includes(s), {
			message: 'Slug is a reserved word and cannot be used for a project'
		}),
	name: z.string().min(2).max(80),
	short_desc: z.string().min(10).max(160),
	repo: z
		.string()
		.url()
		.regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/),
	license: z.string().min(1),
	added_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	primary_lang: z.string().min(1),
	category: z.string().min(1),
	tags: z.array(z.string()).min(1).max(10),
	looking_for_contributors: z.boolean(),
	location_city: z.string().min(2).max(100),
	location_nigerian_state: z.string().min(2).max(100),

	// Optional fields
	website: z.string().url().optional(),
	logo: z
		.string()
		.regex(/^\/logos\/[^/]+\.(svg|png|jpg|jpeg|webp)$/)
		.optional(),
	good_first_issues: z.number().int().nonnegative().optional().default(0),
	stars: z.number().int().nonnegative().optional().default(0),
	verified: z.boolean().optional().default(false),
	nigeria_connection: z
		.enum(['founder', 'organization', 'community', 'contributor'])
		.optional(),
	nigeria_connection_details: z.string().max(500).optional()
});

export type Project = z.infer<typeof ProjectSchema>;

export const SearchIndexItemSchema = z.object({
	slug: z.string(),
	name: z.string(),
	short_desc: z.string(),
	category: z.string(),
	tags: z.array(z.string()),
	stars: z.number().default(0),
	primary_lang: z.string(),
	verified: z.boolean().default(false),
	added_at: z.string(),
	looking_for_contributors: z.boolean(),
	location_city: z.string(),
	location_nigerian_state: z.string()
});

export type SearchIndexItem = z.infer<typeof SearchIndexItemSchema>;

export const ProjectSubmissionSchema = ProjectSchema.omit({
	stars: true,
	good_first_issues: true,
	verified: true
}).extend({ submitter_notes: z.string().max(500).optional() });

export type ProjectSubmission = z.infer<typeof ProjectSubmissionSchema>;

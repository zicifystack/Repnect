import { z } from 'zod';

export const NIGERIAN_STATES = [
	'Abia',
	'Adamawa',
	'Akwa Ibom',
	'Anambra',
	'Bauchi',
	'Bayelsa',
	'Benue',
	'Borno',
	'Cross River',
	'Delta',
	'Ebonyi',
	'Edo',
	'Ekiti',
	'Enugu',
	'FCT Abuja',
	'Gombe',
	'Imo',
	'Jigawa',
	'Kaduna',
	'Kano',
	'Katsina',
	'Kebbi',
	'Kogi',
	'Kwara',
	'Lagos',
	'Nasarawa',
	'Niger',
	'Ogun',
	'Ondo',
	'Osun',
	'Oyo',
	'Plateau',
	'Rivers',
	'Sokoto',
	'Taraba',
	'Yobe',
	'Zamfara'
] as const;

export const CATEGORIES = [
	'developer-tools',
	'fintech',
	'open-source',
	'ai-ml',
	'e-commerce',
	'healthtech',
	'edtech',
	'infrastructure',
	'logistics',
	'agritech'
] as const;

export const NIGERIA_CONNECTIONS = [
	'founder',
	'built_in_nigeria',
	'nigerian_market',
	'contributor',
	'team'
] as const;

export const directoryItemSchema = z.object({
	id: z
		.string()
		.min(2)
		.max(100)
		.regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
	name: z.string().min(2).max(100),
	description: z.string().min(10).max(500),
	website_url: z.string().url(),
	logo_url: z.string().url().optional().or(z.literal('')),
	github_repo: z
		.string()
		.regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)
		.optional()
		.or(z.literal('')),
	category: z.enum(CATEGORIES),
	tags: z.array(z.string().min(1).max(30)).default([]),
	location_city: z.string().min(2).max(100),
	location_state: z.string().min(2).max(100),
	nigeria_connection: z.enum(NIGERIA_CONNECTIONS),
	nigeria_connection_details: z.string().min(5).max(500),
	stars: z.number().int().min(0).default(0),
	good_first_issues: z.number().int().min(0).default(0),
	verified: z.boolean().default(false),
	updated_at: z
		.string()
		.datetime()
		.default(() => new Date().toISOString())
});

export type DirectoryItem = z.infer<typeof directoryItemSchema>;

export const submitProjectSchema = directoryItemSchema.omit({
	stars: true,
	good_first_issues: true,
	verified: true,
	updated_at: true
});

export type SubmitProjectInput = z.infer<typeof submitProjectSchema>;

import { AppError } from '../errors';
import type { Ctx } from '../ctx';
import {
	directoryItemSchema,
	submitProjectSchema,
	type DirectoryItem,
	type SubmitProjectInput
} from './validation';

import { DEFAULT_PROJECTS } from './defaults';

export type DirectoryFilters = {
	search?: string;
	category?: string;
	state?: string;
	connection?: string;
	verifiedOnly?: boolean;
	minStars?: number;
	goodFirstIssuesOnly?: boolean;
	sortBy?: 'stars' | 'newest' | 'name' | 'votes';
};

export async function listDirectoryItems(
	ctx: Ctx,
	filters: DirectoryFilters = {}
): Promise<DirectoryItem[]> {
	const stored = await ctx.store.get<DirectoryItem[]>('dir:all', 'json');
	const all = stored && stored.length > 0 ? stored : DEFAULT_PROJECTS;

	let results = [...all];

	if (filters.search) {
		const q = filters.search.toLowerCase().trim();
		results = results.filter(
			(item) =>
				item.name.toLowerCase().includes(q) ||
				item.description.toLowerCase().includes(q) ||
				item.location_city.toLowerCase().includes(q) ||
				item.location_state.toLowerCase().includes(q) ||
				item.tags.some((tag) => tag.toLowerCase().includes(q))
		);
	}

	if (filters.category) {
		results = results.filter((item) => item.category === filters.category);
	}

	if (filters.state) {
		results = results.filter(
			(item) => item.location_state.toLowerCase() === filters.state?.toLowerCase()
		);
	}

	if (filters.connection) {
		results = results.filter((item) => item.nigeria_connection === filters.connection);
	}

	if (filters.verifiedOnly) {
		results = results.filter((item) => item.verified);
	}

	if (filters.minStars != null && filters.minStars > 0) {
		results = results.filter((item) => item.stars >= (filters.minStars ?? 0));
	}

	if (filters.goodFirstIssuesOnly) {
		results = results.filter((item) => item.good_first_issues > 0);
	}

	const sortBy = filters.sortBy ?? 'stars';
	if (sortBy === 'votes') {
		const scores = await Promise.all(
			results.map(async (i) => ({
				item: i,
				score: Number((await ctx.store.get(`vote:score:${i.id}`)) ?? 0)
			}))
		);
		scores.sort((a, b) => b.score - a.score || b.item.stars - a.item.stars);
		return scores.map((s) => s.item);
	} else if (sortBy === 'stars') {
		results.sort((a, b) => b.stars - a.stars);
	} else if (sortBy === 'newest') {
		results.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
	} else if (sortBy === 'name') {
		results.sort((a, b) => a.name.localeCompare(b.name));
	}

	return results;
}

export async function getDirectoryItem(ctx: Ctx, id: string): Promise<DirectoryItem> {
	const item = await ctx.store.get<DirectoryItem>(`dir:item:${id}`, 'json');
	if (item) return item;

	const stored = await ctx.store.get<DirectoryItem[]>('dir:all', 'json');
	const all = stored && stored.length > 0 ? stored : DEFAULT_PROJECTS;
	const found = all.find((i) => i.id === id);
	if (!found) throw new AppError('not_found', 'Project not found in directory');
	return found;
}

export async function syncDirectoryItems(
	ctx: Ctx,
	rawItems: unknown[]
): Promise<{ count: number }> {
	const parsed = directoryItemSchema.array().safeParse(rawItems);
	if (!parsed.success) {
		throw new AppError('invalid', `Validation failed: ${parsed.error.message}`);
	}

	const items = parsed.data;

	await ctx.store.put('dir:all', JSON.stringify(items));

	for (const item of items) {
		await ctx.store.put(`dir:item:${item.id}`, JSON.stringify(item));
	}

	const categories = Array.from(new Set(items.map((i) => i.category))).map((cat) => ({
		category: cat,
		count: items.filter((i) => i.category === cat).length
	}));
	await ctx.store.put('dir:categories', JSON.stringify(categories));

	const states = Array.from(new Set(items.map((i) => i.location_state))).map((st) => ({
		state: st,
		count: items.filter((i) => i.location_state === st).length
	}));
	await ctx.store.put('dir:states', JSON.stringify(states));

	return { count: items.length };
}

export async function submitProject(
	ctx: Ctx,
	ip: string,
	rawInput: unknown
): Promise<{ item: DirectoryItem; yamlPreview: string }> {
	const { success } = await ctx.rateLimiter.limit(`dir:submit:${ip}`);
	if (!success) throw new AppError('rate_limited', 'Too many submissions. Please try again later.');

	const parsed = submitProjectSchema.safeParse(rawInput);
	if (!parsed.success) {
		throw new AppError('invalid', parsed.error.issues[0]?.message ?? 'Invalid submission data');
	}

	const input: SubmitProjectInput = parsed.data;

	const item: DirectoryItem = {
		...input,
		stars: 0,
		good_first_issues: 0,
		verified: false,
		updated_at: new Date().toISOString()
	};

	await ctx.store.put(`dir:pending:${item.id}`, JSON.stringify(item));

	const yamlPreview = [
		`id: ${item.id}`,
		`name: "${item.name}"`,
		`description: "${item.description.replace(/"/g, '\\"')}"`,
		`website_url: ${item.website_url}`,
		item.logo_url ? `logo_url: ${item.logo_url}` : null,
		item.github_repo ? `github_repo: ${item.github_repo}` : null,
		`category: ${item.category}`,
		`tags: [${item.tags.map((t) => `"${t}"`).join(', ')}]`,
		'',
		'# Location',
		`location_city: "${item.location_city}"`,
		`location_state: "${item.location_state}"`,
		'',
		'# Nigeria connection',
		`nigeria_connection: ${item.nigeria_connection}`,
		`nigeria_connection_details: "${item.nigeria_connection_details.replace(/"/g, '\\"')}"`,
		'',
		'# Auto-updated fields',
		`stars: 0`,
		`good_first_issues: 0`,
		`verified: false`,
		`updated_at: ${item.updated_at}`
	]
		.filter((line) => line != null)
		.join('\n');

	return { item, yamlPreview };
}

export type GitHubRepoDetails = {
	owner: string;
	repo: string;
	fullName: string;
	name: string;
	slug: string;
	description: string;
	websiteUrl: string;
	logoUrl: string;
	stars: number;
	tags: string[];
	topics: string[];
	language: string | null;
};

export type LanguageBreakdown = {
	name: string;
	bytes: number;
	percentage: number;
};

export async function fetchGitHubRepoLanguages(
	_ctx: Ctx,
	rawInput: string
): Promise<LanguageBreakdown[]> {
	const parsed = parseGitHubRepo(rawInput);
	if (!parsed) return [];
	const { owner, repo } = parsed;
	try {
		const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
			headers: {
				'User-Agent': 'repnect-directory',
				Accept: 'application/vnd.github.v3+json'
			}
		});
		if (!res.ok) return [];
		const data = (await res.json()) as Record<string, number>;
		const totalBytes = Object.values(data).reduce((acc, curr) => acc + curr, 0);
		if (totalBytes === 0) return [];
		return Object.entries(data)
			.map(([name, bytes]) => ({
				name,
				bytes,
				percentage: Math.round((bytes / totalBytes) * 1000) / 10
			}))
			.sort((a, b) => b.bytes - a.bytes);
	} catch {
		return [];
	}
}

export function parseGitHubRepo(input: string): { owner: string; repo: string } | null {
	const trimmed = input.trim();
	const match =
		trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/) ||
		trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
	if (!match || !match[1] || !match[2]) return null;
	const owner = match[1];
	const repo = match[2].replace(/\.git$/i, '');
	return { owner, repo };
}

export async function fetchGitHubRepoDetails(
	_ctx: Ctx,
	rawInput: string
): Promise<GitHubRepoDetails> {
	const parsed = parseGitHubRepo(rawInput);
	if (!parsed) {
		throw new AppError('invalid', 'Please provide a valid GitHub repo in owner/repo format or URL');
	}

	const { owner, repo } = parsed;
	const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
		headers: {
			'User-Agent': 'repnect-directory',
			Accept: 'application/vnd.github.v3+json'
		}
	});

	if (res.status === 404) {
		throw new AppError(
			'not_found',
			`GitHub repository ${owner}/${repo} was not found or is private`
		);
	}

	if (!res.ok) {
		throw new AppError('internal', `GitHub API error (${res.status})`);
	}

	const data = (await res.json()) as {
		name: string;
		description: string | null;
		homepage: string | null;
		html_url: string;
		owner: { avatar_url: string | null; login: string };
		topics?: string[];
		language: string | null;
		stargazers_count: number;
	};

	const formattedName = data.name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

	const slug = data.name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	const topics = Array.isArray(data.topics) ? data.topics : [];
	const tags = [...topics];
	if (data.language && !tags.some((t) => t.toLowerCase() === data.language?.toLowerCase())) {
		tags.push(data.language.toLowerCase());
	}

	let websiteUrl = data.homepage?.trim() || '';
	if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
		websiteUrl = `https://${websiteUrl}`;
	}
	if (!websiteUrl) {
		websiteUrl = data.html_url;
	}

	return {
		owner,
		repo,
		fullName: `${owner}/${repo}`,
		name: formattedName,
		slug,
		description: data.description ?? '',
		websiteUrl,
		logoUrl: data.owner?.avatar_url ?? '',
		stars: data.stargazers_count ?? 0,
		tags,
		topics,
		language: data.language
	};
}

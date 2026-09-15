import type { Contributor } from './types.js';

const BASE = 'https://api.github.com';

function headers(token?: string): Record<string, string> {
	const h: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'repnect/1.0',
	};
	if (token) h['Authorization'] = `Bearer ${token}`;
	return h;
}

export interface GitHubRepoMeta {
	name: string;
	description: string | null;
	stargazers_count: number;
	forks_count: number;
	watchers_count: number;
	open_issues_count: number;
	size: number;
	created_at: string;
	updated_at: string;
	pushed_at: string;
	has_wiki: boolean;
	has_pages: boolean;
	has_discussions: boolean;
	license: { spdx_id: string } | null;
	default_branch: string;
}

export async function getRepoMeta(owner: string, repo: string, token?: string): Promise<GitHubRepoMeta | null> {
	const res = await fetch(`${BASE}/repos/${owner}/${repo}`, { headers: headers(token) });
	if (!res.ok) return null;
	return res.json() as Promise<GitHubRepoMeta>;
}

export async function getContributors(owner: string, repo: string, token?: string): Promise<Contributor[]> {
	const res = await fetch(`${BASE}/repos/${owner}/${repo}/contributors?per_page=30`, { headers: headers(token) });
	if (!res.ok) return [];
	const data = await res.json() as Array<{ login: string; avatar_url: string; html_url: string; contributions: number; type: string }>;
	return data
		.filter((c) => c.type !== 'Bot' && !c.login.endsWith('[bot]'))
		.slice(0, 10)
		.map((c) => ({ login: c.login, avatar_url: c.avatar_url, html_url: c.html_url, contributions: c.contributions }));
}

export async function getLanguages(owner: string, repo: string, token?: string): Promise<Record<string, number>> {
	const res = await fetch(`${BASE}/repos/${owner}/${repo}/languages`, { headers: headers(token) });
	if (!res.ok) return {};
	return res.json() as Promise<Record<string, number>>;
}

export async function getTopics(owner: string, repo: string, token?: string): Promise<string[]> {
	const res = await fetch(`${BASE}/repos/${owner}/${repo}/topics`, { headers: headers(token) });
	if (!res.ok) return [];
	const data = await res.json() as { names: string[] };
	return data.names ?? [];
}

export async function getReadme(owner: string, repo: string, token?: string): Promise<string | null> {
	const res = await fetch(`${BASE}/repos/${owner}/${repo}/readme`, { headers: headers(token) });
	if (!res.ok) return null;
	const data = await res.json() as { content?: string; encoding?: string };
	if (data.encoding === 'base64' && data.content) {
		return Buffer.from(data.content, 'base64').toString('utf-8');
	}
	return null;
}

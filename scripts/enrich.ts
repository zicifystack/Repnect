/**
 * scripts/enrich.ts
 *
 * Enriches project TOML files with live GitHub data and writes per-project
 * cache JSON files to public/cache/[slug].json.
 *
 * Required env:
 *   GITHUB_TOKEN — Personal access token with at least `public_repo` scope.
 *
 * Exit codes:
 *   0  — all projects processed (some may have non-fatal warnings)
 *   1  — GITHUB_TOKEN missing, or fatal setup error
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx tsx scripts/enrich.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parse, stringify } from 'smol-toml';
import { loadAllProjects } from '../src/lib/projects.js';
import type { CacheData, Contributor, InstallationInfo, RepoStats } from '../src/lib/types.js';

// ---------------------------------------------------------------------------
// Token guard
// ---------------------------------------------------------------------------

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
	process.stderr.write(
		'Error: GITHUB_TOKEN environment variable is required but not set.\n' +
			'Set it with: export GITHUB_TOKEN=ghp_xxx\n'
	);
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECTS_DIR = join(process.cwd(), 'data', 'projects');
const CACHE_DIR = join(process.cwd(), 'public', 'cache');
const DELAY_MS = 1000;

const GITHUB_HEADERS: Record<string, string> = {
	Authorization: `Bearer ${GITHUB_TOKEN}`,
	Accept: 'application/vnd.github+json',
	'X-GitHub-Api-Version': '2022-11-28',
	'User-Agent': 'repnect-enrich/1.0'
};

const BOT_PATTERNS = [/\[bot\]$/i, /^dependabot$/i, /^renovate$/i, /^github-actions$/i];

// ---------------------------------------------------------------------------
// Pure helper: updateProjectFields (exported for task-16 property tests)
// ---------------------------------------------------------------------------

/**
 * Takes raw TOML content and returns new TOML content with `stars`,
 * `good_first_issues`, and `verified` fields updated/inserted.
 * All other fields are preserved exactly.
 */
export function updateProjectFields(
	original: string,
	updates: { stars: number; good_first_issues: number; verified: boolean }
): string {
	const parsed = parse(original) as Record<string, unknown>;
	const updated = { ...parsed, ...updates };
	return stringify(updated);
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

function parseGitHubRepo(repoUrl: string): { owner: string; repo: string } | null {
	const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
	if (!match) return null;
	return { owner: match[1], repo: match[2] };
}

async function ghFetch(path: string): Promise<Response> {
	return fetch(`https://api.github.com${path}`, { headers: GITHUB_HEADERS });
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBot(login: string): boolean {
	return BOT_PATTERNS.some((pattern) => pattern.test(login));
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

interface RepoData {
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
	topics?: string[];
}

async function fetchRepoData(owner: string, repo: string): Promise<RepoData | null> {
	const res = await ghFetch(`/repos/${owner}/${repo}`);
	if (!res.ok) return null;
	return res.json() as Promise<RepoData>;
}

async function fetchTopics(owner: string, repo: string): Promise<string[]> {
	const res = await ghFetch(`/repos/${owner}/${repo}/topics`);
	if (!res.ok) return [];
	const data = (await res.json()) as { names: string[] };
	return data.names ?? [];
}

async function fetchReadme(owner: string, repo: string): Promise<string | null> {
	const res = await ghFetch(`/repos/${owner}/${repo}/readme`);
	if (!res.ok) return null;
	const data = (await res.json()) as { content?: string; encoding?: string };
	if (data.encoding === 'base64' && data.content) {
		return Buffer.from(data.content, 'base64').toString('utf-8');
	}
	return null;
}

async function fetchContributors(owner: string, repo: string): Promise<Contributor[]> {
	const res = await ghFetch(`/repos/${owner}/${repo}/contributors?per_page=30&anon=0`);
	if (!res.ok) return [];
	const data = (await res.json()) as Array<{
		login: string;
		avatar_url: string;
		html_url: string;
		contributions: number;
		type: string;
	}>;

	return data
		.filter((c) => c.type !== 'Bot' && !isBot(c.login))
		.slice(0, 10)
		.map((c) => ({
			login: c.login,
			avatar_url: c.avatar_url,
			html_url: c.html_url,
			contributions: c.contributions
		}));
}

async function fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
	const res = await ghFetch(`/repos/${owner}/${repo}/languages`);
	if (!res.ok) return {};
	return res.json() as Promise<Record<string, number>>;
}

async function fetchGoodFirstIssues(owner: string, repo: string): Promise<number> {
	const res = await ghFetch(
		`/repos/${owner}/${repo}/issues?labels=good+first+issue&state=open&per_page=1`
	);
	if (!res.ok) return 0;

	// GitHub returns X-Total-Count or we count via Link header pagination
	// Simpler: fetch up to 100, count them, then check for more via Link header
	const res2 = await ghFetch(
		`/repos/${owner}/${repo}/issues?labels=good+first+issue&state=open&per_page=100`
	);
	if (!res2.ok) return 0;
	const issues = (await res2.json()) as unknown[];
	return issues.length;
}

async function checkFileExists(owner: string, repo: string, filePath: string): Promise<boolean> {
	const res = await ghFetch(`/repos/${owner}/${repo}/contents/${filePath}`);
	return res.ok;
}

async function detectInstallation(
	owner: string,
	repo: string
): Promise<InstallationInfo | null> {
	// Check in order of specificity
	const checks: Array<[string, InstallationInfo]> = [
		['package.json', { type: 'npm', command: 'npm install' }],
		['requirements.txt', { type: 'pip', command: 'pip install -r requirements.txt' }],
		['pyproject.toml', { type: 'pip', command: 'pip install .' }],
		['Cargo.toml', { type: 'cargo', command: 'cargo add' }],
		['go.mod', { type: 'go', command: 'go get' }]
	];

	for (const [file, info] of checks) {
		const exists = await checkFileExists(owner, repo, file);
		if (exists) return info;
	}

	return { type: 'git', command: `git clone https://github.com/${owner}/${repo}` };
}

// ---------------------------------------------------------------------------
// Main enrichment loop
// ---------------------------------------------------------------------------

async function main() {
	console.log('🔄 Enriching project data...\n');

	// Ensure cache directory exists
	if (!existsSync(CACHE_DIR)) {
		mkdirSync(CACHE_DIR, { recursive: true });
	}

	let projects;
	try {
		projects = loadAllProjects();
	} catch (err) {
		process.stderr.write(
			`Fatal: Could not load projects: ${err instanceof Error ? err.message : String(err)}\n`
		);
		process.exit(1);
	}

	console.log(`Loaded ${projects.length} project(s)\n`);

	let firstProject = true;

	for (const project of projects) {
		// Pause ≥ 1000 ms between consecutive GitHub API calls (not before first)
		if (!firstProject) {
			await sleep(DELAY_MS);
		}
		firstProject = false;

		console.log(`\nEnriching ${project.slug}...`);

		const parsed = parseGitHubRepo(project.repo);
		if (!parsed) {
			console.warn(`  ⚠  Could not parse GitHub repo URL: "${project.repo}" — skipping`);
			continue;
		}

		const { owner, repo } = parsed;

		try {
			// Fetch repo metadata
			const repoData = await fetchRepoData(owner, repo);
			if (!repoData) {
				console.warn(`  ⚠  Could not fetch repo data (404 or network error) — skipping`);
				continue;
			}

			// Fetch topics to determine repnect topic presence
			const topics = await fetchTopics(owner, repo);
			const hasRepnectTopic = topics.includes('repnect');

			// Fetch README to check for repnect badge
			const readme = await fetchReadme(owner, repo);
			const hasRepnectBadge = readme?.includes('repnect.dev/projects/') ?? false;

			// Determine verified status
			const verified = hasRepnectTopic && hasRepnectBadge;

			// Fetch good first issues count
			const goodFirstIssues = await fetchGoodFirstIssues(owner, repo);

			// Fetch contributors (top 10, no bots)
			const contributors = await fetchContributors(owner, repo);

			// Fetch language breakdown
			const languages = await fetchLanguages(owner, repo);

			// Detect installation method
			const installation = await detectInstallation(owner, repo);

			// Build stats
			const stats: RepoStats = {
				forks: repoData.forks_count,
				watchers: repoData.watchers_count,
				open_issues: repoData.open_issues_count,
				size: repoData.size,
				created_at: repoData.created_at,
				updated_at: repoData.updated_at,
				pushed_at: repoData.pushed_at,
				has_wiki: repoData.has_wiki,
				has_pages: repoData.has_pages,
				has_discussions: repoData.has_discussions
			};

			// Build cache data
			const cacheData: CacheData = {
				slug: project.slug,
				contributors,
				installation,
				documentation: {
					// docs_url and changelog_url are left empty; a future task can detect them
				},
				stats,
				languages,
				updated_at: new Date().toISOString()
			};

			// Write cache JSON
			const cachePath = join(CACHE_DIR, `${project.slug}.json`);
			writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');

			// Update TOML file preserving all other fields
			const tomlPath = join(PROJECTS_DIR, `${project.slug}.toml`);
			const originalToml = readFileSync(tomlPath, 'utf-8');
			const updatedToml = updateProjectFields(originalToml, {
				stars: repoData.stargazers_count,
				good_first_issues: goodFirstIssues,
				verified
			});
			writeFileSync(tomlPath, updatedToml, 'utf-8');

			console.log(
				`  ✓  stars=${repoData.stargazers_count}  good_first_issues=${goodFirstIssues}  verified=${verified}`
			);
			console.log(`  ✓  contributors=${contributors.length}  languages=${Object.keys(languages).length}`);
		} catch (err) {
			// Log warning and continue — do not abort the whole run
			console.warn(
				`  ⚠  Network/API error for ${project.slug}: ` +
					`${err instanceof Error ? err.message : String(err)}`
			);
		}
	}

	console.log('\n✅ Enrichment complete!\n');
}

main().catch((err) => {
	process.stderr.write(
		`Unexpected error: ${err instanceof Error ? err.message : String(err)}\n`
	);
	process.exit(1);
});

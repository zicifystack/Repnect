/**
 * scripts/validate.ts
 *
 * Validates all projects in data/projects/ against allowlists and GitHub API.
 *
 * Exit codes:
 *   0  — only warnings (or no issues at all)
 *   1  — at least one error found
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx tsx scripts/validate.ts
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { parse } from 'smol-toml';
import { loadAllProjects } from '../src/lib/projects.js';
import type { Project } from '../src/lib/schema.js';

// ---------------------------------------------------------------------------
// Data loading helpers
// ---------------------------------------------------------------------------

function loadCategoryIds(): string[] {
	const filePath = join(process.cwd(), 'data', 'categories.json');
	const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as {
		categories: Record<string, unknown>;
	};
	return Object.keys(raw.categories);
}

function loadAllowedTags(): string[] {
	const filePath = join(process.cwd(), 'data', 'tags.toml');
	const raw = parse(readFileSync(filePath, 'utf-8')) as { tags: string[] };
	return raw.tags;
}

function loadSpdxIds(): string[] {
	const filePath = join(process.cwd(), 'data', 'licenses-osi.json');
	const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as {
		licenses: string[];
	};
	return raw.licenses;
}

// ---------------------------------------------------------------------------
// Pure allowlist checker (exported for unit tests — task 14)
// ---------------------------------------------------------------------------

/**
 * Check a single project against allowlists.
 *
 * @returns Array of error message strings (empty = all good)
 */
export function checkAllowlists(
	project: Project,
	categoryIds: string[],
	allowedTags: string[],
	spdxIds: string[]
): string[] {
	const errors: string[] = [];

	// Category check
	if (!categoryIds.includes(project.category)) {
		errors.push(
			`[${project.slug}] Unknown category "${project.category}". ` +
				`Valid categories: ${categoryIds.join(', ')}`
		);
	}

	// Tags check
	const invalidTags = project.tags.filter((tag) => !allowedTags.includes(tag));
	if (invalidTags.length > 0) {
		errors.push(
			`[${project.slug}] Unknown tag(s): ${invalidTags.map((t) => `"${t}"`).join(', ')}. ` +
				`Add them to data/tags.toml first.`
		);
	}

	// License check
	if (!spdxIds.includes(project.license)) {
		errors.push(
			`[${project.slug}] Unknown SPDX license identifier "${project.license}". ` +
				`Add it to data/licenses-osi.json or correct the value.`
		);
	}

	return errors;
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

/**
 * Extract {owner, repo} from a GitHub URL like https://github.com/owner/repo
 */
function parseGitHubRepo(repoUrl: string): { owner: string; repo: string } | null {
	const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
	if (!match) return null;
	return { owner: match[1], repo: match[2] };
}

interface RepoCheckResult {
	accessible: boolean;
	hasRepnectTopic: boolean;
	statusCode: number;
}

async function checkGitHubRepo(
	owner: string,
	repo: string,
	token: string
): Promise<RepoCheckResult> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'repnect-validate/1.0'
	};

	// Check repo accessibility
	const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });

	if (!repoRes.ok) {
		return {
			accessible: false,
			hasRepnectTopic: false,
			statusCode: repoRes.status
		};
	}

	// Check topics
	const topicsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/topics`, {
		headers
	});

	let hasRepnectTopic = false;
	if (topicsRes.ok) {
		const topicsData = (await topicsRes.json()) as { names: string[] };
		hasRepnectTopic = topicsData.names.includes('repnect');
	}

	return {
		accessible: true,
		hasRepnectTopic,
		statusCode: repoRes.status
	};
}

// ---------------------------------------------------------------------------
// Logo file checks
// ---------------------------------------------------------------------------

function checkLogo(
	project: Project
): { warnings: string[]; errors: string[] } {
	const warnings: string[] = [];
	const errors: string[] = [];

	if (!project.logo) return { warnings, errors };

	// logo field is like /logos/myproject.svg — map to public/logos/myproject.svg
	const relativePath = project.logo.startsWith('/') ? project.logo.slice(1) : project.logo;
	const absolutePath = join(process.cwd(), 'public', relativePath);

	if (!existsSync(absolutePath)) {
		warnings.push(
			`[${project.slug}] Logo file not found: ${absolutePath} (referenced as "${project.logo}")`
		);
		return { warnings, errors };
	}

	const stat = statSync(absolutePath);
	const sizeKb = stat.size / 1024;
	if (sizeKb > 200) {
		warnings.push(
			`[${project.slug}] Logo file is ${sizeKb.toFixed(1)} KB (> 200 KB limit): ${absolutePath}`
		);
	}

	return { warnings, errors };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const allErrors: string[] = [];
	const allWarnings: string[] = [];

	// Load allowlists
	let categoryIds: string[];
	let allowedTags: string[];
	let spdxIds: string[];

	try {
		categoryIds = loadCategoryIds();
		allowedTags = loadAllowedTags();
		spdxIds = loadSpdxIds();
	} catch (err) {
		console.error('Fatal: Could not load allowlist data files:', err);
		process.exit(1);
	}

	// Load all projects
	let projects: Project[];
	try {
		projects = loadAllProjects();
	} catch (err) {
		console.error('Fatal: Could not load projects:', err);
		process.exit(1);
	}

	console.log(`\nValidating ${projects.length} project(s)...\n`);

	// -------------------------------------------------------------------------
	// 1. Allowlist checks (synchronous)
	// -------------------------------------------------------------------------
	for (const project of projects) {
		const errors = checkAllowlists(project, categoryIds, allowedTags, spdxIds);
		allErrors.push(...errors);
	}

	// -------------------------------------------------------------------------
	// 2. Slug uniqueness
	// -------------------------------------------------------------------------
	const slugCounts = new Map<string, number>();
	for (const project of projects) {
		slugCounts.set(project.slug, (slugCounts.get(project.slug) ?? 0) + 1);
	}
	for (const [slug, count] of slugCounts.entries()) {
		if (count > 1) {
			allErrors.push(`Duplicate slug "${slug}" found in ${count} project files.`);
		}
	}

	// -------------------------------------------------------------------------
	// 3. Logo file checks (synchronous)
	// -------------------------------------------------------------------------
	for (const project of projects) {
		const { warnings, errors } = checkLogo(project);
		allWarnings.push(...warnings);
		allErrors.push(...errors);
	}

	// -------------------------------------------------------------------------
	// 4. GitHub API checks (async, skipped if no token)
	// -------------------------------------------------------------------------
	const githubToken = process.env.GITHUB_TOKEN;

	if (!githubToken) {
		allWarnings.push(
			'GITHUB_TOKEN is not set — skipping GitHub repo accessibility and repnect topic checks.'
		);
	} else {
		console.log('Checking GitHub repos...');

		// Run checks concurrently with a small batch size to avoid rate-limits
		const BATCH_SIZE = 5;
		for (let i = 0; i < projects.length; i += BATCH_SIZE) {
			const batch = projects.slice(i, i + BATCH_SIZE);

			await Promise.all(
				batch.map(async (project) => {
					const parsed = parseGitHubRepo(project.repo);
					if (!parsed) {
						allErrors.push(
							`[${project.slug}] Could not parse GitHub repo URL: "${project.repo}"`
						);
						return;
					}

					const { owner, repo } = parsed;

					try {
						const result = await checkGitHubRepo(owner, repo, githubToken);

						if (!result.accessible) {
							if (result.statusCode === 404) {
								allErrors.push(
									`[${project.slug}] GitHub repo not found (404): https://github.com/${owner}/${repo}`
								);
							} else if (result.statusCode === 403) {
								allErrors.push(
									`[${project.slug}] GitHub repo access denied (403): https://github.com/${owner}/${repo}`
								);
							} else {
								allErrors.push(
									`[${project.slug}] GitHub repo inaccessible (HTTP ${result.statusCode}): https://github.com/${owner}/${repo}`
								);
							}
						} else if (!result.hasRepnectTopic) {
							allWarnings.push(
								`[${project.slug}] GitHub repo is missing the "repnect" topic: https://github.com/${owner}/${repo}`
							);
						}
					} catch (err) {
						allWarnings.push(
							`[${project.slug}] GitHub API request failed: ${err instanceof Error ? err.message : String(err)}`
						);
					}
				})
			);
		}
	}

	// -------------------------------------------------------------------------
	// 5. Report results
	// -------------------------------------------------------------------------
	if (allWarnings.length > 0) {
		console.log(`⚠  Warnings (${allWarnings.length}):`);
		for (const w of allWarnings) {
			console.log(`   ⚠  ${w}`);
		}
		console.log('');
	}

	if (allErrors.length > 0) {
		console.log(`✖  Errors (${allErrors.length}):`);
		for (const e of allErrors) {
			console.error(`   ✖  ${e}`);
		}
		console.log('');
		console.error(`Validation failed with ${allErrors.length} error(s).`);
		process.exit(1);
	}

	if (allWarnings.length > 0) {
		console.log(
			`Validation complete with ${allWarnings.length} warning(s) — no errors. Exiting 0.`
		);
	} else {
		console.log(`✓ All ${projects.length} project(s) passed validation.`);
	}

	process.exit(0);
}

main().catch((err) => {
	console.error('Unexpected error:', err);
	process.exit(1);
});

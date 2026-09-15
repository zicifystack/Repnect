import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { loadAllProjects } from '$lib/projects';
import { groupByState } from '$lib/radar';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { CacheData } from '$lib/types';

export const load: PageServerLoad = async () => {
	let projects;
	try {
		projects = loadAllProjects();
	} catch (err) {
		error(500, `Failed to load projects: ${err}`);
	}

	const cacheDir = join(process.cwd(), 'public', 'cache');
	const cacheMap: Record<string, CacheData> = {};
	if (existsSync(cacheDir)) {
		for (const file of readdirSync(cacheDir).filter((f: string) => f.endsWith('.json'))) {
			try {
				const slug = file.replace('.json', '');
				cacheMap[slug] = JSON.parse(readFileSync(join(cacheDir, file), 'utf-8'));
			} catch {
				/* skip bad cache */
			}
		}
	}

	const totalProjects = projects.length;
	const totalStars = projects.reduce((sum, p) => sum + (p.stars ?? 0), 0);
	const stateGroups = groupByState(projects);
	const statesCount = Object.keys(stateGroups).length;
	const citiesCount = new Set(projects.map((p) => p.location_city)).size;

	const allContributors = new Set<string>();
	let totalForks = 0;
	const langBytes: Record<string, number> = {};

	for (const cache of Object.values(cacheMap)) {
		for (const c of cache.contributors) allContributors.add(c.login);
		totalForks += cache.stats.forks;
		for (const [lang, bytes] of Object.entries(cache.languages)) {
			langBytes[lang] = (langBytes[lang] ?? 0) + bytes;
		}
	}

	const topLanguages = Object.entries(langBytes)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([lang, bytes]) => ({ lang, bytes }));

	return {
		projects,
		cacheMap,
		stats: {
			totalProjects,
			totalStars,
			statesCount,
			citiesCount,
			uniqueContributors: allContributors.size,
			totalForks,
			totalCommits: 0,
			topLanguages
		},
		stateGroups
	};
};

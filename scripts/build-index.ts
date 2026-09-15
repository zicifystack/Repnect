import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadAllProjects } from '../src/lib/projects.js';
import type { Project, SearchIndexItem } from '../src/lib/schema.js';

export function buildIndex(projects: Project[]): SearchIndexItem[] {
	const items: SearchIndexItem[] = projects.map((p) => ({
		slug: p.slug,
		name: p.name,
		short_desc: p.short_desc,
		category: p.category,
		tags: p.tags,
		stars: p.stars ?? 0,
		primary_lang: p.primary_lang,
		verified: p.verified ?? false,
		added_at: p.added_at,
		looking_for_contributors: p.looking_for_contributors,
		location_city: p.location_city,
		location_nigerian_state: p.location_nigerian_state
	}));

	return items.sort((a, b) => {
		if (a.slug === 'repnect') return -1;
		if (b.slug === 'repnect') return 1;
		return a.name.localeCompare(b.name);
	});
}

// Main execution
try {
	const projects = loadAllProjects();
	const index = buildIndex(projects);
	const json = JSON.stringify(index, null, 2);

	const outputPath = join(process.cwd(), 'public', 'index.json');
	mkdirSync(join(process.cwd(), 'public'), { recursive: true });
	writeFileSync(outputPath, json, 'utf-8');

	const sizeKb = Buffer.byteLength(json) / 1024;
	if (sizeKb > 300) {
		console.warn(`⚠ index.json is ${sizeKb.toFixed(1)} KB (> 300 KB). Consider sharding.`);
	}

	console.log(`✓ Built search index: ${index.length} projects → ${outputPath}`);
} catch (err) {
	console.error('Fatal error building index:', err);
	process.exit(1);
}

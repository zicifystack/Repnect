import type { PageServerLoad } from './$types';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { loadCities } from '$lib/server/cities';

export const load: PageServerLoad = async () => {
	const categoriesPath = join(process.cwd(), 'data', 'categories.json');
	let categories: { id: string; label: string; description: string }[] = [];
	if (existsSync(categoriesPath)) {
		try {
			const raw = JSON.parse(readFileSync(categoriesPath, 'utf-8'));
			const list = raw.categories ?? raw;
			categories = Object.entries(list).map(([id, cat]: [string, unknown]) => ({
				id,
				label: (cat as { label: string }).label ?? id,
				description: (cat as { description: string }).description ?? ''
			}));
		} catch {
			categories = [];
		}
	}

	const { cities } = loadCities();

	return { categories, cities };
};

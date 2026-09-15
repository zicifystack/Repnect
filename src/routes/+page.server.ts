import type { PageServerLoad } from './$types';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { SearchIndexItem } from '$lib/schema';

export const load: PageServerLoad = async () => {
  const indexPath = join(process.cwd(), 'public', 'index.json');
  let searchIndex: SearchIndexItem[] = [];
  if (existsSync(indexPath)) {
    try {
      searchIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
    } catch {
      searchIndex = [];
    }
  }

  const categoriesPath = join(process.cwd(), 'data', 'categories.json');
  let categories: { id: string; label: string }[] = [];
  if (existsSync(categoriesPath)) {
    try {
      const raw = JSON.parse(readFileSync(categoriesPath, 'utf-8'));
      categories = Object.entries(raw.categories ?? raw).map(([id, cat]: [string, unknown]) => ({
        id,
        label: (cat as { label: string }).label,
      }));
    } catch {
      categories = [];
    }
  }

  return { searchIndex, categories };
};

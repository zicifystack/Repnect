import type { SearchIndexItem } from './schema.js';

export type SortOrder = 'recent' | 'stars' | 'alpha';

/**
 * Filter items to only those matching the given category.
 * If category is 'all', returns all items unchanged.
 */
export function filterByCategory(items: SearchIndexItem[], category: string): SearchIndexItem[] {
	if (category === 'all') return items;
	return items.filter((item) => item.category === category);
}

/**
 * Sort items by the given order. Returns a new array (does not mutate).
 */
export function sortItems(items: SearchIndexItem[], order: SortOrder): SearchIndexItem[] {
	return [...items].sort((a, b) => {
		if (order === 'stars') return (b.stars ?? 0) - (a.stars ?? 0);
		if (order === 'alpha') return a.name.localeCompare(b.name);
		// 'recent': sort by added_at descending
		return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
	});
}

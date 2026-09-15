// src/lib/search.ts
import Fuse from 'fuse.js';
import type { SearchIndexItem } from './schema.js';

export function createFuse(items: SearchIndexItem[]): Fuse<SearchIndexItem> {
  return new Fuse(items, {
    threshold: 0.3,
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'short_desc', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
      { name: 'category', weight: 0.1 },
    ],
    includeScore: true,
  });
}

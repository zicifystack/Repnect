import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import { loadAllProjects, getProjectBySlug } from '$lib/projects';
import { findSimilarProjects } from '$lib/similar';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { CacheData } from '$lib/types';

export const prerender = true;

export const entries: EntryGenerator = () => {
  return loadAllProjects().map((p) => ({ slug: p.slug }));
};

export const load: PageServerLoad = async ({ params }) => {
  const project = getProjectBySlug(params.slug);
  if (!project) error(404, 'Project not found');

  let cache: CacheData | null = null;
  const cachePath = join(process.cwd(), 'public', 'cache', `${params.slug}.json`);
  if (existsSync(cachePath)) {
    try { cache = JSON.parse(readFileSync(cachePath, 'utf-8')); }
    catch { cache = null; }
  }

  const allProjects = loadAllProjects();
  const similarProjects = findSimilarProjects(project, allProjects, 4);

  return { project, cache, similarProjects };
};

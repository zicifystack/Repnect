import type { Project } from './schema.js';

export function findSimilarProjects(
	current: Project,
	all: Project[],
	limit: number
): Project[] {
	return all
		.filter((p) => p.slug !== current.slug)
		.map((p) => {
			const sharedTags = p.tags.filter((t) => current.tags.includes(t)).length;
			const sameCategory = p.category === current.category ? 1 : 0;
			return { project: p, score: sharedTags + sameCategory };
		})
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((entry) => entry.project);
}

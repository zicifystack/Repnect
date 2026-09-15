import type { Project } from './schema.js';

export function groupByState(projects: Project[]): Record<string, Project[]> {
  const result: Record<string, Project[]> = {};
  for (const project of projects) {
    const state = project.location_nigerian_state;
    if (!result[state]) result[state] = [];
    result[state].push(project);
  }
  return result;
}

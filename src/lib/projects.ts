import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'smol-toml';
import { ZodError } from 'zod';
import { ProjectSchema } from './schema.js';
import type { Project } from './schema.js';

const PROJECTS_DIR = join(process.cwd(), 'data', 'projects');

/**
 * Parse a TOML string into a validated Project, using the filename (without
 * extension) to enforce the slug–filename invariant.
 *
 * @param content  Raw TOML file content
 * @param filename Basename of the file, e.g. `"my-project.toml"` or `"my-project"`
 * @throws {Error} When TOML is malformed, schema validation fails, or the slug
 *                 does not match the filename (minus `.toml` extension).
 */
export function parseProjectFile(content: string, filename: string): Project {
	// Normalise filename: strip trailing .toml if present
	const filenameWithoutExt = filename.endsWith('.toml') ? filename.slice(0, -5) : filename;

	// 1. Parse TOML
	let raw: unknown;
	try {
		raw = parse(content);
	} catch (err) {
		throw new Error(
			`[${filenameWithoutExt}.toml] TOML parse error: ${err instanceof Error ? err.message : String(err)}`
		);
	}

	// 2. Validate against ProjectSchema
	let project: Project;
	try {
		project = ProjectSchema.parse(raw);
	} catch (err) {
		if (err instanceof ZodError) {
			const issues = err.issues
				.map((issue) => `  • ${issue.path.join('.')} — ${issue.message}`)
				.join('\n');
			throw new Error(
				`[${filenameWithoutExt}.toml] Schema validation failed:\n${issues}`
			);
		}
		throw err;
	}

	// 3. Enforce filename–slug invariant
	if (project.slug !== filenameWithoutExt) {
		throw new Error(
			`[${filenameWithoutExt}.toml] Filename–slug mismatch: ` +
				`file is named "${filenameWithoutExt}.toml" but slug field is "${project.slug}". ` +
				`Rename the file to "${project.slug}.toml" or update the slug field.`
		);
	}

	return project;
}

/**
 * Load and validate every `.toml` file in `data/projects/`.
 * Returns an empty array when the directory does not exist.
 *
 * @throws {Error} On any TOML parse or schema validation failure.
 */
export function loadAllProjects(): Project[] {
	if (!existsSync(PROJECTS_DIR)) {
		return [];
	}

	const files = readdirSync(PROJECTS_DIR)
		.filter((f) => f.endsWith('.toml'))
		.sort();

	const projects: Project[] = [];

	for (const filename of files) {
		const content = readFileSync(join(PROJECTS_DIR, filename), 'utf-8');
		// parseProjectFile throws on any error — callers receive a descriptive message
		const project = parseProjectFile(content, filename);
		projects.push(project);
	}

	return projects;
}

/**
 * Return the Project for the given slug, or `null` when no matching file
 * exists or the file fails validation.
 */
export function getProjectBySlug(slug: string): Project | null {
	const filePath = join(PROJECTS_DIR, `${slug}.toml`);

	if (!existsSync(filePath)) {
		return null;
	}

	try {
		const content = readFileSync(filePath, 'utf-8');
		return parseProjectFile(content, `${slug}.toml`);
	} catch {
		return null;
	}
}

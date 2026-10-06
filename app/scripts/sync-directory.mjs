import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PROJECTS_DIR = resolve(process.cwd(), '../data/projects');
const API_URL = process.env.API_URL || 'http://localhost:5173';
const SYNC_SECRET = process.env.SYNC_SECRET || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function parseSimpleYaml(content) {
	const result = {};
	const lines = content.split('\n');
	let currentListKey = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		if (line.startsWith('- ') && currentListKey) {
			const val = line.slice(2).trim().replace(/^["']|["']$/g, '');
			if (!Array.isArray(result[currentListKey])) result[currentListKey] = [];
			result[currentListKey].push(val);
			continue;
		}

		currentListKey = null;
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;

		const key = line.slice(0, colonIdx).trim();
		let val = line.slice(colonIdx + 1).trim();

		if (!val) {
			currentListKey = key;
			result[key] = [];
			continue;
		}

		if (val.startsWith('[') && val.endsWith(']')) {
			result[key] = val
				.slice(1, -1)
				.split(',')
				.map((s) => s.trim().replace(/^["']|["']$/g, ''))
				.filter(Boolean);
			continue;
		}

		if (val.startsWith('"') && val.endsWith('"')) {
			val = val.slice(1, -1).replace(/\\"/g, '"');
		} else if (val.startsWith("'") && val.endsWith("'")) {
			val = val.slice(1, -1);
		} else if (val === 'true') {
			val = true;
		} else if (val === 'false') {
			val = false;
		} else if (!isNaN(Number(val)) && val !== '') {
			val = Number(val);
		}

		result[key] = val;
	}

	return result;
}

async function enrichWithGitHub(item) {
	if (!item.github_repo) return item;
	try {
		const headers = {
			'User-Agent': 'repnect-directory-sync',
			Accept: 'application/vnd.github.v3+json'
		};
		if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

		const res = await fetch(`https://api.github.com/repos/${item.github_repo}`, { headers });
		if (!res.ok) return item;
		const data = await res.json();

		return {
			...item,
			stars: data.stargazers_count ?? item.stars ?? 0,
			updated_at: new Date().toISOString()
		};
	} catch {
		return item;
	}
}

async function run() {
	if (!existsSync(PROJECTS_DIR)) {
		console.log(`Directory not found: ${PROJECTS_DIR}`);
		process.exit(0);
	}

	const files = readdirSync(PROJECTS_DIR).filter(
		(f) => f.endsWith('.yaml') || f.endsWith('.yml')
	);
	console.log(`Found ${files.length} project definitions.`);

	const items = [];
	for (const file of files) {
		const raw = readFileSync(join(PROJECTS_DIR, file), 'utf8');
		const parsed = parseSimpleYaml(raw);
		const enriched = await enrichWithGitHub(parsed);
		items.push(enriched);
	}

	console.log(`Parsed and enriched ${items.length} projects. Syncing to ${API_URL}...`);

	const res = await fetch(`${API_URL}/api/directory/sync`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(SYNC_SECRET ? { Authorization: `Bearer ${SYNC_SECRET}` } : {})
		},
		body: JSON.stringify(items)
	});

	if (!res.ok) {
		const text = await res.text();
		console.error(`Sync failed (${res.status}): ${text}`);
		process.exit(1);
	}

	const json = await res.json();
	console.log('Sync successful:', json);
}

run().catch((e) => {
	console.error('Fatal sync error:', e);
	process.exit(1);
});

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'smol-toml';

export interface CitiesData {
	cities: string[];
	featured: string[];
}

const DEFAULT_CITIES: CitiesData = {
	cities: [
		'Lagos',
		'Abuja',
		'Port Harcourt',
		'Kano',
		'Ibadan',
		'Enugu',
		'Benin City',
		'Kaduna',
		'Jos',
		'Calabar'
	],
	featured: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu']
};

/**
 * Loads and parses data/cities.toml on the server.
 */
export function loadCities(): CitiesData {
	const filePath = join(process.cwd(), 'data', 'cities.toml');
	if (!existsSync(filePath)) {
		return DEFAULT_CITIES;
	}

	try {
		const raw = parse(readFileSync(filePath, 'utf-8')) as unknown as CitiesData;
		return {
			cities: Array.isArray(raw?.cities) ? raw.cities : DEFAULT_CITIES.cities,
			featured: Array.isArray(raw?.featured) ? raw.featured : DEFAULT_CITIES.featured
		};
	} catch {
		return DEFAULT_CITIES;
	}
}

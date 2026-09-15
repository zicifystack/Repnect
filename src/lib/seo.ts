// src/lib/seo.ts
import { RESERVED_SLUGS } from './schema.js';

export { RESERVED_SLUGS };

export function canonicalUrl(slug: string): string {
	return `https://repnect.dev/projects/${slug}`;
}

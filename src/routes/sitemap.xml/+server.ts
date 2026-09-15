import type { RequestHandler } from './$types';
import { loadAllProjects } from '$lib/projects';

const SITE = 'https://repnect.dev';

function url(loc: string, priority: string, changefreq: string, lastmod?: string): string {
	return `  <url>
    <loc>${SITE}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
}

export const GET: RequestHandler = () => {
	const projects = loadAllProjects();
	const today = new Date().toISOString().slice(0, 10);

	const staticUrls = [
		url('/', '1.0', 'daily', today),
		url('/radar', '0.9', 'daily', today),
		url('/submit', '0.8', 'monthly'),
		url('/about', '0.7', 'monthly'),
	];

	const projectUrls = projects.map((p) =>
		url(`/projects/${p.slug}`, '0.8', 'weekly', p.added_at)
	);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...projectUrls].join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' },
	});
};

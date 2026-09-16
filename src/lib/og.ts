import satori from 'satori';

let interFontCache: ArrayBuffer | null = null;

async function loadInterFont(): Promise<ArrayBuffer> {
	if (interFontCache) return interFontCache;
	// Try local file first, fall back to Google Fonts CDN
	try {
		const { readFileSync } = await import('fs');
		const { join } = await import('path');
		const fontPath = join(process.cwd(), 'static', 'fonts', 'Inter-Regular.ttf');
		const buffer = readFileSync(fontPath);
		interFontCache = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	} catch {
		const res = await fetch(
			'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
		);
		if (!res.ok) throw new Error('Failed to load Inter font');
		interFontCache = await res.arrayBuffer();
	}
	return interFontCache;
}

/**
 * Renders an OG image as SVG using satori.
 * Returns the SVG string — compatible with Cloudflare Workers (no native binaries required).
 * To convert to PNG locally, use @resvg/resvg-js outside of the worker context.
 */
export async function renderOgImage(
	element: object,
	width: number,
	height: number
): Promise<string> {
	const fontData = await loadInterFont();

	return satori(element as Parameters<typeof satori>[0], {
		width,
		height,
		fonts: [{ name: 'Inter', data: fontData, weight: 400, style: 'normal' }],
	});
}

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

let interFontCache: ArrayBuffer | null = null;

async function loadInterFont(): Promise<ArrayBuffer> {
	if (interFontCache) return interFontCache;
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

export async function renderOgImage(
	element: object,
	width: number,
	height: number
): Promise<Uint8Array> {
	const fontData = await loadInterFont();

	const svg = await satori(element as Parameters<typeof satori>[0], {
		width,
		height,
		fonts: [{ name: 'Inter', data: fontData, weight: 400, style: 'normal' }],
	});

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
	return resvg.render().asPng();
}

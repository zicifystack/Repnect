import type { RequestHandler } from './$types';
import { renderOgImage } from '$lib/og';

export const GET: RequestHandler = async () => {
  const element = {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#030712', padding: '48px' },
      children: [
        { type: 'div', props: { style: { height: '6px', background: 'linear-gradient(to right, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%)', marginBottom: '40px' }, children: [] } },
        { type: 'div', props: { style: { color: '#F97316', fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }, children: ['Repnect.dev'] } },
        { type: 'div', props: { style: { color: '#FFFFFF', fontSize: '64px', fontWeight: 'bold', marginBottom: '16px' }, children: ["Nigeria's Open Source Directory"] } },
        { type: 'div', props: { style: { color: '#9CA3AF', fontSize: '28px' }, children: ['Discover open-source projects built by Nigerian developers'] } },
      ],
    },
  };
  const png = await renderOgImage(element, 1200, 630);
  return new Response(png as unknown as BodyInit, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
};

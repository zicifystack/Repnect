import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getProjectBySlug } from '$lib/projects';
import { renderOgImage } from '$lib/og';

export const GET: RequestHandler = async ({ params }) => {
  if (!params.slug || params.slug.length > 60) error(404, 'Invalid slug');
  const project = getProjectBySlug(params.slug);
  if (!project) error(404, 'Project not found');

  const element = {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#030712', padding: '48px' },
      children: [
        { type: 'div', props: { style: { height: '6px', background: 'linear-gradient(to right, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%)', marginBottom: '24px' }, children: [] } },
        { type: 'div', props: { style: { color: '#F97316', fontSize: '24px', marginBottom: '24px' }, children: ['Repnect.dev'] } },
        { type: 'div', props: { style: { color: '#FFFFFF', fontSize: '56px', fontWeight: 'bold', marginBottom: '12px' }, children: [project.name] } },
        { type: 'div', props: { style: { color: '#9CA3AF', fontSize: '28px', marginBottom: '24px' }, children: [project.short_desc] } },
        { type: 'div', props: { style: { display: 'flex', gap: '16px' }, children: [
          { type: 'div', props: { style: { backgroundColor: '#1F2937', color: '#60A5FA', padding: '8px 16px', borderRadius: '8px', fontSize: '20px' }, children: [project.primary_lang] } },
          { type: 'div', props: { style: { color: '#6B7280', fontSize: '20px' }, children: [`${project.location_city}, ${project.location_nigerian_state}`] } },
        ]}},
      ],
    },
  };

  const png = await renderOgImage(element, 1200, 630);
  return new Response(png as unknown as BodyInit, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
};

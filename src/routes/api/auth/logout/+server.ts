import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
  cookies.delete('gh_session', { path: '/' });
  cookies.delete('oauth_state', { path: '/' });
  redirect(302, '/');
};

import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID } from '$env/static/private';

const PUBLIC_ORIGIN = 'https://repnect.dev';

export const GET: RequestHandler = async ({ cookies }) => {
  if (!GITHUB_CLIENT_ID) redirect(302, '/?error=auth_not_configured');
  const state = crypto.randomUUID();
  cookies.set('oauth_state', state, { path: '/', httpOnly: true, maxAge: 600, sameSite: 'lax' });
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${PUBLIC_ORIGIN}/api/auth/callback`,
    scope: 'public_repo',
    state,
  });
  redirect(302, `https://github.com/login/oauth/authorize?${params}`);
};

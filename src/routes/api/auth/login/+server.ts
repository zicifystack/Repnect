import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const PUBLIC_ORIGIN = 'https://repnect.dev';

export const GET: RequestHandler = async ({ cookies, platform }) => {
  const githubClientId = env.GITHUB_CLIENT_ID || (platform?.env as Record<string, string> | undefined)?.GITHUB_CLIENT_ID;
  if (!githubClientId) redirect(302, '/?error=auth_not_configured');
  const state = crypto.randomUUID();
  cookies.set('oauth_state', state, { path: '/', httpOnly: true, maxAge: 600, sameSite: 'lax' });
  const params = new URLSearchParams({
    client_id: githubClientId,
    redirect_uri: `${PUBLIC_ORIGIN}/api/auth/callback`,
    scope: 'public_repo',
    state,
  });
  redirect(302, `https://github.com/login/oauth/authorize?${params}`);
};

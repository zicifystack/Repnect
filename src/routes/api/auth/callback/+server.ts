import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET } from '$env/static/private';
import type { GitHubSession } from '$lib/types';

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('oauth_state');
  if (!code || !state || state !== storedState) redirect(302, '/?error=auth_failed');
  cookies.delete('oauth_state', { path: '/' });
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) redirect(302, '/?error=auth_failed');
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
    });
    const userData = await userRes.json() as { login: string; avatar_url: string };
    const session: GitHubSession = {
      access_token: tokenData.access_token,
      login: userData.login,
      avatar_url: userData.avatar_url,
      expires_at: Date.now() + 8 * 60 * 60 * 1000,
    };
    const payload = btoa(JSON.stringify(session));
    const sig = await hmacSign(payload, SESSION_SECRET);
    cookies.set('gh_session', `${payload}.${sig}`, { path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: 28800 });
    redirect(302, '/');
  } catch { redirect(302, '/?error=auth_failed'); }
};

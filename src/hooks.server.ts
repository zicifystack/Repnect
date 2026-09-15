import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { AuthUser, GitHubSession } from '$lib/types';
import { getDb } from '$lib/server/db';

async function hmacVerify(payload: string, signature: string, secret: string): Promise<boolean> {
	if (!secret) return false;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['verify']
	);
	const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
	return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
}

export const handle: Handle = async ({ event, resolve }) => {
	const d1 = event.platform?.env.DB;
	if (d1) {
		event.locals.db = getDb(d1);
	}

	const raw = event.cookies.get('gh_session');
	event.locals.user = null;

	const sessionSecret = env.SESSION_SECRET || (event.platform?.env as Record<string, string> | undefined)?.SESSION_SECRET;

	if (raw && sessionSecret) {
		try {
			const lastDot = raw.lastIndexOf('.');
			if (lastDot !== -1) {
				const payload = raw.slice(0, lastDot);
				const sig = raw.slice(lastDot + 1);
				const valid = await hmacVerify(payload, sig, sessionSecret);
				if (valid) {
					const session: GitHubSession = JSON.parse(atob(payload));
					if (Date.now() <= session.expires_at) {
						event.locals.user = {
							login: session.login,
							avatar_url: session.avatar_url
						} satisfies AuthUser;
					}
				}
			}
		} catch {
			// Invalid cookie — remain unauthenticated
		}
	}

	return resolve(event);
};

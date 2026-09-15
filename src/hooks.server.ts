import type { Handle } from '@sveltejs/kit';
import { SESSION_SECRET } from '$env/static/private';
import type { AuthUser, GitHubSession } from '$lib/types';

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
	// Read the custom gh_session cookie set by /api/auth/callback
	const raw = event.cookies.get('gh_session');
	event.locals.user = null;

	if (raw && SESSION_SECRET) {
		try {
			const lastDot = raw.lastIndexOf('.');
			if (lastDot !== -1) {
				const payload = raw.slice(0, lastDot);
				const sig = raw.slice(lastDot + 1);
				const valid = await hmacVerify(payload, sig, SESSION_SECRET);
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

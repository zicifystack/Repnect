import { env } from '$env/dynamic/private';
import { betterAuth, type BetterAuthClient } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { getDb } from '$lib/server/db';

function readPlatformVar(name: string, dynamicVal: string | undefined, fallback = ''): string {
	if (dynamicVal) return dynamicVal;
	const fromProcess = process.env[name];
	if (fromProcess) return fromProcess;
	const event = getRequestEvent();
	const fromPlatform = (event?.platform?.env as Record<string, string> | undefined)?.[name];
	if (fromPlatform) return fromPlatform;
	return fallback;
}

function readOrigin(): string | undefined {
	const fromDynamic = env.ORIGIN;
	if (fromDynamic) return fromDynamic;
	const fromProcess = process.env.ORIGIN;
	if (fromProcess) return fromProcess;
	const event = getRequestEvent();
	const fromPlatform = (event?.platform?.env as Record<string, string> | undefined)?.ORIGIN;
	if (fromPlatform) return fromPlatform;
	return undefined;
}

function resolveD1(): D1Database {
	const event = getRequestEvent();
	const d1 = (event?.platform as App.Platform | undefined)?.env?.DB;
	if (!d1) {
		throw new Error(
			'D1 binding (DB) not available. Ensure Cloudflare Pages has the D1 binding configured in wrangler.toml.'
		);
	}
	return d1;
}

let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth(explicitD1?: D1Database): ReturnType<typeof betterAuth> {
	if (_auth) return _auth;

	const d1 = explicitD1 ?? resolveD1();
	const db = getDb(d1);

	const baseURL = readOrigin();
	const secret = readPlatformVar('BETTER_AUTH_SECRET', env.BETTER_AUTH_SECRET, 'placeholder-dev-secret-change-me-in-production');
	const githubClientId = readPlatformVar('GITHUB_CLIENT_ID', env.GITHUB_CLIENT_ID);
	const githubClientSecret = readPlatformVar('GITHUB_CLIENT_SECRET', env.GITHUB_CLIENT_SECRET);

	_auth = betterAuth({
		...(baseURL ? { baseURL } : {}),
		secret,
		database: drizzleAdapter(db, { provider: 'sqlite' }),
		emailAndPassword: { enabled: true },
		socialProviders: githubClientId && githubClientSecret
			? {
					github: {
						clientId: githubClientId,
						clientSecret: githubClientSecret
					}
				}
			: undefined,
		plugins: [
			sveltekitCookies(getRequestEvent)
		]
	});

	return _auth;
}

export const auth = new Proxy({} as BetterAuthClient, {
	get(_target, prop) {
		const instance = getAuth();
		return (instance as unknown as Record<string | symbol, unknown>)[prop];
	}
});

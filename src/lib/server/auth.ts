import { env } from '$env/dynamic/private';
import { betterAuth, type BetterAuthClient } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { getDb } from '$lib/server/db';
import Database from 'better-sqlite3';

function readSecret(): string {
	const fromDynamic = env.BETTER_AUTH_SECRET;
	if (fromDynamic) return fromDynamic;
	const fromProcess = process.env.BETTER_AUTH_SECRET;
	if (fromProcess) return fromProcess;
	const event = getRequestEvent();
	const fromPlatform = (event?.platform?.env as Record<string, string> | undefined)?.BETTER_AUTH_SECRET;
	if (fromPlatform) return fromPlatform;
	return 'placeholder-dev-secret-change-me-in-production';
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

let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth(): ReturnType<typeof betterAuth> {
	if (_auth) return _auth;

	const _sqlite = new Database(process.env.DATABASE_URL ?? 'local.db');
	const db = getDb(_sqlite as unknown as D1Database);

	const baseURL = readOrigin();
	const secret = readSecret();
	const githubClientId =
		env.GITHUB_CLIENT_ID ||
		process.env.GITHUB_CLIENT_ID ||
		(getRequestEvent()?.platform?.env as Record<string, string> | undefined)?.GITHUB_CLIENT_ID ||
		'';
	const githubClientSecret =
		env.GITHUB_CLIENT_SECRET ||
		process.env.GITHUB_CLIENT_SECRET ||
		(getRequestEvent()?.platform?.env as Record<string, string> | undefined)?.GITHUB_CLIENT_SECRET ||
		'';

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

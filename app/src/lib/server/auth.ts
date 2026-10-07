import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { captcha, haveIBeenPwned, magicLink, twoFactor } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { eq } from 'drizzle-orm';
import { baseLocale, isLocale } from '$lib/paraglide/runtime';
import { SITE } from '$lib/site';
import { createDb } from './ctx';
import { eraseUserData } from './account/service';
import {
	changeEmailEmail,
	deleteAccountEmail,
	magicLinkEmail,
	resetPasswordEmail,
	welcomeEmail
} from './email/templates/auth-emails';
import * as schema from './db/schema';
import { sendEmail } from './email/service';
import type { Locale } from '$lib/locale';
import type { RequestEvent } from '@sveltejs/kit';

type AuthContext = {
	getRequestEvent?: () => RequestEvent | undefined;
	waitUntil?: (promise: Promise<unknown>) => void;
};

export function authMethods(env: Env) {
	return {
		google: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
		email: !!env.EMAIL || !!env.EMAIL_DEBUG
	};
}

export function createAuth(env: Env, baseURL: string, ctx: AuthContext = {}) {
	if (!env.BETTER_AUTH_SECRET) {
		throw new Error(
			'BETTER_AUTH_SECRET is not set - .dev.vars locally, `wrangler secret put` in production'
		);
	}
	const db = createDb(env);
	const methods = authMethods(env);

	const localeFor = async (email: string): Promise<Locale> => {
		const [row] = await db
			.select({ locale: schema.user.locale })
			.from(schema.user)
			.where(eq(schema.user.email, email))
			.limit(1);
		const value = row?.locale;
		return isLocale(value) ? value : baseLocale;
	};

	if (!methods.email) {
		console.warn({
			event: 'auth.email_verification_disabled',
			reason: 'no send_email binding and no EMAIL_DEBUG - password signups are unverified'
		});
	}

	return betterAuth({
		database: drizzleAdapter(db, { provider: 'pg', schema }),
		secret: env.BETTER_AUTH_SECRET,
		baseURL,
		rateLimit: {
			enabled: true,
			storage: 'database',
			customRules: {
				'/sign-in/magic-link': { window: 60, max: 3 },
				'/request-password-reset': { window: 60, max: 3 },
				'/sign-up/email': { window: 60, max: 3 },
				'/send-verification-email': { window: 60, max: 3 },
				'/change-email': { window: 60, max: 3 },
				'/delete-user': { window: 60, max: 3 },
				'/two-factor/verify-totp': { window: 60, max: 10 },
				'/two-factor/verify-backup-code': { window: 60, max: 10 }
			}
		},
		advanced: {
			ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
			...(ctx.waitUntil
				? { backgroundTasks: { handler: (p: Promise<unknown>) => ctx.waitUntil!(p) } }
				: {})
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: methods.email,
			sendResetPassword: async ({ user, url }) => {
				await sendEmail(env, resetPasswordEmail(user.email, url, await localeFor(user.email)));
			}
		},
		user: {
			changeEmail: {
				enabled: true,
				sendChangeEmailVerification: async ({ user, newEmail, url }) => {
					await sendEmail(
						env,
						changeEmailEmail(user.email, newEmail, url, await localeFor(user.email))
					);
				}
			},
			deleteUser: {
				enabled: true,
				sendDeleteAccountVerification: async ({
					user,
					url
				}: {
					user: { email: string };
					url: string;
				}) => {
					await sendEmail(env, deleteAccountEmail(user.email, url, await localeFor(user.email)));
				},
				afterDelete: async (account) => {
					await eraseUserData(env, account.id);
				}
			}
		},
		databaseHooks: {
			user: {
				create: {
					before: async (userData) => {
						let cookie: string | undefined;
						try {
							cookie = ctx.getRequestEvent?.()?.cookies.get('PARAGLIDE_LOCALE');
						} catch {}
						return { data: { ...userData, locale: isLocale(cookie) ? cookie : baseLocale } };
					},
					after: async (created) => {
						const label = created.name?.trim() || created.email.split('@')[0] || created.email;
						const welcome = sendEmail(
							env,
							welcomeEmail(created.email, label, `${baseURL}/app`, await localeFor(created.email))
						);
						if (ctx.waitUntil) ctx.waitUntil(welcome);
						else void welcome.catch(() => {});
					}
				}
			}
		},
		plugins: [
			magicLink({
				expiresIn: 60 * 15,
				sendMagicLink: async ({ email, url }) => {
					await sendEmail(env, magicLinkEmail(email, url, await localeFor(email)));
				}
			}),
			twoFactor({ issuer: SITE.name }),
			passkey({ rpID: new URL(baseURL).hostname, rpName: SITE.name, origin: baseURL }),
			haveIBeenPwned({
				customPasswordCompromisedMessage:
					'This password has appeared in a known data breach. Please choose a different one.'
			}),
			...(env.TURNSTILE_SECRET_KEY
				? [captcha({ provider: 'cloudflare-turnstile', secretKey: env.TURNSTILE_SECRET_KEY })]
				: []),
			sveltekitCookies((() => ctx.getRequestEvent?.()) as () => RequestEvent)
		]
	});
}

export type Session = ReturnType<typeof createAuth>['$Infer']['Session'];

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';
import { sendEmail, type EmailContent } from './email/service';

export type KeyValueStore = {
	get: <T = string>(key: string, type?: 'text' | 'json' | 'arrayBuffer') => Promise<T | null>;
	put: (key: string, value: string | ArrayBuffer | ReadableStream, opts?: { expirationTtl?: number }) => Promise<void>;
	delete: (key: string) => Promise<void>;
};

export type BlobStorage = {
	get: (key: string) => Promise<{ body: ReadableStream; contentType?: string; size: number } | null>;
	put: (key: string, value: ReadableStream | ArrayBuffer | string, opts?: { contentType?: string }) => Promise<void>;
	delete: (key: string) => Promise<void>;
	getPublicUrl: (key: string) => string | null;
};

export type RateLimiter = {
	limit: (key: string) => Promise<{ success: boolean }>;
};

export type Mailer = {
	send: (message: EmailContent) => Promise<void>;
};

export type AnalyticsTracker = {
	capture: (event: string, opts?: { distinctId?: string; properties?: Record<string, unknown> }) => Promise<void>;
	recordMetric: (key: string, delta?: number) => Promise<void>;
	getMetric: (key: string) => Promise<number>;
};

export type Ctx = {
	db: ReturnType<typeof createDb>;
	dbCached: ReturnType<typeof createDb>;
	store: KeyValueStore;
	storage: BlobStorage;
	images: BlobStorage;
	rateLimiter: RateLimiter;
	mailer: Mailer;
	analytics: AnalyticsTracker;
	waitUntil: (promise: Promise<unknown>) => void;
	close: () => Promise<void>;
};

export type Actor = { id: string };

const inMemoryStore = new Map<string, string | ArrayBuffer>();

function createKvStore(kvNamespace?: KVNamespace): KeyValueStore {
	if (kvNamespace) {
		return {
			get: async <T = string>(key: string, type: 'text' | 'json' | 'arrayBuffer' = 'text'): Promise<T | null> => {
				if (type === 'json') return kvNamespace.get(key, 'json') as Promise<T | null>;
				if (type === 'arrayBuffer') return kvNamespace.get(key, 'arrayBuffer') as Promise<T | null>;
				return kvNamespace.get(key, 'text') as Promise<T | null>;
			},
			put: async (key, value, opts) => {
				await kvNamespace.put(key, value as any, opts);
			},
			delete: async (key) => {
				await kvNamespace.delete(key);
			}
		};
	}
	return {
		get: async <T = string>(key: string, type: 'text' | 'json' | 'arrayBuffer' = 'text'): Promise<T | null> => {
			const item = inMemoryStore.get(key);
			if (item == null) return null;
			if (type === 'json' && typeof item === 'string') {
				try {
					return JSON.parse(item) as T;
				} catch {
					return null;
				}
			}
			return item as unknown as T;
		},
		put: async (key, value) => {
			if (typeof value === 'string' || value instanceof ArrayBuffer) {
				inMemoryStore.set(key, value);
			}
		},
		delete: async (key) => {
			inMemoryStore.delete(key);
		}
	};
}

function createStorage(r2Bucket?: R2Bucket, publicUrl?: string): BlobStorage {
	if (r2Bucket) {
		return {
			get: async (key: string) => {
				const obj = await r2Bucket.get(key);
				if (!obj) return null;
				return {
					body: obj.body,
					contentType: obj.httpMetadata?.contentType,
					size: obj.size
				};
			},
			put: async (key: string, value, opts) => {
				await r2Bucket.put(key, value as any, opts?.contentType ? { httpMetadata: { contentType: opts.contentType } } : undefined);
			},
			delete: async (key: string) => {
				await r2Bucket.delete(key);
			},
			getPublicUrl: (key: string) => {
				if (!publicUrl) return null;
				const base = publicUrl.replace(/\/+$/, '');
				return `${base}/${key.replace(/^\/+/, '')}`;
			}
		};
	}
	return {
		get: async () => null,
		put: async () => {},
		delete: async () => {},
		getPublicUrl: (key: string) => (publicUrl ? `${publicUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}` : null)
	};
}

function createRateLimiter(limiter?: { limit(options: { key: string }): Promise<{ success: boolean }> }): RateLimiter {
	if (limiter) {
		return {
			limit: async (key: string) => limiter.limit({ key })
		};
	}
	return {
		limit: async () => ({ success: true })
	};
}

function createMailer(env: Env): Mailer {
	return {
		send: async (message: EmailContent) => sendEmail(env, message)
	};
}

function createClient(connectionString: string) {
	const client = postgres(connectionString, {
		max: 5,
		fetch_types: false
	});
	return drizzle(client, { schema });
}

export function createDb(env: Env) {
	if (!env.HYPERDRIVE) {
		return null as unknown as ReturnType<typeof createClient>;
	}
	return createClient(env.HYPERDRIVE.connectionString);
}

export function createCtx(platform: App.Platform | undefined): Ctx {
	if (!platform?.env) {
		throw new Error('Cloudflare platform unavailable - run through vite dev or wrangler dev');
	}
	return createWorkerCtx(platform.env, platform.ctx);
}

function createAnalyticsTracker(env: Env, store: KeyValueStore): AnalyticsTracker {
	return {
		capture: async (event, opts) => {
			const key = env.PUBLIC_POSTHOG_KEY;
			if (!key) return;
			const host = env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
			try {
				await fetch(`${host}/capture/`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						api_key: key,
						event,
						distinct_id: opts?.distinctId ?? 'anonymous',
						properties: opts?.properties,
						timestamp: new Date().toISOString()
					})
				});
			} catch {}
		},
		recordMetric: async (metricKey, delta = 1) => {
			const current = Number((await store.get(`metric:${metricKey}`)) ?? 0);
			await store.put(`metric:${metricKey}`, String(current + delta));
		},
		getMetric: async (metricKey) => {
			const val = await store.get(`metric:${metricKey}`);
			return val ? Number(val) : 0;
		}
	};
}

export function createWorkerCtx(env: Env, executionCtx?: App.Platform['ctx']): Ctx {
	const clients: ReturnType<typeof postgres>[] = [];
	const make = (connectionString: string) => {
		const client = postgres(connectionString, { max: 5, fetch_types: false });
		clients.push(client);
		return drizzle(client, { schema });
	};
	const db = env.HYPERDRIVE ? make(env.HYPERDRIVE.connectionString) : (null as unknown as ReturnType<typeof createDb>);
	const storage = createStorage(env.R2, env.R2_PUBLIC_URL);
	const store = createKvStore(env.KV);

	return {
		db,
		dbCached: env.HYPERDRIVE_CACHED ? make(env.HYPERDRIVE_CACHED.connectionString) : db,
		store,
		storage,
		images: storage,
		rateLimiter: createRateLimiter(env.RATE_LIMITER),
		mailer: createMailer(env),
		analytics: createAnalyticsTracker(env, store),
		waitUntil: executionCtx
			? (promise) => executionCtx.waitUntil(promise)
			: (promise) => void promise.catch((e) => console.error({ event: 'waituntil_failed' }, e)),
		close: async () => {
			await Promise.allSettled(clients.map((client) => client.end()));
		}
	};
}

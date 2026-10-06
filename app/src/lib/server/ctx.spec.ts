import { describe, expect, it } from 'vitest';
import { createWorkerCtx } from './ctx';

describe('Ctx abstraction', () => {
	it('provides in-memory key-value store when KV binding is absent', async () => {
		const ctx = createWorkerCtx({} as Env);

		expect(await ctx.store.get('key1')).toBeNull();

		await ctx.store.put('key1', 'val1');
		expect(await ctx.store.get('key1')).toBe('val1');

		await ctx.store.put('user', JSON.stringify({ name: 'Alice' }));
		expect(await ctx.store.get<{ name: string }>('user', 'json')).toEqual({ name: 'Alice' });

		await ctx.store.delete('key1');
		expect(await ctx.store.get('key1')).toBeNull();
	});

	it('routes to KV binding when present', async () => {
		const backingStore = new Map<string, unknown>();
		const mockKv = {
			get: async (key: string, type?: string) => {
				const val = backingStore.get(key);
				if (val == null) return null;
				if (type === 'json' && typeof val === 'string') return JSON.parse(val);
				return val;
			},
			put: async (key: string, value: unknown) => {
				backingStore.set(key, value);
			},
			delete: async (key: string) => {
				backingStore.delete(key);
			}
		} as unknown as KVNamespace;

		const ctx = createWorkerCtx({ KV: mockKv } as unknown as Env);

		await ctx.store.put('bound', 'hello');
		expect(await ctx.store.get('bound')).toBe('hello');

		await ctx.store.delete('bound');
		expect(await ctx.store.get('bound')).toBeNull();
	});

	it('provides storage abstractions with public URLs', async () => {
		const ctx = createWorkerCtx({
			R2_PUBLIC_URL: 'https://cdn.example.com'
		} as Env);

		expect(ctx.storage.getPublicUrl('avatars/user1.png')).toBe(
			'https://cdn.example.com/avatars/user1.png'
		);
		expect(await ctx.storage.get('nonexistent')).toBeNull();
	});

	it('provides rate limiter abstraction', async () => {
		let checkedKey = '';
		const mockLimiter = {
			limit: async ({ key }: { key: string }) => {
				checkedKey = key;
				return { success: true };
			}
		};

		const ctx = createWorkerCtx({
			RATE_LIMITER: mockLimiter
		} as unknown as Env);

		const result = await ctx.rateLimiter.limit('test-key');
		expect(result.success).toBe(true);
		expect(checkedKey).toBe('test-key');
	});

	it('falls back to passing rate limiter when binding is absent', async () => {
		const ctx = createWorkerCtx({} as Env);
		const result = await ctx.rateLimiter.limit('any');
		expect(result.success).toBe(true);
	});
});

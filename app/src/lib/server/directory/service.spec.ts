import { describe, expect, it } from 'vitest';
import { createWorkerCtx } from '../ctx';
import {
	getDirectoryItem,
	listDirectoryItems,
	syncDirectoryItems,
	submitProject
} from './service';
import type { DirectoryItem } from './validation';

const sampleItem: DirectoryItem = {
	id: 'paystack-python',
	name: 'Paystack Python SDK',
	description: 'Python wrapper for Paystack API integration across Nigerian businesses.',
	website_url: 'https://paystack.com',
	github_repo: 'paystack/paystack-python',
	category: 'fintech',
	tags: ['fintech', 'python', 'payments'],
	location_city: 'Lagos',
	location_state: 'Lagos',
	nigeria_connection: 'founder',
	nigeria_connection_details: 'Founded and built in Lagos by Nigerian engineers.',
	stars: 250,
	good_first_issues: 3,
	verified: true,
	updated_at: '2026-10-06T00:00:00.000Z'
};

const secondItem: DirectoryItem = {
	id: 'abuja-devs',
	name: 'Abuja Dev Network',
	description: 'Community and tools for software developers based in Abuja, Nigeria.',
	website_url: 'https://abujadevs.ng',
	github_repo: 'abujadevs/community-tools',
	category: 'developer-tools',
	tags: ['community', 'dev-tools'],
	location_city: 'Abuja',
	location_state: 'FCT Abuja',
	nigeria_connection: 'built_in_nigeria',
	nigeria_connection_details: 'Built in FCT Abuja for the local tech community.',
	stars: 45,
	good_first_issues: 0,
	verified: false,
	updated_at: '2026-10-05T00:00:00.000Z'
};

describe('Directory service', () => {
	it('syncs directory items into store', async () => {
		const ctx = createWorkerCtx({} as Env);

		const result = await syncDirectoryItems(ctx, [sampleItem, secondItem]);
		expect(result.count).toBe(2);

		const all = await listDirectoryItems(ctx);
		expect(all).toHaveLength(2);
		expect(all[0]?.id).toBe('paystack-python');
	});

	it('filters directory by search query', async () => {
		const ctx = createWorkerCtx({} as Env);
		await syncDirectoryItems(ctx, [sampleItem, secondItem]);

		const searchResult = await listDirectoryItems(ctx, { search: 'Abuja' });
		expect(searchResult).toHaveLength(1);
		expect(searchResult[0]?.id).toBe('abuja-devs');
	});

	it('filters directory by state and category', async () => {
		const ctx = createWorkerCtx({} as Env);
		await syncDirectoryItems(ctx, [sampleItem, secondItem]);

		const lagosFintech = await listDirectoryItems(ctx, {
			state: 'Lagos',
			category: 'fintech'
		});
		expect(lagosFintech).toHaveLength(1);
		expect(lagosFintech[0]?.id).toBe('paystack-python');

		const none = await listDirectoryItems(ctx, { state: 'Kano' });
		expect(none).toHaveLength(0);
	});

	it('filters by verified and good first issues', async () => {
		const ctx = createWorkerCtx({} as Env);
		await syncDirectoryItems(ctx, [sampleItem, secondItem]);

		const verifiedOnly = await listDirectoryItems(ctx, { verifiedOnly: true });
		expect(verifiedOnly).toHaveLength(1);
		expect(verifiedOnly[0]?.verified).toBe(true);

		const issuesOnly = await listDirectoryItems(ctx, { goodFirstIssuesOnly: true });
		expect(issuesOnly).toHaveLength(1);
		expect(issuesOnly[0]?.id).toBe('paystack-python');
	});

	it('retrieves an item by id or throws not_found', async () => {
		const ctx = createWorkerCtx({} as Env);
		await syncDirectoryItems(ctx, [sampleItem]);

		const item = await getDirectoryItem(ctx, 'paystack-python');
		expect(item.name).toBe('Paystack Python SDK');

		await expect(getDirectoryItem(ctx, 'nonexistent')).rejects.toMatchObject({
			code: 'not_found'
		});
	});

	it('handles project submission with YAML preview', async () => {
		const ctx = createWorkerCtx({} as Env);

		const submission = await submitProject(ctx, '127.0.0.1', {
			id: 'kaduna-agritech',
			name: 'Kaduna AgriTech',
			description: 'Digital farming and logistics tracking in Northern Nigeria.',
			website_url: 'https://kaduna-agri.ng',
			github_repo: 'kaduna-agri/tracker',
			category: 'agritech',
			tags: ['agritech', 'iot'],
			location_city: 'Kaduna',
			location_state: 'Kaduna',
			nigeria_connection: 'founder',
			nigeria_connection_details: 'Founded by farmers and engineers in Kaduna state.'
		});

		expect(submission.item.id).toBe('kaduna-agritech');
		expect(submission.yamlPreview).toContain('location_state: "Kaduna"');
		expect(submission.yamlPreview).toContain('nigeria_connection: founder');
	});
});

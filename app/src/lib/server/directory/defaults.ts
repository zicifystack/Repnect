import type { DirectoryItem } from './validation';

export const DEFAULT_PROJECTS: DirectoryItem[] = [
	{
		id: 'flutterwave-v3',
		name: 'Flutterwave Node.js SDK',
		description:
			'Official Node.js SDK for Flutterwave v3 API with full support for card charges, mobile money, and virtual accounts across Africa.',
		website_url: 'https://flutterwave.com',
		github_repo: 'Flutterwave/Node-v3',
		primary_language: 'TypeScript',
		category: 'fintech',
		tags: ['nodejs', 'payments', 'typescript', 'africa'],
		location_city: 'Lagos',
		location_state: 'Lagos',
		nigeria_connection: 'founder',
		nigeria_connection_details:
			'Founded in Lagos, Nigeria powering payments for millions of African businesses.',
		stars: 198,
		good_first_issues: 2,
		verified: true,
		updated_at: '2026-10-06T00:00:00Z'
	},
	{
		id: 'paystack-python',
		name: 'Paystack Python SDK',
		description:
			'Comprehensive Python client library for the Paystack payment gateway, enabling easy checkout, transfers, and subscriptions.',
		website_url: 'https://paystack.com',
		github_repo: 'paystack/paystack-python',
		primary_language: 'Python',
		category: 'fintech',
		tags: ['fintech', 'python', 'payments', 'lagos'],
		location_city: 'Lagos',
		location_state: 'Lagos',
		nigeria_connection: 'founder',
		nigeria_connection_details:
			'Built and maintained by Nigerian developers for the African fintech ecosystem.',
		stars: 285,
		good_first_issues: 4,
		verified: true,
		updated_at: '2026-10-06T00:00:00Z'
	},
	{
		id: 'nigeria-banks-api',
		name: 'Nigeria Banks API & CBN Codes',
		description:
			'Open list and REST API of all Nigerian commercial banks, microfinance banks, and their Central Bank sort codes.',
		website_url: 'https://github.com/tech-abuja/ng-banks',
		github_repo: 'tech-abuja/ng-banks',
		primary_language: 'JavaScript',
		category: 'developer-tools',
		tags: ['open-source', 'banks', 'cbn', 'developer-tools'],
		location_city: 'Abuja',
		location_state: 'FCT Abuja',
		nigeria_connection: 'built_in_nigeria',
		nigeria_connection_details:
			'Developed by open source contributors based in Abuja to simplify bank verification in Nigeria.',
		stars: 142,
		good_first_issues: 5,
		verified: true,
		updated_at: '2026-10-06T00:00:00Z'
	}
];

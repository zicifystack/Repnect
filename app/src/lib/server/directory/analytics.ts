import type { Ctx } from '../ctx';
import type { DirectoryItem } from './validation';

export type ProjectMetrics = {
	views: number;
	clicks: number;
};

export type BreakdownItem = {
	label: string;
	count: number;
	percentage: number;
};

export type DirectoryDataAnalytics = {
	totalProjects: number;
	totalCities: number;
	totalStates: number;
	byCity: BreakdownItem[];
	byState: BreakdownItem[];
	byCategory: BreakdownItem[];
	byConnection: BreakdownItem[];
	totalStars: number;
	avgStars: number;
	totalIssues: number;
	verifiedCount: number;
	verifiedPercentage: number;
};

export async function trackProjectView(ctx: Ctx, projectId: string): Promise<void> {
	await ctx.analytics.recordMetric(`views:${projectId}`);
	await ctx.analytics.recordMetric('views:total');
	await ctx.analytics.capture('directory.project_viewed', {
		properties: { projectId }
	});
}

export async function trackOutboundClick(
	ctx: Ctx,
	projectId: string,
	destination: 'website' | 'github'
): Promise<void> {
	await ctx.analytics.recordMetric(`clicks:${projectId}`);
	await ctx.analytics.recordMetric(`clicks:${destination}:${projectId}`);
	await ctx.analytics.recordMetric('clicks:total');
	await ctx.analytics.capture('directory.outbound_clicked', {
		properties: { projectId, destination }
	});
}

export async function trackSearch(
	ctx: Ctx,
	query: string,
	resultCount: number
): Promise<void> {
	await ctx.analytics.recordMetric('searches:total');
	await ctx.analytics.capture('directory.searched', {
		properties: { query, resultCount }
	});
}

export async function getProjectMetrics(
	ctx: Ctx,
	projectId: string
): Promise<ProjectMetrics> {
	const views = await ctx.analytics.getMetric(`views:${projectId}`);
	const clicks = await ctx.analytics.getMetric(`clicks:${projectId}`);
	return { views, clicks };
}

export async function getGlobalMetrics(ctx: Ctx): Promise<{
	totalViews: number;
	totalClicks: number;
	totalSearches: number;
}> {
	const totalViews = await ctx.analytics.getMetric('views:total');
	const totalClicks = await ctx.analytics.getMetric('clicks:total');
	const totalSearches = await ctx.analytics.getMetric('searches:total');
	return { totalViews, totalClicks, totalSearches };
}

function computeBreakdown(values: string[], total: number): BreakdownItem[] {
	const counts = new Map<string, number>();
	for (const v of values) {
		const key = v || 'Unspecified';
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return Array.from(counts.entries())
		.map(([label, count]) => ({
			label,
			count,
			percentage: total > 0 ? Math.round((count / total) * 100) : 0
		}))
		.sort((a, b) => b.count - a.count);
}

export async function getDirectoryDataAnalytics(ctx: Ctx): Promise<DirectoryDataAnalytics> {
	const items = (await ctx.store.get<DirectoryItem[]>('dir:all', 'json')) ?? [];
	const total = items.length;

	const cities = items.map((i) => i.location_city);
	const states = items.map((i) => i.location_state);
	const categories = items.map((i) => i.category);
	const connections = items.map((i) => i.nigeria_connection.replace(/_/g, ' '));

	const totalStars = items.reduce((sum, i) => sum + (i.stars || 0), 0);
	const totalIssues = items.reduce((sum, i) => sum + (i.good_first_issues || 0), 0);
	const verifiedCount = items.filter((i) => i.verified).length;

	return {
		totalProjects: total,
		totalCities: new Set(cities).size,
		totalStates: new Set(states).size,
		byCity: computeBreakdown(cities, total),
		byState: computeBreakdown(states, total),
		byCategory: computeBreakdown(categories, total),
		byConnection: computeBreakdown(connections, total),
		totalStars,
		avgStars: total > 0 ? Math.round(totalStars / total) : 0,
		totalIssues,
		verifiedCount,
		verifiedPercentage: total > 0 ? Math.round((verifiedCount / total) * 100) : 0
	};
}

<script lang="ts">
	import Seo from '$lib/components/seo/Seo.svelte';
	import AnalyticsPageHeader from '$lib/components/analytics/AnalyticsPageHeader.svelte';
	import AnalyticsStatsGrid from '$lib/components/analytics/AnalyticsStatsGrid.svelte';
	import AnalyticsLeaderboard from '$lib/components/analytics/AnalyticsLeaderboard.svelte';
	import AnalyticsChartsGrid from '$lib/components/analytics/AnalyticsChartsGrid.svelte';
	import AnalyticsEngagementCard from '$lib/components/analytics/AnalyticsEngagementCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const a = $derived(data.analytics);
	const m = $derived(data.metrics);
</script>

<Seo
	title="Ecosystem Analytics | Nigeria Tech Directory"
	description="Insights and statistics on Nigerian tech projects, open-source repositories, and developer tools across cities and categories."
/>

<section class="mx-auto max-w-6xl px-6 py-10 sm:py-14 space-y-10">
	<AnalyticsPageHeader />

	<AnalyticsStatsGrid
		totalProjects={a.totalProjects}
		totalCities={a.totalCities}
		totalStates={a.totalStates}
		totalStars={a.totalStars}
		avgStars={a.avgStars}
		totalIssues={a.totalIssues}
		verifiedPercentage={a.verifiedPercentage}
		verifiedCount={a.verifiedCount}
		openSourceCount={a.openSourceCount}
		openSourcePercentage={a.openSourcePercentage}
	/>

	<AnalyticsLeaderboard
		topStarred={a.topStarredProjects ?? []}
		topContributors={a.topContributorProjects ?? []}
	/>

	<AnalyticsChartsGrid
		byCity={a.byCity ?? []}
		byState={a.byState ?? []}
		byCategory={a.byCategory ?? []}
		byConnection={a.byConnection ?? []}
		byTag={a.byTag ?? []}
	/>

	<AnalyticsEngagementCard
		totalViews={m.totalViews}
		totalClicks={m.totalClicks}
		totalSearches={m.totalSearches}
	/>
</section>

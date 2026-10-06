<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DistributionBar from '$lib/components/charts/DistributionBar.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const a = $derived(data.analytics);
	const m = $derived(data.metrics);
</script>

<Seo
	title="Ecosystem Analytics | Nigeria Tech Directory"
	description="Insights and statistics on Nigerian tech projects, open-source repositories, and developer tools across cities and categories."
/>

<section class="mx-auto max-w-6xl px-6 py-12">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<a href={resolve('/directory')} class="text-sm font-medium text-link hover:underline">
				← Back to Directory
			</a>
			<h1 class="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
				Ecosystem Analytics
			</h1>
			<p class="mt-2 text-muted-foreground">
				Geographic distribution, category breakdowns, and activity across the Nigerian ecosystem.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<Button href={resolve('/submit')} variant="default">+ Submit Project</Button>
		</div>
	</div>

	<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border border-border bg-card p-5 shadow-xs">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Projects</p>
			<p class="mt-2 text-3xl font-bold tabular-nums text-foreground">{a.totalProjects}</p>
			<p class="mt-1 text-xs text-muted-foreground">Across {a.totalCities} cities</p>
		</div>

		<div class="rounded-xl border border-border bg-card p-5 shadow-xs">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geographic Reach</p>
			<p class="mt-2 text-3xl font-bold tabular-nums text-foreground">{a.totalStates} States</p>
			<p class="mt-1 text-xs text-muted-foreground">{a.totalCities} urban hubs</p>
		</div>

		<div class="rounded-xl border border-border bg-card p-5 shadow-xs">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GitHub Stars</p>
			<p class="mt-2 text-3xl font-bold tabular-nums text-foreground">★ {a.totalStars.toLocaleString()}</p>
			<p class="mt-1 text-xs text-muted-foreground">Avg. {a.avgStars} stars / project</p>
		</div>

		<div class="rounded-xl border border-border bg-card p-5 shadow-xs">
			<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification Rate</p>
			<p class="mt-2 text-3xl font-bold tabular-nums text-foreground">{a.verifiedPercentage}%</p>
			<p class="mt-1 text-xs text-muted-foreground">{a.verifiedCount} verified entries</p>
		</div>
	</div>

	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<BarChart items={a.byCity} title="Projects by Nigerian City" maxItems={8} />
		<BarChart items={a.byState} title="Projects by State" maxItems={8} />
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-2">
		<DistributionBar items={a.byCategory} title="Category Distribution" />
		<DistributionBar items={a.byConnection} title="Nigeria Connection Type" />
	</div>

	<div class="mt-8 rounded-xl border border-border bg-card p-6 shadow-xs">
		<h2 class="text-base font-semibold text-foreground">Directory Traffic & Engagement</h2>
		<p class="mt-1 text-xs text-muted-foreground">
			Platform usage recorded in the edge store.
		</p>

		<div class="mt-6 grid gap-4 sm:grid-cols-3">
			<div class="rounded-lg border border-border bg-muted/40 p-4">
				<p class="text-xs text-muted-foreground uppercase font-semibold">Total Page Views</p>
				<p class="mt-1 text-2xl font-bold tabular-nums text-foreground">{m.totalViews.toLocaleString()}</p>
			</div>

			<div class="rounded-lg border border-border bg-muted/40 p-4">
				<p class="text-xs text-muted-foreground uppercase font-semibold">Outbound Clicks</p>
				<p class="mt-1 text-2xl font-bold tabular-nums text-foreground">{m.totalClicks.toLocaleString()}</p>
			</div>

			<div class="rounded-lg border border-border bg-muted/40 p-4">
				<p class="text-xs text-muted-foreground uppercase font-semibold">Directory Searches</p>
				<p class="mt-1 text-2xl font-bold tabular-nums text-foreground">{m.totalSearches.toLocaleString()}</p>
			</div>
		</div>
	</div>
</section>

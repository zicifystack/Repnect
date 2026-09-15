<script lang="ts">
	import type { PageData } from './$types';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import RadarChart from '$lib/components/RadarChart.svelte';
	import BreadcrumbSchema from '$lib/components/BreadcrumbSchema.svelte';
	import { Globe, Star, GitFork, Users, Code2, MapPin } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const { stats, stateGroups, projects } = $derived(data);

	const title = 'Nigeria OSS Radar — Repnect';
	const description =
		"Geographic breakdown of Nigeria's open source ecosystem. Explore projects by state, city, language, and contributor metrics.";

	const topLanguages = $derived(stats.topLanguages);
	const totalLangBytes = $derived(topLanguages.reduce((s, l) => s + l.bytes, 0));

	// State breakdown sorted by project count
	const stateBreakdown = $derived(
		Object.entries(stateGroups)
			.map(([state, projs]) => ({
				state,
				count: projs.length,
				cities: [...new Set(projs.map((p) => p.location_city))],
				pct: stats.totalProjects > 0 ? Math.round((projs.length / stats.totalProjects) * 100) : 0
			}))
			.sort((a, b) => b.count - a.count)
	);

	// Top 6 states for radar chart
	const top6States = $derived(
		stateBreakdown.slice(0, 6).map((s) => ({ name: s.state, count: s.count }))
	);

	const breadcrumbs = [
		{ name: 'Home', url: 'https://repnect.dev' },
		{ name: 'Radar', url: 'https://repnect.dev/radar' }
	];

	const breadcrumbJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: breadcrumbs.map((c, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: c.name,
			item: c.url
		}))
	});
	const breadcrumbTag = `\x3cscript type="application/ld+json">${breadcrumbJsonLd}\x3c/script>`;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="https://repnect.dev/radar" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content="https://repnect.dev/radar" />
	<meta property="og:image" content="https://repnect.dev/api/og" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://repnect.dev/api/og" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html breadcrumbTag}
</svelte:head>

<BreadcrumbSchema crumbs={breadcrumbs} />

<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
	<!-- Page header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-foreground">Nigeria OSS Radar</h1>
		<p class="mt-2 text-muted-foreground">
			Visualising Nigeria's open source ecosystem across states and cities.
		</p>
	</div>

	<!-- Primary stat cards -->
	<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
		<Card>
			<CardContent class="pt-4">
				<p class="text-sm text-muted-foreground">Total Projects</p>
				<p class="mt-1 text-3xl font-bold text-foreground">{stats.totalProjects}</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4">
				<p class="text-sm text-muted-foreground">Total Stars</p>
				<p class="mt-1 flex items-center gap-1.5 text-3xl font-bold text-foreground">
					<Star class="size-5 fill-yellow-400 text-yellow-400" />
					{stats.totalStars.toLocaleString()}
				</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4">
				<p class="text-sm text-muted-foreground">States</p>
				<p class="mt-1 flex items-center gap-1.5 text-3xl font-bold text-foreground">
					<MapPin class="size-5 text-primary" />
					{stats.statesCount}
				</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4">
				<p class="text-sm text-muted-foreground">Cities</p>
				<p class="mt-1 flex items-center gap-1.5 text-3xl font-bold text-foreground">
					<Globe class="size-5 text-primary" />
					{stats.citiesCount}
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Secondary stat cards -->
	<div class="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
		<Card>
			<CardContent class="pt-4">
				<p class="text-sm text-muted-foreground">Contributors</p>
				<p class="mt-1 flex items-center gap-1.5 text-2xl font-bold text-foreground">
					<Users class="size-4 text-primary" />
					{stats.uniqueContributors}
				</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4">
				<p class="text-sm text-muted-foreground">Total Forks</p>
				<p class="mt-1 flex items-center gap-1.5 text-2xl font-bold text-foreground">
					<GitFork class="size-4 text-primary" />
					{stats.totalForks.toLocaleString()}
				</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4">
				<p class="text-sm text-muted-foreground">Total Commits</p>
				<p class="mt-1 text-2xl font-bold text-foreground">
					{stats.totalCommits.toLocaleString()}
				</p>
			</CardContent>
		</Card>
		<Card>
			<CardContent class="pt-4">
				<p class="text-sm text-muted-foreground">Languages</p>
				<p class="mt-1 flex items-center gap-1.5 text-2xl font-bold text-foreground">
					<Code2 class="size-4 text-primary" />
					{topLanguages.length}
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Language distribution + Radar chart -->
	<div class="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Language distribution -->
		<Card>
			<CardHeader>
				<h2 class="font-semibold text-foreground">Top Languages</h2>
			</CardHeader>
			<CardContent class="flex flex-col gap-3">
				{#if topLanguages.length === 0}
					<p class="text-sm text-muted-foreground">No language data available yet.</p>
				{:else}
					{#each topLanguages as lang (lang.lang)}
						{@const pct = totalLangBytes > 0 ? Math.round((lang.bytes / totalLangBytes) * 100) : 0}
						<div class="flex flex-col gap-1">
							<div class="flex items-center justify-between text-sm">
								<span class="text-foreground">{lang.lang}</span>
								<span class="text-muted-foreground">{pct}%</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div class="h-full rounded-full bg-primary transition-all" style="width: {pct}%"></div>
							</div>
						</div>
					{/each}
				{/if}
			</CardContent>
		</Card>

		<!-- Radar chart -->
		<Card>
			<CardHeader>
				<h2 class="font-semibold text-foreground">State Distribution</h2>
			</CardHeader>
			<CardContent class="flex items-center justify-center py-4">
				{#if top6States.length === 0}
					<p class="text-sm text-muted-foreground">No geographic data available yet.</p>
				{:else}
					<RadarChart states={top6States} />
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- State breakdown table -->
	<div>
		<h2 class="mb-4 text-xl font-semibold text-foreground">State-by-State Breakdown</h2>
		{#if stateBreakdown.length === 0}
			<p class="text-muted-foreground">No state data available yet.</p>
		{:else}
			<div class="flex flex-col gap-4">
				{#each stateBreakdown as entry, rank (entry.state)}
					<Card>
						<CardContent class="pt-4">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div class="flex items-center gap-3">
									<span
										class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
									>
										{rank + 1}
									</span>
									<div>
										<h3 class="font-semibold text-foreground">{entry.state}</h3>
										<p class="text-sm text-muted-foreground">
											{entry.cities.length}
											{entry.cities.length === 1 ? 'city' : 'cities'}
										</p>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<Badge variant="secondary">{entry.count} projects</Badge>
									<span class="text-sm text-muted-foreground">{entry.pct}% of total</span>
								</div>
							</div>

							<!-- Progress bar -->
							<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-primary"
									style="width: {entry.pct}%"
								></div>
							</div>

							<!-- City sub-breakdown -->
							{#if entry.cities.length > 0}
								<div class="mt-3 flex flex-wrap gap-2">
									{#each entry.cities.slice(0, 8) as city (city)}
										{@const cityProjects = stateGroups[entry.state]?.filter(
											(p) => p.location_city === city
										) ?? []}
										<div class="flex flex-col gap-1 text-xs">
											<span class="font-medium text-foreground">{city}</span>
											<div class="flex flex-wrap gap-1">
												{#each cityProjects.slice(0, 3) as p (p.slug)}
													<a
														href="/projects/{p.slug}"
														class="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
													>
														{p.name}
													</a>
												{/each}
												{#if cityProjects.length > 3}
													<span class="text-muted-foreground">+{cityProjects.length - 3}</span>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>

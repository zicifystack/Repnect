<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Sparkles, Plus, LayoutGrid, List } from '@lucide/svelte';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ProjectFilters from '$lib/components/directory/ProjectFilters.svelte';
	import ProjectGrid from '$lib/components/directory/ProjectGrid.svelte';
	import ProjectList from '$lib/components/directory/ProjectList.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const items = $derived(data?.items ?? []);
	const categories = $derived(data?.categories ?? []);
	const states = $derived(data?.states ?? []);
	const connections = $derived(data?.connections ?? []);
	const filters = $derived(data?.filters ?? {});

	let searchQuery = $state('');
	let selectedCategory = $state('');
	let selectedState = $state('');
	let selectedConnection = $state('');
	let verifiedOnly = $state(false);
	let goodFirstIssuesOnly = $state(false);
	let sortBy = $state('stars');
	let viewMode = $state<'grid' | 'list'>('grid');

	function syncFromFilters() {
		searchQuery = filters.search ?? '';
		selectedCategory = filters.category ?? '';
		selectedState = filters.state ?? '';
		selectedConnection = filters.connection ?? '';
		verifiedOnly = Boolean(filters.verifiedOnly);
		goodFirstIssuesOnly = Boolean(filters.goodFirstIssuesOnly);
		sortBy = filters.sortBy ?? 'stars';
	}

	syncFromFilters();

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedCategory) params.set('category', selectedCategory);
		if (selectedState) params.set('state', selectedState);
		if (selectedConnection) params.set('connection', selectedConnection);
		if (verifiedOnly) params.set('verified', 'true');
		if (goodFirstIssuesOnly) params.set('issues', 'true');
		if (sortBy && sortBy !== 'stars') params.set('sortBy', sortBy);

		const qs = params.toString();
		goto(resolve(qs ? `/directory?${qs}` : '/directory'), { keepFocus: true });
	}

	function resetFilters() {
		searchQuery = '';
		selectedCategory = '';
		selectedState = '';
		selectedConnection = '';
		verifiedOnly = false;
		goodFirstIssuesOnly = false;
		sortBy = 'stars';
		goto(resolve('/directory'));
	}

	function trackClick(projectId: string, destination: 'website' | 'github') {
		if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
			navigator.sendBeacon(
				resolve('/api/directory/track'),
				JSON.stringify({ type: 'click', projectId, destination })
			);
		}
	}
</script>

<Seo
	title="Nigeria Tech & Open Source Directory"
	description="Curated directory of startups, open-source projects, and developer tools built in Nigeria or with strong Nigerian connections."
/>

<section class="mx-auto max-w-6xl px-6 py-10 sm:py-14">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-link"
			>
				<Sparkles class="size-3.5" />
				<span>Curated Ecosystem</span>
			</div>
			<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
				Nigerian Tech Directory
			</h1>
			<p class="mt-1.5 text-sm text-muted-foreground sm:text-base">
				Explore innovative products, open-source libraries, and developer tools built in Nigeria.
			</p>
		</div>

		<div class="flex items-center gap-2.5">
			<Button href={resolve('/submit')} variant="default" class="gap-1.5">
				<Plus class="size-4" />
				<span>Submit Project</span>
			</Button>
		</div>
	</div>

	<div class="mt-8">
		<ProjectFilters
			bind:searchQuery
			bind:selectedCategory
			bind:selectedState
			bind:selectedConnection
			bind:verifiedOnly
			bind:goodFirstIssuesOnly
			bind:sortBy
			{categories}
			{states}
			{connections}
			onApply={applyFilters}
			onReset={resetFilters}
		/>
	</div>

	<div class="mt-8">
		<div class="mb-4 flex items-center justify-between text-xs text-muted-foreground">
			<p>
				Showing <strong class="text-foreground">{items.length}</strong>
				{items.length === 1 ? 'project' : 'projects'}
			</p>

			<div class="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
				<Button
					variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
					size="sm"
					class="size-7 p-0"
					onclick={() => (viewMode = 'grid')}
					aria-label="Grid view"
				>
					<LayoutGrid class="size-3.5" />
				</Button>
				<Button
					variant={viewMode === 'list' ? 'secondary' : 'ghost'}
					size="sm"
					class="size-7 p-0"
					onclick={() => (viewMode = 'list')}
					aria-label="List view"
				>
					<List class="size-3.5" />
				</Button>
			</div>
		</div>

		{#if viewMode === 'grid'}
			<ProjectGrid {items} onTrackClick={trackClick} onReset={resetFilters} />
		{:else}
			<ProjectList {items} onTrackClick={trackClick} onReset={resetFilters} />
		{/if}
	</div>
</section>

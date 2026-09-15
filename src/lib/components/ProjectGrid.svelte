<script lang="ts">
	import type { SearchIndexItem } from '$lib/schema.js';
	import { createFuse } from '$lib/search.js';
	import { filterByCategory, sortItems, type SortOrder } from '$lib/filters.js';
	import SearchBar from './SearchBar.svelte';
	import Filters from './Filters.svelte';
	import ProjectCard from './ProjectCard.svelte';

	interface Props {
		initialProjects: SearchIndexItem[];
		categories: { id: string; label: string }[];
	}

	let { initialProjects, categories }: Props = $props();

	let query = $state('');
	let activeCategory = $state('all');
	let sortOrder = $state<SortOrder>('recent');
	let debouncedQuery = $state('');

	const fuse = $derived(createFuse(initialProjects));

	// 300ms debounce
	$effect(() => {
		const q = query;
		const timer = setTimeout(() => {
			debouncedQuery = q;
		}, 300);
		return () => clearTimeout(timer);
	});

	const searchResults = $derived(
		debouncedQuery.trim() ? fuse.search(debouncedQuery).map((r) => r.item) : initialProjects
	);

	const filteredProjects = $derived(filterByCategory(searchResults, activeCategory));
	const sortedProjects = $derived(sortItems(filteredProjects, sortOrder));
</script>

<div class="flex flex-col gap-4">
	<!-- Search + Filters -->
	<div class="flex flex-col gap-3">
		<SearchBar value={query} onchange={(q) => (query = q)} />
		<Filters
			{categories}
			{activeCategory}
			{sortOrder}
			onCategoryChange={(id) => (activeCategory = id)}
			onSortChange={(order) => (sortOrder = order)}
		/>
	</div>

	<!-- Result count -->
	<div class="flex items-center justify-between text-xs font-mono text-muted-foreground">
		<p>
			showing <span class="font-semibold text-foreground">{sortedProjects.length}</span> of <span class="font-semibold text-foreground">{initialProjects.length}</span> {initialProjects.length === 1 ? 'project' : 'projects'}
		</p>
	</div>

	<!-- Grid -->
	{#if sortedProjects.length > 0}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each sortedProjects as project (project.slug)}
				<ProjectCard {project} />
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
			<p class="text-lg font-medium text-foreground">No projects found</p>
			{#if query.trim()}
				<p class="text-sm text-muted-foreground">
					No results for "<span class="font-medium">{query}</span>". Try a different search.
				</p>
			{:else}
				<p class="text-sm text-muted-foreground">
					No projects match the selected filter.
				</p>
			{/if}
		</div>
	{/if}
</div>

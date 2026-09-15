<script lang="ts">
	import type { Project } from '$lib/schema.js';
	import type { SearchIndexItem } from '$lib/schema.js';
	import ProjectCard from './ProjectCard.svelte';

	let { projects }: { projects: Project[] } = $props();

	// Map Project to SearchIndexItem shape for ProjectCard
	const items = $derived<SearchIndexItem[]>(
		projects.map((p) => ({
			slug: p.slug,
			name: p.name,
			short_desc: p.short_desc,
			category: p.category,
			tags: p.tags,
			stars: p.stars ?? 0,
			primary_lang: p.primary_lang,
			verified: p.verified ?? false,
			added_at: p.added_at,
			looking_for_contributors: p.looking_for_contributors,
			location_city: p.location_city,
			location_nigerian_state: p.location_nigerian_state
		}))
	);
</script>

{#if items.length > 0}
	<section>
		<h2 class="mb-4 text-xl font-semibold text-foreground">Similar Projects</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each items as item (item.slug)}
				<ProjectCard project={item} />
			{/each}
		</div>
	</section>
{/if}

<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import DirectoryCard from '$lib/components/directory/DirectoryCard.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { DirectoryItem } from '$lib/server/directory/validation';

	let {
		featured,
		onTrackClick
	}: {
		featured: DirectoryItem[];
		onTrackClick?: (projectId: string, destination: 'website' | 'github') => void;
	} = $props();
</script>

<section class="mx-auto max-w-5xl px-6 py-20 sm:py-24">
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<h2 class="text-2xl font-bold tracking-tight sm:text-3xl">{m.landing_featured_title()}</h2>
			<p class="mt-2 text-sm text-muted-foreground">{m.landing_featured_body()}</p>
		</div>
		<Button href={resolve('/directory')} variant="ghost">
			{m.landing_view_all()}
			<ArrowRight data-icon="inline-end" />
		</Button>
	</div>

	<div class="mt-10 grid gap-5 sm:grid-cols-3">
		{#each featured as project (project.id)}
			<DirectoryCard item={project} {onTrackClick} />
		{/each}
	</div>
</section>

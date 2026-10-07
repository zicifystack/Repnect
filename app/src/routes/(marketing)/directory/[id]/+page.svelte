<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/seo/Seo.svelte';
	import ProjectDetail from '$lib/components/directory/ProjectDetail.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function trackClick(destination: 'website' | 'github') {
		if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
			navigator.sendBeacon(
				resolve('/api/directory/track'),
				JSON.stringify({ type: 'click', projectId: data.item.id, destination })
			);
		}
	}
</script>

<Seo title={`${data.item.name} | Nigeria Tech Directory`} description={data.item.description} />

<ProjectDetail
	item={data.item}
	relatedProjects={data.relatedProjects ?? []}
	metrics={data.metrics}
	voteStats={data.voteStats}
	languages={data.languages ?? []}
	onTrackClick={trackClick}
/>

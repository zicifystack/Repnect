<script lang="ts">
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import DistributionBar from '$lib/components/charts/DistributionBar.svelte';
	import type { BreakdownItem } from '$lib/server/directory/analytics';

	let {
		byCity = [],
		byState = [],
		byCategory = [],
		byConnection = [],
		byTag = []
	}: {
		byCity?: BreakdownItem[];
		byState?: BreakdownItem[];
		byCategory?: BreakdownItem[];
		byConnection?: BreakdownItem[];
		byTag?: BreakdownItem[];
	} = $props();
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-bold tracking-tight text-foreground sm:text-xl">Geographic Reach</h2>
		<p class="text-xs text-muted-foreground mt-0.5">
			Distribution of tech initiatives and companies across Nigerian urban centers and states.
		</p>
		<div class="mt-4 grid gap-6 lg:grid-cols-2">
			<BarChart items={byCity} title="Projects by Nigerian City" maxItems={8} />
			<BarChart items={byState} title="Projects by State" maxItems={8} />
		</div>
	</div>

	<div>
		<h2 class="text-lg font-bold tracking-tight text-foreground sm:text-xl">Ecosystem Structure</h2>
		<p class="text-xs text-muted-foreground mt-0.5">
			Industry verticals, connection models, and primary technologies.
		</p>
		<div class="mt-4 grid gap-6 lg:grid-cols-2">
			<DistributionBar items={byCategory} title="Category Breakdown" />
			<DistributionBar items={byConnection} title="Connection to Nigeria" />
		</div>

		{#if byTag.length > 0}
			<div class="mt-6">
				<DistributionBar items={byTag} title="Popular Tech Stack & Tags" />
			</div>
		{/if}
	</div>
</div>

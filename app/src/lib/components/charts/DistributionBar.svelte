<script lang="ts">
	let {
		items = [],
		title = ''
	}: {
		items: { label: string; count: number; percentage: number }[];
		title?: string;
	} = $props();

	const colors = [
		'bg-primary-500',
		'bg-chart-2',
		'bg-chart-3',
		'bg-chart-4',
		'bg-chart-5',
		'bg-muted-foreground'
	];
</script>

<div class="rounded-xl border border-border bg-card p-5 shadow-xs">
	{#if title}
		<h3 class="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
	{/if}

	<div class="mt-4">
		<div class="flex h-3 w-full overflow-hidden rounded-full bg-muted">
			{#each items as item, idx}
				{#if item.percentage > 0}
					<div
						class="h-full transition-all {colors[idx % colors.length]}"
						style="width: {item.percentage}%"
						title="{item.label}: {item.count} ({item.percentage}%)"
					></div>
				{/if}
			{/each}
		</div>

		<div class="mt-4 flex flex-wrap gap-x-4 gap-y-2">
			{#each items.slice(0, 6) as item, idx}
				<div class="flex items-center gap-1.5 text-xs">
					<span class="h-2 w-2 rounded-full {colors[idx % colors.length]}"></span>
					<span class="text-muted-foreground capitalize">{item.label}:</span>
					<span class="font-medium text-foreground">{item.count} ({item.percentage}%)</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<script lang="ts">
	let {
		items = [],
		title = '',
		maxItems = 8
	}: {
		items: { label: string; count: number; percentage: number }[];
		title?: string;
		maxItems?: number;
	} = $props();

	const displayed = $derived(items.slice(0, maxItems));
	const maxCount = $derived(Math.max(...items.map((i) => i.count), 1));
</script>

<div class="rounded-xl border border-border bg-card p-5 shadow-xs">
	{#if title}
		<h3 class="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
	{/if}

	<div class="mt-4 space-y-3">
		{#if displayed.length === 0}
			<p class="py-4 text-center text-xs text-muted-foreground">No data available</p>
		{:else}
			{#each displayed as item}
				<div>
					<div class="flex items-center justify-between text-xs">
						<span class="font-medium text-foreground truncate max-w-[60%]">{item.label}</span>
						<div class="flex items-center gap-1.5 tabular-nums text-muted-foreground">
							<span class="font-semibold text-foreground">{item.count}</span>
							<span>({item.percentage}%)</span>
						</div>
					</div>
					<div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary-500 transition-all duration-500"
							style="width: {(item.count / maxCount) * 100}%"
						></div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

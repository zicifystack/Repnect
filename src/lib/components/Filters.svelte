<script lang="ts">
	import type { SortOrder } from '$lib/filters.js';

	let {
		categories,
		activeCategory,
		sortOrder,
		onCategoryChange,
		onSortChange
	}: {
		categories: { id: string; label: string }[];
		activeCategory: string;
		sortOrder: SortOrder;
		onCategoryChange: (id: string) => void;
		onSortChange: (order: SortOrder) => void;
	} = $props();

	const sortOptions: { value: SortOrder; label: string }[] = [
		{ value: 'recent', label: 'Recently Added' },
		{ value: 'stars', label: 'Most Stars' },
		{ value: 'alpha', label: 'Alphabetical' }
	];
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	<!-- Horizontal scrollable category tabs -->
	<div
		class="scrollbar-hide flex flex-1 items-center gap-1.5 overflow-x-auto py-1"
		role="tablist"
		aria-label="Filter by category"
	>
		<button
			type="button"
			role="tab"
			aria-selected={activeCategory === 'all'}
			onclick={() => onCategoryChange('all')}
			class="shrink-0 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
				{activeCategory === 'all'
				? 'bg-primary text-primary-foreground shadow-sm'
				: 'bg-muted/50 border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			All
		</button>
		{#each categories as cat (cat.id)}
			<button
				type="button"
				role="tab"
				aria-selected={activeCategory === cat.id}
				onclick={() => onCategoryChange(cat.id)}
				class="shrink-0 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
					{activeCategory === cat.id
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'bg-muted/50 border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground'}"
			>
				{cat.label}
			</button>
		{/each}
	</div>

	<!-- Sort select -->
	<select
		value={sortOrder}
		onchange={(e) => onSortChange((e.currentTarget as HTMLSelectElement).value as SortOrder)}
		aria-label="Sort order"
		class="shrink-0 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
	>
		{#each sortOptions as opt (opt.value)}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
</div>

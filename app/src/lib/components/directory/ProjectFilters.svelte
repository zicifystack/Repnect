<script lang="ts">
	import { Search, RotateCcw } from '@lucide/svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		searchQuery = $bindable(''),
		selectedCategory = $bindable(''),
		selectedState = $bindable(''),
		selectedConnection = $bindable(''),
		verifiedOnly = $bindable(false),
		goodFirstIssuesOnly = $bindable(false),
		sortBy = $bindable('stars'),
		categories = [],
		states = [],
		connections = [],
		onApply,
		onReset
	}: {
		searchQuery?: string;
		selectedCategory?: string;
		selectedState?: string;
		selectedConnection?: string;
		verifiedOnly?: boolean;
		goodFirstIssuesOnly?: boolean;
		sortBy?: string;
		categories?: readonly string[];
		states?: readonly string[];
		connections?: readonly string[];
		onApply: () => void;
		onReset: () => void;
	} = $props();

	const hasActiveFilters = $derived(
		Boolean(
			searchQuery ||
			selectedCategory ||
			selectedState ||
			selectedConnection ||
			verifiedOnly ||
			goodFirstIssuesOnly ||
			(sortBy && sortBy !== 'stars')
		)
	);
</script>

<Card class="border-border bg-card shadow-xs">
	<CardContent class="p-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div class="relative flex-1">
				<Search
					class="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
				/>
				<input
					type="text"
					placeholder="Search by project name, description, city, or tech..."
					class="w-full rounded-xl border border-input bg-background py-2.5 pr-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
					bind:value={searchQuery}
					onkeydown={(e) => e.key === 'Enter' && onApply()}
				/>
			</div>

			<div class="flex items-center gap-2">
				<Button variant="default" size="sm" onclick={onApply}>Search</Button>
				{#if hasActiveFilters}
					<Button variant="ghost" size="sm" onclick={onReset} class="gap-1 text-muted-foreground">
						<RotateCcw class="size-3.5" />
						Reset
					</Button>
				{/if}
			</div>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
			<select
				aria-label="Filter by Category"
				class="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring capitalize"
				bind:value={selectedCategory}
				onchange={onApply}
			>
				<option value="">All Categories</option>
				{#each categories as cat (cat)}
					<option value={cat}>{cat}</option>
				{/each}
			</select>

			<select
				aria-label="Filter by State"
				class="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
				bind:value={selectedState}
				onchange={onApply}
			>
				<option value="">All Nigerian States</option>
				{#each states as st (st)}
					<option value={st}>{st}</option>
				{/each}
			</select>

			<select
				aria-label="Filter by Nigeria Connection"
				class="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring capitalize"
				bind:value={selectedConnection}
				onchange={onApply}
			>
				<option value="">All Connections</option>
				{#each connections as conn (conn)}
					<option value={conn}>{conn.replace(/_/g, ' ')}</option>
				{/each}
			</select>

			<select
				aria-label="Sort Projects"
				class="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
				bind:value={sortBy}
				onchange={onApply}
			>
				<option value="stars">Most GitHub Stars</option>
				<option value="votes">Highest Community Score</option>
				<option value="newest">Recently Updated</option>
				<option value="name">Alphabetical</option>
			</select>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3.5 text-xs">
			<label class="flex items-center gap-2 cursor-pointer font-medium text-foreground">
				<input
					type="checkbox"
					class="size-4 rounded border-input accent-primary-600"
					bind:checked={verifiedOnly}
					onchange={onApply}
				/>
				Verified Only
			</label>

			<label class="flex items-center gap-2 cursor-pointer font-medium text-foreground">
				<input
					type="checkbox"
					class="size-4 rounded border-input accent-primary-600"
					bind:checked={goodFirstIssuesOnly}
					onchange={onApply}
				/>
				Has Good First Issues
			</label>
		</div>
	</CardContent>
</Card>

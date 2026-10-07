<script lang="ts">
	import { resolve } from '$app/paths';
	import { Plus, RotateCcw } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DirectoryCard from '$lib/components/directory/DirectoryCard.svelte';
	import type { DirectoryItem } from '$lib/server/directory/validation';

	type ItemWithVote = DirectoryItem & {
		voteScore?: number;
		userVote?: 'up' | 'down' | null;
	};

	let {
		items,
		onTrackClick,
		onReset
	}: {
		items: ItemWithVote[];
		onTrackClick?: (projectId: string, destination: 'website' | 'github') => void;
		onReset?: () => void;
	} = $props();
</script>

{#if items.length === 0}
	<div class="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
		<p class="text-lg font-semibold text-foreground">No projects found</p>
		<p class="mt-1 text-sm text-muted-foreground">
			Try clearing your filters or submit a new project!
		</p>
		<div class="mt-6 flex justify-center gap-3">
			{#if onReset}
				<Button variant="outline" onclick={onReset} class="gap-1.5">
					<RotateCcw class="size-3.5" />
					<span>Reset Filters</span>
				</Button>
			{/if}
			<Button href={resolve('/submit')} variant="default" class="gap-1.5">
				<Plus class="size-4" />
				<span>Submit a Project</span>
			</Button>
		</div>
	</div>
{:else}
	<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each items as item (item.id)}
			<DirectoryCard {item} {onTrackClick} />
		{/each}
	</div>
{/if}

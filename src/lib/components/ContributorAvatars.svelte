<script lang="ts">
	import type { Contributor } from '$lib/types.js';

	let { contributors }: { contributors: Contributor[] } = $props();

	const MAX_VISIBLE = 7;
	const visible = $derived(contributors.slice(0, MAX_VISIBLE));
	const overflow = $derived(Math.max(0, contributors.length - MAX_VISIBLE));
</script>

{#if visible.length > 0}
	<div class="flex items-center">
		<div class="flex -space-x-2">
			{#each visible as contributor (contributor.login)}
				<a
					href={contributor.html_url}
					target="_blank"
					rel="noopener noreferrer"
					title={contributor.login}
					class="relative block size-8 overflow-hidden rounded-full border-2 border-background transition-transform hover:z-10 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{#if contributor.avatar_url}
						<img
							src={contributor.avatar_url}
							alt={contributor.login}
							class="size-full object-cover"
							loading="lazy"
						/>
					{:else}
						<div
							class="flex size-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground"
						>
							{contributor.login[0].toUpperCase()}
						</div>
					{/if}
				</a>
			{/each}

			{#if overflow > 0}
				<div
					class="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground"
					title="{overflow} more contributors"
				>
					+{overflow}
				</div>
			{/if}
		</div>
	</div>
{/if}

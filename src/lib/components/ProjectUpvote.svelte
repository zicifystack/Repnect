<script lang="ts">
	import { ArrowUp } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { getUpvoteCount, voteProject } from '$lib/upvote.remote';

	let { slug, initialCount = 0 }: { slug: string; initialCount: number } = $props();

	// $state.raw is used so we can mutate count freely (optimistic updates + server reconciliation).
	// We seed from initialCount via $effect so the prop is tracked reactively.
	let count = $state(0);
	let hasVoted = $state(false);
	let loading = $state(true);
	let pendingVote = $state(false);

	// Keep count in sync when the parent changes initialCount
	$effect(() => {
		if (!loading) return; // once we have a live server value, don't overwrite it
		count = initialCount;
	});

	// Initialise hasVoted from localStorage on mount
	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			hasVoted = localStorage.getItem(`upvote-${slug}`) === 'true';
		}
	});

	// Persist hasVoted to localStorage reactively
	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			if (hasVoted) {
				localStorage.setItem(`upvote-${slug}`, 'true');
			} else {
				localStorage.removeItem(`upvote-${slug}`);
			}
		}
	});

	// Fetch live count from the server using the remote query
	$effect(() => {
		loading = true;
		getUpvoteCount({ slug })
			.then((data) => {
				count = data.count;
			})
			.catch(() => {
				// Keep initialCount on error
			})
			.finally(() => {
				loading = false;
			});
	});

	async function handleVote() {
		if (loading || pendingVote) return;

		const prevCount = count;
		const prevVoted = hasVoted;

		// Optimistic update
		if (hasVoted) {
			count -= 1;
			hasVoted = false;
		} else {
			count += 1;
			hasVoted = true;
		}

		pendingVote = true;
		try {
			const data = await voteProject({ slug, action: prevVoted ? 'unvote' : 'upvote' });
			count = data.count;
		} catch {
			// Revert on error
			count = prevCount;
			hasVoted = prevVoted;
		} finally {
			pendingVote = false;
		}
	}
</script>

<div class="flex items-center gap-2">
	{#if loading}
		<Skeleton class="h-8 w-16 rounded-md" />
	{:else}
		<button
			type="button"
			onclick={handleVote}
			disabled={pendingVote}
			aria-label="Upvote"
			class="flex min-h-8 items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60
				{hasVoted
				? 'border-primary/50 bg-primary/15 text-primary hover:bg-primary/25 shadow-xs shadow-primary/10'
				: 'border-border/70 bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'}"
		>
			<ArrowUp class="size-3.5 {hasVoted ? 'fill-primary text-primary' : ''}" />
			<span>{count}</span>
		</button>
	{/if}
</div>

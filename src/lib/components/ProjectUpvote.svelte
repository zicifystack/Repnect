<script lang="ts">
	import { ArrowUp } from '@lucide/svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let { slug, initialCount = 0 }: { slug: string; initialCount: number } = $props();

	let count = $state(0);
	let hasVoted = $state(false);
	let loading = $state(true);

	// Sync count from initialCount prop reactively
	$effect(() => {
		count = initialCount;
	});

	// Initialise hasVoted from localStorage on mount
	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			hasVoted = localStorage.getItem(`upvote-${slug}`) === 'true';
		}
	});

	// Persist hasVoted to localStorage on change
	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			if (hasVoted) {
				localStorage.setItem(`upvote-${slug}`, 'true');
			} else {
				localStorage.removeItem(`upvote-${slug}`);
			}
		}
	});

	// Fetch current count on mount
	$effect(() => {
		loading = true;
		fetch(`/api/upvote?slug=${encodeURIComponent(slug)}`)
			.then((r) => r.json())
			.then((data) => {
				count = (data as { count: number }).count;
			})
			.catch(() => {
				// Keep initialCount on error
			})
			.finally(() => {
				loading = false;
			});
	});

	async function handleVote() {
		if (loading) return;

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

		try {
			const res = await fetch('/api/upvote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug, action: prevVoted ? 'unvote' : 'upvote' })
			});
			if (!res.ok) throw new Error('API error');
			const data = await res.json() as { count: number };
			count = data.count;
		} catch {
			// Revert on error
			count = prevCount;
			hasVoted = prevVoted;
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
			aria-label="Upvote"
			class="flex min-h-8 items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
				{hasVoted
				? 'border-primary/50 bg-primary/15 text-primary hover:bg-primary/25 shadow-xs shadow-primary/10'
				: 'border-border/70 bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'}"
		>
			<ArrowUp class="size-3.5 {hasVoted ? 'fill-primary text-primary' : ''}" />
			<span>{count}</span>
		</button>
	{/if}
</div>

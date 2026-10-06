<script lang="ts">
	import { resolve } from '$app/paths';
	import { ChevronUp, ChevronDown } from '@lucide/svelte';

	let {
		projectId,
		initialScore = 0,
		initialUserVote = null,
		orientation = 'vertical',
		size = 'md'
	}: {
		projectId: string;
		initialScore?: number;
		initialUserVote?: 'up' | 'down' | null;
		orientation?: 'vertical' | 'horizontal';
		size?: 'sm' | 'md';
	} = $props();

	let score = $state(0);
	let userVote = $state<'up' | 'down' | null>(null);
	let pending = $state(false);

	$effect(() => {
		score = initialScore;
	});

	$effect(() => {
		userVote = initialUserVote;
	});

	async function handleVote(type: 'up' | 'down') {
		if (pending) return;

		const previousScore = score;
		const previousVote = userVote;

		if (userVote === type) {
			userVote = null;
			score += type === 'up' ? -1 : 1;
		} else if (userVote != null) {
			userVote = type;
			score += type === 'up' ? 2 : -2;
		} else {
			userVote = type;
			score += type === 'up' ? 1 : -1;
		}

		pending = true;
		try {
			const res = await fetch(resolve('/api/directory/vote'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ projectId, type })
			});

			if (!res.ok) throw new Error('Vote failed');

			const data = (await res.json()) as { score: number; userVote: 'up' | 'down' | null };
			score = data.score;
			userVote = data.userVote;
		} catch {
			score = previousScore;
			userVote = previousVote;
		} finally {
			pending = false;
		}
	}
</script>

<div
	class="inline-flex items-center rounded-lg border border-border bg-card shadow-2xs select-none {orientation === 'vertical' ? 'flex-col p-1' : 'flex-row gap-1 px-2 py-1'}"
>
	<button
		type="button"
		class="flex items-center justify-center rounded-md transition hover:bg-muted active:scale-95 {size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'} {userVote === 'up' ? 'bg-primary-500/15 text-link' : 'text-muted-foreground hover:text-foreground'}"
		aria-label="Upvote"
		aria-pressed={userVote === 'up'}
		onclick={() => handleVote('up')}
	>
		<ChevronUp class={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
	</button>

	<span
		class="font-semibold tabular-nums {size === 'sm' ? 'text-xs px-1' : 'text-sm px-1.5'} {score > 0 ? 'text-link' : score < 0 ? 'text-destructive' : 'text-muted-foreground'}"
	>
		{score}
	</span>

	<button
		type="button"
		class="flex items-center justify-center rounded-md transition hover:bg-muted active:scale-95 {size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'} {userVote === 'down' ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground hover:text-foreground'}"
		aria-label="Downvote"
		aria-pressed={userVote === 'down'}
		onclick={() => handleVote('down')}
	>
		<ChevronDown class={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
	</button>
</div>

<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Search } from '@lucide/svelte';

	let {
		value = $bindable(''),
		onchange
	}: {
		value?: string;
		onchange: (q: string) => void;
	} = $props();

	function handleInput(e: Event) {
		const q = (e.currentTarget as HTMLInputElement).value;
		value = q;
		onchange(q);
	}

	function clearSearch() {
		value = '';
		onchange('');
	}
</script>

<div class="relative w-full">
	<Search class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
	<Input
		type="search"
		placeholder="Search projects by name, tags, tech, city…"
		{value}
		oninput={handleInput}
		class="pl-9 pr-14 font-mono text-sm bg-muted/20 border-border/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
	/>
	{#if value}
		<button
			type="button"
			aria-label="Clear search"
			onclick={clearSearch}
			class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
			<span aria-hidden="true" class="text-base leading-none">×</span>
		</button>
	{:else}
		<kbd class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
			/
		</kbd>
	{/if}
</div>

<script lang="ts">
	import { getTheme, toggleTheme } from '$lib/theme.svelte.js';
	import { Sun, Moon } from '@lucide/svelte';
</script>

<button
	type="button"
	aria-label="Toggle theme"
	onclick={toggleTheme}
	class="inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
	{#if getTheme() === 'dark'}
		<Sun class="size-5" />
	{:else}
		<Moon class="size-5" />
	{/if}
</button>

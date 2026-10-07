<script lang="ts">
	import { Menu, X } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import * as m from '$lib/paraglide/messages';
	import { SITE } from '$lib/site';

	let { children } = $props();

	const year = new Date().getFullYear();

	let menuOpen = $state(false);

	const navLinks = [
		{ href: resolve('/directory'), label: 'Directory' },
		{ href: resolve('/directory/analytics'), label: 'Analytics' },
		{ href: resolve('/submit'), label: 'Submit' }
	];
</script>

<div class="flex min-h-screen flex-col">
	<header class="border-b border-border">
		<nav class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
			<a href={resolve('/')} class="text-lg font-semibold" onclick={() => (menuOpen = false)}>
				{SITE.name}
			</a>

			<div class="hidden items-center gap-6 text-sm font-medium sm:flex">
				{#each navLinks as link (link.href)}
					<a href={link.href} class="text-muted-foreground transition-colors hover:text-foreground">
						{link.label}
					</a>
				{/each}
				<ThemeToggle />
			</div>

			<div class="flex items-center gap-2 sm:hidden">
				<ThemeToggle />
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded text-muted-foreground hover:bg-muted"
					aria-label={menuOpen ? m.menu_close() : m.menu_open()}
					aria-expanded={menuOpen}
					aria-controls="mobile-menu"
					onclick={() => (menuOpen = !menuOpen)}
				>
					{#if menuOpen}
						<X class="h-6 w-6" aria-hidden="true" />
					{:else}
						<Menu class="h-6 w-6" aria-hidden="true" />
					{/if}
				</button>
			</div>
		</nav>

		{#if menuOpen}
			<div id="mobile-menu" class="border-t border-border sm:hidden">
				<div class="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-3 text-sm">
					{#each navLinks as link (link.href)}
						<a
							href={link.href}
							class="rounded px-2 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							onclick={() => (menuOpen = false)}
						>
							{link.label}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="border-t border-border">
		<div
			class="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
		>
			<p>{m.footer_copyright({ year: String(year), name: SITE.name })}</p>
			<div class="flex flex-wrap gap-4">
				<a href={resolve('/blog')} class="hover:text-foreground">{m.blog_short()}</a>
				<a href={resolve('/terms')} class="hover:text-foreground">{m.terms_short()}</a>
				<a href={resolve('/privacy')} class="hover:text-foreground">{m.privacy_short()}</a>
				<a href={resolve('/cookies')} class="hover:text-foreground">{m.cookies_short()}</a>
			</div>
		</div>
	</footer>
</div>

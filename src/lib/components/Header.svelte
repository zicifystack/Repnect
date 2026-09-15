<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import ThemeToggle from './ThemeToggle.svelte';
	import { Menu, X } from '@lucide/svelte';

	let mobileOpen = $state(false);

	// Close mobile menu on navigation
	$effect(() => {
		// Track navigation by accessing pathname reactively
		const _path = page.url.pathname;
		mobileOpen = false;
	});

	const navLinks = [
		{ href: '/radar', label: 'Radar' },
		{ href: '/about', label: 'About' }
	];
</script>

<header
	class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm"
>
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
		<!-- Brand -->
		<a href="/" class="flex items-center gap-2 font-bold text-foreground hover:opacity-85 transition-opacity">
			<span class="text-lg tracking-tight">Repnect</span>
			<span class="rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary"
				>BETA</span
			>
		</a>

		<!-- Desktop nav -->
		<nav class="hidden items-center gap-1 md:flex" aria-label="Main navigation">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground
						{page.url.pathname === link.href ? 'bg-muted text-foreground' : ''}"
				>
					{link.label}
				</a>
			{/each}
			<!-- Feedback — hidden on mobile -->
			<a
				href="https://github.com/wbfoss/repnect/issues"
				target="_blank"
				rel="noopener noreferrer"
				class="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
			>
				Feedback
			</a>
		</nav>

		<div class="flex items-center gap-2">
			<ThemeToggle />

			<!-- Auth section -->
			{#if page.data.user}
				<div class="hidden items-center gap-2 md:flex">
					<img
						src={page.data.user.avatar_url}
						alt={page.data.user.login}
						class="size-7 rounded-full"
					/>
					<span class="text-sm font-medium text-foreground">{page.data.user.login}</span>
					<a
						href="/api/auth/logout"
						class="text-sm text-muted-foreground hover:text-foreground"
					>
						Sign out
					</a>
				</div>
			{:else}
				<a href="/api/auth/login" class="hidden md:inline-flex">
					<Button variant="ghost" size="sm">Sign in</Button>
				</a>
			{/if}

			<!-- Submit CTA -->
			<a href="/submit" class="hidden md:inline-flex">
				<Button size="sm">Submit Project</Button>
			</a>

			<!-- Mobile hamburger -->
			<button
				type="button"
				aria-label="Open menu"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
				class="inline-flex items-center justify-center rounded-md p-2 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
			>
				{#if mobileOpen}
					<X class="size-5" />
				{:else}
					<Menu class="size-5" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile dropdown -->
	{#if mobileOpen}
		<div class="border-t border-border bg-background px-4 py-3 md:hidden">
			<nav class="flex flex-col gap-1" aria-label="Mobile navigation">
				{#each navLinks as link (link.href)}
					<a
						href={link.href}
						class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						{link.label}
					</a>
				{/each}
				<a
					href="https://github.com/wbfoss/repnect/issues"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					Feedback
				</a>
				<a
					href="/submit"
					class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					Submit Project
				</a>
				{#if page.data.user}
					<div class="mt-2 flex items-center gap-2 border-t border-border pt-2">
						<img
							src={page.data.user.avatar_url}
							alt={page.data.user.login}
							class="size-7 rounded-full"
						/>
						<span class="text-sm font-medium text-foreground">{page.data.user.login}</span>
						<a
							href="/api/auth/logout"
							class="ml-auto text-sm text-muted-foreground hover:text-foreground"
						>
							Sign out
						</a>
					</div>
				{:else}
					<a
						href="/api/auth/login"
						class="mt-2 rounded-md border border-border px-3 py-2 text-center text-sm font-medium text-foreground"
					>
						Sign in with GitHub
					</a>
				{/if}
			</nav>
		</div>
	{/if}
</header>

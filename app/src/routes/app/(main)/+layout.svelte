<script lang="ts">
	import { Compass, FolderPlus, LayoutDashboard, LogOut, Menu, Settings } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { resetAnalytics } from '$lib/analytics';
	import { authClient } from '$lib/auth-client';
	import Avatar from '$lib/components/Avatar.svelte';
	import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import { connectNotifications, disconnectNotifications } from '$lib/notifications.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	let menuOpen = $state(false);
	let userMenuOpen = $state(false);

	onMount(() => {
		connectNotifications();
		return () => disconnectNotifications();
	});

	const links = [
		{ href: resolve('/app'), label: m.nav_dashboard(), icon: LayoutDashboard, exact: true },
		{ href: resolve('/directory'), label: 'Directory', icon: Compass, exact: false },
		{ href: resolve('/submit'), label: 'Submit Project', icon: FolderPlus, exact: false }
	];

	function isActive(href: string, exact: boolean) {
		return exact ? page.url.pathname === href : page.url.pathname.startsWith(href);
	}

	async function signOut() {
		resetAnalytics();
		await authClient.signOut();
		await goto(resolve('/'), { invalidateAll: true });
	}
</script>

<div class="min-h-dvh bg-muted/50">
	<header class="border-b border-border bg-card">
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
			<div class="flex items-center gap-6">
				<a
					href={resolve('/app')}
					class="font-bold text-foreground tracking-tight flex items-center gap-2"
				>
					<span class="inline-block size-2 rounded-full bg-link"></span>
					<span>Repnect</span>
				</a>
				<nav class="hidden items-center gap-1 md:flex">
					{#each links as link (link.href)}
						<a
							href={link.href}
							aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
							class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {isActive(
								link.href,
								link.exact
							)
								? 'bg-muted text-foreground'
								: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
						>
							<link.icon class="h-4 w-4" />
							{link.label}
						</a>
					{/each}
				</nav>
			</div>

			<div class="flex items-center gap-2">
				<ThemeToggle />
				<NotificationBell />
				<div class="relative">
					<button
						onclick={() => (userMenuOpen = !userMenuOpen)}
						aria-label={m.nav_user_menu()}
						aria-expanded={userMenuOpen}
						class="flex items-center rounded-full ring-offset-2 hover:ring-2 hover:ring-ring focus:ring-2 focus:ring-primary-500 focus:outline-none"
					>
						<Avatar
							name={data.user.name}
							email={data.user.email}
							image={data.user.image}
							size={36}
						/>
					</button>
					{#if userMenuOpen}
						<button
							class="fixed inset-0 z-10 cursor-default"
							tabindex="-1"
							aria-hidden="true"
							onclick={() => (userMenuOpen = false)}
						></button>
						<div
							class="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
						>
							<div class="border-b border-border px-4 py-3">
								<p class="truncate text-sm font-medium text-foreground">{data.user.name}</p>
								<p class="truncate text-xs text-muted-foreground">{data.user.email}</p>
							</div>
							<a
								href={resolve('/app/settings')}
								onclick={() => (userMenuOpen = false)}
								class="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50"
							>
								<Settings class="h-4 w-4" />
								{m.nav_settings()}
							</a>
							<button
								onclick={signOut}
								class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50"
							>
								<LogOut class="h-4 w-4" />
								{m.sign_out()}
							</button>
						</div>
					{/if}
				</div>

				<button
					onclick={() => (menuOpen = !menuOpen)}
					aria-label={m.nav_open_menu()}
					aria-expanded={menuOpen}
					class="rounded-md p-2 text-muted-foreground hover:bg-muted/50 md:hidden"
				>
					<Menu class="h-5 w-5" />
				</button>
			</div>
		</div>

		{#if menuOpen}
			<nav class="border-t border-border px-4 py-2 md:hidden">
				{#each links as link (link.href)}
					<a
						href={link.href}
						onclick={() => (menuOpen = false)}
						aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
						class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium {isActive(
							link.href,
							link.exact
						)
							? 'bg-muted text-foreground'
							: 'text-muted-foreground hover:bg-muted/50'}"
					>
						<link.icon class="h-4 w-4" />
						{link.label}
					</a>
				{/each}
			</nav>
		{/if}
	</header>

	{@render children()}
	<Toasts />
</div>

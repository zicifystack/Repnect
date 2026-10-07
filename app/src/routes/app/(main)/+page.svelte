<script lang="ts">
	import { resolve } from '$app/paths';
	import { Compass, FolderPlus, ArrowRight, Sparkles, Settings } from '@lucide/svelte';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title="Dashboard | Repnect" noindex />

<main class="mx-auto max-w-5xl space-y-8 p-4 sm:p-8">
	<header class="space-y-1.5">
		<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
			Welcome, {data.user.name}
		</h1>
		<p class="text-sm text-muted-foreground">
			Manage your projects, discover ecosystem updates, and customize your account profile.
		</p>
	</header>

	<div class="grid gap-6 sm:grid-cols-3">
		<Card class="border-border bg-card p-5 shadow-xs">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl bg-primary-500/10 text-link"
				>
					<Compass class="size-5" />
				</div>
				<div>
					<CardTitle class="text-base font-semibold">Directory</CardTitle>
					<CardDescription class="text-xs"
						>{data.directoryCount} Nigerian innovations</CardDescription
					>
				</div>
			</div>
			<div class="mt-4">
				<Button
					href={resolve('/directory')}
					variant="outline"
					size="sm"
					class="w-full gap-1.5 text-xs"
				>
					<span>Browse Projects</span>
					<ArrowRight class="size-3.5" />
				</Button>
			</div>
		</Card>

		<Card class="border-border bg-card p-5 shadow-xs">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl bg-primary-500/10 text-link"
				>
					<FolderPlus class="size-5" />
				</div>
				<div>
					<CardTitle class="text-base font-semibold">Submit</CardTitle>
					<CardDescription class="text-xs">Showcase your innovation</CardDescription>
				</div>
			</div>
			<div class="mt-4">
				<Button href={resolve('/submit')} size="sm" class="w-full gap-1.5 text-xs">
					<span>Submit Project</span>
					<ArrowRight class="size-3.5" />
				</Button>
			</div>
		</Card>

		<Card class="border-border bg-card p-5 shadow-xs">
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 items-center justify-center rounded-xl bg-primary-500/10 text-link"
				>
					<Settings class="size-5" />
				</div>
				<div>
					<CardTitle class="text-base font-semibold">Account</CardTitle>
					<CardDescription class="text-xs">Security, sessions, profile</CardDescription>
				</div>
			</div>
			<div class="mt-4">
				<Button
					href={resolve('/app/settings')}
					variant="outline"
					size="sm"
					class="w-full gap-1.5 text-xs"
				>
					<span>Manage Settings</span>
					<ArrowRight class="size-3.5" />
				</Button>
			</div>
		</Card>
	</div>

	<Card class="border-border bg-card p-6 shadow-xs">
		<CardHeader class="p-0 pb-4">
			<div class="flex items-center gap-2 text-link">
				<Sparkles class="size-4" />
				<h2 class="text-sm font-semibold text-foreground">Nigerian Engineering Spotlight</h2>
			</div>
			<CardDescription class="text-xs mt-1">
				Repnect tracks tech projects, GitHub open source repositories, and tools created by
				Nigerians across 36 states and the diaspora.
			</CardDescription>
		</CardHeader>
		<CardContent class="p-0 pt-2 flex flex-wrap gap-3">
			<Button href={resolve('/directory/analytics')} variant="secondary" size="sm" class="text-xs">
				View Ecosystem Analytics
			</Button>
			<Button href={resolve('/directory')} variant="ghost" size="sm" class="text-xs text-link">
				Explore All Projects ↗
			</Button>
		</CardContent>
	</Card>
</main>

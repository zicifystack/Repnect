<script lang="ts">
	import { resolve } from '$app/paths';
	import { Sparkles, Loader2, CheckCircle2, AlertCircle } from '@lucide/svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/Button.svelte';
	import GithubIcon from '$lib/components/icons/GithubIcon.svelte';
	import type { GitHubRepoDetails } from '$lib/server/directory/service';

	let {
		repo = $bindable(''),
		onAutofill
	}: {
		repo?: string;
		onAutofill: (details: GitHubRepoDetails) => void;
	} = $props();

	let loading = $state(false);
	let error = $state('');
	let successMsg = $state('');

	async function fetchDetails() {
		const query = repo.trim();
		if (!query) {
			error = 'Please enter a GitHub repository (e.g. author/repo)';
			return;
		}

		loading = true;
		error = '';
		successMsg = '';

		try {
			const res = await fetch(resolve(`/api/directory/github?repo=${encodeURIComponent(query)}`));
			const data = (await res.json().catch(() => ({}))) as {
				ok?: boolean;
				details?: GitHubRepoDetails;
				message?: string;
			};

			if (!res.ok || !data.ok || !data.details) {
				throw new Error(data.message || 'Repository not found or private');
			}

			repo = data.details.fullName;
			lastFetchedRepo = data.details.fullName;
			successMsg = `Loaded details for ${data.details.fullName} (★ ${data.details.stars} stars)`;
			onAutofill(data.details);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to fetch repository details';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			fetchDetails();
		}
	}
</script>

<Card class="border-primary-500/30 bg-primary-500/5 shadow-xs">
	<CardHeader class="pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="flex size-7 items-center justify-center rounded-lg bg-primary-500/15 text-link">
					<Sparkles class="size-4" />
				</div>
				<div>
					<CardTitle class="text-sm font-semibold text-foreground">
						Auto-fill from GitHub Repository
					</CardTitle>
					<CardDescription class="text-xs">
						Paste a repo URL or author/repo to automatically populate fields.
					</CardDescription>
				</div>
			</div>
			<Badge
				variant="outline"
				class="text-xs border-primary-500/30 text-link hidden sm:inline-flex"
			>
				Recommended
			</Badge>
		</div>
	</CardHeader>

	<CardContent class="space-y-3 pt-0">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
			<div class="relative flex-1">
				<GithubIcon
					class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
				/>
				<input
					type="text"
					placeholder="e.g. Flutterwave/Node-v3 or https://github.com/..."
					class="w-full rounded-lg border border-input bg-background py-2 pr-4 pl-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
					bind:value={repo}
					onkeydown={handleKeydown}
				/>
			</div>

			<Button
				type="button"
				variant="default"
				size="sm"
				class="shrink-0 gap-1.5"
				disabled={loading || !repo.trim()}
				onclick={fetchDetails}
			>
				{#if loading}
					<Loader2 class="size-3.5 animate-spin" />
					<span>Fetching...</span>
				{:else}
					<Sparkles class="size-3.5" />
					<span>Auto-fill</span>
				{/if}
			</Button>
		</div>

		{#if successMsg}
			<div class="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
				<CheckCircle2 class="size-3.5 shrink-0" />
				<span>{successMsg}</span>
			</div>
		{/if}

		{#if error}
			<div
				class="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
			>
				<AlertCircle class="size-3.5 shrink-0" />
				<span>{error}</span>
			</div>
		{/if}
	</CardContent>
</Card>

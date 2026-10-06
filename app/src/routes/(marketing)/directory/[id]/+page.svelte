<script lang="ts">
	import {
		ArrowLeft,
		CheckCircle2,
		ExternalLink,
		Github,
		Globe,
		MapPin,
		Share2,
		Copy,
		Check,
		FileCode,
		Sparkles,
		Eye,
		MousePointerClick,
		Calendar,
		GitPullRequest
	} from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/seo/Seo.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import VoteButton from '$lib/components/directory/VoteButton.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const item = $derived(data.item);

	let copied = $state(false);
	let linkCopied = $state(false);

	const formattedDate = $derived(
		new Date(item.updated_at).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);

	const yamlString = $derived(`id: ${item.id}
name: "${item.name}"
description: "${item.description.replace(/"/g, '\\"')}"
website_url: ${item.website_url}
${item.github_repo ? `github_repo: ${item.github_repo}` : ''}
category: ${item.category}
tags: [${item.tags.map((t) => `"${t}"`).join(', ')}]
location_city: "${item.location_city}"
location_state: "${item.location_state}"
nigeria_connection: ${item.nigeria_connection}
nigeria_connection_details: "${item.nigeria_connection_details.replace(/"/g, '\\"')}"
stars: ${item.stars}
good_first_issues: ${item.good_first_issues}
verified: ${item.verified}
updated_at: ${item.updated_at}`);

	function copyYaml() {
		navigator.clipboard.writeText(yamlString);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function copyShareLink() {
		if (typeof window !== 'undefined') {
			navigator.clipboard.writeText(window.location.href);
			linkCopied = true;
			setTimeout(() => (linkCopied = false), 2000);
		}
	}

	function trackClick(destination: 'website' | 'github') {
		if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
			navigator.sendBeacon(
				resolve('/api/directory/track'),
				JSON.stringify({ type: 'click', projectId: item.id, destination })
			);
		}
	}
</script>

<Seo title={`${item.name} | Nigeria Tech Directory`} description={item.description} />

<div class="min-h-screen bg-muted/20 pb-20">
	<header class="border-b border-border bg-background/80 backdrop-blur">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<Button href={resolve('/directory')} variant="ghost" size="sm" class="gap-1.5 text-muted-foreground hover:text-foreground">
				<ArrowLeft class="size-4" />
				Back to Directory
			</Button>

			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" onclick={copyShareLink} class="gap-1.5">
					{#if linkCopied}
						<Check class="size-3.5 text-success" />
						Copied
					{:else}
						<Share2 class="size-3.5" />
						Share
					{/if}
				</Button>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-6 pt-8">
		<div class="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
			<div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
				<div class="flex items-start gap-5">
					<Avatar.Root class="size-20 rounded-2xl border border-border shadow-xs sm:size-24">
						{#if item.logo_url}
							<Avatar.Image src={item.logo_url} alt={item.name} class="p-1 object-contain" />
						{/if}
						<Avatar.Fallback class="rounded-2xl bg-primary-500/10 text-xl font-bold text-link">
							{item.name.slice(0, 2).toUpperCase()}
						</Avatar.Fallback>
					</Avatar.Root>

					<div class="space-y-1.5">
						<div class="flex flex-wrap items-center gap-2.5">
							<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{item.name}</h1>
							{#if item.verified}
								<Badge class="bg-success/10 text-success">
									<CheckCircle2 class="size-3" />
									Verified
								</Badge>
							{/if}
							<Badge variant="secondary">{item.category}</Badge>
						</div>

						<p class="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
							<MapPin class="size-3.5 text-link" />
							<span>{item.location_city}, {item.location_state} State, Nigeria</span>
							<span class="text-border">•</span>
							<span class="capitalize">{item.nigeria_connection.replace(/_/g, ' ')}</span>
						</p>

						{#if data.metrics}
							<div class="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
								<span class="inline-flex items-center gap-1">
									<Eye class="size-3.5" />
									{data.metrics.views} views
								</span>
								<span class="inline-flex items-center gap-1">
									<MousePointerClick class="size-3.5" />
									{data.metrics.clicks} clicks
								</span>
								<span class="inline-flex items-center gap-1">
									<Calendar class="size-3.5" />
									Synced {formattedDate}
								</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
					<VoteButton
						projectId={item.id}
						initialScore={data.voteStats?.score ?? 0}
						initialUserVote={data.voteStats?.userVote ?? null}
						orientation="horizontal"
						size="md"
					/>

					<div class="flex items-center gap-2">
						{#if item.github_repo}
							<Button
								href={`https://github.com/${item.github_repo}`}
								variant="outline"
								size="sm"
								target="_blank"
								rel="noreferrer"
								class="gap-1.5"
								onclick={() => trackClick('github')}
							>
								<Github class="size-4" />
								<span>★ {item.stars}</span>
							</Button>
						{/if}
						<Button
							href={item.website_url}
							size="sm"
							target="_blank"
							rel="noreferrer"
							class="gap-1.5"
							onclick={() => trackClick('website')}
						>
							<Globe class="size-4" />
							<span>Visit</span>
							<ExternalLink class="size-3" />
						</Button>
					</div>
				</div>
			</div>

			{#if item.tags.length > 0}
				<div class="mt-6 flex flex-wrap gap-1.5 border-t border-border pt-5">
					{#each item.tags as tag (tag)}
						<Badge variant="outline" class="text-xs">#{tag}</Badge>
					{/each}
				</div>
			{/if}
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				<div class="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
					<h2 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Project Overview</h2>
					<p class="mt-4 text-base leading-relaxed text-foreground">{item.description}</p>
				</div>

				<div class="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
					<div class="flex items-center gap-2">
						<div class="inline-flex size-7 items-center justify-center rounded-lg bg-primary-500/15 text-link">
							<Sparkles class="size-4" />
						</div>
						<h2 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Nigerian Connection</h2>
					</div>

					<div class="mt-4 rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 sm:p-5">
						<p class="font-medium text-foreground">
							{item.nigeria_connection_details || item.nigeria_connection}
						</p>
					</div>
				</div>

				{#if item.github_repo}
					<div class="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Github class="size-4 text-muted-foreground" />
								<h2 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">GitHub Repository</h2>
							</div>
							<a
								href={`https://github.com/${item.github_repo}`}
								target="_blank"
								rel="noreferrer"
								class="text-xs font-medium text-link hover:underline"
							>
								{item.github_repo} ↗
							</a>
						</div>

						<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
							<div class="rounded-xl border border-border bg-muted/40 p-4">
								<p class="text-xs text-muted-foreground">GitHub Stars</p>
								<p class="mt-1 text-2xl font-bold tracking-tight text-foreground">{item.stars}</p>
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-4">
								<p class="text-xs text-muted-foreground">Good First Issues</p>
								<p class="mt-1 text-2xl font-bold tracking-tight text-link">{item.good_first_issues}</p>
							</div>
							<div class="col-span-2 rounded-xl border border-border bg-muted/40 p-4 sm:col-span-1">
								<p class="text-xs text-muted-foreground">Repository Status</p>
								<p class="mt-1 flex items-center gap-1.5 text-sm font-semibold text-success">
									<CheckCircle2 class="size-4" /> Active
								</p>
							</div>
						</div>

						{#if item.good_first_issues > 0}
							<div class="mt-5 flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
								<div class="flex items-center gap-2">
									<GitPullRequest class="size-4 text-link" />
									<span class="text-xs font-medium text-foreground">Want to contribute to this project?</span>
								</div>
								<Button
									href={`https://github.com/${item.github_repo}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`}
									size="xs"
									variant="outline"
									target="_blank"
									rel="noreferrer"
								>
									View {item.good_first_issues} Issues ↗
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="space-y-6">
				<div class="rounded-2xl border border-border bg-card p-6 shadow-xs">
					<h3 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Project Metadata</h3>
					<div class="mt-4 divide-y divide-border text-sm">
						<div class="flex items-center justify-between py-2.5">
							<span class="text-muted-foreground">Category</span>
							<span class="font-medium text-foreground capitalize">{item.category}</span>
						</div>
						<div class="flex items-center justify-between py-2.5">
							<span class="text-muted-foreground">City</span>
							<span class="font-medium text-foreground">{item.location_city}</span>
						</div>
						<div class="flex items-center justify-between py-2.5">
							<span class="text-muted-foreground">State</span>
							<span class="font-medium text-foreground">{item.location_state}</span>
						</div>
						<div class="flex items-center justify-between py-2.5">
							<span class="text-muted-foreground">Verification</span>
							<span class="font-medium {item.verified ? 'text-success' : 'text-muted-foreground'}">
								{item.verified ? 'Verified' : 'Community'}
							</span>
						</div>
						<div class="flex items-center justify-between py-2.5">
							<span class="text-muted-foreground">Last Synced</span>
							<span class="font-medium text-foreground">{formattedDate}</span>
						</div>
					</div>
				</div>

				<div class="rounded-2xl border border-border bg-card p-6 shadow-xs">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5">
							<FileCode class="size-4 text-muted-foreground" />
							<h3 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">GitOps YAML</h3>
						</div>
						<Button variant="ghost" size="xs" onclick={copyYaml} class="gap-1">
							{#if copied}
								<Check class="size-3 text-success" />
								<span>Copied</span>
							{:else}
								<Copy class="size-3" />
								<span>Copy</span>
							{/if}
						</Button>
					</div>
					<p class="mt-2 text-xs text-muted-foreground">
						This record is managed via GitOps in <code class="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">data/projects/{item.id}.yaml</code>.
					</p>
					<pre class="mt-4 max-h-64 overflow-x-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground select-all">{yamlString}</pre>
				</div>
			</div>
		</div>
	</main>
</div>

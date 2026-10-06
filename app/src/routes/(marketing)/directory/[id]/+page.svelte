<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import VoteButton from '$lib/components/directory/VoteButton.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const item = $derived(data.item);

	let copied = $state(false);

	const yamlString = $derived(`id: ${item.id}
name: "${item.name}"
description: "${item.description.replace(/"/g, '\\"')}"
website_url: ${item.website_url}
${item.github_repo ? `github_repo: ${item.github_repo}` : ''}
category: ${item.category}
tags: [${item.tags.map((t) => `"${t}"`).join(', ')}]

# Location
location_city: "${item.location_city}"
location_state: "${item.location_state}"

# Nigeria connection
nigeria_connection: ${item.nigeria_connection}
nigeria_connection_details: "${item.nigeria_connection_details.replace(/"/g, '\\"')}"

# Auto-updated fields
stars: ${item.stars}
good_first_issues: ${item.good_first_issues}
verified: ${item.verified}
updated_at: ${item.updated_at}`);

	function copyYaml() {
		navigator.clipboard.writeText(yamlString);
		copied = true;
		setTimeout(() => (copied = false), 2000);
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

<article class="mx-auto max-w-4xl px-6 py-12">
	<div class="mb-6">
		<a href={resolve('/directory')} class="text-sm font-medium text-link hover:underline">
			← Back to Directory
		</a>
	</div>

	<div class="rounded-xl border border-border bg-card p-6 shadow-xs sm:p-8">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-4">
				{#if item.logo_url}
					<img
						src={item.logo_url}
						alt={`${item.name} logo`}
						class="h-14 w-14 rounded-xl border border-border bg-background p-1.5 object-contain shadow-xs"
					/>
				{/if}
				<div>
					<div class="flex items-center gap-3">
						<h1 class="text-3xl font-bold tracking-tight text-foreground">{item.name}</h1>
						{#if item.verified}
							<span class="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
								Verified
							</span>
						{/if}
					</div>
					<div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
						<span class="font-medium text-link">{item.category}</span>
						<span>•</span>
						<span>{item.location_city}, {item.location_state}, Nigeria</span>
						{#if data.metrics}
							<span>•</span>
							<span>👁 {data.metrics.views}</span>
							<span>•</span>
							<span>↗ {data.metrics.clicks} clicks</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<VoteButton
					projectId={item.id}
					initialScore={data.voteStats?.score ?? 0}
					initialUserVote={data.voteStats?.userVote ?? null}
					orientation="horizontal"
					size="md"
				/>
				{#if item.github_repo}
					<Button
						href={`https://github.com/${item.github_repo}`}
						variant="outline"
						target="_blank"
						rel="noreferrer"
						onclick={() => trackClick('github')}
					>
						GitHub ★ {item.stars}
					</Button>
				{/if}
				<Button
					href={item.website_url}
					variant="default"
					target="_blank"
					rel="noreferrer"
					onclick={() => trackClick('website')}
				>
					Visit Website ↗
				</Button>
			</div>
		</div>

		<div class="mt-6 border-t border-border pt-6">
			<h2 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">About</h2>
			<p class="mt-2 text-base leading-relaxed text-foreground">{item.description}</p>
		</div>

		<div class="mt-8 grid gap-4 rounded-lg border border-border bg-muted/30 p-5 sm:grid-cols-2">
			<div>
				<h3 class="text-xs font-semibold text-muted-foreground uppercase">Location</h3>
				<p class="mt-1 text-sm font-medium text-foreground">
					{item.location_city}, {item.location_state} State, Nigeria
				</p>
			</div>

			<div>
				<h3 class="text-xs font-semibold text-muted-foreground uppercase">Connection Type</h3>
				<p class="mt-1 text-sm font-medium text-foreground capitalize">
					{item.nigeria_connection.replace(/_/g, ' ')}
				</p>
			</div>

			<div class="sm:col-span-2">
				<h3 class="text-xs font-semibold text-muted-foreground uppercase">Connection Details</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					{item.nigeria_connection_details}
				</p>
			</div>
		</div>

		{#if item.tags.length > 0}
			<div class="mt-6 flex flex-wrap gap-2">
				{#each item.tags as tag}
					<span class="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
						#{tag}
					</span>
				{/each}
			</div>
		{/if}

		<div class="mt-10 border-t border-border pt-6">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-semibold text-muted-foreground">Directory YAML Source</h3>
				<Button variant="ghost" size="sm" onclick={copyYaml}>
					{copied ? 'Copied!' : 'Copy YAML'}
				</Button>
			</div>
			<pre class="mt-3 overflow-x-auto rounded-lg border border-border bg-muted/60 p-4 font-mono text-xs text-foreground">{yamlString}</pre>
		</div>
	</div>
</article>

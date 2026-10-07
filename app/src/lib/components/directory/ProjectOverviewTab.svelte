<script lang="ts">
	import { resolve } from '$app/paths';
	import { Sparkles, MapPin, Tag, GitPullRequest, ExternalLink, Code2 } from '@lucide/svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/Button.svelte';
	import type { DirectoryItem } from '$lib/server/directory/validation';

	let { item }: { item: DirectoryItem } = $props();
</script>

<div class="space-y-6">
	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-base font-bold text-foreground">
				About {item.name}
			</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-sm sm:text-base leading-relaxed text-foreground/90 whitespace-pre-line">
				{item.description}
			</p>
		</CardContent>
	</Card>

	<Card class="border-primary-500/20 bg-primary-500/5 shadow-xs">
		<CardHeader class="pb-3">
			<div class="flex items-center gap-2">
				<div class="flex size-7 items-center justify-center rounded-lg bg-primary-500/15 text-link">
					<Sparkles class="size-4" />
				</div>
				<CardTitle class="text-base font-bold text-foreground">
					Nigerian Roots & Connection
				</CardTitle>
			</div>
		</CardHeader>
		<CardContent class="space-y-3">
			<div class="rounded-xl border border-primary-500/20 bg-card p-4">
				<div
					class="flex items-center gap-2 text-xs font-semibold text-link uppercase tracking-wider"
				>
					<MapPin class="size-3.5" />
					<span>Hub: {item.location_city}, {item.location_state} State</span>
				</div>
				<p class="mt-2 text-sm leading-relaxed text-foreground">
					{item.nigeria_connection_details ||
						`Connected to Nigeria via ${item.nigeria_connection.replace(/_/g, ' ')}.`}
				</p>
			</div>
		</CardContent>
	</Card>

	{#if item.tags && item.tags.length > 0}
		<Card class="border-border bg-card shadow-xs">
			<CardHeader class="pb-3">
				<div class="flex items-center gap-2">
					<Tag class="size-4 text-link" />
					<CardTitle class="text-base font-bold text-foreground">
						Tech Stack & Ecosystem Tags
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<p class="text-xs text-muted-foreground mb-3">
					Click any tag to search for other Nigerian projects built with similar technologies.
				</p>
				<div class="flex flex-wrap gap-2">
					{#each item.tags as tag (tag)}
						<a href={resolve(`/directory?q=${encodeURIComponent(tag)}`)}>
							<Badge
								variant="secondary"
								class="px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary-500/10 hover:text-link"
							>
								#{tag}
							</Badge>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	{#if item.github_repo && item.good_first_issues > 0}
		<Card class="border-success/30 bg-success/5 shadow-xs">
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<GitPullRequest class="size-4 text-success" />
						<CardTitle class="text-sm font-bold text-foreground">
							Good First Issues Available
						</CardTitle>
					</div>
					<Badge
						variant="secondary"
						class="bg-success/15 text-success font-semibold text-xs border-transparent"
					>
						{item.good_first_issues} Starter Tasks
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<p class="text-xs text-muted-foreground">
					This project is actively welcoming contributors! Beginner-friendly tasks are tagged and
					waiting for developers.
				</p>
				<div class="mt-3">
					<Button
						href={`https://github.com/${item.github_repo}/issues?q=is%3Aissue+is%3Aopen+label%3A"good+first+issue"`}
						target="_blank"
						rel="noreferrer"
						variant="outline"
						size="sm"
						class="text-xs gap-1.5 border-success/30 text-success hover:bg-success/10"
					>
						<span>Browse Starter Issues on GitHub</span>
						<ExternalLink class="size-3" />
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

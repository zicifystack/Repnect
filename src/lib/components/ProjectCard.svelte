<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import type { SearchIndexItem } from '$lib/schema.js';
	import { Star, MapPin, ShieldCheck, Users } from '@lucide/svelte';

	let { project }: { project: SearchIndexItem } = $props();

	// Build GitHub owner/repo from slug for OG image fallback
	function githubOgUrl(repoUrl?: string): string | null {
		if (!repoUrl) return null;
		const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
		return match ? `https://opengraph.githubassets.com/1/${match[1]}` : null;
	}

	// Determine logo source
	const logoSrc = $derived.by(() => {
		// We don't have logo on SearchIndexItem, so use OG preview
		return null;
	});

	const MAX_VISIBLE_TAGS = 3;
	const visibleTags = $derived(project.tags.slice(0, MAX_VISIBLE_TAGS));
	const extraTagCount = $derived(Math.max(0, project.tags.length - MAX_VISIBLE_TAGS));

	// Format star count
	function formatStars(n: number): string {
		if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
		return String(n);
	}
</script>

<a href="/projects/{project.slug}" class="group block h-full focus-visible:outline-none">
	<Card
		class="flex h-full flex-col overflow-hidden border-border/70 bg-card/70 backdrop-blur-xs transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/5 group-focus-visible:ring-2 group-focus-visible:ring-ring"
	>
		<CardContent class="flex grow flex-col gap-3 p-4">
			<!-- Header: name + badges -->
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0">
					<h3 class="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
						{project.name}
					</h3>
					<div class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
						<MapPin class="size-3 shrink-0 text-muted-foreground/70" />
						<span class="truncate font-mono text-[11px]">{project.location_city}</span>
					</div>
				</div>
				<div class="flex shrink-0 flex-col items-end gap-1">
					{#if project.verified}
						<Badge variant="secondary" class="gap-1 px-1.5 py-0.5 text-[11px] font-mono border border-border/40">
							<ShieldCheck class="size-3 text-primary" />
							Verified
						</Badge>
					{/if}
					{#if project.stars > 0}
						<span class="flex items-center gap-1 font-mono text-xs text-muted-foreground">
							<Star class="size-3 fill-amber-400/80 text-amber-400" />
							{formatStars(project.stars)}
						</span>
					{/if}
				</div>
			</div>

			<!-- Description -->
			<p class="line-clamp-2 grow text-sm text-muted-foreground">
				{project.short_desc}
			</p>

			<!-- Footer: language + tags + contributor badge -->
			<div class="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
				<Badge variant="outline" class="border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary rounded-md">
					{project.primary_lang}
				</Badge>
				{#each visibleTags as tag (tag)}
					<Badge variant="secondary" class="border border-border/40 px-1.5 py-0.5 font-mono text-[11px] rounded-md">
						{tag}
					</Badge>
				{/each}
				{#if extraTagCount > 0}
					<span class="font-mono text-[11px] text-muted-foreground">+{extraTagCount}</span>
				{/if}
				{#if project.looking_for_contributors}
					<Badge
						variant="outline"
						class="ml-auto shrink-0 gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 rounded-md"
					>
						<span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
						Hiring
					</Badge>
				{/if}
			</div>
		</CardContent>
	</Card>
</a>

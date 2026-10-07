<script lang="ts">
	import { resolve } from '$app/paths';
	import { CheckCircle2, ExternalLink, Globe, MapPin } from '@lucide/svelte';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import GithubIcon from '$lib/components/icons/GithubIcon.svelte';
	import VoteButton from '$lib/components/directory/VoteButton.svelte';
	import type { DirectoryItem } from '$lib/server/directory/validation';

	let {
		item,
		onTrackClick
	}: {
		item: DirectoryItem & { voteScore?: number; userVote?: 'up' | 'down' | null };
		onTrackClick?: (projectId: string, destination: 'website' | 'github') => void;
	} = $props();
</script>

<Card
	class="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border-border bg-card p-4 shadow-xs transition-all duration-200 hover:border-primary-500/40 hover:bg-muted/30"
>
	<div class="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
		{#if item.logo_url}
			<img
				src={item.logo_url}
				alt={`${item.name} logo`}
				class="size-11 shrink-0 rounded-xl border border-border bg-background p-1 object-contain"
			/>
		{:else}
			<div
				class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-base font-bold text-link"
			>
				{item.name.slice(0, 2).toUpperCase()}
			</div>
		{/if}

		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<a
					href={resolve(`/directory/${item.id}`)}
					class="font-semibold text-foreground hover:text-link hover:underline truncate"
				>
					{item.name}
				</a>
				{#if item.verified}
					<span title="Verified" class="text-success inline-flex shrink-0">
						<CheckCircle2 class="size-3.5" />
					</span>
				{/if}
				<Badge variant="secondary" class="text-[11px] font-medium capitalize py-0">
					{item.category}
				</Badge>
				{#if item.primary_language}
					<Badge variant="outline" class="text-[11px] font-medium py-0">
						{item.primary_language}
					</Badge>
				{/if}
			</div>

			<p class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
				{item.description}
			</p>

			<div class="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
				<span class="inline-flex items-center gap-1">
					<MapPin class="size-3 text-link" />
					{item.location_city}, {item.location_state}
				</span>
				<span>•</span>
				<span>{item.nigeria_connection.replace(/_/g, ' ')}</span>
			</div>
		</div>
	</div>

	<div
		class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0"
	>
		<VoteButton
			projectId={item.id}
			initialScore={item.voteScore ?? 0}
			initialUserVote={item.userVote ?? null}
			orientation="horizontal"
			size="sm"
		/>

		<div class="flex items-center gap-1.5">
			{#if item.github_repo}
				<a
					href={`https://github.com/${item.github_repo}`}
					target="_blank"
					rel="noreferrer"
					onclick={() => onTrackClick?.(item.id, 'github')}
					class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<GithubIcon class="size-3.5" />
					<span>{item.stars}</span>
				</a>
			{/if}

			<a
				href={item.website_url}
				target="_blank"
				rel="noreferrer"
				onclick={() => onTrackClick?.(item.id, 'website')}
				class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-link hover:bg-muted"
			>
				<Globe class="size-3.5" />
				<span>Visit</span>
				<ExternalLink class="size-3" />
			</a>
		</div>
	</div>
</Card>

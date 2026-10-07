<script lang="ts">
	import { resolve } from '$app/paths';
	import { CheckCircle2, ExternalLink, Globe, MapPin, Sparkles } from '@lucide/svelte';
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
	class="group relative flex flex-col justify-between rounded-2xl border-border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/40 hover:shadow-md"
>
	<div>
		<div class="flex items-start justify-between gap-3">
			<div class="flex items-center gap-3 min-w-0">
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

				<div class="min-w-0">
					<div class="flex items-center gap-1.5">
						<a
							href={resolve(`/directory/${item.id}`)}
							class="font-semibold text-foreground hover:text-link hover:underline truncate"
						>
							{item.name}
						</a>
						{#if item.verified}
							<span title="Verified Project" class="inline-flex text-success shrink-0">
								<CheckCircle2 class="size-4" />
							</span>
						{/if}
					</div>

					<p class="flex items-center gap-1 text-xs text-muted-foreground truncate">
						<MapPin class="size-3 text-link shrink-0" />
						<span>{item.location_city}, {item.location_state}</span>
					</p>
				</div>
			</div>

			<VoteButton
				projectId={item.id}
				initialScore={item.voteScore ?? 0}
				initialUserVote={item.userVote ?? null}
				orientation="vertical"
				size="sm"
			/>
		</div>

		<p class="mt-3.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
			{item.description}
		</p>

		{#if item.nigeria_connection_details}
			<div
				class="mt-3 flex items-start gap-1.5 rounded-lg bg-primary-500/5 px-2.5 py-1.5 text-xs text-muted-foreground"
			>
				<Sparkles class="size-3.5 shrink-0 text-link mt-0.5" />
				<span class="line-clamp-1">{item.nigeria_connection_details}</span>
			</div>
		{/if}

		{#if item.tags && item.tags.length > 0}
			<div class="mt-3 flex flex-wrap gap-1">
				{#each item.tags.slice(0, 3) as tag (tag)}
					<Badge variant="outline" class="text-[11px] font-medium py-0">
						#{tag}
					</Badge>
				{/each}
				{#if item.tags.length > 3}
					<Badge variant="secondary" class="text-[11px] py-0">
						+{item.tags.length - 3}
					</Badge>
				{/if}
			</div>
		{/if}
	</div>

	<div class="mt-5 flex items-center justify-between border-t border-border pt-3.5 text-xs">
		<div class="flex items-center gap-1.5 flex-wrap">
			<Badge variant="secondary" class="capitalize font-medium">
				{item.category}
			</Badge>
			{#if item.primary_language}
				<Badge variant="outline" class="font-medium text-[11px] py-0">
					{item.primary_language}
				</Badge>
			{/if}
		</div>

		<div class="flex items-center gap-1.5">
			{#if item.github_repo}
				<a
					href={`https://github.com/${item.github_repo}`}
					target="_blank"
					rel="noreferrer"
					onclick={() => onTrackClick?.(item.id, 'github')}
					class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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
				class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-link hover:bg-muted"
			>
				<Globe class="size-3.5" />
				<span>Visit</span>
				<ExternalLink class="size-3" />
			</a>
		</div>
	</div>
</Card>

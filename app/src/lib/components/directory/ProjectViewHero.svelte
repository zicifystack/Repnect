<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		CheckCircle2,
		ExternalLink,
		Globe,
		MapPin,
		Share2,
		Sparkles,
		Eye,
		MousePointerClick,
		Calendar,
		ArrowLeft,
		Star,
		GitPullRequest
	} from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import GithubIcon from '$lib/components/icons/GithubIcon.svelte';
	import VoteButton from '$lib/components/directory/VoteButton.svelte';
	import type { DirectoryItem } from '$lib/server/directory/validation';

	let {
		item,
		formattedDate,
		metrics,
		voteStats,
		onTrackClick,
		onOpenShare
	}: {
		item: DirectoryItem;
		formattedDate: string;
		metrics?: { views: number; clicks: number } | null;
		voteStats?: { score: number; userVote?: 'up' | 'down' | null } | null;
		onTrackClick?: (destination: 'website' | 'github') => void;
		onOpenShare: () => void;
	} = $props();
</script>

<div
	class="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary-500/5 via-card/50 to-background pb-10 pt-6"
>
	<div class="mx-auto max-w-6xl px-6">
		<div class="mb-6 flex items-center justify-between">
			<a
				href={resolve('/directory')}
				class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="size-3.5" />
				<span>Back to Directory</span>
			</a>

			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" onclick={onOpenShare} class="h-8 gap-1.5 text-xs">
					<Share2 class="size-3.5" />
					<span>Share</span>
				</Button>

				<Button
					href={item.website_url}
					target="_blank"
					rel="noreferrer"
					size="sm"
					class="h-8 gap-1.5 text-xs"
					onclick={() => onTrackClick?.('website')}
				>
					<Globe class="size-3.5" />
					<span>Visit Website</span>
					<ExternalLink class="size-3" />
				</Button>
			</div>
		</div>

		<div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
			<div class="flex flex-col sm:flex-row sm:items-start gap-5">
				<div
					class="flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-card p-2 shadow-md"
				>
					{#if item.logo_url}
						<img
							src={item.logo_url}
							alt={`${item.name} logo`}
							class="size-full rounded-xl object-contain"
						/>
					{:else}
						<div
							class="flex size-full items-center justify-center rounded-xl bg-primary-500/10 text-2xl font-bold text-link"
						>
							{item.name.slice(0, 2).toUpperCase()}
						</div>
					{/if}
				</div>

				<div class="space-y-2.5">
					<div class="flex flex-wrap items-center gap-2.5">
						<h1 class="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
							{item.name}
						</h1>

						{#if item.verified}
							<Badge
								variant="secondary"
								class="gap-1 bg-success/10 text-success border-transparent font-medium"
							>
								<CheckCircle2 class="size-3.5" />
								<span>Verified</span>
							</Badge>
						{/if}

						<a href={resolve(`/directory?category=${item.category}`)}>
							<Badge
								variant="outline"
								class="capitalize transition-colors hover:border-link hover:text-link"
							>
								{item.category}
							</Badge>
						</a>
					</div>

					<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
						{item.description}
					</p>

					<div class="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
						<span class="inline-flex items-center gap-1">
							<MapPin class="size-3.5 text-link" />
							<span>{item.location_city}, {item.location_state} State</span>
						</span>
						<span class="text-border">•</span>
						<span class="inline-flex items-center gap-1 capitalize">
							<Sparkles class="size-3 text-link" />
							<span>{item.nigeria_connection.replace(/_/g, ' ')}</span>
						</span>
						<span class="text-border">•</span>
						<span class="inline-flex items-center gap-1">
							<Calendar class="size-3" />
							<span>Updated {formattedDate}</span>
						</span>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
				<VoteButton
					projectId={item.id}
					initialScore={voteStats?.score ?? 0}
					initialUserVote={voteStats?.userVote ?? null}
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
							class="gap-1.5 h-9"
							onclick={() => onTrackClick?.('github')}
						>
							<GithubIcon class="size-4" />
							<span>★ {item.stars}</span>
						</Button>
					{/if}

					<Button
						href={item.website_url}
						target="_blank"
						rel="noreferrer"
						size="sm"
						class="gap-1.5 h-9"
						onclick={() => onTrackClick?.('website')}
					>
						<span>Visit</span>
						<ExternalLink class="size-3.5" />
					</Button>
				</div>
			</div>
		</div>

		<div
			class="mt-8 flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card/80 p-4 text-xs text-muted-foreground backdrop-blur-xs"
		>
			<div class="flex items-center gap-1.5">
				<Eye class="size-4 text-link" />
				<span class="font-semibold text-foreground tabular-nums">{metrics?.views ?? 0}</span>
				<span>views</span>
			</div>
			<div class="flex items-center gap-1.5">
				<MousePointerClick class="size-4 text-link" />
				<span class="font-semibold text-foreground tabular-nums">{metrics?.clicks ?? 0}</span>
				<span>clicks</span>
			</div>
			{#if item.github_repo}
				<div class="flex items-center gap-1.5">
					<Star class="size-4 text-warning fill-warning" />
					<span class="font-semibold text-foreground tabular-nums">{item.stars}</span>
					<span>GitHub stars</span>
				</div>
			{/if}
			{#if item.good_first_issues > 0}
				<div class="flex items-center gap-1.5">
					<GitPullRequest class="size-4 text-success" />
					<span class="font-semibold text-foreground tabular-nums">{item.good_first_issues}</span>
					<span>open issues</span>
				</div>
			{/if}
			<div class="ml-auto flex items-center gap-1.5">
				<span
					class="inline-block size-2 rounded-full {item.verified
						? 'bg-success'
						: 'bg-muted-foreground'}"
				></span>
				<span class="font-medium text-foreground"
					>{item.verified ? 'Verified Repnect Listing' : 'Community Submitted'}</span
				>
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { Globe, ExternalLink, CheckCircle2, Copy, Check, Code, Share2 } from '@lucide/svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/Button.svelte';
	import GithubIcon from '$lib/components/icons/GithubIcon.svelte';
	import type { DirectoryItem } from '$lib/server/directory/validation';

	let {
		item,
		formattedDate,
		onTrackClick,
		onOpenShare
	}: {
		item: DirectoryItem;
		formattedDate: string;
		onTrackClick?: (destination: 'website' | 'github') => void;
		onOpenShare: () => void;
	} = $props();

	let badgeCopied = $state(false);

	const markdownBadge = $derived(
		`[![Featured on Repnect](https://repnect.dev/badge.svg)](${typeof window !== 'undefined' ? window.location.href : 'https://repnect.dev'})`
	);

	function copyBadgeCode() {
		if (typeof window !== 'undefined') {
			navigator.clipboard.writeText(markdownBadge);
			badgeCopied = true;
			setTimeout(() => (badgeCopied = false), 2000);
		}
	}
</script>

<div class="space-y-6">
	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
				Quick Actions
			</CardTitle>
		</CardHeader>
		<CardContent class="space-y-2.5">
			<Button
				href={item.website_url}
				target="_blank"
				rel="noreferrer"
				class="w-full gap-2"
				onclick={() => onTrackClick?.('website')}
			>
				<Globe class="size-4" />
				<span>Visit Website</span>
				<ExternalLink class="size-3.5" />
			</Button>

			{#if item.github_repo}
				<Button
					href={`https://github.com/${item.github_repo}`}
					variant="outline"
					target="_blank"
					rel="noreferrer"
					class="w-full gap-2"
					onclick={() => onTrackClick?.('github')}
				>
					<GithubIcon class="size-4" />
					<span>View on GitHub</span>
					<ExternalLink class="size-3.5" />
				</Button>
			{/if}

			<Button variant="secondary" class="w-full gap-2 text-xs" onclick={onOpenShare}>
				<Share2 class="size-3.5" />
				<span>Share Project</span>
			</Button>
		</CardContent>
	</Card>

	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="pb-2">
			<CardTitle class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
				Project Intel
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="divide-y divide-border text-xs sm:text-sm">
				<div class="flex items-center justify-between py-2.5">
					<span class="text-muted-foreground">Category</span>
					<a href={resolve(`/directory?category=${item.category}`)}>
						<Badge
							variant="outline"
							class="capitalize transition-colors hover:border-link hover:text-link"
						>
							{item.category}
						</Badge>
					</a>
				</div>

				<div class="flex items-center justify-between py-2.5">
					<span class="text-muted-foreground">Location</span>
					<span class="font-medium text-foreground"
						>{item.location_city}, {item.location_state}</span
					>
				</div>

				<div class="flex items-center justify-between py-2.5">
					<span class="text-muted-foreground">Connection</span>
					<span class="font-medium text-foreground capitalize">
						{item.nigeria_connection.replace(/_/g, ' ')}
					</span>
				</div>

				<div class="flex items-center justify-between py-2.5">
					<span class="text-muted-foreground">Verification</span>
					<span
						class="font-medium {item.verified
							? 'text-success'
							: 'text-muted-foreground'} flex items-center gap-1"
					>
						{#if item.verified}
							<CheckCircle2 class="size-3 text-success" />
							<span>Verified</span>
						{:else}
							<span>Community</span>
						{/if}
					</span>
				</div>

				<div class="flex items-center justify-between py-2.5">
					<span class="text-muted-foreground">Last Synced</span>
					<span class="font-medium text-foreground tabular-nums">{formattedDate}</span>
				</div>
			</div>
		</CardContent>
	</Card>

	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="pb-2">
			<div class="flex items-center justify-between">
				<CardTitle class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
					README Badge
				</CardTitle>
				<Button
					variant="ghost"
					size="sm"
					onclick={copyBadgeCode}
					class="h-7 px-2 text-xs text-link gap-1"
				>
					{#if badgeCopied}
						<Check class="size-3 text-success" />
						<span>Copied</span>
					{:else}
						<Copy class="size-3" />
						<span>Copy Markdown</span>
					{/if}
				</Button>
			</div>
		</CardHeader>
		<CardContent class="space-y-2">
			<p class="text-xs text-muted-foreground">
				Add this badge to your GitHub README to show your project is featured on Repnect.
			</p>
			<div
				class="rounded-lg border border-border bg-muted/60 p-2 font-mono text-[11px] text-muted-foreground truncate"
			>
				{markdownBadge}
			</div>
		</CardContent>
	</Card>
</div>

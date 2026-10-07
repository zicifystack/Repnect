<script lang="ts">
	import { Check, Copy, ExternalLink, Share2, Code } from '@lucide/svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import Button from '$lib/components/ui/Button.svelte';
	import type { DirectoryItem } from '$lib/server/directory/validation';

	let {
		item,
		shareUrl = ''
	}: {
		item: DirectoryItem;
		shareUrl?: string;
	} = $props();

	let linkCopied = $state(false);
	let badgeCopied = $state(false);

	const activeUrl = $derived(
		shareUrl || (typeof window !== 'undefined' ? window.location.href : '')
	);

	const shareText = $derived(
		`Check out ${item.name} on the Repnect Nigerian Tech Directory! ${item.description.slice(0, 100)}...`
	);

	const twitterUrl = $derived(
		`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(activeUrl)}`
	);

	const linkedinUrl = $derived(
		`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(activeUrl)}`
	);

	const whatsappUrl = $derived(
		`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${activeUrl}`)}`
	);

	const markdownBadge = $derived(
		`[![Featured on Repnect](https://repnect.dev/badge.svg)](${activeUrl})`
	);

	function copyShareLink() {
		if (typeof window !== 'undefined' && activeUrl) {
			navigator.clipboard.writeText(activeUrl);
			linkCopied = true;
			setTimeout(() => (linkCopied = false), 2000);
		}
	}

	function copyBadgeCode() {
		if (typeof window !== 'undefined' && markdownBadge) {
			navigator.clipboard.writeText(markdownBadge);
			badgeCopied = true;
			setTimeout(() => (badgeCopied = false), 2000);
		}
	}
</script>

<Card class="border-border bg-card">
	<CardHeader class="pb-3">
		<div class="flex items-center gap-3">
			{#if item.logo_url}
				<img
					src={item.logo_url}
					alt={item.name}
					class="size-10 shrink-0 rounded-xl border border-border bg-background p-1 object-contain"
				/>
			{:else}
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-sm font-bold text-link"
				>
					{item.name.slice(0, 2).toUpperCase()}
				</div>
			{/if}
			<div>
				<CardTitle class="text-base font-bold text-foreground">{item.name}</CardTitle>
				<CardDescription class="text-xs">
					Share this project across the developer community
				</CardDescription>
			</div>
		</div>
	</CardHeader>

	<CardContent class="space-y-4 pt-1">
		<div class="space-y-1.5">
			<label class="text-xs font-medium text-muted-foreground" for="share-url-input">
				Direct Link
			</label>
			<div class="flex items-center gap-2">
				<input
					id="share-url-input"
					type="text"
					readonly
					value={activeUrl}
					class="w-full rounded-lg border border-input bg-muted px-3 py-2 text-xs font-mono text-foreground focus:outline-hidden"
				/>
				<Button variant="default" size="sm" onclick={copyShareLink} class="shrink-0 gap-1.5">
					{#if linkCopied}
						<Check class="size-3.5 text-success" />
						<span>Copied</span>
					{:else}
						<Copy class="size-3.5" />
						<span>Copy</span>
					{/if}
				</Button>
			</div>
		</div>

		<div class="space-y-1.5">
			<span class="text-xs font-medium text-muted-foreground">Share to Social</span>
			<div class="flex flex-wrap items-center gap-2">
				<Button
					href={twitterUrl}
					target="_blank"
					rel="noreferrer"
					variant="outline"
					size="sm"
					class="text-xs gap-1.5"
				>
					<Share2 class="size-3.5" />
					<span>X (Twitter)</span>
					<ExternalLink class="size-3" />
				</Button>
				<Button
					href={linkedinUrl}
					target="_blank"
					rel="noreferrer"
					variant="outline"
					size="sm"
					class="text-xs gap-1.5"
				>
					<Share2 class="size-3.5" />
					<span>LinkedIn</span>
					<ExternalLink class="size-3" />
				</Button>
				<Button
					href={whatsappUrl}
					target="_blank"
					rel="noreferrer"
					variant="outline"
					size="sm"
					class="text-xs gap-1.5"
				>
					<Share2 class="size-3.5" />
					<span>WhatsApp</span>
					<ExternalLink class="size-3" />
				</Button>
			</div>
		</div>

		<div class="space-y-1.5 border-t border-border pt-3">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-muted-foreground">Embed Badge (README)</span>
				<Button
					variant="ghost"
					size="sm"
					onclick={copyBadgeCode}
					class="h-7 px-2 text-xs text-link gap-1"
				>
					{#if badgeCopied}
						<Check class="size-3 text-success" />
						<span>Copied Markdown</span>
					{:else}
						<Code class="size-3" />
						<span>Copy Markdown</span>
					{/if}
				</Button>
			</div>
			<div
				class="rounded-lg border border-border bg-muted/60 p-2 font-mono text-[11px] text-muted-foreground truncate"
			>
				{markdownBadge}
			</div>
		</div>
	</CardContent>
</Card>

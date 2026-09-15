<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ShieldCheck, Copy, Check } from '@lucide/svelte';

	let { slug, verified }: { slug: string; verified: boolean } = $props();

	const badgeMarkdown = $derived(
		`[![Repnect Verified](https://repnect.dev/badge.svg)](https://repnect.dev/projects/${slug})`
	);

	let copied = $state(false);
	let codeRef: HTMLElement | undefined = $state();

	async function copyBadge() {
		try {
			await navigator.clipboard.writeText(badgeMarkdown);
		} catch {
			// Fallback: select text
			if (codeRef) {
				const selection = window.getSelection();
				const range = document.createRange();
				range.selectNodeContents(codeRef);
				selection?.removeAllRanges();
				selection?.addRange(range);
			}
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

{#if verified}
	<div class="flex flex-col gap-2">
		<Badge class="w-fit gap-1.5 px-2 py-1 text-sm">
			<ShieldCheck class="size-4" />
			Repnect Verified
		</Badge>

		<div class="rounded-lg border border-border bg-muted/50 p-3">
			<div class="mb-1.5 flex items-center justify-between">
				<span class="text-xs font-medium text-muted-foreground">Badge Markdown</span>
				<button
					type="button"
					onclick={copyBadge}
					class="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{#if copied}
						<Check class="size-3 text-green-500" />
						Copied!
					{:else}
						<Copy class="size-3" />
						Copy Badge
					{/if}
				</button>
			</div>
			<code
				bind:this={codeRef}
				class="block break-all font-mono text-xs text-foreground"
			>{badgeMarkdown}</code>
		</div>
	</div>
{/if}

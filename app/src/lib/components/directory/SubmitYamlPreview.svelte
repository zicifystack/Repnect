<script lang="ts">
	import { Copy, Check, ExternalLink, FileCode } from '@lucide/svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import Button from '$lib/components/ui/Button.svelte';

	let {
		liveYaml,
		slug,
		logoUrl
	}: {
		liveYaml: string;
		slug: string;
		logoUrl?: string;
	} = $props();

	let copied = $state(false);

	const ghPrUrl = $derived(
		`https://github.com/Zicifystack/repnect/new/main?filename=data/projects/${slug || 'project'}.yaml&value=${encodeURIComponent(liveYaml)}`
	);

	function copyYaml() {
		navigator.clipboard.writeText(liveYaml);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="space-y-4">
	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div
						class="flex size-7 items-center justify-center rounded-lg bg-primary-500/10 text-link"
					>
						<FileCode class="size-4" />
					</div>
					<div>
						<CardTitle class="text-sm font-semibold text-foreground">
							Generated GitOps Definition
						</CardTitle>
						<CardDescription class="text-xs">
							Live preview of the YAML file for this entry.
						</CardDescription>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<Button type="button" variant="outline" size="sm" onclick={copyYaml} class="gap-1.5 h-8">
						{#if copied}
							<Check class="size-3.5 text-success" />
							<span>Copied</span>
						{:else}
							<Copy class="size-3.5" />
							<span>Copy</span>
						{/if}
					</Button>

					<Button
						href={ghPrUrl}
						variant="default"
						size="sm"
						target="_blank"
						rel="noreferrer"
						class="gap-1.5 h-8"
					>
						<span>Create GitHub PR</span>
						<ExternalLink class="size-3" />
					</Button>
				</div>
			</div>
		</CardHeader>

		<CardContent class="space-y-3">
			<p class="text-xs text-muted-foreground">
				Submitting through this form will queue your project for review. You can also open a Pull
				Request directly on GitHub with the generated YAML!
			</p>

			{#if logoUrl}
				<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
					<img
						src={logoUrl}
						alt="Logo preview"
						class="size-10 rounded-lg object-contain bg-background border border-border p-0.5"
					/>
					<div class="text-xs min-w-0">
						<p class="font-medium text-foreground">Logo Attached</p>
						<p class="text-muted-foreground truncate max-w-xs">{logoUrl}</p>
					</div>
				</div>
			{/if}

			<pre
				class="max-h-[460px] overflow-x-auto rounded-xl border border-border bg-muted/60 p-4 font-mono text-xs text-foreground leading-relaxed">{liveYaml}</pre>
		</CardContent>
	</Card>
</div>

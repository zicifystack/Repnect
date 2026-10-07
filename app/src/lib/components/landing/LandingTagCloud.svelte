<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, Tag } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';

	let {
		tags = []
	}: {
		tags?: { name: string; count: number }[];
	} = $props();
</script>

<section class="border-y border-border bg-muted/30 py-16 sm:py-20">
	<div class="mx-auto max-w-5xl px-6 text-center">
		<div
			class="inline-flex size-10 items-center justify-center rounded-xl bg-primary-500/15 text-link"
		>
			<Tag class="size-5" />
		</div>
		<h2 class="mt-4 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
			Explore Ecosystem Topics & Technologies
		</h2>
		<p class="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
			Filter projects across Nigerian technical niches, frameworks, and developer tooling.
		</p>

		<div class="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
			{#each tags as tag (tag.name)}
				<a
					href={resolve(`/directory?search=${encodeURIComponent(tag.name)}`)}
					class="transition-transform hover:-translate-y-0.5"
				>
					<Badge
						variant="outline"
						class="gap-1.5 rounded-full border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-link hover:text-link hover:bg-card/80 shadow-2xs"
					>
						<span>#{tag.name}</span>
						<span
							class="rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground tabular-nums"
						>
							{tag.count}
						</span>
					</Badge>
				</a>
			{/each}
		</div>

		<div class="mt-8">
			<a
				href={resolve('/directory')}
				class="inline-flex items-center gap-1.5 text-xs font-medium text-link hover:underline"
			>
				<span>Browse full directory with filters</span>
				<ArrowRight class="size-3.5" />
			</a>
		</div>
	</div>
</section>

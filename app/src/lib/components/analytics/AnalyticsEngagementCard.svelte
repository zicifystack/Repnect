<script lang="ts">
	import { Eye, MousePointerClick, Search } from '@lucide/svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';

	let {
		totalViews = 0,
		totalClicks = 0,
		totalSearches = 0
	}: {
		totalViews?: number;
		totalClicks?: number;
		totalSearches?: number;
	} = $props();
</script>

<Card class="border-border bg-card shadow-xs">
	<CardHeader class="pb-3">
		<CardTitle class="text-base font-semibold text-foreground">
			Directory Traffic & Engagement
		</CardTitle>
		<CardDescription class="text-xs">Platform usage recorded in the edge store.</CardDescription>
	</CardHeader>

	<CardContent>
		<div class="grid gap-4 sm:grid-cols-3">
			<div class="rounded-xl border border-border bg-muted/40 p-4">
				<div class="flex items-center gap-2">
					<Eye class="size-4 text-link" />
					<span class="text-xs text-muted-foreground uppercase font-semibold">Total Page Views</span
					>
				</div>
				<p class="mt-2 text-2xl font-bold tabular-nums text-foreground">
					{totalViews.toLocaleString()}
				</p>
			</div>

			<div class="rounded-xl border border-border bg-muted/40 p-4">
				<div class="flex items-center gap-2">
					<MousePointerClick class="size-4 text-link" />
					<span class="text-xs text-muted-foreground uppercase font-semibold">Outbound Clicks</span>
				</div>
				<p class="mt-2 text-2xl font-bold tabular-nums text-foreground">
					{totalClicks.toLocaleString()}
				</p>
			</div>

			<div class="rounded-xl border border-border bg-muted/40 p-4">
				<div class="flex items-center gap-2">
					<Search class="size-4 text-link" />
					<span class="text-xs text-muted-foreground uppercase font-semibold"
						>Directory Searches</span
					>
				</div>
				<p class="mt-2 text-2xl font-bold tabular-nums text-foreground">
					{totalSearches.toLocaleString()}
				</p>
			</div>
		</div>
	</CardContent>
</Card>

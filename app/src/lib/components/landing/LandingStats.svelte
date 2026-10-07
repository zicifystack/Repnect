<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as m from '$lib/paraglide/messages';

	let {
		stats
	}: {
		stats: { states: number; categories: number; projects: number };
	} = $props();

	const hubs = ['LA', 'AB', 'PH', 'EN', 'IB'];

	const statItems = $derived([
		{ value: stats.states, label: m.landing_stat_states() },
		{ value: stats.categories, label: m.landing_stat_categories() },
		{ value: stats.projects, label: m.landing_stat_projects() }
	]);
</script>

<div class="mx-auto max-w-5xl px-6 py-12">
	<div class="flex flex-col items-center justify-center gap-3 sm:flex-row mb-8">
		<Avatar.Group>
			{#each hubs as hub (hub)}
				<Avatar.Root class="ring-2 ring-background">
					<Avatar.Fallback class="bg-primary-500/15 text-xs font-semibold text-link"
						>{hub}</Avatar.Fallback
					>
				</Avatar.Root>
			{/each}
			<Avatar.GroupCount>+{stats.states - hubs.length}</Avatar.GroupCount>
		</Avatar.Group>
		<p class="text-sm text-muted-foreground">{m.landing_builders()}</p>
	</div>

	<div class="mx-auto flex max-w-xl items-center justify-center gap-6 sm:gap-10">
		{#each statItems as stat, i (stat.label)}
			{#if i > 0}
				<Separator orientation="vertical" class="h-10!" />
			{/if}
			<div class="flex flex-col items-center">
				<span class="text-3xl font-bold tracking-tight tabular-nums text-foreground"
					>{stat.value}</span
				>
				<span class="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</span>
			</div>
		{/each}
	</div>
</div>

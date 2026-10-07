<script lang="ts">
	import { Compass, ShieldCheck, TrendingUp } from '@lucide/svelte';
	import { Card } from '$lib/components/ui/card';
	import * as m from '$lib/paraglide/messages';

	const pillars = [
		{ icon: Compass, title: m.feature_auth_title, body: m.feature_auth_body },
		{ icon: ShieldCheck, title: m.feature_speed_title, body: m.feature_speed_body },
		{ icon: TrendingUp, title: m.feature_tested_title, body: m.feature_tested_body }
	];
</script>

<section class="border-y border-border bg-muted/30 py-20 sm:py-24">
	<div class="mx-auto max-w-5xl px-6">
		<div class="mx-auto mb-14 max-w-2xl text-center">
			<h2 class="text-2xl font-bold tracking-tight sm:text-3xl">{m.landing_pillars_title()}</h2>
			<p class="mt-3 text-muted-foreground">{m.landing_pillars_body()}</p>
		</div>
		<div class="grid gap-5 sm:grid-cols-3">
			{#each pillars as pillar (pillar.title)}
				<Card class="rounded-2xl border-border bg-card p-6 shadow-xs">
					<div
						class="inline-flex size-10 items-center justify-center rounded-xl bg-primary-500/15 text-link"
					>
						<pillar.icon class="size-5" />
					</div>
					<h3 class="mt-4 font-semibold text-foreground">{pillar.title()}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body()}</p>
				</Card>
			{/each}
		</div>
	</div>
</section>

<script lang="ts">
	import { ArrowRight, Sparkles } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as m from '$lib/paraglide/messages';
</script>

<section class="relative isolate overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:48px_48px]"
	></div>
	<div
		aria-hidden="true"
		class="absolute top-[-10rem] left-1/2 -z-10 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl"
	></div>

	<div class="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
		<Badge
			variant="outline"
			href={resolve('/directory/analytics')}
			class="h-7 gap-1.5 bg-background/60 px-3 backdrop-blur"
		>
			<Sparkles class="text-link" />
			{m.landing_badge()}
			<ArrowRight />
		</Badge>

		<h1 class="mt-8 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
			{m.landing_hero_title()}
			<span
				class="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent"
			>
				{m.landing_hero_title_accent()}
			</span>
		</h1>

		<p class="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
			{m.landing_hero_subtitle()}
		</p>

		<div class="mt-10 flex flex-wrap items-center justify-center gap-3">
			<Button
				href={resolve('/directory')}
				size="lg"
				class="h-11 px-5 shadow-lg shadow-primary-500/20"
			>
				{m.landing_explore()}
				<ArrowRight data-icon="inline-end" />
			</Button>
			<Button href={resolve('/submit')} variant="outline" size="lg" class="h-11 px-5">
				{m.landing_submit()}
			</Button>
		</div>
	</div>
</section>

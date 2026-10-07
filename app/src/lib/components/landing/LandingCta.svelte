<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as m from '$lib/paraglide/messages';
</script>

<section class="mx-auto max-w-5xl px-6 py-20 sm:py-24">
	<div
		class="relative overflow-hidden rounded-3xl border border-primary-500/20 bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-14 text-center shadow-2xl shadow-primary-500/20 sm:px-16"
	>
		<div
			aria-hidden="true"
			class="absolute -top-24 -right-24 size-72 rounded-full bg-primary-400/30 blur-3xl"
		></div>
		<h2 class="relative text-3xl font-bold tracking-tight text-primary-foreground">
			{m.landing_cta_title()}
		</h2>
		<p class="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
			{m.landing_cta_body()}
		</p>
		<div class="relative mt-8 flex flex-wrap justify-center gap-3">
			<Button href={resolve('/submit')} size="lg" variant="secondary" class="h-11 px-5">
				{m.landing_submit()}
			</Button>
			<Button
				href={resolve('/directory')}
				size="lg"
				variant="outline"
				class="h-11 px-5 border-primary-400/40 bg-primary-700/20 text-primary-foreground hover:bg-primary-700/40 hover:text-primary-foreground"
			>
				{m.landing_browse()}
				<ArrowRight data-icon="inline-end" />
			</Button>
		</div>
	</div>
</section>

<script lang="ts">
	import {
		Compass,
		Code2,
		Layers,
		CheckCircle2,
		ArrowRight,
		Sparkles,
		TrendingUp,
		Share2,
		ShieldCheck
	} from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import NewsletterSignup from '$lib/components/newsletter/NewsletterSignup.svelte';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import * as m from '$lib/paraglide/messages';
	import { organizationJsonLd, websiteJsonLd } from '$lib/utils/seo';

	const stats = [
		{ label: 'Nigerian States & FCT', value: '37' },
		{ label: 'Ecosystem Categories', value: '10+' },
		{ label: 'Open-Source & Startups', value: '100% Curated' },
		{ label: 'Community Voted', value: 'Realtime' }
	];

	const sampleSpotlights = [
		{
			id: 'paystack-python',
			name: 'Paystack Python SDK',
			category: 'fintech',
			city: 'Lagos',
			state: 'Lagos',
			description: 'Comprehensive Python client library for the Paystack payment gateway enabling seamless checkout and transfers.',
			stars: 285,
			issues: 4,
			verified: true
		},
		{
			id: 'flutterwave-v3',
			name: 'Flutterwave Node.js SDK',
			category: 'fintech',
			city: 'Lagos',
			state: 'Lagos',
			description: 'Official Node.js SDK for Flutterwave v3 API with full support for card charges, mobile money, and virtual accounts.',
			stars: 198,
			issues: 2,
			verified: true
		},
		{
			id: 'nigeria-banks-api',
			name: 'Nigeria Banks API & CBN Codes',
			category: 'developer-tools',
			city: 'Abuja',
			state: 'FCT Abuja',
			description: 'Open list and REST API of all Nigerian commercial banks, microfinance banks, and their Central Bank sort codes.',
			stars: 142,
			issues: 5,
			verified: true
		}
	];

	const pillars = [
		{
			icon: Compass,
			title: '36 States & Diaspora Reach',
			description: 'Discover software created in Lagos, Abuja, Port Harcourt, Enugu, Ibadan, Kaduna, and across the Nigerian tech diaspora.'
		},
		{
			icon: ShieldCheck,
			title: 'Nigerian-Verified Connection',
			description: 'Clear provenance on every project: whether founded by Nigerians, built on Nigerian soil, or solving local market problems.'
		},
		{
			icon: TrendingUp,
			title: 'Community Upvotes & GitHub Sync',
			description: 'Live star badges, open Good First Issues for contributors, and decentralized upvoting to showcase what the community loves.'
		}
	];
</script>

<Seo description={m.landing_meta_description()} jsonLd={[websiteJsonLd(), organizationJsonLd()]} />

<!-- Hero Section -->
<section class="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/40 via-background to-background py-20 sm:py-28">
	<div class="mx-auto max-w-5xl px-6 text-center">
		<div class="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-medium text-link mb-8">
			<Sparkles class="h-3.5 w-3.5" />
			<span>Connecting Nigerian Builders with the Global Tech Stage</span>
		</div>

		<h1 class="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl text-balance">
			{m.landing_hero_title()}
		</h1>

		<p class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-pretty">
			{m.landing_hero_subtitle()}
		</p>

		<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
			<Button href={resolve('/directory')} size="lg" class="shadow-sm">
				Explore Directory
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
			<Button href={resolve('/submit')} variant="outline" size="lg">
				Submit a Project
			</Button>
			<Button href={resolve('/directory/analytics')} variant="ghost" size="lg">
				View Analytics ↗
			</Button>
		</div>

		<!-- Live Metrics Ribbon -->
		<div class="mt-16 grid grid-cols-2 gap-4 border-t border-border pt-12 sm:grid-cols-4">
			{#each stats as item}
				<div class="flex flex-col items-center justify-center p-2">
					<span class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{item.value}</span>
					<span class="mt-1 text-xs font-medium text-muted-foreground">{item.label}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Featured Spotlight Projects -->
<section class="mx-auto max-w-5xl px-6 py-20 sm:py-24">
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Featured Innovations</h2>
			<p class="mt-2 text-sm text-muted-foreground">High-impact libraries, APIs, and tools driving the Nigerian ecosystem forward.</p>
		</div>
		<Button href={resolve('/directory')} variant="ghost" class="text-link">
			View all projects →
		</Button>
	</div>

	<div class="mt-10 grid gap-6 sm:grid-cols-3">
		{#each sampleSpotlights as project}
			<a
				href={resolve(`/directory/${project.id}`)}
				class="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-2xs transition hover:border-primary-500/50 hover:shadow-xs"
			>
				<div>
					<div class="flex items-start justify-between gap-2">
						<span class="rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-link">
							{project.category}
						</span>
						{#if project.verified}
							<span class="flex items-center gap-1 text-xs font-medium text-success">
								<CheckCircle2 class="h-3.5 w-3.5" />
								Verified
							</span>
						{/if}
					</div>

					<h3 class="mt-4 text-lg font-semibold text-foreground group-hover:text-link transition">
						{project.name}
					</h3>
					<p class="mt-1 text-xs text-muted-foreground">
						{project.city}, {project.state}
					</p>

					<p class="mt-3 line-clamp-3 text-sm text-muted-foreground">
						{project.description}
					</p>
				</div>

				<div class="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
					<span class="font-medium text-foreground">★ {project.stars} stars</span>
					{#if project.issues > 0}
						<span class="text-link">{project.issues} good issues</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</section>

<!-- Why Repnect / Ecosystem Pillars -->
<section class="border-t border-border bg-muted/30 py-20 sm:py-24">
	<div class="mx-auto max-w-5xl px-6">
		<div class="text-center max-w-2xl mx-auto mb-16">
			<h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Built for Nigerian Engineering Excellence</h2>
			<p class="mt-3 text-muted-foreground">Everything you need to discover, authenticate, and support African technical creators.</p>
		</div>

		<div class="grid gap-8 sm:grid-cols-3">
			{#each pillars as pillar}
				<div class="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-4">
					<div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/15 text-link">
						<pillar.icon class="h-5 w-5" />
					</div>
					<h3 class="text-base font-semibold text-foreground">{pillar.title}</h3>
					<p class="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Call to Action -->
<section class="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
	<h2 class="text-3xl font-bold tracking-tight text-foreground">{m.landing_cta_title()}</h2>
	<p class="mx-auto mt-4 max-w-xl text-base text-muted-foreground">{m.landing_cta_body()}</p>
	<div class="mt-8 flex flex-wrap justify-center gap-4">
		<Button href={resolve('/submit')} size="lg" class="shadow-sm">
			Submit Your Project
		</Button>
		<Button href={resolve('/directory')} variant="outline" size="lg">
			Browse All Tech
		</Button>
	</div>
</section>

<!-- Newsletter / Ecosystem Pulse -->
<section class="border-t border-border bg-muted/40 py-20">
	<div class="mx-auto max-w-md px-6 text-center">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">{m.newsletter_heading()}</h2>
		<p class="mx-auto mt-3 text-sm text-muted-foreground">{m.newsletter_subtitle()}</p>
		<div class="mt-8">
			<NewsletterSignup />
		</div>
	</div>
</section>

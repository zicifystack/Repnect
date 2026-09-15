<script lang="ts">
	import type { PageData } from './$types';
	import ProjectGrid from '$lib/components/ProjectGrid.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ArrowRight, Rocket, Code2 } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const ogImageUrl = 'https://repnect.dev/api/og';
	const canonicalUrl = 'https://repnect.dev';
	const title = 'Repnect — Nigeria\'s Open Source Directory';
	const description =
		'Discover open source projects built by Nigerians, for the world. Browse by city, state, language, or category.';

	const orgJsonLd = $derived(JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: 'Repnect — Nigerian Open Source Projects',
		url: canonicalUrl,
		numberOfItems: data.searchIndex.length
	}));

	const scriptTag = $derived(`\x3cscript type="application/ld+json">${orgJsonLd}\x3c/script>`);
	const browseCities = $derived(data.featuredCities?.length ? data.featuredCities : ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu']);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImageUrl} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html scriptTag}
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden border-b border-border bg-grid-pattern px-4 py-16 sm:px-6 sm:py-24">
	<div class="pointer-events-none absolute inset-0 bg-radial-green"></div>
	<div class="relative mx-auto max-w-3xl text-center">
		<Badge variant="outline" class="mb-4 gap-1.5 border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary rounded-md shadow-xs">
			<Rocket class="size-3.5" />
			Made in Nigeria 🇮🇳 // OSS Registry
		</Badge>
		<h1 class="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
			Nigeria's Open Source Directory
		</h1>
		<p class="mb-8 text-lg text-muted-foreground sm:text-xl">
			Discover open source projects built by Nigerians, for the world. Search by city, state,
			language, or category — and find your next contribution.
		</p>
		<div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
			<a href="/submit">
				<Button size="lg" class="gap-2 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30">
					Submit a Project
					<ArrowRight class="size-4" />
				</Button>
			</a>
			<a href="/radar">
				<Button variant="outline" size="lg" class="border-border/80 bg-background/80 backdrop-blur-xs hover:border-primary/40 font-mono text-sm">View Radar Map</Button>
			</a>
		</div>
	</div>
</section>

<!-- Project grid -->
<section class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
	{#if data.searchIndex.length === 0}
		<div class="flex flex-col items-center justify-center gap-4 py-20 text-center">
			<Code2 class="size-12 text-muted-foreground/50" />
			<h2 class="text-2xl font-semibold text-foreground">Be the first to submit a project</h2>
			<p class="max-w-md text-muted-foreground">
				No projects have been listed yet. Submit your open source project and help build Nigeria's
				largest OSS directory.
			</p>
			<a href="/submit">
				<Button class="gap-2">
					Submit Your Project
					<ArrowRight class="size-4" />
				</Button>
			</a>
		</div>
	{:else}
		<ProjectGrid initialProjects={data.searchIndex} categories={data.categories} />
	{/if}
</section>

<!-- Developer CTA -->
<section class="relative overflow-hidden border-t border-border bg-muted/20 px-4 py-14 sm:px-6">
	<div class="pointer-events-none absolute inset-0 bg-grid-pattern opacity-50"></div>
	<div class="relative mx-auto max-w-3xl text-center">
		<div class="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-xs text-primary">
			<Code2 class="size-3.5" />
			<span>git clone https://github.com/wbfoss/repnect</span>
		</div>
		<h2 class="mb-3 text-2xl font-bold text-foreground">Built by the community</h2>
		<p class="mb-6 text-muted-foreground">
			Repnect is itself open source. Contribute data, fix bugs, or suggest features.
		</p>
		<div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
			<a
				href="https://github.com/wbfoss/repnect"
				target="_blank"
				rel="noopener noreferrer"
			>
				<Button variant="outline" size="lg" class="gap-2 border-border/80 hover:border-primary/40">
					<Code2 class="size-4" />
					View on GitHub
				</Button>
			</a>
			<a href="/about">
				<Button variant="ghost" size="lg">Learn how it works</Button>
			</a>
		</div>
	</div>
</section>

<!-- SEO content section -->
<section class="border-t border-border px-4 py-10 sm:px-6">
	<div class="mx-auto max-w-7xl">
		<div class="grid grid-cols-1 gap-8 text-sm sm:grid-cols-3">
			<div>
				<h3 class="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Browse by City</h3>
				<ul class="flex flex-col gap-1.5 font-mono text-xs">
					{#each browseCities as city (city)}
						<li>
							<a href="/?city={city}" class="text-muted-foreground hover:text-primary transition-colors">{city}</a>
						</li>
					{/each}
				</ul>
			</div>
			<div>
				<h3 class="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Browse by Tech</h3>
				<ul class="flex flex-col gap-1.5 font-mono text-xs">
					{#each ['TypeScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin'] as lang (lang)}
						<li>
							<a href="/?lang={lang}" class="text-muted-foreground hover:text-primary transition-colors">{lang}</a>
						</li>
					{/each}
				</ul>
			</div>
			<div>
				<h3 class="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">Browse by Category</h3>
				<ul class="flex flex-col gap-1.5 font-mono text-xs">
					{#each data.categories.slice(0, 6) as cat (cat.id)}
						<li>
							<a href="/?category={cat.id}" class="text-muted-foreground hover:text-primary transition-colors">{cat.label}</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
		<p class="mt-8 text-xs font-mono text-muted-foreground/80 leading-relaxed">
			Repnect is a curated, Git-powered directory of open source projects with a strong Nigerian
			connection — founded by Nigerians, built by Nigerian contributors, or maintained by Nigerian
			organizations. Every project is reviewed and linked to a verified GitHub repository.
		</p>
	</div>
</section>

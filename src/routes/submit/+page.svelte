<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import BreadcrumbSchema from '$lib/components/BreadcrumbSchema.svelte';
	import ProjectSubmissionForm from '$lib/components/ProjectSubmissionForm.svelte';
	import {
		CheckCircle,
		GitBranch,
		HelpCircle,
		Globe,
		Users,
		Building2,
		Heart,
		FileCode2,
		BookOpen,
		Sparkles
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'generator' | 'guidelines'>('generator');

	const title = 'Submit a Project — Repnect';
	const description =
		'Generate your project TOML file or submit directly to Nigeria\'s Open Source Directory.';

	const eligibility = [
		{
			icon: Globe,
			title: 'Founded in Nigeria',
			desc: 'The project was founded by someone based in Nigeria or of Nigerian origin.'
		},
		{
			icon: Users,
			title: 'Nigerian Core Contributors',
			desc: 'The project has a significant number of core contributors who are Nigerian.'
		},
		{
			icon: Building2,
			title: 'Nigerian Organisation',
			desc: 'Maintained or backed by an Nigerian company, NGO, or educational institution.'
		},
		{
			icon: Heart,
			title: 'Serves Nigerian Community',
			desc: 'The project is built primarily to serve the needs of the Nigerian community.'
		}
	];

	const steps = [
		{ num: '01', title: 'Generate your TOML', desc: 'Use the interactive form below to generate and validate your .toml entry.' },
		{ num: '02', title: 'Fork the repository', desc: 'Fork github.com/zicifystack/repnect to your GitHub account.' },
		{ num: '03', title: 'Add to data/projects/', desc: 'Place your file at data/projects/your-slug.toml with all required fields.' },
		{ num: '04', title: 'Add your logo (optional)', desc: 'Place a logo (SVG, PNG, JPG/JPEG, or WebP, ≤ 200 KB) in public/logos/.' },
		{ num: '05', title: 'Add the Repnect badge', desc: 'Add the Repnect badge or "repnect" GitHub topic to get verified.' },
		{ num: '06', title: 'Open a pull request', desc: 'Submit a PR to the main repository. CI runs validation and team merges.' }
	];

	const faqs = [
		{
			q: 'Do I need to be the project owner to submit?',
			a: 'No. Anyone can submit a project as long as it meets the eligibility criteria.'
		},
		{
			q: 'How long does review take?',
			a: 'Typically within a few days. We review PRs manually to ensure data quality.'
		},
		{
			q: 'Can I update my project\'s details later?',
			a: 'Yes. Open a PR with the updated TOML file, just like the initial submission.'
		},
		{
			q: 'What if my project is under active development and not yet stable?',
			a: 'Early-stage projects are welcome as long as they have a public repository with open code.'
		}
	];

	const faqJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.q,
			acceptedAnswer: { '@type': 'Answer', text: f.a }
		}))
	});
	const faqTag = `\x3cscript type="application/ld+json">${faqJsonLd}\x3c/script>`;

	const breadcrumbs = [
		{ name: 'Home', url: 'https://repnect.dev' },
		{ name: 'Submit', url: 'https://repnect.dev/submit' }
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="https://repnect.dev/submit" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content="https://repnect.dev/submit" />
	<meta property="og:image" content="https://repnect.dev/api/og" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://repnect.dev/api/og" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html faqTag}
</svelte:head>

<BreadcrumbSchema crumbs={breadcrumbs} />

<!-- Hero Header with Nigerian Green developer theme -->
<section class="relative overflow-hidden border-b border-border bg-grid-pattern px-4 py-12 sm:px-6 sm:py-16">
	<div class="pointer-events-none absolute inset-0 bg-radial-green"></div>
	<div class="relative mx-auto max-w-4xl text-center">
		<Badge variant="outline" class="mb-4 gap-1.5 border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary rounded-md">
			<Sparkles class="size-3.5" />
			Made in Nigeria 🇮🇳 // Project Submission
		</Badge>
		<h1 class="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
			Submit Your Project
		</h1>
		<p class="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
			Use the interactive form below to generate your validated project TOML file, copy it, or open a pull request directly on GitHub.
		</p>

		<!-- Tab Switcher -->
		<div class="mt-8 inline-flex items-center rounded-lg border border-border/70 bg-muted/30 p-1 font-mono text-xs">
			<button
				type="button"
				onclick={() => (activeTab = 'generator')}
				class="flex items-center gap-2 rounded-md px-4 py-2 font-medium transition-all
					{activeTab === 'generator'
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<FileCode2 class="size-3.5" />
				TOML Generator & Form
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'guidelines')}
				class="flex items-center gap-2 rounded-md px-4 py-2 font-medium transition-all
					{activeTab === 'guidelines'
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<BookOpen class="size-3.5" />
				Guidelines & FAQ
			</button>
		</div>
	</div>
</section>

<!-- Content Body -->
<div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
	{#if activeTab === 'generator'}
		<ProjectSubmissionForm categories={data.categories} />
	{:else}
		<div class="mx-auto max-w-3xl flex flex-col gap-12">
			<!-- Eligibility -->
			<section>
				<h2 class="mb-2 text-2xl font-bold text-foreground">Eligibility Criteria</h2>
				<p class="mb-6 text-sm text-muted-foreground">
					Your project should meet at least one of the following criteria to be listed in Repnect:
				</p>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each eligibility as item (item.title)}
						<Card class="border-border/70 bg-card/70 backdrop-blur-xs">
							<CardContent class="flex gap-3 p-5">
								{@const Icon = item.icon}
								<div class="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
									<Icon class="size-4" />
								</div>
								<div>
									<h3 class="font-semibold text-foreground text-sm">{item.title}</h3>
									<p class="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</section>

			<!-- Submission steps -->
			<section>
				<h2 class="mb-2 text-2xl font-bold text-foreground">Manual Submission Workflow</h2>
				<p class="mb-6 text-sm text-muted-foreground">
					Follow these steps to submit via GitHub Pull Request:
				</p>
				<div class="flex flex-col gap-3">
					{#each steps as step (step.num)}
						<div class="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
							<div class="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/15 font-mono text-xs font-bold text-primary">
								{step.num}
							</div>
							<div>
								<h3 class="font-semibold text-foreground text-sm">{step.title}</h3>
								<p class="mt-0.5 text-xs text-muted-foreground font-mono">{step.desc}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Action CTA -->
			<div class="flex flex-col gap-3 sm:flex-row">
				<Button onclick={() => (activeTab = 'generator')} class="flex-1 gap-2">
					<FileCode2 class="size-4" />
					Switch to TOML Generator
				</Button>
				<a
					href="https://github.com/zicifystack/repnect"
					target="_blank"
					rel="noopener noreferrer"
					class="flex-1"
				>
					<Button variant="outline" class="w-full gap-2 border-border/80 hover:border-primary/40">
						<GitBranch class="size-4" />
						Repository on GitHub
					</Button>
				</a>
			</div>

			<!-- FAQ -->
			<section>
				<h2 class="mb-2 text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
				<p class="mb-6 text-sm text-muted-foreground">Common questions about getting your project featured.</p>
				<div class="flex flex-col gap-3">
					{#each faqs as faq (faq.q)}
						<Card class="border-border/60 bg-card/60">
							<CardContent class="flex gap-3 p-4">
								<HelpCircle class="size-4 shrink-0 text-primary mt-0.5" />
								<div>
									<h3 class="font-semibold text-foreground text-sm">{faq.q}</h3>
									<p class="mt-1 text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</section>
		</div>
	{/if}
</div>


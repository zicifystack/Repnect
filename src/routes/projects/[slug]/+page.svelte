<script lang="ts">
	import type { PageData } from './$types';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
	import VerifiedBadge from '$lib/components/VerifiedBadge.svelte';
	import SocialShare from '$lib/components/SocialShare.svelte';
	import ProjectUpvote from '$lib/components/ProjectUpvote.svelte';
	import ContributorAvatars from '$lib/components/ContributorAvatars.svelte';
	import SimilarProjects from '$lib/components/SimilarProjects.svelte';
	import BreadcrumbSchema from '$lib/components/BreadcrumbSchema.svelte';
	import { canonicalUrl } from '$lib/seo.js';
	import {
		Star,
		GitFork,
		MapPin,
		ExternalLink,
		Globe,
		Users,
		BookOpen,
		Tag,
		Eye,
		MessageSquare
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const { project, cache, similarProjects } = $derived(data);

	const pageTitle = $derived(`${project.name} — Repnect`);
	const pageDescription = $derived(project.short_desc);
	const canonical = $derived(canonicalUrl(project.slug));
	const ogImage = $derived(`https://repnect.dev/projects/${project.slug}/og`);

	// Language breakdown percentages
	const langEntries = $derived(() => {
		if (!cache?.languages) return [];
		const total = Object.values(cache.languages).reduce((a, b) => a + b, 0);
		if (total === 0) return [];
		return Object.entries(cache.languages)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8)
			.map(([lang, bytes]) => ({ lang, pct: Math.round((bytes / total) * 100) }));
	});

	const softwareJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'SoftwareSourceCode',
			name: project.name,
			description: project.short_desc,
			url: canonical,
			codeRepository: project.repo,
			programmingLanguage: project.primary_lang,
			license: `https://spdx.org/licenses/${project.license}`,
			dateCreated: project.added_at
		})
	);

	const softwareScriptTag = $derived(
		`\x3cscript type="application/ld+json">${softwareJsonLd}\x3c/script>`
	);

	const faqJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: `What is ${project.name}?`,
					acceptedAnswer: { '@type': 'Answer', text: project.short_desc }
				},
				{
					'@type': 'Question',
					name: `What language is ${project.name} written in?`,
					acceptedAnswer: { '@type': 'Answer', text: `${project.name} is primarily written in ${project.primary_lang}.` }
				},
				{
					'@type': 'Question',
					name: `Where is ${project.name} based?`,
					acceptedAnswer: { '@type': 'Answer', text: `${project.name} is based in ${project.location_city}, ${project.location_nigerian_state}, Nigeria.` }
				}
			]
		})
	);

	const faqScriptTag = $derived(
		`\x3cscript type="application/ld+json">${faqJsonLd}\x3c/script>`
	);

	const breadcrumbs = $derived([
		{ name: 'Home', url: 'https://repnect.dev' },
		{ name: 'Projects', url: 'https://repnect.dev/projects' },
		{ name: project.name, url: canonical }
	]);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	<meta name="twitter:image" content={ogImage} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html softwareScriptTag}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html faqScriptTag}
</svelte:head>

<BreadcrumbSchema crumbs={breadcrumbs} />

<article class="mx-auto max-w-5xl px-4 py-10 sm:px-6">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex flex-col gap-2">
				<div class="flex flex-wrap items-center gap-2">
					<h1 class="text-3xl font-bold text-foreground sm:text-4xl">{project.name}</h1>
					<Badge variant="outline" class="border-primary/30 bg-primary/10 font-mono text-xs text-primary px-2.5 py-0.5 rounded-md">{project.primary_lang}</Badge>
				</div>
				<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
					<MapPin class="size-3.5 text-muted-foreground/70" />
					<span class="font-mono text-xs">{project.location_city}, {project.location_nigerian_state}</span>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<ProjectUpvote slug={project.slug} initialCount={project.stars} />
				<a href={project.repo} target="_blank" rel="noopener noreferrer">
					<Button variant="outline" class="gap-2">
						<Star class="size-4" />
						Star on GitHub
					</Button>
				</a>
			</div>
		</div>

		<!-- Verified badge -->
		{#if project.verified}
			<VerifiedBadge slug={project.slug} verified={project.verified} />
		{/if}

		<p class="max-w-2xl text-lg text-muted-foreground">{project.short_desc}</p>

		<!-- Quick links -->
		<div class="flex flex-wrap gap-2">
			<a href={project.repo} target="_blank" rel="noopener noreferrer">
				<Button variant="outline" size="sm" class="gap-2">
					<ExternalLink class="size-3.5" />
					GitHub Repository
				</Button>
			</a>
			{#if project.website}
				<a href={project.website} target="_blank" rel="noopener noreferrer">
					<Button variant="outline" size="sm" class="gap-2">
						<Globe class="size-3.5" />
						Website
					</Button>
				</a>
			{/if}
			{#if cache?.documentation?.docs_url}
				<a href={cache.documentation.docs_url} target="_blank" rel="noopener noreferrer">
					<Button variant="outline" size="sm" class="gap-2">
						<BookOpen class="size-3.5" />
						Documentation
					</Button>
				</a>
			{/if}
			{#if cache?.documentation?.changelog_url}
				<a href={cache.documentation.changelog_url} target="_blank" rel="noopener noreferrer">
					<Button variant="outline" size="sm" class="gap-2">
						<BookOpen class="size-3.5" />
						Changelog
					</Button>
				</a>
			{/if}
		</div>

		<!-- Social share -->
		<SocialShare project={{ name: project.name, short_desc: project.short_desc, slug: project.slug }} />
	</div>

	<!-- Main content grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left column: stats + language -->
		<div class="flex flex-col gap-6 lg:col-span-1">
			<!-- Stats card -->
			<Card class="border-border/70 bg-card/70 backdrop-blur-xs">
				<CardHeader class="pb-2">
					<h2 class="font-semibold text-foreground font-mono text-sm tracking-wide uppercase text-muted-foreground">Stats</h2>
				</CardHeader>
				<CardContent class="flex flex-col gap-3 text-sm">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2 text-muted-foreground">
							<Star class="size-4" />
							Stars
						</div>
						<span class="font-mono font-medium">{project.stars ?? 0}</span>
					</div>
					{#if cache}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-muted-foreground">
								<GitFork class="size-4" />
								Forks
							</div>
							<span class="font-mono font-medium">{cache.stats.forks}</span>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-muted-foreground">
								<Eye class="size-4" />
								Watchers
							</div>
							<span class="font-mono font-medium">{cache.stats.watchers}</span>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-muted-foreground">
								<MessageSquare class="size-4" />
								Open Issues
							</div>
							<span class="font-mono font-medium">{cache.stats.open_issues}</span>
						</div>
					{:else}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-muted-foreground">
								<BookOpen class="size-4" />
								Good First Issues
							</div>
							<span class="font-mono font-medium">{project.good_first_issues ?? 0}</span>
						</div>
					{/if}
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">License</span>
						<Badge variant="outline" class="font-mono text-xs">{project.license}</Badge>
					</div>
				</CardContent>
			</Card>

			<!-- Language breakdown -->
			{#if langEntries().length > 0}
				<Card class="border-border/70 bg-card/70 backdrop-blur-xs">
					<CardHeader class="pb-2">
						<h2 class="font-semibold text-foreground font-mono text-sm tracking-wide uppercase text-muted-foreground">Languages</h2>
					</CardHeader>
					<CardContent class="flex flex-col gap-2 text-sm">
						{#each langEntries() as entry (entry.lang)}
							<div class="flex flex-col gap-1">
								<div class="flex justify-between">
									<span class="text-muted-foreground font-mono text-xs">{entry.lang}</span>
									<span class="font-mono text-xs font-medium">{entry.pct}%</span>
								</div>
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-primary"
										style="width: {entry.pct}%"
									></div>
								</div>
							</div>
						{/each}
					</CardContent>
				</Card>
			{/if}
		</div>

		<!-- Right column: tags, contributors, contributor invite -->
		<div class="flex flex-col gap-6 lg:col-span-2">
			<!-- Tags -->
			<div>
				<h2 class="mb-3 flex items-center gap-2 font-semibold text-foreground">
					<Tag class="size-4" />
					Tags
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each project.tags as tag (tag)}
						<a href="/?tag={tag}">
							<Badge variant="secondary" class="font-mono text-xs cursor-pointer border border-border/40 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-colors">
								{tag}
							</Badge>
						</a>
					{/each}
				</div>
			</div>

			<!-- Contributors -->
			{#if cache && cache.contributors.length > 0}
				<div>
					<h2 class="mb-3 flex items-center gap-2 font-semibold text-foreground">
						<Users class="size-4" />
						Contributors
					</h2>
					<ContributorAvatars contributors={cache.contributors} />
				</div>
			{/if}

			<!-- Looking for contributors message -->
			{#if project.looking_for_contributors}
				<Card class="border-green-500/30 bg-green-500/5">
					<CardContent class="pt-4">
						<div class="flex items-start gap-3">
							<Users class="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />
							<div>
								<h3 class="font-semibold text-foreground">Contributors Welcome</h3>
								<p class="mt-1 text-sm text-muted-foreground">
									This project is actively looking for contributors. Check out their repository for
									issues labeled "good first issue" or "help wanted".
								</p>
								{#if (project.good_first_issues ?? 0) > 0}
									<a
										href="{project.repo}/issues?q=is%3Aopen+label%3A%22good+first+issue%22"
										target="_blank"
										rel="noopener noreferrer"
										class="mt-2 inline-flex"
									>
										<Button variant="outline" size="sm" class="gap-2 text-green-600 dark:text-green-400">
											{project.good_first_issues} good first
											{(project.good_first_issues ?? 0) === 1 ? 'issue' : 'issues'}
										</Button>
									</a>
								{/if}
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Nigeria connection -->
			{#if project.nigeria_connection}
				<div class="text-sm text-muted-foreground">
					<span class="font-medium text-foreground">Nigeria connection:</span>
					{project.nigeria_connection}
					{#if project.nigeria_connection_details}
						— {project.nigeria_connection_details}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Similar projects -->
	{#if similarProjects.length > 0}
		<div class="mt-12 border-t border-border pt-10">
			<SimilarProjects projects={similarProjects} />
		</div>
	{/if}
</article>

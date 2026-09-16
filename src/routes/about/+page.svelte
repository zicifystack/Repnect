<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import BreadcrumbSchema from '$lib/components/BreadcrumbSchema.svelte';
	import { Database, GitBranch, Search, ArrowRight, Code2 } from '@lucide/svelte';

	const title = 'About Repnect';
	const description =
		'Learn how Repnect works — a Git-powered, database-free directory for Nigeria\'s open source ecosystem.';

	const breadcrumbs = [
		{ name: 'Home', url: 'https://repnect.dev' },
		{ name: 'About', url: 'https://repnect.dev/about' }
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="https://repnect.dev/about" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content="https://repnect.dev/about" />
	<meta property="og:image" content="https://repnect.dev/api/og" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://repnect.dev/api/og" />
</svelte:head>

<BreadcrumbSchema crumbs={breadcrumbs} />

<div class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
	<h1 class="mb-4 text-4xl font-bold text-foreground">About Repnect</h1>
	<p class="mb-10 text-lg text-muted-foreground">{description}</p>

	<!-- Mission -->
	<section class="mb-12">
		<h2 class="mb-4 text-2xl font-semibold text-foreground">Our Mission</h2>
		<p class="text-muted-foreground">
			Nigeria has a thriving open source community — but it's scattered across platforms and hard to
			discover. Repnect aims to be the definitive, curated directory of open source projects with
			a strong Nigerian connection: founded by Nigerians, maintained by Nigerian contributors, or serving
			the Nigerian community.
		</p>
		<p class="mt-4 text-muted-foreground">
			We believe in transparency, low friction, and community ownership. That's why every project
			entry lives as a plain TOML file in a public GitHub repository — auditable, forkable, and
			modifiable by anyone via a pull request.
		</p>
	</section>

	<!-- How it works -->
	<section class="mb-12">
		<h2 class="mb-6 text-2xl font-semibold text-foreground">How the Data Layer Works</h2>
		<div class="flex flex-col gap-4">
			<Card>
				<CardContent class="flex gap-4 pt-4">
					<Database class="mt-0.5 size-6 shrink-0 text-primary" />
					<div>
						<h3 class="font-semibold text-foreground">No database, just files</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							Each project is stored as a TOML file in <code class="font-mono text-xs"
								>data/projects/</code
							>. There's no SQL, no ORM, and no migrations — just plain text files in Git.
						</p>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex gap-4 pt-4">
					<GitBranch class="mt-0.5 size-6 shrink-0 text-primary" />
					<div>
						<h3 class="font-semibold text-foreground">Build-time JSON index</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							Before each deployment, a script reads all TOML files, validates them against a Zod
							schema, and writes a static <code class="font-mono text-xs">public/index.json</code>
							search index. The SvelteKit app reads this file at SSR time — no runtime file I/O on
							hot paths.
						</p>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="flex gap-4 pt-4">
					<Search class="mt-0.5 size-6 shrink-0 text-primary" />
					<div>
						<h3 class="font-semibold text-foreground">Client-side search via Fuse.js</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							The JSON index is hydrated to the browser. All search, filtering, and sorting happens
							entirely on the client using Fuse.js — no search API, no round trips, instant results.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- Eligibility -->
	<section class="mb-12">
		<h2 class="mb-4 text-2xl font-semibold text-foreground">Eligibility for Listing</h2>
		<p class="text-muted-foreground">
			A project qualifies for Repnect if it meets at least one of: founded by someone of Nigerian
			origin, has significant Nigerian core contributors, is maintained by an Nigerian organisation, or
			is built primarily to serve the Nigerian community. Projects must be publicly available on
			GitHub with an OSI-approved open source license.
		</p>
	</section>

	<!-- Contributing -->
	<section class="mb-12">
		<h2 class="mb-4 text-2xl font-semibold text-foreground">How to Contribute to the Platform</h2>
		<p class="mb-4 text-muted-foreground">
			Repnect itself is open source. You can contribute by:
		</p>
		<ul class="flex flex-col gap-2 text-muted-foreground">
			<li class="flex items-start gap-2">
				<span class="mt-1 text-primary">•</span>
				Submitting a new project via a pull request to <code class="font-mono text-xs"
					>data/projects/</code
				>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-1 text-primary">•</span>
				Fixing bugs or adding features to the SvelteKit application
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-1 text-primary">•</span>
				Improving the CI scripts (<code class="font-mono text-xs">validate.ts</code>,
				<code class="font-mono text-xs">enrich.ts</code>)
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-1 text-primary">•</span>
				Reporting issues, suggesting categories, or expanding the tag allowlist
			</li>
		</ul>
	</section>

	<div class="flex flex-col gap-3 sm:flex-row">
		<a href="/submit">
			<Button class="gap-2">
				Submit a Project
				<ArrowRight class="size-4" />
			</Button>
		</a>
		<a href="https://github.com/zicifystack/repnect" target="_blank" rel="noopener noreferrer">
			<Button variant="outline" class="gap-2">
				<Code2 class="size-4" />
				View on GitHub
			</Button>
		</a>
	</div>
</div>

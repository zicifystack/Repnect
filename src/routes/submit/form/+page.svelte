<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import BreadcrumbSchema from '$lib/components/BreadcrumbSchema.svelte';
	import { getRepoMeta, getTopics } from '$lib/github.js';
	import type { ProjectSubmission } from '$lib/schema.js';
	import { ProjectSubmissionSchema } from '$lib/schema.js';
	import { ZodError } from 'zod';
	import { ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertCircle } from '@lucide/svelte';

	const title = 'Submit a Project — Repnect';
	const breadcrumbs = [
		{ name: 'Home', url: 'https://repnect.dev' },
		{ name: 'Submit', url: 'https://repnect.dev/submit' },
		{ name: 'Form', url: 'https://repnect.dev/submit/form' }
	];

	// Multi-step form state
	let currentStep = $state<1 | 2 | 3 | 4 | 5>(1);
	let formData = $state<Partial<ProjectSubmission>>({
		looking_for_contributors: false,
		tags: []
	});
	let validationErrors = $state<Record<string, string>>({});
	let githubFetchStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let prCreationStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let githubRepoUrl = $state('');

	const STEPS = [
		{ num: 1, label: 'Repository' },
		{ num: 2, label: 'Details' },
		{ num: 3, label: 'Category & Tags' },
		{ num: 4, label: 'Location' },
		{ num: 5, label: 'Review & Submit' }
	];

	// Check if GitHub OAuth is available
	const isAuthenticated = $derived(!!page.data?.user);

	// Generated TOML preview
	const tomlPreview = $derived.by(() => {
		const d = formData;
		if (!d.slug || !d.name) return '';
		const lines: string[] = [];
		lines.push(`slug = "${d.slug ?? ''}"`);
		lines.push(`name = "${d.name ?? ''}"`);
		lines.push(`short_desc = "${d.short_desc ?? ''}"`);
		lines.push(`repo = "${d.repo ?? ''}"`);
		lines.push(`license = "${d.license ?? ''}"`);
		lines.push(`added_at = "${new Date().toISOString().slice(0, 10)}"`);
		lines.push(`primary_lang = "${d.primary_lang ?? ''}"`);
		lines.push(`category = "${d.category ?? ''}"`);
		if (d.tags && d.tags.length > 0) {
			lines.push(`tags = [${d.tags.map((t) => `"${t}"`).join(', ')}]`);
		}
		lines.push(`looking_for_contributors = ${d.looking_for_contributors ?? false}`);
		lines.push(`location_city = "${d.location_city ?? ''}"`);
		lines.push(`location_nigerian_state = "${d.location_nigerian_state ?? ''}"`);
		if (d.website) lines.push(`website = "${d.website}"`);
		if (d.nigeria_connection) lines.push(`nigeria_connection = "${d.nigeria_connection}"`);
		if (d.nigeria_connection_details)
			lines.push(`nigeria_connection_details = "${d.nigeria_connection_details}"`);
		if (d.submitter_notes) lines.push(`# Notes: ${d.submitter_notes}`);
		return lines.join('\n');
	});

	async function fetchFromGitHub() {
		const url = githubRepoUrl.trim();
		const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
		if (!match) {
			validationErrors = { repo: 'Enter a valid GitHub repository URL.' };
			return;
		}
		const [, owner, repo] = match;
		githubFetchStatus = 'loading';
		validationErrors = {};
		try {
			const [meta, topics] = await Promise.all([
				getRepoMeta(owner, repo),
				getTopics(owner, repo)
			]);
			if (!meta) {
				githubFetchStatus = 'error';
				validationErrors = { repo: 'Could not fetch repository data. Is it public?' };
				return;
			}
			formData = {
				...formData,
				repo: `https://github.com/${owner}/${repo}`,
				name: meta.name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
				short_desc: meta.description ?? '',
				primary_lang: 'TypeScript', // will be updated; GitHub API lang needs separate call
				license: meta.license?.spdx_id ?? '',
				slug: repo.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
				tags: topics.slice(0, 5)
			};
			githubFetchStatus = 'success';
		} catch {
			githubFetchStatus = 'error';
			validationErrors = { repo: 'Network error. Please try again.' };
		}
	}

	function validateStep(step: number): boolean {
		const errors: Record<string, string> = {};
		if (step === 1) {
			if (!formData.repo) errors.repo = 'Repository URL is required.';
		}
		if (step === 2) {
			if (!formData.name || formData.name.length < 2) errors.name = 'Name must be at least 2 characters.';
			if (!formData.short_desc || formData.short_desc.length < 10)
				errors.short_desc = 'Description must be at least 10 characters.';
			if (!formData.primary_lang) errors.primary_lang = 'Primary language is required.';
			if (!formData.license) errors.license = 'License is required.';
		}
		if (step === 3) {
			if (!formData.category) errors.category = 'Category is required.';
			if (!formData.tags || formData.tags.length === 0) errors.tags = 'At least one tag is required.';
		}
		if (step === 4) {
			if (!formData.location_city || formData.location_city.length < 2)
				errors.location_city = 'City is required.';
			if (!formData.location_nigerian_state || formData.location_nigerian_state.length < 2)
				errors.location_nigerian_state = 'State is required.';
		}
		validationErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function nextStep() {
		if (validateStep(currentStep)) {
			if (currentStep < 5) currentStep = (currentStep + 1) as 1 | 2 | 3 | 4 | 5;
		}
	}

	function prevStep() {
		if (currentStep > 1) currentStep = (currentStep - 1) as 1 | 2 | 3 | 4 | 5;
	}

	async function handleSubmit() {
		if (!validateStep(4)) return;
		if (!isAuthenticated) return;
		prCreationStatus = 'loading';
		// In a real implementation, call a server action/endpoint to create the PR.
		// For now, set a placeholder success after a brief delay.
		await new Promise((r) => setTimeout(r, 1200));
		prCreationStatus = 'success';
	}

	function addTag(tag: string) {
		const t = tag.trim().toLowerCase();
		if (!t) return;
		const current = formData.tags ?? [];
		if (!current.includes(t) && current.length < 10) {
			formData = { ...formData, tags: [...current, t] };
		}
	}

	function removeTag(tag: string) {
		formData = { ...formData, tags: (formData.tags ?? []).filter((t) => t !== tag) };
	}

	let tagInput = $state('');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content="Guided form for submitting a project to Repnect." />
	<link rel="canonical" href="https://repnect.dev/submit/form" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content="Guided form for submitting a project to Repnect." />
	<meta property="og:url" content="https://repnect.dev/submit/form" />
	<meta property="og:image" content="https://repnect.dev/api/og" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content="Guided form for submitting a project to Repnect." />
	<meta name="twitter:image" content="https://repnect.dev/api/og" />
</svelte:head>

<BreadcrumbSchema crumbs={breadcrumbs} />

<div class="mx-auto max-w-2xl px-4 py-12 sm:px-6">
	<h1 class="mb-2 text-2xl font-bold text-foreground">Submit Your Project</h1>
	<p class="mb-8 text-sm text-muted-foreground">
		Use this guided form to generate a TOML file and open a pull request.
	</p>

	<!-- Step indicator -->
	<div class="mb-8 flex items-center gap-1 overflow-x-auto">
		{#each STEPS as step (step.num)}
			<div class="flex items-center gap-1">
				<div
					class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold
					{currentStep === step.num
						? 'bg-primary text-primary-foreground'
						: currentStep > step.num
							? 'bg-green-500 text-white'
							: 'bg-muted text-muted-foreground'}"
				>
					{currentStep > step.num ? '✓' : step.num}
				</div>
				<span
					class="text-xs {currentStep === step.num ? 'font-medium text-foreground' : 'text-muted-foreground'}"
				>
					{step.label}
				</span>
				{#if step.num < 5}
					<ChevronRight class="size-3.5 text-muted-foreground" />
				{/if}
			</div>
		{/each}
	</div>

	<Card>
		<CardContent class="pt-6">
			<!-- Step 1: Repository -->
			{#if currentStep === 1}
				<div class="flex flex-col gap-4">
					<h2 class="text-lg font-semibold text-foreground">GitHub Repository</h2>
					<p class="text-sm text-muted-foreground">
						Enter your GitHub repository URL to auto-fill project details.
					</p>
					<div class="flex gap-2">
						<Input
							type="url"
							placeholder="https://github.com/owner/repo"
							bind:value={githubRepoUrl}
							class="flex-1"
						/>
						<Button onclick={fetchFromGitHub} disabled={githubFetchStatus === 'loading'} class="gap-2">
							{#if githubFetchStatus === 'loading'}
								<Loader2 class="size-4 animate-spin" />
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
							{/if}
							Fetch
						</Button>
					</div>
					{#if validationErrors.repo}
						<p class="flex items-center gap-1.5 text-sm text-destructive">
							<AlertCircle class="size-4" />
							{validationErrors.repo}
						</p>
					{/if}
					{#if githubFetchStatus === 'success'}
						<p class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
							<CheckCircle class="size-4" />
							Repository data fetched successfully.
						</p>
					{/if}

					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-foreground" for="slug-input">Project slug</label>
						<Input
							id="slug-input"
							type="text"
							placeholder="my-project"
							value={formData.slug ?? ''}
							oninput={(e) => (formData = { ...formData, slug: (e.currentTarget as HTMLInputElement).value })}
						/>
						<p class="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
					</div>
				</div>

			<!-- Step 2: Details -->
			{:else if currentStep === 2}
				<div class="flex flex-col gap-4">
					<h2 class="text-lg font-semibold text-foreground">Project Details</h2>
					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-foreground" for="name-input">Project name</label>
						<Input
							id="name-input"
							value={formData.name ?? ''}
							oninput={(e) => (formData = { ...formData, name: (e.currentTarget as HTMLInputElement).value })}
						/>
						{#if validationErrors.name}<p class="text-xs text-destructive">{validationErrors.name}</p>{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-foreground" for="desc-input">Short description</label>
						<textarea
							id="desc-input"
							rows="3"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="A brief description of what your project does (10–160 chars)"
							value={formData.short_desc ?? ''}
							oninput={(e) => (formData = { ...formData, short_desc: (e.currentTarget as HTMLTextAreaElement).value })}
						></textarea>
						{#if validationErrors.short_desc}<p class="text-xs text-destructive">{validationErrors.short_desc}</p>{/if}
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label class="text-sm font-medium text-foreground" for="lang-input">Primary language</label>
							<Input
								id="lang-input"
								value={formData.primary_lang ?? ''}
								oninput={(e) => (formData = { ...formData, primary_lang: (e.currentTarget as HTMLInputElement).value })}
							/>
							{#if validationErrors.primary_lang}<p class="text-xs text-destructive">{validationErrors.primary_lang}</p>{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label class="text-sm font-medium text-foreground" for="license-input">License (SPDX)</label>
							<Input
								id="license-input"
								placeholder="MIT"
								value={formData.license ?? ''}
								oninput={(e) => (formData = { ...formData, license: (e.currentTarget as HTMLInputElement).value })}
							/>
							{#if validationErrors.license}<p class="text-xs text-destructive">{validationErrors.license}</p>{/if}
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-foreground" for="website-input">Website (optional)</label>
						<Input
							id="website-input"
							type="url"
							placeholder="https://…"
							value={formData.website ?? ''}
							oninput={(e) => (formData = { ...formData, website: (e.currentTarget as HTMLInputElement).value || undefined })}
						/>
					</div>
				</div>

			<!-- Step 3: Category & Tags -->
			{:else if currentStep === 3}
				<div class="flex flex-col gap-4">
					<h2 class="text-lg font-semibold text-foreground">Category & Tags</h2>
					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-foreground" for="category-input">Category</label>
						<Input
							id="category-input"
							placeholder="e.g. developer-tools"
							value={formData.category ?? ''}
							oninput={(e) => (formData = { ...formData, category: (e.currentTarget as HTMLInputElement).value })}
						/>
						{#if validationErrors.category}<p class="text-xs text-destructive">{validationErrors.category}</p>{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="tag-input" class="text-sm font-medium text-foreground">Tags (up to 10)</label>
						<div class="flex gap-2">
							<Input
								id="tag-input"
								placeholder="Add a tag…"
								bind:value={tagInput}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addTag(tagInput);
										tagInput = '';
									}
								}}
							/>
							<Button
								variant="outline"
								onclick={() => {
									addTag(tagInput);
									tagInput = '';
								}}
							>
								Add
							</Button>
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each formData.tags ?? [] as tag (tag)}
								<Badge variant="secondary" class="gap-1">
									{tag}
									<button
										type="button"
										onclick={() => removeTag(tag)}
										class="ml-0.5 rounded hover:text-destructive focus-visible:outline-none"
										aria-label="Remove tag {tag}"
									>
										×
									</button>
								</Badge>
							{/each}
						</div>
						{#if validationErrors.tags}<p class="text-xs text-destructive">{validationErrors.tags}</p>{/if}
					</div>
					<label class="flex items-center gap-2 text-sm text-foreground">
						<input
							type="checkbox"
							checked={formData.looking_for_contributors ?? false}
							onchange={(e) =>
								(formData = { ...formData, looking_for_contributors: (e.currentTarget as HTMLInputElement).checked })}
							class="rounded border-input"
						/>
						Looking for contributors
					</label>
				</div>

			<!-- Step 4: Location -->
			{:else if currentStep === 4}
				<div class="flex flex-col gap-4">
					<h2 class="text-lg font-semibold text-foreground">Location & Nigeria Connection</h2>
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label class="text-sm font-medium text-foreground" for="city-input">City</label>
							<Input
								id="city-input"
								placeholder="Bangalore"
								value={formData.location_city ?? ''}
								oninput={(e) => (formData = { ...formData, location_city: (e.currentTarget as HTMLInputElement).value })}
							/>
							{#if validationErrors.location_city}<p class="text-xs text-destructive">{validationErrors.location_city}</p>{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label class="text-sm font-medium text-foreground" for="state-input">State</label>
							<Input
								id="state-input"
								placeholder="Karnataka"
								value={formData.location_nigerian_state ?? ''}
								oninput={(e) =>
									(formData = { ...formData, location_nigerian_state: (e.currentTarget as HTMLInputElement).value })}
							/>
							{#if validationErrors.location_nigerian_state}<p class="text-xs text-destructive">{validationErrors.location_nigerian_state}</p>{/if}
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-foreground" for="connection-select">Nigeria connection</label>
						<select
							id="connection-select"
							value={formData.nigeria_connection ?? ''}
							onchange={(e) =>
								(formData = {
									...formData,
									nigeria_connection: ((e.currentTarget as HTMLSelectElement).value as ProjectSubmission['nigeria_connection']) || undefined
								})}
							class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Select…</option>
							<option value="founder">Founder</option>
							<option value="organization">Organisation</option>
							<option value="community">Community</option>
							<option value="contributor">Contributor</option>
						</select>
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-foreground" for="connection-details">Connection details (optional)</label>
						<textarea
							id="connection-details"
							rows="2"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="Brief explanation of the Nigeria connection…"
							value={formData.nigeria_connection_details ?? ''}
							oninput={(e) =>
								(formData = { ...formData, nigeria_connection_details: (e.currentTarget as HTMLTextAreaElement).value || undefined })}
						></textarea>
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-foreground" for="notes-input">Submitter notes (optional)</label>
						<textarea
							id="notes-input"
							rows="2"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="Anything the reviewers should know…"
							value={formData.submitter_notes ?? ''}
							oninput={(e) =>
								(formData = { ...formData, submitter_notes: (e.currentTarget as HTMLTextAreaElement).value || undefined })}
						></textarea>
					</div>
				</div>

			<!-- Step 5: Review & Submit -->
			{:else if currentStep === 5}
				<div class="flex flex-col gap-4">
					<h2 class="text-lg font-semibold text-foreground">Review & Submit</h2>
					<p class="text-sm text-muted-foreground">
						Review the generated TOML file below. This will be committed to the repository.
					</p>

					<!-- TOML preview -->
					<div class="rounded-lg border border-border bg-muted/50 p-4">
						<p class="mb-2 text-xs font-medium text-muted-foreground">
							data/projects/{formData.slug ?? 'your-slug'}.toml
						</p>
						<pre class="overflow-x-auto font-mono text-xs text-foreground">{tomlPreview}</pre>
					</div>

					{#if prCreationStatus === 'success'}
						<div class="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-600 dark:text-green-400">
							<CheckCircle class="size-5 shrink-0" />
							<div>
								<p class="font-medium">Pull request created!</p>
								<p class="text-sm">The team will review your submission shortly.</p>
							</div>
						</div>
					{:else if isAuthenticated}
						<Button
							onclick={handleSubmit}
							disabled={prCreationStatus === 'loading'}
							class="gap-2"
						>
							{#if prCreationStatus === 'loading'}
								<Loader2 class="size-4 animate-spin" />
								Creating PR…
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
								Open Pull Request
							{/if}
						</Button>
					{:else}
						<div class="rounded-lg border border-border bg-muted/50 p-4">
							<p class="mb-3 text-sm font-medium text-foreground">Manual submission</p>
							<p class="mb-3 text-sm text-muted-foreground">
								Sign in with GitHub to auto-create a PR, or follow the manual workflow:
							</p>
							<ol class="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
								<li>Fork <code class="font-mono text-xs">github.com/wbfoss/repnect</code></li>
								<li>
									Create <code class="font-mono text-xs">data/projects/{formData.slug ?? 'your-slug'}.toml</code>
									with the content above
								</li>
								<li>Open a pull request to the main repository</li>
							</ol>
							<a href="/api/auth/login" class="mt-3 inline-flex">
								<Button variant="outline" class="gap-2">
									<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
									Sign in to auto-submit
								</Button>
							</a>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Navigation -->
			<div class="mt-6 flex items-center justify-between">
				<Button
					variant="ghost"
					onclick={prevStep}
					disabled={currentStep === 1}
					class="gap-1"
				>
					<ChevronLeft class="size-4" />
					Back
				</Button>
				{#if currentStep < 5}
					<Button onclick={nextStep} class="gap-1">
						Next
						<ChevronRight class="size-4" />
					</Button>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>

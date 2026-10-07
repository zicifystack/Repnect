<script lang="ts">
	import { resolve } from '$app/paths';
	import { CheckCircle2, AlertCircle } from '@lucide/svelte';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Card } from '$lib/components/ui/card';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import SubmitRepoAutofill from '$lib/components/directory/SubmitRepoAutofill.svelte';
	import SubmitYamlPreview from '$lib/components/directory/SubmitYamlPreview.svelte';
	import type { GitHubRepoDetails } from '$lib/server/directory/service';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let id = $state('');
	let name = $state('');
	let description = $state('');
	let websiteUrl = $state('');
	let logoUrl = $state('');
	let githubRepo = $state('');
	let primaryLanguage = $state('');
	let category = $state('developer-tools');
	let tags = $state('');
	let locationCity = $state('Lagos');
	let locationState = $state('Lagos');
	let nigeriaConnection = $state('founder');
	let connectionDetails = $state('');

	let uploadingLogo = $state(false);
	let uploadError = $state('');

	function handleAutofill(details: GitHubRepoDetails) {
		name = details.name;
		id = details.slug;
		if (details.description) {
			description = details.description;
		}
		if (details.websiteUrl) {
			websiteUrl = details.websiteUrl;
		}
		githubRepo = details.fullName;
		if (details.language) {
			primaryLanguage = details.language;
		}
		if (details.tags.length > 0) {
			tags = details.tags.join(', ');
		}
		if (!logoUrl && details.logoUrl) {
			logoUrl = details.logoUrl;
		}

		const matchedCat = data.categories.find((c) =>
			details.tags.some(
				(t) =>
					t.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(t.toLowerCase())
			)
		);
		if (matchedCat) {
			category = matchedCat;
		}
	}

	function updateSlug() {
		if (
			!id ||
			id ===
				name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.slice(0, -1)
		) {
			id = name
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
		}
	}

	async function handleLogoUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		uploadingLogo = true;
		uploadError = '';
		try {
			const body = new FormData();
			body.append('file', file);
			const res = await fetch(resolve('/api/directory/upload'), {
				method: 'POST',
				body
			});
			if (!res.ok) {
				const resData = (await res.json().catch(() => ({}))) as { message?: string };
				throw new Error(resData.message || 'Upload failed');
			}
			const resData = (await res.json()) as { url: string };
			logoUrl = resData.url;
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Logo upload failed';
		} finally {
			uploadingLogo = false;
		}
	}

	const liveYaml = $derived(`id: ${id || 'my-project'}
name: "${name || 'My Project'}"
description: "${description.replace(/"/g, '\\"') || 'Project description'}"
website_url: ${websiteUrl || 'https://example.com'}
${logoUrl ? `logo_url: ${logoUrl}\n` : ''}${githubRepo ? `github_repo: ${githubRepo}\n` : ''}${primaryLanguage ? `primary_language: ${primaryLanguage}\n` : ''}category: ${category}
tags: [${
		tags
			? tags
					.split(',')
					.map((t) => `"${t.trim()}"`)
					.join(', ')
			: '"nigeria"'
	}]

# Location
location_city: "${locationCity}"
location_state: "${locationState}"

# Nigeria connection
nigeria_connection: ${nigeriaConnection}
nigeria_connection_details: "${connectionDetails.replace(/"/g, '\\"') || 'Details on Nigerian connection'}"

# Auto-updated fields
stars: 0
good_first_issues: 0
verified: false
updated_at: ${new Date().toISOString()}`);
</script>

<Seo
	title="Submit a Project | Nigeria Tech Directory"
	description="Submit your Nigerian startup, dev tool, or open-source project to the directory via web form or GitHub Pull Request."
/>

<section class="mx-auto max-w-5xl px-6 py-10 sm:py-14">
	<div class="mb-4">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href={resolve('/directory')}>Directory</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Submit Project</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>

	<div class="mb-8">
		<h1 class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
			Submit a Project
		</h1>
		<p class="mt-1.5 text-sm text-muted-foreground sm:text-base">
			Submit your Nigerian startup or open-source repo via this verified form or open a Pull
			Request.
		</p>
	</div>

	{#if form?.success}
		<Card class="border-success/30 bg-success/10 p-6 sm:p-8">
			<div class="flex items-center gap-3">
				<CheckCircle2 class="size-6 text-success shrink-0" />
				<div>
					<h2 class="text-lg font-bold text-foreground">Project Submitted Successfully!</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Your project <strong>{form.item.name}</strong> has been received and queued for community
						verification.
					</p>
				</div>
			</div>
			<div class="mt-6 flex gap-3">
				<Button href={resolve('/directory')} variant="default">Return to Directory</Button>
				<Button variant="outline" onclick={() => location.reload()}>Submit Another</Button>
			</div>
		</Card>
	{:else}
		{#if form?.error}
			<div
				class="mb-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
			>
				<AlertCircle class="size-4 shrink-0" />
				<span>{form.error}</span>
			</div>
		{/if}

		<div class="grid gap-8 lg:grid-cols-2">
			<div class="space-y-6">
				<SubmitRepoAutofill bind:repo={githubRepo} onAutofill={handleAutofill} />

				<form method="POST" class="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
					<div class="space-y-1.5">
						<label for="name" class="text-xs font-semibold text-foreground">Project Name *</label>
						<input
							id="name"
							name="name"
							required
							placeholder="e.g. Paystack Python SDK"
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
							bind:value={name}
							oninput={updateSlug}
						/>
					</div>

					<div class="space-y-1.5">
						<label for="id" class="text-xs font-semibold text-foreground">Identifier / Slug *</label
						>
						<input
							id="id"
							name="id"
							required
							placeholder="e.g. paystack-python"
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
							bind:value={id}
						/>
					</div>

					<div class="space-y-1.5">
						<label for="description" class="text-xs font-semibold text-foreground"
							>Short Description *</label
						>
						<textarea
							id="description"
							name="description"
							required
							rows={3}
							placeholder="What does this project or startup do?"
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
							bind:value={description}></textarea>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-1.5">
							<label for="website_url" class="text-xs font-semibold text-foreground"
								>Website URL *</label
							>
							<input
								id="website_url"
								name="website_url"
								type="url"
								required
								placeholder="https://..."
								class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
								bind:value={websiteUrl}
							/>
						</div>

						<div class="space-y-1.5">
							<label for="github_repo" class="text-xs font-semibold text-foreground"
								>GitHub Repo</label
							>
							<input
								id="github_repo"
								name="github_repo"
								placeholder="e.g. author/repo"
								class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
								bind:value={githubRepo}
							/>
						</div>
					</div>

					<div class="space-y-1.5">
						<label for="primary_language" class="text-xs font-semibold text-foreground"
							>Primary Language</label
						>
						<input
							id="primary_language"
							name="primary_language"
							placeholder="e.g. TypeScript, Python, Go, Rust"
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
							bind:value={primaryLanguage}
						/>
					</div>

					<div class="space-y-1.5">
						<label for="logo_upload" class="text-xs font-semibold text-foreground"
							>Project Logo</label
						>
						<div class="flex items-center gap-3">
							<input
								id="logo_upload"
								type="file"
								accept="image/png,image/jpeg,image/webp,image/svg+xml"
								class="text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary-500/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-link hover:file:bg-primary-500/20"
								onchange={handleLogoUpload}
							/>
							{#if uploadingLogo}
								<span class="text-xs text-muted-foreground">Uploading...</span>
							{/if}
						</div>
						{#if uploadError}
							<p class="text-xs text-destructive">{uploadError}</p>
						{/if}
						<input type="hidden" name="logo_url" value={logoUrl} />
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-1.5">
							<label for="category" class="text-xs font-semibold text-foreground">Category *</label>
							<select
								id="category"
								name="category"
								class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground capitalize focus:outline-hidden focus:ring-2 focus:ring-ring"
								bind:value={category}
							>
								{#each data.categories as cat (cat)}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</div>

						<div class="space-y-1.5">
							<label for="tags" class="text-xs font-semibold text-foreground"
								>Tags (comma-separated)</label
							>
							<input
								id="tags"
								name="tags"
								placeholder="python, fintech, payments"
								class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
								bind:value={tags}
							/>
						</div>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-1.5">
							<label for="location_city" class="text-xs font-semibold text-foreground">City *</label
							>
							<input
								id="location_city"
								name="location_city"
								required
								placeholder="e.g. Lagos, Abuja, Ibadan"
								class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
								bind:value={locationCity}
							/>
						</div>

						<div class="space-y-1.5">
							<label for="location_state" class="text-xs font-semibold text-foreground"
								>State *</label
							>
							<select
								id="location_state"
								name="location_state"
								class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
								bind:value={locationState}
							>
								{#each data.states as st (st)}
									<option value={st}>{st}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="space-y-1.5">
						<label for="nigeria_connection" class="text-xs font-semibold text-foreground"
							>Nigeria Connection *</label
						>
						<select
							id="nigeria_connection"
							name="nigeria_connection"
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground capitalize focus:outline-hidden focus:ring-2 focus:ring-ring"
							bind:value={nigeriaConnection}
						>
							{#each data.connections as conn (conn)}
								<option value={conn}>{conn.replace(/_/g, ' ')}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-1.5">
						<label for="nigeria_connection_details" class="text-xs font-semibold text-foreground"
							>Connection Details *</label
						>
						<textarea
							id="nigeria_connection_details"
							name="nigeria_connection_details"
							required
							rows={2}
							placeholder="Explain how this project is connected to Nigeria..."
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
							bind:value={connectionDetails}></textarea>
					</div>

					<div class="pt-2">
						<Button type="submit" variant="default" class="w-full">Submit for Review</Button>
					</div>
				</form>
			</div>

			<SubmitYamlPreview {liveYaml} slug={id} {logoUrl} />
		</div>
	{/if}
</section>

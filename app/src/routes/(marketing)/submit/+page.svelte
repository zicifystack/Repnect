<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let id = $state('');
	let name = $state('');
	let description = $state('');
	let websiteUrl = $state('');
	let logoUrl = $state('');
	let githubRepo = $state('');
	let category = $state(data.categories[0]);
	let tags = $state('');
	let locationCity = $state('Lagos');
	let locationState = $state('Lagos');
	let nigeriaConnection = $state(data.connections[0]);
	let connectionDetails = $state('');

	let uploadingLogo = $state(false);
	let uploadError = $state('');

	function updateSlug() {
		if (!id || id === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, -1)) {
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
				const data = (await res.json().catch(() => ({}))) as { message?: string };
				throw new Error(data.message || 'Upload failed');
			}
			const data = (await res.json()) as { url: string };
			logoUrl = data.url;
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
${logoUrl ? `logo_url: ${logoUrl}` : ''}
${githubRepo ? `github_repo: ${githubRepo}` : ''}
category: ${category}
tags: [${tags ? tags.split(',').map((t) => `"${t.trim()}"`).join(', ') : '"nigeria"'}]

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

	const ghPrUrl = $derived(
		`https://github.com/Isaac/repnect/new/main?filename=data/projects/${id || 'project'}.yaml&value=${encodeURIComponent(liveYaml)}`
	);

	let copied = $state(false);
	function copyYaml() {
		navigator.clipboard.writeText(liveYaml);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<Seo
	title="Submit a Project | Nigeria Tech Directory"
	description="Submit your Nigerian startup, dev tool, or open-source project to the directory via web form or GitHub Pull Request."
/>

<section class="mx-auto max-w-5xl px-6 py-12">
	<div class="mb-8">
		<a href={resolve('/directory')} class="text-sm font-medium text-link hover:underline">
			← Back to Directory
		</a>
		<h1 class="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			Submit a Project
		</h1>
		<p class="mt-2 text-muted-foreground">
			Submit via this form or open a Pull Request directly on GitHub.
		</p>
	</div>

	{#if form?.success}
		<div class="rounded-xl border border-success/30 bg-success/10 p-6">
			<h2 class="text-lg font-semibold text-success">Project Submitted Successfully!</h2>
			<p class="mt-1 text-sm text-foreground">
				Your project <strong>{form.item.name}</strong> has been received and queued for verification.
			</p>
			<div class="mt-4 flex gap-3">
				<Button href={resolve('/directory')} variant="default">Return to Directory</Button>
				<Button variant="outline" onclick={() => location.reload()}>Submit Another</Button>
			</div>
		</div>
	{:else}
		{#if form?.error}
			<div class="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<div class="grid gap-8 lg:grid-cols-2">
			<form method="POST" class="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
				<div class="space-y-1.5">
					<Label for="name">Project Name *</Label>
					<Input
						id="name"
						name="name"
						required
						placeholder="e.g. Paystack Python SDK"
						bind:value={name}
						oninput={updateSlug}
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="id">Identifier / Slug *</Label>
					<Input
						id="id"
						name="id"
						required
						placeholder="e.g. paystack-python"
						bind:value={id}
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="description">Short Description *</Label>
					<Textarea
						id="description"
						name="description"
						required
						rows={3}
						placeholder="What does this project or startup do?"
						bind:value={description}
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="website_url">Website URL *</Label>
						<Input
							id="website_url"
							name="website_url"
							type="url"
							required
							placeholder="https://..."
							bind:value={websiteUrl}
						/>
					</div>

					<div class="space-y-1.5">
						<Label for="github_repo">GitHub Repo (owner/repo)</Label>
						<Input
							id="github_repo"
							name="github_repo"
							placeholder="e.g. author/repo"
							bind:value={githubRepo}
						/>
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="logo_upload">Project Logo (R2 Storage)</Label>
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
						<Label for="category">Category *</Label>
						<select
							id="category"
							name="category"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden"
							bind:value={category}
						>
							{#each data.categories as cat}
								<option value={cat}>{cat}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-1.5">
						<Label for="tags">Tags (comma-separated)</Label>
						<Input
							id="tags"
							name="tags"
							placeholder="python, fintech, payments"
							bind:value={tags}
						/>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="location_city">City *</Label>
						<Input
							id="location_city"
							name="location_city"
							required
							placeholder="e.g. Lagos, Abuja, Ibadan"
							bind:value={locationCity}
						/>
					</div>

					<div class="space-y-1.5">
						<Label for="location_state">State *</Label>
						<select
							id="location_state"
							name="location_state"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden"
							bind:value={locationState}
						>
							{#each data.states as st}
								<option value={st}>{st}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="nigeria_connection">Nigeria Connection *</Label>
					<select
						id="nigeria_connection"
						name="nigeria_connection"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden"
						bind:value={nigeriaConnection}
					>
						{#each data.connections as conn}
							<option value={conn}>{conn.replace(/_/g, ' ')}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-1.5">
					<Label for="nigeria_connection_details">Connection Details *</Label>
					<Textarea
						id="nigeria_connection_details"
						name="nigeria_connection_details"
						required
						rows={2}
						placeholder="Explain how this project is connected to Nigeria..."
						bind:value={connectionDetails}
					/>
				</div>

				<div class="pt-2">
					<Button type="submit" variant="default" class="w-full">
						Submit for Review
					</Button>
				</div>
			</form>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-semibold text-foreground">Generated YAML Definition</h2>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="sm" onclick={copyYaml}>
							{copied ? 'Copied!' : 'Copy YAML'}
						</Button>
						<Button
							href={ghPrUrl}
							variant="default"
							size="sm"
							target="_blank"
							rel="noreferrer"
						>
							Create GitHub PR ↗
						</Button>
					</div>
				</div>

				<p class="text-xs text-muted-foreground">
					Clicking <strong>Create GitHub PR</strong> takes you directly to GitHub with the pre-filled YAML file ready to commit to a new branch!
				</p>

				{#if logoUrl}
					<div class="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
						<img src={logoUrl} alt="Logo preview" class="h-10 w-10 rounded-md object-contain" />
						<div class="text-xs">
							<p class="font-medium text-foreground">Logo Attached (R2)</p>
							<p class="text-muted-foreground truncate max-w-xs">{logoUrl}</p>
						</div>
					</div>
				{/if}

				<pre class="overflow-x-auto rounded-xl border border-border bg-muted/60 p-4 font-mono text-xs text-foreground">{liveYaml}</pre>
			</div>
		</div>
	{/if}
</section>

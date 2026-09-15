<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
	import { getRepoMeta, getTopics, getLanguages } from '$lib/github.js';
	import { RESERVED_SLUGS } from '$lib/schema.js';
	import {
		Copy,
		Check,
		Download,
		ExternalLink,
		Loader2,
		GitPullRequest,
		Sparkles,
		Plus,
		X,
		AlertTriangle,
		CheckCircle2,
		Code2,
		FileCode,
		ChevronDown
	} from '@lucide/svelte';

	interface CategoryOption {
		id: string;
		label: string;
		description?: string;
	}

	let { categories = [] }: { categories?: CategoryOption[] } = $props();

	// Form State
	let repoUrl = $state('');
	let slug = $state('');
	let name = $state('');
	let shortDesc = $state('');
	let primaryLang = $state('TypeScript');
	let license = $state('MIT');
	let category = $state('developer-tools');
	let tags = $state<string[]>(['open-source', 'developer-tools']);
	let tagInput = $state('');
	let lookingForContributors = $state(true);
	let locationCity = $state('Bengaluru');
	let locationNigerianState = $state('Karnataka');

	// Optional Fields
	let website = $state('');
	let nigeriaConnection = $state<'founder' | 'organization' | 'community' | 'contributor' | ''>('founder');
	let nigeriaConnectionDetails = $state('');
	let submitterNotes = $state('');
	let showOptional = $state(false);

	// Status states
	let fetchingGitHub = $state(false);
	let fetchError = $state<string | null>(null);
	let fetchSuccess = $state(false);
	let copied = $state(false);

	const NigeriaN_STATES = [
		'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
		'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
		'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
		'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
		'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
		'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Chandigarh', 'Puducherry'
	];

	const COMMON_LICENSES = ['MIT', 'Apache-2.0', 'GPL-3.0', 'AGPL-3.0', 'BSD-2-Clause', 'BSD-3-Clause', 'MPL-2.0', 'ISC', 'Unlicense'];
	const COMMON_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin', 'C++', 'C', 'PHP', 'Ruby', 'Swift', 'Dart'];
	const SUGGESTED_TAGS = ['open-source', 'developer-tools', 'cli', 'web', 'ai', 'database', 'library', 'framework', 'automation'];

	// Real-time Slug formatting
	function formatSlug(value: string): string {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function handleSlugInput(e: Event) {
		const val = (e.currentTarget as HTMLInputElement).value;
		slug = formatSlug(val);
	}

	// Tag handlers
	function addTag(tag: string) {
		const clean = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
		if (clean && !tags.includes(clean) && tags.length < 10) {
			tags = [...tags, clean];
		}
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			if (tagInput.trim()) {
				addTag(tagInput);
				tagInput = '';
			}
		}
	}

	// GitHub Autofill
	async function autofillFromGitHub() {
		fetchError = null;
		fetchSuccess = false;
		const trimmed = repoUrl.trim();
		const match = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/);
		if (!match) {
			fetchError = 'Please enter a valid GitHub URL (e.g. https://github.com/owner/repo)';
			return;
		}

		const [, owner, repo] = match;
		const cleanRepo = repo.replace(/\.git$/, '');
		fetchingGitHub = true;

		try {
			const [meta, topics, languages] = await Promise.all([
				getRepoMeta(owner, cleanRepo),
				getTopics(owner, cleanRepo),
				getLanguages(owner, cleanRepo)
			]);

			if (!meta) {
				fetchError = `Could not find public repository: ${owner}/${cleanRepo}`;
				return;
			}

			repoUrl = `https://github.com/${owner}/${cleanRepo}`;
			slug = formatSlug(cleanRepo);
			name = meta.name
				.replace(/[-_]/g, ' ')
				.replace(/\b\w/g, (char) => char.toUpperCase());

			if (meta.description) {
				shortDesc = meta.description.slice(0, 160);
			}

			if (meta.license?.spdx_id && meta.license.spdx_id !== 'NOASSERTION') {
				license = meta.license.spdx_id;
			}

			// Top language
			const langEntries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
			if (langEntries.length > 0) {
				primaryLang = langEntries[0][0];
			}

			// Topics as tags
			if (topics.length > 0) {
				const uniqueTopics = Array.from(new Set([...tags, ...topics.slice(0, 6)]));
				tags = uniqueTopics.slice(0, 10);
			}

			fetchSuccess = true;
		} catch {
			fetchError = 'Network error fetching repository details.';
		} finally {
			fetchingGitHub = false;
		}
	}

	// Validation
	const validationState = $derived.by(() => {
		const errors: string[] = [];
		if (!slug) errors.push('Slug is required');
		else if (slug.length < 2 || slug.length > 60) errors.push('Slug must be 2-60 characters');
		else if (RESERVED_SLUGS.includes(slug)) errors.push(`"${slug}" is a reserved slug`);

		if (!name) errors.push('Project name is required');
		else if (name.length < 2 || name.length > 80) errors.push('Name must be 2-80 characters');

		if (!shortDesc) errors.push('Short description is required');
		else if (shortDesc.length < 10 || shortDesc.length > 160) errors.push('Description must be 10-160 characters');

		if (!repoUrl) errors.push('GitHub repository URL is required');
		else if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(repoUrl)) errors.push('Repository must be a valid GitHub HTTPS URL');

		if (!primaryLang) errors.push('Primary language is required');
		if (!license) errors.push('License is required');
		if (!category) errors.push('Category is required');
		if (tags.length === 0) errors.push('At least one tag is required');
		if (!locationCity) errors.push('City is required');
		if (!locationNigerianState) errors.push('Nigerian State is required');

		return {
			isValid: errors.length === 0,
			errors
		};
	});

	// Live Generated TOML
	const generatedToml = $derived.by(() => {
		const today = new Date().toISOString().slice(0, 10);
		const lines: string[] = [];

		lines.push(`slug = "${slug || 'your-slug'}"`);
		lines.push(`name = "${name.replace(/"/g, '\\"') || 'Your Project Name'}"`);
		lines.push(`short_desc = "${shortDesc.replace(/"/g, '\\"') || 'A short description of the project.'}"`);
		lines.push(`repo = "${repoUrl || 'https://github.com/owner/repo'}"`);
		lines.push(`license = "${license || 'MIT'}"`);
		lines.push(`added_at = "${today}"`);
		lines.push(`primary_lang = "${primaryLang || 'TypeScript'}"`);
		lines.push(`category = "${category || 'developer-tools'}"`);
		
		const tagList = tags.length > 0 ? tags : ['open-source'];
		lines.push(`tags = [${tagList.map((t) => `"${t}"`).join(', ')}]`);
		lines.push(`looking_for_contributors = ${lookingForContributors}`);
		lines.push(`location_city = "${locationCity.replace(/"/g, '\\"') || 'Bengaluru'}"`);
		lines.push(`location_nigerian_state = "${locationNigerianState.replace(/"/g, '\\"') || 'Karnataka'}"`);

		// Optional block
		const optionals: string[] = [];
		if (website.trim()) {
			optionals.push(`website = "${website.trim()}"`);
		}
		if (nigeriaConnection) {
			optionals.push(`nigeria_connection = "${nigeriaConnection}"`);
		}
		if (nigeriaConnectionDetails.trim()) {
			optionals.push(`nigeria_connection_details = "${nigeriaConnectionDetails.trim().replace(/"/g, '\\"')}"`);
		}

		if (optionals.length > 0) {
			lines.push('');
			lines.push('# Optional fields');
			lines.push(...optionals);
		}

		if (submitterNotes.trim()) {
			lines.push('');
			lines.push(`# Submitter notes: ${submitterNotes.trim()}`);
		}

		return lines.join('\n');
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedToml);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy TOML', err);
		}
	}

	function downloadTomlFile() {
		const filename = `${slug || 'project'}.toml`;
		const blob = new Blob([generatedToml], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	const githubWebEditUrl = $derived.by(() => {
		const filename = `data/projects/${slug || 'project'}.toml`;
		const encodedVal = encodeURIComponent(generatedToml);
		return `https://github.com/wbfoss/repnect/new/main?filename=${filename}&value=${encodedVal}`;
	});
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
	<!-- Left: Form Inputs -->
	<div class="flex flex-col gap-6 lg:col-span-7">
		<!-- GitHub Autofill Card -->
		<Card class="border-primary/30 bg-primary/5 shadow-xs">
			<CardContent class="p-5 flex flex-col gap-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
						<Sparkles class="size-4" />
						<span>Quick Autofill via GitHub</span>
					</div>
					<Badge variant="outline" class="font-mono text-[10px] border-primary/30 text-primary">Recommended</Badge>
				</div>
				<p class="text-xs text-muted-foreground">
					Paste your public GitHub repository URL to automatically fill in details, description, primary language, topics, and license.
				</p>
				<div class="flex flex-col sm:flex-row gap-2">
					<Input
						type="url"
						placeholder="https://github.com/owner/repository"
						bind:value={repoUrl}
						class="font-mono text-xs bg-background/80 flex-1 border-border/80"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								autofillFromGitHub();
							}
						}}
					/>
					<Button
						type="button"
						onclick={autofillFromGitHub}
						disabled={fetchingGitHub || !repoUrl.trim()}
						class="gap-1.5 font-mono text-xs shrink-0"
					>
						{#if fetchingGitHub}
							<Loader2 class="size-3.5 animate-spin" />
							Fetching…
						{:else}
							<Sparkles class="size-3.5" />
							Autofill
						{/if}
					</Button>
				</div>
				{#if fetchError}
					<p class="flex items-center gap-1.5 font-mono text-xs text-destructive">
						<AlertTriangle class="size-3.5 shrink-0" />
						{fetchError}
					</p>
				{:else if fetchSuccess}
					<p class="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
						<CheckCircle2 class="size-3.5 shrink-0" />
						Repository metadata fetched successfully!
					</p>
				{/if}
			</CardContent>
		</Card>

		<!-- Main Details Card -->
		<Card class="border-border/70 bg-card/70 backdrop-blur-xs">
			<CardHeader class="pb-3">
				<h2 class="font-semibold text-foreground text-base flex items-center gap-2">
					<Code2 class="size-4 text-primary" />
					Core Project Information
				</h2>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<!-- Slug & Name -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-mono font-medium text-foreground flex items-center justify-between" for="project-slug">
							<span>Slug *</span>
							<span class="text-[10px] text-muted-foreground">{slug.length}/60</span>
						</label>
						<Input
							id="project-slug"
							type="text"
							placeholder="e.g. repnect"
							value={slug}
							oninput={handleSlugInput}
							class="font-mono text-xs bg-muted/20 border-border/70"
						/>
						<p class="text-[11px] text-muted-foreground">Used as file name: <code class="font-mono text-[10px]">data/projects/{slug || 'slug'}.toml</code></p>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-mono font-medium text-foreground flex items-center justify-between" for="project-name">
							<span>Project Name *</span>
							<span class="text-[10px] text-muted-foreground">{name.length}/80</span>
						</label>
						<Input
							id="project-name"
							type="text"
							placeholder="e.g. Repnect"
							bind:value={name}
							class="text-xs bg-muted/20 border-border/70"
						/>
					</div>
				</div>

				<!-- Short Description -->
				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-mono font-medium text-foreground flex items-center justify-between" for="project-desc">
						<span>Short Description *</span>
						<span class="text-[10px] {shortDesc.length < 10 || shortDesc.length > 160 ? 'text-amber-400 font-medium' : 'text-muted-foreground'}">
							{shortDesc.length}/160 (min 10)
						</span>
					</label>
					<textarea
						id="project-desc"
						rows="3"
						placeholder="A concise, punchy description of what your project accomplishes (10 to 160 characters)"
						bind:value={shortDesc}
						class="w-full rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50"
					></textarea>
				</div>

				<!-- Repo & Primary Language -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-mono font-medium text-foreground" for="project-repo">
							Repository URL *
						</label>
						<Input
							id="project-repo"
							type="url"
							placeholder="https://github.com/owner/repo"
							bind:value={repoUrl}
							class="font-mono text-xs bg-muted/20 border-border/70"
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-mono font-medium text-foreground" for="project-lang">
							Primary Language *
						</label>
						<Input
							id="project-lang"
							type="text"
							list="languages-list"
							placeholder="e.g. TypeScript"
							bind:value={primaryLang}
							class="font-mono text-xs bg-muted/20 border-border/70"
						/>
						<datalist id="languages-list">
							{#each COMMON_LANGUAGES as lang}
								<option value={lang}></option>
							{/each}
						</datalist>
					</div>
				</div>

				<!-- License & Category -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-mono font-medium text-foreground" for="project-license">
							License (SPDX) *
						</label>
						<Input
							id="project-license"
							type="text"
							list="license-list"
							placeholder="MIT"
							bind:value={license}
							class="font-mono text-xs bg-muted/20 border-border/70"
						/>
						<datalist id="license-list">
							{#each COMMON_LICENSES as lic}
								<option value={lic}></option>
							{/each}
						</datalist>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-mono font-medium text-foreground" for="project-category">
							Category *
						</label>
						<select
							id="project-category"
							bind:value={category}
							class="w-full rounded-md border border-border/70 bg-muted/40 px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{#if categories.length > 0}
								{#each categories as cat}
									<option value={cat.id}>{cat.label}</option>
								{/each}
							{:else}
								<option value="developer-tools">Developer Tools</option>
								<option value="web">Web</option>
								<option value="ai-ml">AI / ML</option>
								<option value="data">Data</option>
								<option value="security">Security</option>
								<option value="devops">DevOps</option>
								<option value="mobile">Mobile</option>
								<option value="education">Education</option>
								<option value="productivity">Productivity</option>
							{/if}
						</select>
					</div>
				</div>

				<!-- Tags -->
				<div class="flex flex-col gap-2">
					<label class="text-xs font-mono font-medium text-foreground flex items-center justify-between" for="tag-input-field">
						<span>Tags ({tags.length}/10) *</span>
						<span class="text-[10px] text-muted-foreground">Press Enter or comma to add</span>
					</label>
					<div class="flex gap-2">
						<Input
							id="tag-input-field"
							type="text"
							placeholder="Add tag (e.g. svelte, rust, cli)..."
							bind:value={tagInput}
							onkeydown={handleTagKeydown}
							class="font-mono text-xs bg-muted/20 border-border/70 flex-1"
						/>
						<Button
							type="button"
							variant="outline"
							onclick={() => {
								if (tagInput.trim()) {
									addTag(tagInput);
									tagInput = '';
								}
							}}
							class="font-mono text-xs gap-1"
						>
							<Plus class="size-3" />
							Add
						</Button>
					</div>

					<!-- Current tag pills -->
					<div class="flex flex-wrap gap-1.5 pt-1">
						{#each tags as tag (tag)}
							<Badge variant="secondary" class="font-mono text-[11px] gap-1 px-2 py-0.5 border border-border/50 rounded-md">
								{tag}
								<button
									type="button"
									onclick={() => removeTag(tag)}
									class="ml-0.5 rounded text-muted-foreground hover:text-destructive focus-visible:outline-none"
									aria-label="Remove {tag}"
								>
									<X class="size-3" />
								</button>
							</Badge>
						{/each}
					</div>

					<!-- Suggested tags -->
					<div class="flex flex-wrap items-center gap-1 pt-1 text-[11px] text-muted-foreground">
						<span class="font-mono text-[10px]">Suggestions:</span>
						{#each SUGGESTED_TAGS.filter((s) => !tags.includes(s)).slice(0, 5) as sug}
							<button
								type="button"
								onclick={() => addTag(sug)}
								class="rounded border border-border/50 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
							>
								+{sug}
							</button>
						{/each}
					</div>
				</div>

				<!-- Location: City & State -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-mono font-medium text-foreground" for="project-city">
							City *
						</label>
						<Input
							id="project-city"
							type="text"
							placeholder="e.g. Bengaluru"
							bind:value={locationCity}
							class="font-mono text-xs bg-muted/20 border-border/70"
						/>
					</div>

					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-mono font-medium text-foreground" for="project-state">
							Nigerian State / UT *
						</label>
						<select
							id="project-state"
							bind:value={locationNigerianState}
							class="w-full rounded-md border border-border/70 bg-muted/40 px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{#each NigeriaN_STATES as st}
								<option value={st}>{st}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Looking for contributors -->
				<div class="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 p-3">
					<input
						type="checkbox"
						id="hiring-toggle"
						bind:checked={lookingForContributors}
						class="size-4 rounded border-border text-primary focus:ring-primary/30 accent-primary"
					/>
					<label for="hiring-toggle" class="flex flex-col cursor-pointer">
						<span class="font-medium text-xs text-foreground">Actively looking for contributors</span>
						<span class="text-[11px] text-muted-foreground">Adds a prominent "Hiring" status badge to help attract developers.</span>
					</label>
				</div>

				<!-- Collapsible Optional Fields -->
				<div class="border-t border-border/50 pt-3">
					<button
						type="button"
						onclick={() => (showOptional = !showOptional)}
						class="flex w-full items-center justify-between font-mono text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
					>
						<span class="font-semibold uppercase tracking-wider text-[11px]">Additional & Nigeria Connection Details</span>
						<ChevronDown class="size-4 transition-transform duration-200 {showOptional ? 'rotate-180' : ''}" />
					</button>

					{#if showOptional}
						<div class="flex flex-col gap-4 pt-3">
							<!-- Website -->
							<div class="flex flex-col gap-1.5">
								<label class="text-xs font-mono font-medium text-foreground" for="project-website">
									Project Website (Optional)
								</label>
								<Input
									id="project-website"
									type="url"
									placeholder="https://yourproject.dev"
									bind:value={website}
									class="font-mono text-xs bg-muted/20 border-border/70"
								/>
							</div>

							<!-- Nigeria Connection Type -->
							<div class="flex flex-col gap-1.5">
								<label class="text-xs font-mono font-medium text-foreground" for="nigeria-connection">
									Nigeria Connection Type
								</label>
								<select
									id="nigeria-connection"
									bind:value={nigeriaConnection}
									class="w-full rounded-md border border-border/70 bg-muted/40 px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<option value="founder">Founder (Founded by Nigerian developer)</option>
									<option value="organization">Organization (Maintained by Nigerian entity)</option>
									<option value="community">Community (Nigerian OSS collective)</option>
									<option value="contributor">Contributor (Core maintainers are Nigerian)</option>
								</select>
							</div>

							<!-- Nigeria Connection Details -->
							<div class="flex flex-col gap-1.5">
								<label class="text-xs font-mono font-medium text-foreground" for="nigeria-details">
									Connection Details (Optional)
								</label>
								<textarea
									id="nigeria-details"
									rows="2"
									placeholder="e.g. Founded and actively maintained by developers based in Bengaluru."
									bind:value={nigeriaConnectionDetails}
									class="w-full rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								></textarea>
							</div>

							<!-- Notes -->
							<div class="flex flex-col gap-1.5">
								<label class="text-xs font-mono font-medium text-foreground" for="submitter-notes">
									Submitter Notes for Reviewers (Optional)
								</label>
								<textarea
									id="submitter-notes"
									rows="2"
									placeholder="Any extra context or links for the directory maintainers..."
									bind:value={submitterNotes}
									class="w-full rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								></textarea>
							</div>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Right: Live Generated TOML Output (Sticky) -->
	<div class="flex flex-col gap-4 lg:col-span-5 lg:sticky lg:top-20">
		<Card class="border-border/80 bg-card/80 backdrop-blur-md shadow-lg overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-muted/40">
				<div class="flex items-center gap-2 font-mono text-xs">
					<FileCode class="size-4 text-primary" />
					<span class="font-semibold text-foreground truncate max-w-[200px]">
						{slug || 'project'}.toml
					</span>
				</div>
				<div>
					{#if validationState.isValid}
						<Badge variant="outline" class="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] gap-1">
							<CheckCircle2 class="size-3" />
							Ready to Submit
						</Badge>
					{:else}
						<Badge variant="outline" class="border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-[10px] gap-1">
							<AlertTriangle class="size-3" />
							{validationState.errors.length} Missing
						</Badge>
					{/if}
				</div>
			</div>

			<!-- Code Output View -->
			<div class="relative bg-black/40 p-4 max-h-[420px] overflow-y-auto">
				<pre class="font-mono text-xs leading-relaxed text-foreground selection:bg-primary/30 selection:text-primary-foreground">{generatedToml}</pre>
			</div>

			<!-- Action Buttons -->
			<CardContent class="p-4 bg-muted/20 border-t border-border/60 flex flex-col gap-2.5">
				<div class="grid grid-cols-2 gap-2">
					<Button
						type="button"
						variant="outline"
						onclick={copyToClipboard}
						class="gap-1.5 font-mono text-xs border-border/80 hover:border-primary/40"
					>
						{#if copied}
							<Check class="size-3.5 text-emerald-400" />
							Copied!
						{:else}
							<Copy class="size-3.5" />
							Copy TOML
						{/if}
					</Button>

					<Button
						type="button"
						variant="outline"
						onclick={downloadTomlFile}
						class="gap-1.5 font-mono text-xs border-border/80 hover:border-primary/40"
					>
						<Download class="size-3.5" />
						Download .toml
					</Button>
				</div>

				<a
					href={githubWebEditUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="w-full"
				>
					<Button
						type="button"
						disabled={!validationState.isValid}
						class="w-full gap-2 font-mono text-xs shadow-sm shadow-primary/25"
					>
						<GitPullRequest class="size-4" />
						Create PR on GitHub
					</Button>
				</a>

				{#if !validationState.isValid}
					<div class="rounded-md border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] font-mono text-amber-300">
						<p class="font-semibold mb-1">Please fix to submit:</p>
						<ul class="list-disc list-inside space-y-0.5 text-muted-foreground">
							{#each validationState.errors.slice(0, 3) as err}
								<li>{err}</li>
							{/each}
						</ul>
					</div>
				{:else}
					<p class="text-center font-mono text-[11px] text-muted-foreground">
						File will be created at <code class="text-foreground">data/projects/{slug}.toml</code>
					</p>
				{/if}
			</CardContent>
		</Card>

		<!-- Fast Instruction Card -->
		<Card class="border-border/60 bg-muted/20 p-4">
			<h3 class="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">How this works</h3>
			<ol class="space-y-1.5 font-mono text-xs text-muted-foreground list-decimal list-inside">
				<li>Fill in or autofill repository details</li>
				<li>Click <strong class="text-foreground">Create PR on GitHub</strong> or download the file</li>
				<li>Submit pull request to <code class="text-foreground">wbfoss/repnect</code></li>
				<li>CI validates the schema & merges upon review</li>
			</ol>
		</Card>
	</div>
</div>

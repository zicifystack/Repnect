<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import VoteButton from '$lib/components/directory/VoteButton.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state(data.filters.search);
	let selectedCategory = $state(data.filters.category);
	let selectedState = $state(data.filters.state);
	let selectedConnection = $state(data.filters.connection);
	let verifiedOnly = $state(data.filters.verifiedOnly);
	let goodFirstIssuesOnly = $state(data.filters.goodFirstIssuesOnly);
	let sortBy = $state(data.filters.sortBy);

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedCategory) params.set('category', selectedCategory);
		if (selectedState) params.set('state', selectedState);
		if (selectedConnection) params.set('connection', selectedConnection);
		if (verifiedOnly) params.set('verified', 'true');
		if (goodFirstIssuesOnly) params.set('issues', 'true');
		if (sortBy && sortBy !== 'stars') params.set('sortBy', sortBy);

		const qs = params.toString();
		goto(resolve(qs ? `/directory?${qs}` : '/directory'), { keepFocus: true });
	}

	function resetFilters() {
		searchQuery = '';
		selectedCategory = '';
		selectedState = '';
		selectedConnection = '';
		verifiedOnly = false;
		goodFirstIssuesOnly = false;
		sortBy = 'stars';
		goto(resolve('/directory'));
	}

	function trackClick(projectId: string, destination: 'website' | 'github') {
		if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
			navigator.sendBeacon(
				resolve('/api/directory/track'),
				JSON.stringify({ type: 'click', projectId, destination })
			);
		}
	}
</script>

<Seo
	title="Nigeria Tech & Open Source Directory"
	description="Curated directory of startups, open-source projects, and developer tools built in Nigeria or with strong Nigerian connections."
/>

<section class="mx-auto max-w-6xl px-6 py-12">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Nigeria Tech Directory</h1>
			<p class="mt-2 text-muted-foreground">
				Discover projects, dev tools, and startups built in Nigeria or founded by Nigerians.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<Button href={resolve('/directory/analytics')} variant="outline">
				Analytics
			</Button>
			<Button href={resolve('/submit')} variant="default">
				+ Submit Project
			</Button>
		</div>
	</div>

	<div class="mt-4 flex flex-wrap items-center gap-2">
		<span class="text-xs font-medium text-muted-foreground">Hubs:</span>
		{#each ['All', 'Lagos', 'FCT Abuja', 'Oyo', 'Rivers', 'Kaduna', 'Enugu', 'Edo'] as hub}
			<button
				type="button"
				class="rounded-full border px-3 py-1 text-xs font-medium transition {(hub === 'All' && !selectedState) || selectedState === hub ? 'border-primary-500 bg-primary-500/10 text-link' : 'border-border bg-background text-muted-foreground hover:bg-muted'}"
				onclick={() => { selectedState = hub === 'All' ? '' : hub; applyFilters(); }}
			>
				{hub}
			</button>
		{/each}
	</div>

	<div class="mt-8 rounded-xl border border-border bg-card p-4 shadow-xs">
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<Input
					type="search"
					placeholder="Search title, city, tags..."
					bind:value={searchQuery}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
			</div>
			<div>
				<select
					aria-label="Filter by Category"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
					bind:value={selectedCategory}
					onchange={applyFilters}
				>
					<option value="">All Categories</option>
					{#each data.categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>
			<div>
				<select
					aria-label="Filter by State"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
					bind:value={selectedState}
					onchange={applyFilters}
				>
					<option value="">All Nigerian States</option>
					{#each data.states as st}
						<option value={st}>{st}</option>
					{/each}
				</select>
			</div>
			<div>
				<select
					aria-label="Filter by Nigeria Connection"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
					bind:value={selectedConnection}
					onchange={applyFilters}
				>
					<option value="">All Connections</option>
					{#each data.connections as conn}
						<option value={conn}>{conn.replace(/_/g, ' ')}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
			<div class="flex flex-wrap items-center gap-4 text-sm">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						class="rounded-sm border-input"
						bind:checked={verifiedOnly}
						onchange={applyFilters}
					/>
					<span>Verified only</span>
				</label>
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						class="rounded-sm border-input"
						bind:checked={goodFirstIssuesOnly}
						onchange={applyFilters}
					/>
					<span>Good First Issues</span>
				</label>
			</div>

			<div class="flex items-center gap-2">
				<select
					aria-label="Sort by"
					class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
					bind:value={sortBy}
					onchange={applyFilters}
				>
					<option value="votes">Top Voted</option>
					<option value="stars">Most Stars</option>
					<option value="newest">Recently Updated</option>
					<option value="name">Alphabetical</option>
				</select>
				<Button variant="ghost" size="sm" onclick={resetFilters}>Reset</Button>
			</div>
		</div>
	</div>

	<div class="mt-8">
		<div class="mb-4 flex items-center justify-between text-sm text-muted-foreground">
			<span>Showing {data.items.length} projects</span>
		</div>

		{#if data.items.length === 0}
			<div class="rounded-xl border border-dashed border-border p-12 text-center">
				<p class="text-lg font-medium">No projects found</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Try clearing your filters or be the first to submit a project!
				</p>
				<div class="mt-6 flex justify-center gap-3">
					<Button variant="outline" onclick={resetFilters}>Reset Filters</Button>
					<Button href={resolve('/submit')} variant="default">Submit a Project</Button>
				</div>
			</div>
		{:else}
			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.items as item (item.id)}
					<div class="flex gap-3.5 rounded-xl border border-border bg-card p-4 shadow-xs transition hover:border-primary-500/50 sm:p-5">
						<div class="pt-0.5 shrink-0">
							<VoteButton
								projectId={item.id}
								initialScore={item.voteScore ?? 0}
								initialUserVote={item.userVote ?? null}
								orientation="vertical"
								size="sm"
							/>
						</div>

						<div class="flex flex-1 flex-col justify-between min-w-0">
							<div>
								<div class="flex items-start justify-between gap-2">
									<div class="flex items-center gap-2.5 min-w-0">
										{#if item.logo_url}
											<img
												src={item.logo_url}
												alt={`${item.name} logo`}
												class="h-8 w-8 shrink-0 rounded-md border border-border bg-background p-0.5 object-contain"
											/>
										{/if}
										<a
											href={resolve(`/directory/${item.id}`)}
											class="text-lg font-semibold text-foreground hover:underline truncate"
										>
											{item.name}
										</a>
									</div>
									{#if item.verified}
										<span class="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
											Verified
										</span>
									{/if}
								</div>

								<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
									<span class="font-medium text-link">{item.category}</span>
									<span>•</span>
									<span>{item.location_city}, {item.location_state}</span>
								</div>

								<p class="mt-3 line-clamp-3 text-sm text-muted-foreground">
									{item.description}
								</p>

								<div class="mt-3 rounded-md bg-muted/50 p-2 text-xs">
									<span class="font-medium text-foreground">Nigeria connection:</span>
									<span class="text-muted-foreground ml-1">
										{item.nigeria_connection_details || item.nigeria_connection}
									</span>
								</div>

								{#if item.tags.length > 0}
									<div class="mt-3 flex flex-wrap gap-1.5">
										{#each item.tags as tag}
											<span class="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
												#{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>

							<div class="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
								<div class="flex items-center gap-3">
									{#if item.stars > 0}
										<span class="flex items-center gap-1 font-medium text-foreground">
											★ {item.stars}
										</span>
									{/if}
									{#if item.good_first_issues > 0}
										<span class="rounded-sm bg-primary-500/10 px-1.5 py-0.5 text-link">
											{item.good_first_issues} issues
										</span>
									{/if}
								</div>

								<div class="flex items-center gap-2">
									{#if item.github_repo}
										<a
											href={`https://github.com/${item.github_repo}`}
											target="_blank"
											rel="noreferrer"
											class="hover:text-foreground hover:underline"
										>
											GitHub
										</a>
									{/if}
									<a
										href={item.website_url}
										target="_blank"
										rel="noreferrer"
										class="font-medium text-link hover:underline"
									>
										Visit ↗
									</a>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

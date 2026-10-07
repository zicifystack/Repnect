<script lang="ts">
	import { resolve } from '$app/paths';
	import { Info } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/Button.svelte';
	import GithubIcon from '$lib/components/icons/GithubIcon.svelte';
	import ProjectViewHero from '$lib/components/directory/ProjectViewHero.svelte';
	import ProjectOverviewTab from '$lib/components/directory/ProjectOverviewTab.svelte';
	import ProjectIntelSidebar from '$lib/components/directory/ProjectIntelSidebar.svelte';
	import ProjectRepoTab from '$lib/components/directory/ProjectRepoTab.svelte';
	import ProjectList from '$lib/components/directory/ProjectList.svelte';
	import ShareCard from '$lib/components/directory/ShareCard.svelte';
	import type { DirectoryItem } from '$lib/server/directory/validation';
	import type { LanguageBreakdown } from '$lib/server/directory/service';

	let {
		item,
		relatedProjects = [],
		metrics,
		voteStats,
		languages = [],
		onTrackClick
	}: {
		item: DirectoryItem;
		relatedProjects?: DirectoryItem[];
		metrics?: { views: number; clicks: number } | null;
		voteStats?: { score: number; userVote?: 'up' | 'down' | null } | null;
		languages?: LanguageBreakdown[];
		onTrackClick?: (destination: 'website' | 'github') => void;
	} = $props();

	let shareDialogOpen = $state(false);
	let activeTab = $state('overview');

	const formattedDate = $derived(
		new Date(item.updated_at).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);
</script>

<div class="min-h-screen bg-background pb-20">
	<ProjectViewHero
		{item}
		{formattedDate}
		{metrics}
		{voteStats}
		{onTrackClick}
		onOpenShare={() => (shareDialogOpen = true)}
	/>

	<div class="mx-auto max-w-6xl px-6 pt-6">
		<div class="flex gap-6 border-b border-border overflow-x-auto">
			<button
				type="button"
				onclick={() => (activeTab = 'overview')}
				class="flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 {activeTab ===
				'overview'
					? 'border-link text-foreground'
					: 'border-transparent text-muted-foreground hover:text-foreground'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xs"
			>
				<Info class="size-4" />
				<span>Overview</span>
			</button>

			{#if item.github_repo}
				<button
					type="button"
					onclick={() => (activeTab = 'repository')}
					class="flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 {activeTab ===
					'repository'
						? 'border-link text-foreground'
						: 'border-transparent text-muted-foreground hover:text-foreground'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xs"
				>
					<GithubIcon class="size-4" />
					<span>Repository & Code</span>
				</button>
			{/if}
		</div>

		<main class="pt-8">
			{#if activeTab === 'overview'}
				<div class="grid gap-8 lg:grid-cols-3">
					<div class="space-y-8 lg:col-span-2">
						<ProjectOverviewTab {item} />

						{#if relatedProjects.length > 0}
							<div class="border-t border-border pt-10">
								<div class="mb-6 flex items-center justify-between">
									<div>
										<h2 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
											Related Projects
										</h2>
										<p class="mt-1 text-xs text-muted-foreground sm:text-sm">
											More Nigerian innovations in <span
												class="capitalize text-foreground font-medium">{item.category}</span
											>
										</p>
									</div>
									<Button
										href={resolve(`/directory?category=${item.category}`)}
										variant="ghost"
										size="sm"
										class="text-link text-xs"
									>
										View all ↗
									</Button>
								</div>

								<ProjectList items={relatedProjects} />
							</div>
						{/if}
					</div>

					<div>
						<div class="sticky top-16">
							<ProjectIntelSidebar
								{item}
								{formattedDate}
								{onTrackClick}
								onOpenShare={() => (shareDialogOpen = true)}
							/>
						</div>
					</div>
				</div>
			{:else if activeTab === 'repository' && item.github_repo}
				<div class="space-y-8">
					<ProjectRepoTab
						repo={item.github_repo}
						stars={item.stars}
						goodFirstIssues={item.good_first_issues}
						{languages}
					/>
				</div>
			{/if}
		</main>
	</div>
</div>

<Dialog.Root bind:open={shareDialogOpen}>
	<Dialog.Content class="sm:max-w-md p-0 border-none bg-transparent shadow-none">
		<ShareCard {item} />
	</Dialog.Content>
</Dialog.Root>

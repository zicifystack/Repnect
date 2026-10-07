<script lang="ts">
	import { resolve } from '$app/paths';
	import { Star, GitPullRequest, ExternalLink, CheckCircle2 } from '@lucide/svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/Button.svelte';
	import GithubIcon from '$lib/components/icons/GithubIcon.svelte';
	import type { TopProjectItem } from '$lib/server/directory/analytics';

	let {
		topStarred = [],
		topContributors = []
	}: {
		topStarred: TopProjectItem[];
		topContributors: TopProjectItem[];
	} = $props();
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-base font-semibold text-foreground">
						Top Starred Repositories
					</CardTitle>
					<CardDescription class="text-xs">
						Most starred open-source projects in the Nigerian tech ecosystem.
					</CardDescription>
				</div>
				<div class="flex size-7 items-center justify-center rounded-lg bg-primary-500/10 text-link">
					<Star class="size-4" />
				</div>
			</div>
		</CardHeader>
		<CardContent class="divide-y divide-border pt-1">
			{#if topStarred.length === 0}
				<p class="py-6 text-center text-xs text-muted-foreground">No repositories found</p>
			{:else}
				{#each topStarred as project, idx (project.id)}
					<div class="flex items-center justify-between gap-3 py-3">
						<div class="flex items-center gap-3 min-w-0">
							<span
								class="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
							>
								{idx + 1}
							</span>

							{#if project.logo_url}
								<img
									src={project.logo_url}
									alt={project.name}
									class="size-8 shrink-0 rounded-lg border border-border bg-background p-0.5 object-contain"
								/>
							{:else}
								<div
									class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-xs font-bold text-link"
								>
									{project.name.slice(0, 2).toUpperCase()}
								</div>
							{/if}

							<div class="min-w-0">
								<div class="flex items-center gap-1.5">
									<a
										href={resolve(`/directory/${project.id}`)}
										class="font-medium text-sm text-foreground hover:text-link hover:underline truncate"
									>
										{project.name}
									</a>
									{#if project.verified}
										<span title="Verified" class="text-success shrink-0">
											<CheckCircle2 class="size-3.5" />
										</span>
									{/if}
								</div>
								<span class="capitalize text-xs text-muted-foreground">{project.category}</span>
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0">
							<Badge variant="secondary" class="gap-1 font-semibold text-xs tabular-nums">
								<Star class="size-3 text-warning fill-warning" />
								{project.stars}
							</Badge>

							{#if project.github_repo}
								<Button
									href={`https://github.com/${project.github_repo}`}
									target="_blank"
									rel="noreferrer"
									variant="ghost"
									size="sm"
									class="size-7 p-0 text-muted-foreground hover:text-foreground"
									aria-label="GitHub repository"
								>
									<GithubIcon class="size-3.5" />
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</CardContent>
	</Card>

	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-base font-semibold text-foreground">Good First Issues</CardTitle>
					<CardDescription class="text-xs">
						Open-source projects welcoming contributors with starter tasks.
					</CardDescription>
				</div>
				<div class="flex size-7 items-center justify-center rounded-lg bg-success/10 text-success">
					<GitPullRequest class="size-4" />
				</div>
			</div>
		</CardHeader>
		<CardContent class="divide-y divide-border pt-1">
			{#if topContributors.length === 0}
				<p class="py-6 text-center text-xs text-muted-foreground">No contributor issues found</p>
			{:else}
				{#each topContributors as project, idx (project.id)}
					<div class="flex items-center justify-between gap-3 py-3">
						<div class="flex items-center gap-3 min-w-0">
							<span
								class="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
							>
								{idx + 1}
							</span>

							{#if project.logo_url}
								<img
									src={project.logo_url}
									alt={project.name}
									class="size-8 shrink-0 rounded-lg border border-border bg-background p-0.5 object-contain"
								/>
							{:else}
								<div
									class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-xs font-bold text-link"
								>
									{project.name.slice(0, 2).toUpperCase()}
								</div>
							{/if}

							<div class="min-w-0">
								<div class="flex items-center gap-1.5">
									<a
										href={resolve(`/directory/${project.id}`)}
										class="font-medium text-sm text-foreground hover:text-link hover:underline truncate"
									>
										{project.name}
									</a>
									{#if project.verified}
										<span title="Verified" class="text-success shrink-0">
											<CheckCircle2 class="size-3.5" />
										</span>
									{/if}
								</div>
								<span class="capitalize text-xs text-muted-foreground">{project.category}</span>
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0">
							<Badge
								variant="outline"
								class="gap-1 font-semibold text-xs tabular-nums text-success border-success/30 bg-success/5"
							>
								<GitPullRequest class="size-3 text-success" />
								{project.good_first_issues} issues
							</Badge>

							{#if project.github_repo}
								<Button
									href={`https://github.com/${project.github_repo}/issues?q=is%3Aissue+is%3Aopen+label%3A"good+first+issue"`}
									target="_blank"
									rel="noreferrer"
									variant="ghost"
									size="sm"
									class="size-7 p-0 text-muted-foreground hover:text-foreground"
									aria-label="View issues on GitHub"
								>
									<ExternalLink class="size-3.5" />
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</CardContent>
	</Card>
</div>

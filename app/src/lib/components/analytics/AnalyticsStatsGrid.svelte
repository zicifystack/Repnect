<script lang="ts">
	import { FolderGit2, Star, GitPullRequest, Code2 } from '@lucide/svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let {
		totalProjects = 0,
		totalCities = 0,
		totalStates = 0,
		totalStars = 0,
		avgStars = 0,
		totalIssues = 0,
		verifiedPercentage = 0,
		verifiedCount = 0,
		openSourceCount = 0,
		openSourcePercentage = 0
	}: {
		totalProjects?: number;
		totalCities?: number;
		totalStates?: number;
		totalStars?: number;
		avgStars?: number;
		totalIssues?: number;
		verifiedPercentage?: number;
		verifiedCount?: number;
		openSourceCount?: number;
		openSourcePercentage?: number;
	} = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="flex flex-row items-center justify-between pb-2">
			<CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				Total Projects
			</CardTitle>
			<div class="flex size-7 items-center justify-center rounded-lg bg-primary-500/10 text-link">
				<FolderGit2 class="size-4" />
			</div>
		</CardHeader>
		<CardContent>
			<div class="flex items-baseline justify-between">
				<p class="text-3xl font-bold tabular-nums text-foreground">{totalProjects}</p>
				<Badge variant="outline" class="text-xs">{totalStates} States</Badge>
			</div>
			<p class="mt-1.5 text-xs text-muted-foreground">Across {totalCities} Nigerian cities</p>
		</CardContent>
	</Card>

	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="flex flex-row items-center justify-between pb-2">
			<CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				Open Source Rate
			</CardTitle>
			<div class="flex size-7 items-center justify-center rounded-lg bg-primary-500/10 text-link">
				<Code2 class="size-4" />
			</div>
		</CardHeader>
		<CardContent>
			<div class="flex items-baseline justify-between">
				<p class="text-3xl font-bold tabular-nums text-foreground">{openSourcePercentage}%</p>
				<Badge variant="outline" class="text-xs">{openSourceCount} repos</Badge>
			</div>
			<p class="mt-1.5 text-xs text-muted-foreground">Public code repositories</p>
		</CardContent>
	</Card>

	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="flex flex-row items-center justify-between pb-2">
			<CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				GitHub Stars
			</CardTitle>
			<div class="flex size-7 items-center justify-center rounded-lg bg-primary-500/10 text-link">
				<Star class="size-4" />
			</div>
		</CardHeader>
		<CardContent>
			<div class="flex items-baseline justify-between">
				<p class="text-3xl font-bold tabular-nums text-foreground">
					★ {totalStars.toLocaleString()}
				</p>
				<span class="text-xs font-medium text-muted-foreground">avg. {avgStars}/proj</span>
			</div>
			<p class="mt-1.5 text-xs text-muted-foreground">Community recognition</p>
		</CardContent>
	</Card>

	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="flex flex-row items-center justify-between pb-2">
			<CardTitle class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				Contributor Issues
			</CardTitle>
			<div class="flex size-7 items-center justify-center rounded-lg bg-success/10 text-success">
				<GitPullRequest class="size-4" />
			</div>
		</CardHeader>
		<CardContent>
			<div class="flex items-baseline justify-between">
				<p class="text-3xl font-bold tabular-nums text-foreground">{totalIssues}</p>
				<Badge variant="secondary" class="text-xs bg-success/10 text-success border-transparent">
					{verifiedPercentage}% verified
				</Badge>
			</div>
			<p class="mt-1.5 text-xs text-muted-foreground">{verifiedCount} verified initiatives</p>
		</CardContent>
	</Card>
</div>

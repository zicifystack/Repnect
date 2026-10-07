<script lang="ts">
	import {
		CheckCircle2,
		ExternalLink,
		GitPullRequest,
		Copy,
		Check,
		Terminal,
		Star,
		Code2
	} from '@lucide/svelte';
	import GithubIcon from '$lib/components/icons/GithubIcon.svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import Button from '$lib/components/ui/Button.svelte';
	import type { LanguageBreakdown } from '$lib/server/directory/service';

	let {
		repo,
		stars = 0,
		goodFirstIssues = 0,
		languages = []
	}: {
		repo: string;
		stars?: number;
		goodFirstIssues?: number;
		languages?: LanguageBreakdown[];
	} = $props();

	let cloneCopied = $state(false);

	const cloneCommand = $derived(`git clone https://github.com/${repo}.git`);

	function copyClone() {
		if (typeof navigator !== 'undefined') {
			navigator.clipboard.writeText(cloneCommand);
			cloneCopied = true;
			setTimeout(() => (cloneCopied = false), 2000);
		}
	}
</script>

<div class="space-y-6">
	<Card class="border-border bg-card shadow-xs">
		<CardHeader class="pb-4">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-3">
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"
					>
						<GithubIcon class="size-6" />
					</div>
					<div>
						<CardTitle class="text-lg font-bold text-foreground">{repo}</CardTitle>
						<CardDescription class="text-xs">
							Open-source source code and developer repository on GitHub.
						</CardDescription>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<Button
						href={`https://github.com/${repo}`}
						target="_blank"
						rel="noreferrer"
						size="sm"
						variant="outline"
						class="gap-1.5"
					>
						<span>Open on GitHub</span>
						<ExternalLink class="size-3.5" />
					</Button>
				</div>
			</div>
		</CardHeader>

		<CardContent class="space-y-6">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="rounded-xl border border-border bg-muted/40 p-4">
					<div class="flex items-center justify-between text-xs text-muted-foreground">
						<span>GitHub Stars</span>
						<Star class="size-3.5 text-warning fill-warning" />
					</div>
					<p class="mt-2 text-3xl font-bold tabular-nums text-foreground">
						{stars.toLocaleString()}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">Community recognition</p>
				</div>

				<div class="rounded-xl border border-border bg-muted/40 p-4">
					<div class="flex items-center justify-between text-xs text-muted-foreground">
						<span>Good First Issues</span>
						<GitPullRequest class="size-3.5 text-success" />
					</div>
					<p class="mt-2 text-3xl font-bold tabular-nums text-link">{goodFirstIssues}</p>
					<p class="mt-1 text-xs text-muted-foreground">Starter tasks for new contributors</p>
				</div>

				<div class="rounded-xl border border-border bg-muted/40 p-4">
					<div class="flex items-center justify-between text-xs text-muted-foreground">
						<span>Repository Status</span>
						<CheckCircle2 class="size-3.5 text-success" />
					</div>
					<p class="mt-2 text-lg font-bold text-success flex items-center gap-1.5">
						<span class="inline-block size-2 rounded-full bg-success"></span>
						Public & Active
					</p>
					<p class="mt-1 text-xs text-muted-foreground">Ready for exploration</p>
				</div>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between text-xs">
					<span class="font-medium text-muted-foreground flex items-center gap-1.5">
						<Terminal class="size-3.5 text-link" />
						Clone Repository
					</span>
					<button
						type="button"
						onclick={copyClone}
						class="text-xs text-link hover:underline flex items-center gap-1 cursor-pointer"
					>
						{#if cloneCopied}
							<Check class="size-3 text-success" />
							<span class="text-success">Copied</span>
						{:else}
							<Copy class="size-3" />
							<span>Copy Command</span>
						{/if}
					</button>
				</div>
				<div
					class="flex items-center justify-between rounded-xl border border-border bg-muted/60 px-4 py-3 font-mono text-xs text-foreground"
				>
					<span class="truncate">{cloneCommand}</span>
					<button
						type="button"
						onclick={copyClone}
						class="ml-3 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
						aria-label="Copy clone command"
					>
						{#if cloneCopied}
							<Check class="size-4 text-success" />
						{:else}
							<Copy class="size-4" />
						{/if}
					</button>
				</div>
			</div>

			{#if goodFirstIssues > 0}
				<div
					class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-success/30 bg-success/5 p-5"
				>
					<div class="flex items-start gap-3">
						<div
							class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success mt-0.5"
						>
							<GitPullRequest class="size-4" />
						</div>
						<div>
							<p class="text-sm font-bold text-foreground">
								Want to contribute to Nigerian Open Source?
							</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								This project has {goodFirstIssues} open issues specifically tagged for beginner and community
								developers.
							</p>
						</div>
					</div>
					<Button
						href={`https://github.com/${repo}/issues?q=is%3Aissue+is%3Aopen+label%3A"good+first+issue"`}
						size="sm"
						variant="default"
						target="_blank"
						rel="noreferrer"
						class="shrink-0 gap-1.5"
					>
						<span>View {goodFirstIssues} Starter Issues</span>
						<ExternalLink class="size-3.5" />
					</Button>
				</div>
			{/if}
		</CardContent>
	</Card>

	{#if languages.length > 0}
		<Card class="border-border bg-card shadow-xs">
			<CardHeader class="pb-3">
				<div class="flex items-center gap-2.5">
					<div
						class="flex size-8 items-center justify-center rounded-lg bg-primary-500/10 text-link"
					>
						<Code2 class="size-4" />
					</div>
					<div>
						<CardTitle class="text-base font-bold text-foreground">Languages Breakdown</CardTitle>
						<CardDescription class="text-xs">
							Code composition of this repository across detected languages.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent class="space-y-5">
				<div class="space-y-3.5">
					{#each languages as lang (lang.name)}
						<div class="space-y-1.5">
							<div class="flex items-center justify-between text-xs">
								<span class="font-medium text-foreground">{lang.name}</span>
								<div class="flex items-center gap-2">
									<span class="font-semibold tabular-nums text-foreground">{lang.percentage}%</span>
									<span class="text-[11px] text-muted-foreground"
										>({(lang.bytes / 1024).toFixed(1)} KB)</span
									>
								</div>
							</div>
							<Progress value={lang.percentage} max={100} class="h-2 bg-muted" />
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

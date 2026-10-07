<script lang="ts">
	import { Github, FileText, Code2, MapPin, Clock } from '@lucide/svelte';

	const steps = [
		{
			number: '01',
			title: 'GitHub Autofill',
			subtitle: 'Optional quickstart',
			description: 'Enter your repo to automatically pull description, tags, stars, and language.',
			icon: Github
		},
		{
			number: '02',
			title: 'Project Basics',
			subtitle: 'Name & URL',
			description: 'Provide your project name, short description, and valid website URL.',
			icon: FileText
		},
		{
			number: '03',
			title: 'Category & Tech',
			subtitle: 'Tags & Language',
			description: 'Choose your ecosystem category and specify primary language and tags.',
			icon: Code2
		},
		{
			number: '04',
			title: 'Nigerian Roots',
			subtitle: 'Location & Story',
			description: 'Select city and state, and share details about your Nigerian connection.',
			icon: MapPin
		},
		{
			number: '05',
			title: 'Review & Approval',
			subtitle: 'Community Verification',
			description: 'Submit your entry. Our moderators verify and approve before going live.',
			icon: Clock
		}
	];
</script>

<div class="mb-10 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
	<div class="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-base font-bold text-foreground sm:text-lg">
				How Project Submission Works
			</h2>
			<p class="text-xs text-muted-foreground sm:text-sm">
				Follow these 5 simple steps to get your project listed and verified on Repnect.
			</p>
		</div>
		<div
			class="inline-flex items-center gap-1.5 self-start rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-link sm:self-auto"
		>
			<span>5 Quick Steps</span>
		</div>
	</div>

	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
		{#each steps as step (step.number)}
			{@const Icon = step.icon}
			<div
				class="relative flex flex-col justify-between rounded-xl border border-border/60 bg-background/50 p-4 transition-all hover:border-primary-500/40 hover:bg-muted/30"
			>
				<div>
					<div class="flex items-center justify-between">
						<span class="text-xs font-extrabold tracking-wider text-muted-foreground">
							{step.number}
						</span>
						<div
							class="flex size-7 items-center justify-center rounded-lg bg-primary-500/10 text-link"
						>
							<Icon class="size-3.5" />
						</div>
					</div>

					<h3 class="mt-3 text-sm font-bold text-foreground">
						{step.title}
					</h3>
					<p class="text-[11px] font-medium text-link">
						{step.subtitle}
					</p>

					<p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">
						{step.description}
					</p>
				</div>
			</div>
		{/each}
	</div>
</div>

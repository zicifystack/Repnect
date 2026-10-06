<script lang="ts">
	import { ArrowRight, CheckCircle2, Compass, MapPin, ShieldCheck, Sparkles, Star, TrendingUp } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/seo/Seo.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as m from '$lib/paraglide/messages';
	import { organizationJsonLd, websiteJsonLd } from '$lib/utils/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const hubs = ['LA', 'AB', 'PH', 'EN', 'IB'];

	const stats = $derived([
		{ value: data.stats.states, label: m.landing_stat_states() },
		{ value: data.stats.categories, label: m.landing_stat_categories() },
		{ value: data.stats.projects, label: m.landing_stat_projects() }
	]);

	const pillars = [
		{ icon: Compass, title: m.feature_auth_title, body: m.feature_auth_body },
		{ icon: ShieldCheck, title: m.feature_speed_title, body: m.feature_speed_body },
		{ icon: TrendingUp, title: m.feature_tested_title, body: m.feature_tested_body }
	];
</script>

<Seo description={m.landing_meta_description()} jsonLd={[websiteJsonLd(), organizationJsonLd()]} />

<section class="relative isolate overflow-hidden border-b border-border">
	<div
		aria-hidden="true"
		class="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:48px_48px]"
	></div>
	<div
		aria-hidden="true"
		class="absolute top-[-10rem] left-1/2 -z-10 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl"
	></div>

	<div class="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
		<Badge variant="outline" href={resolve('/directory/analytics')} class="h-7 gap-1.5 bg-background/60 px-3 backdrop-blur">
			<Sparkles class="text-link" />
			{m.landing_badge()}
			<ArrowRight />
		</Badge>

		<h1 class="mt-8 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
			{m.landing_hero_title()}
			<span class="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent">
				{m.landing_hero_title_accent()}
			</span>
		</h1>

		<p class="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
			{m.landing_hero_subtitle()}
		</p>

		<div class="mt-10 flex flex-wrap items-center justify-center gap-3">
			<Button href={resolve('/directory')} size="lg" class="h-11 px-5 shadow-lg shadow-primary-500/20">
				{m.landing_explore()}
				<ArrowRight data-icon="inline-end" />
			</Button>
			<Button href={resolve('/submit')} variant="outline" size="lg" class="h-11 px-5">
				{m.landing_submit()}
			</Button>
		</div>

		<div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<Avatar.Group>
				{#each hubs as hub (hub)}
					<Avatar.Root class="ring-2 ring-background">
						<Avatar.Fallback class="bg-primary-500/15 text-xs font-semibold text-link">{hub}</Avatar.Fallback>
					</Avatar.Root>
				{/each}
				<Avatar.GroupCount>+{data.stats.states - hubs.length}</Avatar.GroupCount>
			</Avatar.Group>
			<p class="text-sm text-muted-foreground">{m.landing_builders()}</p>
		</div>

		<div class="mx-auto mt-14 flex max-w-xl items-center justify-center gap-6 sm:gap-10">
			{#each stats as stat, i (stat.label)}
				{#if i > 0}
					<Separator orientation="vertical" class="h-10!" />
				{/if}
				<div class="flex flex-col items-center">
					<span class="text-3xl font-bold tracking-tight tabular-nums">{stat.value}</span>
					<span class="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="mx-auto max-w-5xl px-6 py-20 sm:py-24">
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<h2 class="text-2xl font-bold tracking-tight sm:text-3xl">{m.landing_featured_title()}</h2>
			<p class="mt-2 text-sm text-muted-foreground">{m.landing_featured_body()}</p>
		</div>
		<Button href={resolve('/directory')} variant="ghost">
			{m.landing_view_all()}
			<ArrowRight data-icon="inline-end" />
		</Button>
	</div>

	<Tooltip.Provider delayDuration={150}>
		<div class="mt-10 grid gap-5 sm:grid-cols-3">
			{#each data.featured as project (project.id)}
				<article
					class="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/5"
				>
					<div>
						<div class="flex items-center justify-between gap-2">
							<Badge variant="secondary">{project.category}</Badge>
							{#if project.verified}
								<Badge class="bg-success/10 text-success">
									<CheckCircle2 />
									{m.landing_verified()}
								</Badge>
							{/if}
						</div>

						<HoverCard.Root openDelay={200}>
							<HoverCard.Trigger
								href={resolve(`/directory/${project.id}`)}
								class="mt-5 block text-lg font-semibold tracking-tight transition group-hover:text-link"
							>
								{project.name}
							</HoverCard.Trigger>
							<HoverCard.Content class="w-80">
								<div class="flex gap-3">
									<Avatar.Root class="rounded-lg">
										{#if project.logo_url}
											<Avatar.Image src={project.logo_url} alt={project.name} />
										{/if}
										<Avatar.Fallback class="rounded-lg">{project.name.slice(0, 2)}</Avatar.Fallback>
									</Avatar.Root>
									<div class="space-y-1">
										<p class="text-sm font-semibold">{project.name}</p>
										<p class="text-xs text-muted-foreground">{project.nigeria_connection_details}</p>
										<div class="flex flex-wrap gap-1 pt-1">
											{#each project.tags as tag (tag)}
												<Badge variant="outline">#{tag}</Badge>
											{/each}
										</div>
									</div>
								</div>
							</HoverCard.Content>
						</HoverCard.Root>

						<p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
							<MapPin class="size-3" />
							{project.location_city}, {project.location_state}
						</p>
						<p class="mt-4 line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
					</div>

					<Separator class="my-5" />

					<div class="flex items-center justify-between text-xs text-muted-foreground">
						<Tooltip.Root>
							<Tooltip.Trigger class="flex items-center gap-1 font-medium text-foreground">
								<Star class="size-3.5 fill-current text-warning" />
								{project.stars}
							</Tooltip.Trigger>
							<Tooltip.Content>{m.landing_stars({ count: project.stars })}</Tooltip.Content>
						</Tooltip.Root>
						{#if project.good_first_issues > 0}
							<Badge variant="outline" class="text-link">
								{m.landing_issues({ count: project.good_first_issues })}
							</Badge>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	</Tooltip.Provider>
</section>

<section class="border-y border-border bg-muted/30 py-20 sm:py-24">
	<div class="mx-auto max-w-5xl px-6">
		<div class="mx-auto mb-14 max-w-2xl text-center">
			<h2 class="text-2xl font-bold tracking-tight sm:text-3xl">{m.landing_pillars_title()}</h2>
			<p class="mt-3 text-muted-foreground">{m.landing_pillars_body()}</p>
		</div>
		<div class="grid gap-5 sm:grid-cols-3">
			{#each pillars as pillar (pillar.title)}
				<div class="rounded-2xl border border-border bg-card p-6">
					<div class="inline-flex size-10 items-center justify-center rounded-xl bg-primary-500/15 text-link">
						<pillar.icon class="size-5" />
					</div>
					<h3 class="mt-4 font-semibold">{pillar.title()}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body()}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="mx-auto max-w-5xl px-6 py-20 sm:py-24">
	<div
		class="relative overflow-hidden rounded-3xl border border-primary-500/20 bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-14 text-center shadow-2xl shadow-primary-500/20 sm:px-16"
	>
		<div aria-hidden="true" class="absolute -top-24 -right-24 size-72 rounded-full bg-primary-400/30 blur-3xl"></div>
		<h2 class="relative text-3xl font-bold tracking-tight text-primary-foreground">{m.landing_cta_title()}</h2>
		<p class="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">{m.landing_cta_body()}</p>
		<div class="relative mt-8 flex flex-wrap justify-center gap-3">
			<Button href={resolve('/submit')} size="lg" variant="secondary" class="h-11 px-5">
				{m.landing_submit()}
			</Button>
			<Button
				href={resolve('/directory')}
				size="lg"
				variant="outline"
				class="h-11 px-5 border-primary-400/40 bg-primary-700/20 text-primary-foreground hover:bg-primary-700/40 hover:text-primary-foreground"
			>
				{m.landing_browse()}
				<ArrowRight data-icon="inline-end" />
			</Button>
		</div>
	</div>
</section>

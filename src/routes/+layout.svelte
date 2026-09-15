<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setTheme } from '$lib/theme.svelte.js';
	import Header from '$lib/components/Header.svelte';
	import { env } from '$env/dynamic/public';

	let { children } = $props();

	const vercelAnalytics = env.PUBLIC_VERCEL_ANALYTICS;
	const vercelSpeedInsights = env.PUBLIC_VERCEL_SPEED_INSIGHTS;
	const gaMeasurementId = env.PUBLIC_GA_MEASUREMENT_ID;

	$effect(() => {
		const saved = localStorage.getItem('theme');
		setTheme(saved === 'light' ? 'light' : 'dark');
	});

	const orgJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Organization',
				name: 'Repnect',
				url: 'https://repnect.dev',
				logo: 'https://repnect.dev/favicon.png'
			},
			{
				'@type': 'WebSite',
				name: 'Repnect',
				url: 'https://repnect.dev',
				dialog: 'SearchAction',
				potentialAction: {
					'@type': 'SearchAction',
					target: 'https://repnect.dev/?q={search_term_string}',
					'query-input': 'required name=search_term_string'
				}
			}
		]
	});

	// Build script tags as strings to avoid Svelte template parser issues with literal <script tags.
	// Content is fully static/trusted — no user input injected.
	const jsonLdTag = `\x3cscript type="application/ld+json">${orgJsonLd}\x3c/script>`;
	const vercelAnalyticsTag = '\x3cscript async src="/_vercel/insights/script.js">\x3c/script>';
	const vercelSpeedTag = '\x3cscript async src="/_vercel/speed-insights/script.js">\x3c/script>';
	const gaTag = gaMeasurementId
		? `\x3cscript async src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}">\x3c/script>`
		: '';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonLdTag}
	{#if vercelAnalytics === 'true'}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html vercelAnalyticsTag}
	{/if}
	{#if vercelSpeedInsights === 'true'}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html vercelSpeedTag}
	{/if}
	{#if gaMeasurementId}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html gaTag}
	{/if}
</svelte:head>

<Header />
<main>
	{@render children()}
</main>
<footer class="border-t border-border bg-muted/30 px-4 py-6 sm:px-6">
	<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 text-sm text-muted-foreground">
		<p>© {new Date().getFullYear()} Repnect. Open source under MIT.</p>
		<nav aria-label="Footer navigation" class="flex gap-4">
			<a href="/about" class="hover:text-foreground">About</a>
			<a href="/submit" class="hover:text-foreground">Submit</a>
			<a href="https://github.com/wbfoss/repnect" target="_blank" rel="noopener noreferrer" class="hover:text-foreground">GitHub</a>
		</nav>
	</div>
</footer>

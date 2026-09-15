<script lang="ts">
	let { crumbs }: { crumbs: { name: string; url: string }[] } = $props();

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: crumbs.map((crumb, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: crumb.name,
				item: crumb.url
			}))
		})
	);

	// Build the script tag string to avoid Svelte template parser issues
	const scriptTag = $derived(`\x3cscript type="application/ld+json">${jsonLd}\x3c/script>`);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html scriptTag}
</svelte:head>

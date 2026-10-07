<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/seo/Seo.svelte';
	import LandingHero from '$lib/components/landing/LandingHero.svelte';
	import LandingFeatured from '$lib/components/landing/LandingFeatured.svelte';
	import LandingTagCloud from '$lib/components/landing/LandingTagCloud.svelte';
	import * as m from '$lib/paraglide/messages';
	import { organizationJsonLd, websiteJsonLd } from '$lib/utils/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function trackClick(projectId: string, destination: 'website' | 'github') {
		if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
			navigator.sendBeacon(
				resolve('/api/directory/track'),
				JSON.stringify({ type: 'click', projectId, destination })
			);
		}
	}
</script>

<Seo description={m.landing_meta_description()} jsonLd={[websiteJsonLd(), organizationJsonLd()]} />

<LandingHero />

<LandingFeatured featured={data.featured} onTrackClick={trackClick} />

<LandingTagCloud tags={data.tags} />

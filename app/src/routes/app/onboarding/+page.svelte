<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import AvatarUploader from '$lib/components/AvatarUploader.svelte';
	import Seo from '$lib/components/seo/Seo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { SITE } from '$lib/site';
	import * as m from '$lib/paraglide/messages';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let busy = $state(false);
	let error = $state('');
	// svelte-ignore state_referenced_locally
	let displayName = $state(data.user?.name ?? '');

	async function saveProfile() {
		const name = displayName.trim();
		if (!name) {
			error = m.error_generic();
			return;
		}
		busy = true;
		error = '';
		const res = await authClient.updateUser({ name });
		busy = false;
		if (res.error) {
			error = res.error.message ?? m.error_generic();
		}
	}
</script>

<Seo title={m.onboarding_title({ name: SITE.name })} noindex />

<main class="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 p-6">
	<div class="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
		<div class="space-y-1">
			<h1 class="text-xl font-semibold">{m.onboarding_profile_title()}</h1>
			<p class="text-sm text-muted-foreground">{m.onboarding_profile_tagline()}</p>
		</div>

		<AvatarUploader
			name={data.user?.name ?? ''}
			email={data.user?.email ?? ''}
			image={data.user?.image}
			uploadEnabled={data.uploadEnabled}
		/>

		<label class="block space-y-1">
			<span class="text-sm font-medium text-muted-foreground">{m.profile_name_label()}</span>
			<Input bind:value={displayName} maxlength={100} onblur={saveProfile} />
		</label>

		{#if error}
			<p role="alert" class="text-sm text-destructive">{error}</p>
		{/if}

		<div class="flex justify-end pt-2">
			<form method="POST" action="?/finish">
				<Button type="submit" disabled={busy}>
					{m.onboarding_finish()}
				</Button>
			</form>
		</div>
	</div>
</main>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { BarChart3, Plus, ArrowLeft } from '@lucide/svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<div>
	<div class="mb-4">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href={resolve('/directory')}>Directory</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Analytics</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div
				class="inline-flex items-center gap-1.5 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-link"
			>
				<BarChart3 class="size-3.5" />
				<span>Live Pulse</span>
			</div>
			<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
				Ecosystem Analytics
			</h1>
			<p class="mt-1.5 text-sm text-muted-foreground sm:text-base">
				Real-time insights, geographic distribution, and repository activity across Nigerian tech.
			</p>
		</div>

		<div class="flex items-center gap-2.5">
			<Button href={resolve('/directory')} variant="outline" size="sm" class="gap-1.5">
				<ArrowLeft class="size-3.5" />
				<span>Browse Directory</span>
			</Button>
			<Button href={resolve('/submit')} variant="default" size="sm" class="gap-1.5">
				<Plus class="size-4" />
				<span>Submit Project</span>
			</Button>
		</div>
	</div>
</div>

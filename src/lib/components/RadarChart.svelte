<script lang="ts">
	let { states }: { states: { name: string; count: number }[] } = $props();

	// Take top 6 states
	const top6 = $derived(states.slice(0, 6));

	const SIZE = 240;
	const CENTER = SIZE / 2;
	const MAX_R = 90;

	const maxCount = $derived(Math.max(1, ...top6.map((s) => s.count)));

	// Points on a regular hexagon at radius r, starting from top
	function hexPoints(r: number): [number, number][] {
		return Array.from({ length: 6 }, (_, i) => {
			const angle = (Math.PI / 3) * i - Math.PI / 2;
			return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)] as [number, number];
		});
	}

	const gridLevels = [0.25, 0.5, 0.75, 1.0];

	// Polygon path for data
	const dataPoints = $derived(
		top6.map((s, i) => {
			const r = (s.count / maxCount) * MAX_R;
			const angle = (Math.PI / 3) * i - Math.PI / 2;
			return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)] as [number, number];
		})
	);

	function toPath(pts: [number, number][]): string {
		if (pts.length === 0) return '';
		return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
	}

	// Label positions (slightly outside MAX_R)
	const labelPoints = $derived(
		top6.map((_, i) => {
			const r = MAX_R + 22;
			const angle = (Math.PI / 3) * i - Math.PI / 2;
			return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)] as [number, number];
		})
	);
</script>

<svg
	width={SIZE}
	height={SIZE}
	viewBox="0 0 {SIZE} {SIZE}"
	role="img"
	aria-label="Geographic radar chart showing project counts by Nigerian state"
	class="overflow-visible"
>
	<title>Project distribution by state</title>

	<!-- Grid levels -->
	{#each gridLevels as level}
		{@const pts = hexPoints(MAX_R * level)}
		<polygon
			points={pts.map((p) => p.join(',')).join(' ')}
			fill="none"
			stroke="currentColor"
			stroke-opacity="0.15"
			stroke-width="1"
		/>
	{/each}

	<!-- Axis lines -->
	{#each hexPoints(MAX_R) as pt, i}
		<line
			x1={CENTER}
			y1={CENTER}
			x2={pt[0]}
			y2={pt[1]}
			stroke="currentColor"
			stroke-opacity="0.15"
			stroke-width="1"
		/>
	{/each}

	<!-- Data polygon -->
	{#if dataPoints.length > 0}
		<path
			d={toPath(dataPoints)}
			fill="hsl(var(--primary))"
			fill-opacity="0.25"
			stroke="hsl(var(--primary))"
			stroke-width="2"
		/>
		{#each dataPoints as pt, i}
			<circle cx={pt[0]} cy={pt[1]} r="4" fill="hsl(var(--primary))" />
		{/each}
	{/if}

	<!-- Labels -->
	{#each top6 as state, i}
		<text
			x={labelPoints[i][0]}
			y={labelPoints[i][1]}
			text-anchor="middle"
			dominant-baseline="middle"
			class="fill-current text-[9px] text-muted-foreground"
			font-size="9"
			fill="currentColor"
			opacity="0.7"
		>
			{state.name.length > 10 ? state.name.slice(0, 10) + '…' : state.name}
		</text>
	{/each}
</svg>

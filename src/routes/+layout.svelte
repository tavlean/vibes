<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { DialRoot } from 'dialkit/svelte';
	import { AudioEngine } from '$lib/audio/engine.svelte';
	import { setEngine } from '$lib/audio/context';

	let { children } = $props();

	// One engine instance per page-load. Provided here so every descendant
	// component sees the same instance via getEngine().
	const engine = new AudioEngine();
	setEngine(engine);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Vibes</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="theme-color" content="#000000" />
</svelte:head>

{@render children()}

<!--
  DialKit panel — inline mode rendered into our own positioned container so we
  can control placement (right side, vertically centered) and outer padding.
  `productionEnabled` is required because DialKit hides itself in production
  by default; for us, it IS the user-facing UI.
-->
<aside class="vibes-panel" aria-label="Controls">
	<DialRoot mode="inline" theme="dark" productionEnabled />
</aside>

<style>
	.vibes-panel {
		position: fixed;
		right: 2rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		width: 320px;
		max-height: min(80vh, 720px);
		display: flex;
		/* Breathing room around DialKit's own internal padding. */
		padding: 0.5rem;
		border-radius: 14px;
		/* Soft outer halo so the panel separates from the video without being
		   visually loud. */
		background: rgba(0, 0, 0, 0.25);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
	}
	.vibes-panel :global(.dial-root) {
		flex: 1;
		min-height: 0;
		max-height: 100%;
	}

	/* Make DialKit's internals more breathable. The library uses CSS custom
	   properties on its panel root for spacing — these target the rendered
	   panel without touching DialKit's own stylesheet. */
	.vibes-panel :global([class*='panel']) {
		--dk-row-gap: 12px;
	}
	.vibes-panel :global([class*='row']),
	.vibes-panel :global([class*='Row']) {
		padding-block: 6px;
	}
	.vibes-panel :global([class*='folder']) {
		padding-block: 4px;
	}

	@media (max-width: 640px) {
		.vibes-panel {
			right: 1rem;
			left: 1rem;
			width: auto;
		}
	}
</style>

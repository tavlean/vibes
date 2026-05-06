<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { DialRoot } from 'dialkit/svelte';
	import { AudioEngine } from '$lib/audio/engine.svelte';
	import { setEngine } from '$lib/audio/context';
	import TrackList from '$lib/components/TrackList.svelte';

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
  Two-section panel: DialKit (master / play / scene / ambient) on top, our
  custom TrackList below. They share the same outer container so visually it
  reads as one panel.
-->
<aside class="vibes-panel" aria-label="Controls">
	<div class="vibes-panel__dial">
		<DialRoot mode="inline" theme="dark" productionEnabled />
	</div>
	<div class="vibes-panel__divider" aria-hidden="true"></div>
	<div class="vibes-panel__tracks">
		<TrackList />
	</div>
</aside>

<style>
	.vibes-panel {
		position: fixed;
		right: 2rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		width: 320px;
		max-height: min(85vh, 760px);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		/* Breathing room around the inner sections. */
		padding: 0.75rem;
		border-radius: 14px;
		/* Soft outer halo so the panel separates from the video without being
		   visually loud. */
		background: rgba(0, 0, 0, 0.28);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
	}
	.vibes-panel__dial {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
	}
	.vibes-panel__dial :global(.dial-root) {
		flex: 1;
		min-height: 0;
		max-height: 100%;
	}
	.vibes-panel__divider {
		flex: 0 0 auto;
		height: 1px;
		background: rgba(255, 255, 255, 0.06);
		margin: 0.25rem 0;
	}
	.vibes-panel__tracks {
		flex: 0 0 auto;
		max-height: 35vh;
		overflow-y: auto;
		/* Scrollbar styling — keep it thin and unobtrusive. */
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
	}

	/* Make DialKit's internals more breathable. The library uses class names
	   we can target — these are matchers, not exact names, since DialKit's
	   classes are auto-generated. */
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
		.vibes-panel__tracks {
			max-height: 30vh;
		}
	}
</style>

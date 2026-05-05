<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
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

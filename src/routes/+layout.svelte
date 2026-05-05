<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Vibes</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="theme-color" content="#000000" />
</svelte:head>

{@render children()}

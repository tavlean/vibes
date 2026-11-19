<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { setRuntime, type AudioRuntime } from '#lib/audio/context.ts';

	let { children } = $props();

	const siteUrl = 'https://vibes.tavmusic.com/';
	const title = "Vibes - Enjoy T.A.V's Music in Custom Ambiences";
	const description =
		"Enjoy T.A.V's music with custom ambience layers for focused listening sessions.";
	const socialImage = 'https://vibes.tavmusic.com/icon-512.png';

	const runtime = $state<AudioRuntime>({ engine: null });
	setRuntime(runtime);

	onMount(() => {
		let destroyed = false;

		void import('#lib/audio/engine.svelte.ts').then(({ AudioEngine }) => {
			if (destroyed) return;
			runtime.engine = new AudioEngine();
		});

		return () => {
			destroyed = true;
			runtime.engine?.destroy();
			runtime.engine = null;
		};
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={siteUrl} />

	<meta name="application-name" content="Vibes" />
	<meta name="apple-mobile-web-app-title" content="Vibes" />
	<meta name="theme-color" content="#000000" />
	<meta name="color-scheme" content="dark" />

	<link rel="icon" href={asset('favicon.svg')} type="image/svg+xml" />
	<link rel="apple-touch-icon" href={asset('apple-touch-icon.png')} sizes="180x180" />
	<link rel="manifest" href={asset('site.webmanifest')} />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={siteUrl} />
	<meta property="og:site_name" content="Vibes" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={socialImage} />
	<meta property="og:image:width" content="512" />
	<meta property="og:image:height" content="512" />

	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={socialImage} />
</svelte:head>

{@render children()}

<script lang="ts">
	import VideoBackground from '$lib/components/VideoBackground.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import { getEngine } from '$lib/audio/context';

	const engine = getEngine();
</script>

<VideoBackground scene={engine.currentScene} />

<main class="page">
	{#if !engine.isReady}
		<button
			class="start"
			type="button"
			onclick={() => engine.ensureRunning()}
			aria-label="Start audio"
		>
			<span class="start-dot"></span>
			<span>tap to begin</span>
		</button>
	{/if}
</main>

<!-- Controls is invisible: it only declares DialKit values and bridges them
     to the engine. The actual UI lives in <DialRoot /> (mounted in layout). -->
<Controls />

<style>
	.page {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
		display: grid;
		place-items: center;
	}
	.start {
		appearance: none;
		background: rgba(0, 0, 0, 0.45);
		color: var(--vibes-fg);
		border: 1px solid rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		padding: 0.75rem 1.25rem;
		border-radius: 999px;
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.95rem;
		letter-spacing: 0.02em;
		cursor: pointer;
		transition: background 200ms ease;
	}
	.start:hover,
	.start:focus-visible {
		background: rgba(0, 0, 0, 0.65);
		outline: none;
	}
	.start-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: oklch(0.85 0.15 150);
		box-shadow: 0 0 12px oklch(0.85 0.15 150 / 0.6);
	}
</style>

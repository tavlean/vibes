<script lang="ts">
	import VideoBackground from '$lib/components/VideoBackground.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import { getEngine } from '$lib/audio/context';

	const engine = getEngine();

	function onkeydown(event: KeyboardEvent) {
		// Ignore shortcuts while typing into a form/contenteditable (e.g.
		// DialKit's text-edit slider input or its preset name field).
		const target = event.target as HTMLElement | null;
		const tag = target?.tagName;
		const typing =
			tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable === true;
		if (typing) return;

		if (event.code === 'Space') {
			event.preventDefault();
			void engine.toggle();
		}
	}
</script>

<svelte:window {onkeydown} />

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
		animation: fade-in 600ms ease-out both;
	}
	.start:hover,
	.start:focus-visible {
		background: rgba(0, 0, 0, 0.65);
		outline: none;
	}
	.start:focus-visible {
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.45);
	}
	.start-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: oklch(0.85 0.15 150);
		box-shadow: 0 0 12px oklch(0.85 0.15 150 / 0.6);
	}
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

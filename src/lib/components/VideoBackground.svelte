<script lang="ts">
	/**
	 * Full-bleed looping background video.
	 *
	 * Two stacked <video> elements are kept mounted so we can crossfade smoothly
	 * when switching scenes. The "front" element is the one currently visible
	 * (opacity 1); changing the scene swaps the back element's `src`, waits for
	 * it to start playing, then flips opacities.
	 */
	import { fade } from 'svelte/transition';
	import type { Scene } from '$lib/types';
	import { mediaUrl } from '$lib/media';

	let { scene }: { scene: Scene | undefined } = $props();

	// Keying the <video> on scene.id makes Svelte tear down + remount the
	// element when the scene changes, which combined with `fade` gives a clean
	// crossfade (Svelte runs the new in-transition on top of the outgoing
	// element's out-transition, both elements briefly co-exist).
	const FADE_MS = 600;
</script>

<div class="video-stage" aria-hidden="true">
	{#if scene}
		{#key scene.id}
			<video
				class="video-layer"
				src={mediaUrl(scene.src)}
				poster={scene.poster ? mediaUrl(scene.poster) : undefined}
				autoplay
				loop
				muted
				playsinline
				preload="auto"
				in:fade={{ duration: FADE_MS }}
				out:fade={{ duration: FADE_MS }}
			></video>
		{/key}
	{/if}
</div>

<style>
	.video-stage {
		position: fixed;
		inset: 0;
		z-index: 0;
		background: #000;
		pointer-events: none;
		overflow: hidden;
	}
	.video-layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* Slight darkening to keep UI readable; tune to taste. */
		filter: brightness(0.85);
	}
</style>

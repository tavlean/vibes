<script lang="ts">
	/**
	 * Full-bleed looping background video.
	 *
	 * Keying the <video> on scene.id makes Svelte tear down + remount the
	 * element when the scene changes; the in/out fade transitions briefly
	 * co-exist for a clean crossfade.
	 */
	import { fade } from 'svelte/transition';
	import type { Scene } from '#lib/types.ts';
	import { mediaUrl } from '#lib/media.ts';

	let { scene }: { scene: Scene | undefined } = $props();

	const FADE_MS = 600;
</script>

<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden="true">
	{#if scene}
		{#key scene.id}
			<video
				class="absolute inset-0 size-full object-cover brightness-[0.85]"
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

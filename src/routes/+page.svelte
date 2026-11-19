<script lang="ts">
	import VideoBackground from '#lib/components/VideoBackground.svelte';
	import Controls from '#lib/components/Controls.svelte';
	import { defaults, scenes } from '#lib/catalog.ts';
	import { SHOW_SCENES } from '#lib/config.ts';
	import { getRuntime } from '#lib/audio/context.ts';

	const runtime = getRuntime();
	const defaultScene = scenes.find((scene) => scene.id === defaults.sceneId);
	const scene = $derived(runtime.engine?.currentScene ?? defaultScene);

	function onkeydown(event: KeyboardEvent) {
		const engine = runtime.engine;
		if (!engine) return;

		// Ignore shortcuts while typing into a form/contenteditable (we don't
		// have any such inputs today, but this keeps Space-to-toggle from
		// hijacking text entry if one is ever added).
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

<!-- Scene-driven video background — hidden behind SHOW_SCENES. See docs/scenes.md. -->
{#if SHOW_SCENES}
	<VideoBackground {scene} />
{/if}

<!-- The first user interaction with any control (Play action in the panel,
     a track button, an ambient slider) unlocks the AudioContext via the
     engine's ensureRunning(). No separate "tap to begin" affordance needed. -->
<Controls />

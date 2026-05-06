<script lang="ts">
	import VideoBackground from '$lib/components/VideoBackground.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import { getEngine } from '$lib/audio/context';

	const engine = getEngine();

	function onkeydown(event: KeyboardEvent) {
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

<VideoBackground scene={engine.currentScene} />

<!-- The first user interaction with any control (Play action in the panel,
     a track button, an ambient slider) unlocks the AudioContext via the
     engine's ensureRunning(). No separate "tap to begin" affordance needed. -->
<Controls />

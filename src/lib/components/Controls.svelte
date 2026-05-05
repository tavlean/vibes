<script lang="ts">
	/**
	 * The single source of truth for all controls.
	 *
	 * DialKit is configured here and its reactive `values` object is bridged to
	 * the AudioEngine via $effect. We don't render any custom controls — DialKit
	 * provides the entire panel (master volume, track picker, play/pause button,
	 * scene picker, and a folder with one slider per ambient layer).
	 */
	import { createDialKit } from 'dialkit/svelte';
	import { ambientLayers, defaults, scenes, tracks } from '$lib/catalog';
	import { getEngine } from '$lib/audio/context';
	import type { AmbientLayerId } from '$lib/types';

	const engine = getEngine();

	const trackOptions = tracks.map((t) => ({ value: t.id, label: t.title }));
	const sceneOptions = scenes.map((s) => ({ value: s.id, label: s.title }));

	const values = createDialKit(
		'Vibes',
		{
			master: [defaults.masterVolume, 0, 1] as [number, number, number],
			track: {
				type: 'select' as const,
				options: trackOptions,
				default: defaults.trackId
			},
			play: { type: 'action' as const, label: 'Play / Pause' },
			scene: {
				type: 'select' as const,
				options: sceneOptions,
				default: defaults.sceneId
			},
			ambient: {
				rain: [0, 0, 1] as [number, number, number],
				thunder: [0, 0, 1] as [number, number, number],
				traffic: [0, 0, 1] as [number, number, number],
				cafe: [0, 0, 1] as [number, number, number],
				fireplace: [0, 0, 1] as [number, number, number],
				vinyl: [0, 0, 1] as [number, number, number]
			}
		},
		{
			onAction: async (path) => {
				if (path === 'play') {
					// The click that fired this callback IS a user gesture, so
					// AudioContext can be created/resumed safely from here.
					await engine.toggle();
				}
			}
		}
	);

	// Bridge: push DialKit value changes into the AudioEngine. Each $effect
	// only depends on the field it reads, so unrelated changes don't refire it.
	$effect(() => {
		engine.setMasterVolume(values.master);
	});

	$effect(() => {
		if (values.track && values.track !== engine.currentTrackId) {
			void engine.setTrack(values.track);
		}
	});

	$effect(() => {
		if (values.scene && values.scene !== engine.currentSceneId) {
			engine.setScene(values.scene);
		}
	});

	// Ambient layers — one $effect per layer keeps changes granular.
	const ambientIds: AmbientLayerId[] = ambientLayers.map((l) => l.id);
	$effect(() => {
		for (const id of ambientIds) {
			const next = values.ambient[id as keyof typeof values.ambient];
			if (next !== engine.ambientVolumes[id]) {
				void engine.setAmbientVolume(id, next);
			}
		}
	});
</script>

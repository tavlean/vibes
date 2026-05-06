<script lang="ts">
	/**
	 * The single source of truth for all controls.
	 *
	 * DialKit renders the entire panel; we declare the schema with createDialKit
	 * and bridge values into the AudioEngine.
	 *
	 * NOTE — DialKit reactivity workaround. We DO NOT use the object returned
	 * by `createDialKit` for $effect. That proxy is a one-shot snapshot:
	 * inside DialKit, `let values = $state(resolve())` is reassigned on every
	 * store change (`values = resolve()`), but the consumer's reference is
	 * still bound to the original proxy/object, so Svelte never sees property
	 * changes through it. (Svelte's docs warn about exporting reassigned
	 * $state — same constraint applies across function-return.)
	 *
	 * Workaround: subscribe to DialStore directly with `subscribe(panelId, …)`
	 * and read with `getValue`. `subscribeGlobal` is NOT enough — it only
	 * fires on panel register/unregister, never on value updates. We use it
	 * to detect when the panel becomes available, then attach the per-panel
	 * subscription.
	 *
	 * See docs/dialkit.md for the upgrade-check procedure.
	 */
	import { createDialKit } from 'dialkit/svelte';
	import { DialStore } from 'dialkit/store';
	import { ambientLayers, defaults, scenes, tracks } from '$lib/catalog';
	import { getEngine } from '$lib/audio/context';
	import type { AmbientLayerId } from '$lib/types';

	const engine = getEngine();
	const PANEL_NAME = 'Vibes';

	const trackOptions = tracks.map((t) => ({ value: t.id, label: t.title }));
	const sceneOptions = scenes.map((s) => ({ value: s.id, label: s.title }));

	createDialKit(
		PANEL_NAME,
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

	function findPanelId(): string | undefined {
		return DialStore.getPanels().find((p) => p.name === PANEL_NAME)?.id;
	}

	function pull(): void {
		const id = findPanelId();
		if (!id) return;

		const m = DialStore.getValue(id, 'master');
		if (typeof m === 'number') engine.setMasterVolume(m);

		const t = DialStore.getValue(id, 'track');
		if (typeof t === 'string' && t !== engine.currentTrackId) {
			void engine.setTrack(t);
		}

		const s = DialStore.getValue(id, 'scene');
		if (typeof s === 'string' && s !== engine.currentSceneId) {
			engine.setScene(s);
		}

		for (const layer of ambientLayers as ReadonlyArray<{ id: AmbientLayerId }>) {
			const v = DialStore.getValue(id, `ambient.${layer.id}`);
			if (typeof v === 'number' && v !== engine.ambientVolumes[layer.id]) {
				void engine.setAmbientVolume(layer.id, v);
			}
		}
	}

	$effect(() => {
		let unsubPanel: (() => void) | undefined;

		function tryAttach() {
			if (unsubPanel) return;
			const id = findPanelId();
			if (!id) return;
			pull();
			unsubPanel = DialStore.subscribe(id, pull);
		}

		tryAttach();
		queueMicrotask(tryAttach);
		const unsubGlobal = DialStore.subscribeGlobal(tryAttach);

		return () => {
			unsubGlobal();
			unsubPanel?.();
		};
	});
</script>

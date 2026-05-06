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
	 * Tracks UX: each track has its own slider in the `tracks` folder. The
	 * slider's value is the playback progress (0..1) — driven by the engine,
	 * not by user drag. Any user interaction with a non-current track's
	 * slider is interpreted as "select this track" (we ignore the dragged
	 * value and reset to 0; the engine begins ticking it forward as soon as
	 * playback starts).
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

	// Threshold below which a track-slider value is treated as "not clicked"
	// — must accommodate floating-point drift in the playback-tick writer.
	const CLICK_EPSILON = 0.001;

	const sceneOptions = scenes.map((s) => ({ value: s.id, label: s.title }));

	// Use the track's title as the slider key so DialKit displays it as the
	// label (DialKit uses the key verbatim for slider labels — there's no
	// `label` override on slider configs).
	const trackTitleById: Record<string, string> = Object.fromEntries(
		tracks.map((t) => [t.id, t.title])
	);
	const tracksFolderConfig: Record<string, [number, number, number]> = Object.fromEntries(
		tracks.map((t) => [t.title, [0, 0, 1] as [number, number, number]])
	);

	createDialKit(
		PANEL_NAME,
		{
			master: [defaults.masterVolume, 0, 1] as [number, number, number],
			play: { type: 'action' as const, label: 'Play / Pause' },
			scene: {
				type: 'select' as const,
				options: sceneOptions,
				default: defaults.sceneId
			},
			tracks: tracksFolderConfig,
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

	function trackPath(title: string): string {
		return `tracks.${title}`;
	}

	/**
	 * Writes to DialStore made by US (progress ticks, track-change resets,
	 * pull's own click-resets). DialStore.updateValue fires notify()
	 * synchronously, which re-enters our subscriber → pull(). Without this
	 * flag, pull would interpret the value we just wrote as a "user clicked"
	 * signal and oscillate. The simpler `pulling` guard alone isn't enough,
	 * because our writes also originate in OTHER $effects (progress-tick,
	 * track-change-reset), not just inside pull itself.
	 */
	let writing = false;
	function writeStore(id: string, path: string, value: number): void {
		writing = true;
		try {
			DialStore.updateValue(id, path, value);
		} finally {
			writing = false;
		}
	}

	/**
	 * Read every DialStore value once and push into the engine. This is the
	 * sole inbound bridge — called on subscribe-fire and after attach.
	 *
	 * Re-entry guard: pull() writes back to DialStore (when a non-current
	 * track is clicked, we reset every track-slider to 0). Each write fires
	 * notify(), which re-enters pull synchronously. Without the guard, the
	 * inner pull observes some sliders un-zeroed yet and re-triggers
	 * setTrack — infinite recursion.
	 */
	let pulling = false;
	function pull(): void {
		if (pulling || writing) return;
		pulling = true;
		try {
			pullInner();
		} finally {
			pulling = false;
		}
	}

	function pullInner(): void {
		const id = findPanelId();
		if (!id) return;

		const m = DialStore.getValue(id, 'master');
		if (typeof m === 'number') engine.setMasterVolume(m);

		const s = DialStore.getValue(id, 'scene');
		if (typeof s === 'string' && s !== engine.currentSceneId) {
			engine.setScene(s);
		}

		// Track sliders are progress indicators we WRITE during playback; the
		// only legitimate inbound signal is "the user clicked a non-current
		// track" — that's why the check is "different track + value above the
		// click epsilon". The dragged value itself is ignored; the engine
		// starts the new track from the beginning.
		for (const t of tracks) {
			const v = DialStore.getValue(id, trackPath(t.title));
			if (
				typeof v === 'number' &&
				v > CLICK_EPSILON &&
				t.id !== engine.currentTrackId
			) {
				void engine.setTrack(t.id);
				// Zero out every track's slider — the progress-tick effect
				// will start moving the new active one. Without this, the
				// user-clicked value would persist on the OLD track.
				for (const tk of tracks) {
					writeStore(id, trackPath(tk.title), 0);
				}
				break;
			}
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

	// ── Outbound bridge: engine → DialStore ─────────────────────────────────
	// Drive the active track's slider as a playback-position display.
	$effect(() => {
		const id = findPanelId();
		if (!id) return;
		const m = engine.music;
		const currentId = engine.currentTrackId;
		const title = currentId ? trackTitleById[currentId] : undefined;
		if (!m || !title) return;
		// Reading these inside the effect is what makes it refire each tick.
		const cur = m.currentTime;
		const dur = m.duration;
		const progress = dur > 0 ? Math.min(1, cur / dur) : 0;
		writeStore(id, trackPath(title), progress);
	});

	// On every track change, zero out the non-active sliders so the previous
	// track's last-known progress doesn't visually linger.
	$effect(() => {
		const id = findPanelId();
		if (!id) return;
		const currentId = engine.currentTrackId;
		for (const t of tracks) {
			if (t.id !== currentId) {
				writeStore(id, trackPath(t.title), 0);
			}
		}
	});
</script>

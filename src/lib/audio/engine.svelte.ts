/**
 * Vibes — AudioEngine
 *
 * One AudioContext per page. Owns master gain, the music track source, and a
 * map of ambient sources (one per layer). All reactive state lives here as
 * `$state` class fields — components mutate it directly (often via DialKit
 * sliders) and the engine reflects it onto Web Audio nodes.
 *
 * Browsers require a user gesture before AudioContext can produce sound, so
 * the AudioContext is constructed lazily inside `ensureRunning()`, which
 * components should call from a click/tap/keypress handler.
 */

import type { AmbientLayerId, Track, Scene } from '$lib/types';
import { ambientLayers, defaults, scenes, tracks } from '$lib/catalog';
import { mediaUrl } from '$lib/media';
import { AudioSource } from './source.svelte';

const FADE_SECONDS = 0.05;

export class AudioEngine {
	#ctx: AudioContext | null = null;
	#masterGain: GainNode | null = null;
	#ambient = new Map<AmbientLayerId, AudioSource>();
	/**
	 * The currently mounted music source. Public + reactive so consumers can
	 * read `music.currentTime` / `music.duration` inside a $effect to drive
	 * progress UI. Reassigned on every track switch — the $state declaration
	 * is what makes that reassignment propagate.
	 */
	music = $state<AudioSource | null>(null);

	// ── Reactive state (UI-facing) ─────────────────────────────────────────
	masterVolume: number = $state(defaults.masterVolume);
	isPlaying = $state(false);
	currentTrackId = $state<string | undefined>(defaults.trackId);
	currentSceneId = $state<string | undefined>(defaults.sceneId);
	/** Per-layer volumes in [0,1]. 0 means muted/off. */
	ambientVolumes = $state<Record<AmbientLayerId, number>>({
		...defaults.ambientVolumes
	});
	/** True once the AudioContext has been created (i.e. a user gesture has fired). */
	isReady = $state(false);

	// ── Catalog-derived helpers ────────────────────────────────────────────
	get currentTrack(): Track | undefined {
		return tracks.find((t) => t.id === this.currentTrackId);
	}
	get currentScene(): Scene | undefined {
		return scenes.find((s) => s.id === this.currentSceneId);
	}

	// ── Lifecycle ──────────────────────────────────────────────────────────
	/**
	 * Create or resume the AudioContext. Must be called from inside a user
	 * gesture (click/tap/key). Idempotent — safe to call repeatedly.
	 */
	async ensureRunning(): Promise<void> {
		if (!this.#ctx) {
			const Ctor =
				window.AudioContext ??
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			this.#ctx = new Ctor();
			this.#masterGain = this.#ctx.createGain();
			this.#masterGain.gain.value = this.masterVolume;
			this.#masterGain.connect(this.#ctx.destination);

			// Pre-create ambient sources so they can buffer in the background.
			// Music source is created on demand when a track is selected.
			for (const layer of ambientLayers) {
				const initial = this.ambientVolumes[layer.id];
				const source = new AudioSource(this.#ctx, this.#masterGain, {
					url: mediaUrl(layer.src),
					loop: true,
					initialVolume: initial
				});
				this.#ambient.set(layer.id, source);
				// If the user adjusted an ambient slider above zero before any
				// audio started, the source's initial volume is set but the
				// element isn't playing. Kick it off here so they immediately
				// hear it once the context comes up.
				if (initial > 0) void source.play();
			}

			if (this.currentTrackId) {
				this.#mountTrack(this.currentTrackId);
			}

			this.isReady = true;
		}

		if (this.#ctx.state === 'suspended') {
			await this.#ctx.resume();
		}
	}

	// ── Master ─────────────────────────────────────────────────────────────
	setMasterVolume(value: number): void {
		const v = clamp(value, 0, 1);
		this.masterVolume = v;
		const ctx = this.#ctx;
		const g = this.#masterGain;
		if (!ctx || !g) return;
		const now = ctx.currentTime;
		g.gain.cancelScheduledValues(now);
		g.gain.setValueAtTime(g.gain.value, now);
		g.gain.linearRampToValueAtTime(v, now + FADE_SECONDS);
	}

	// ── Music ──────────────────────────────────────────────────────────────
	async play(): Promise<void> {
		await this.ensureRunning();
		if (!this.music && this.currentTrackId) this.#mountTrack(this.currentTrackId);
		if (!this.music) return;
		this.music.setVolume(1);
		await this.music.play();
		this.isPlaying = true;
	}

	pause(): void {
		this.music?.pause();
		this.isPlaying = false;
	}

	async toggle(): Promise<void> {
		if (this.isPlaying) this.pause();
		else await this.play();
	}

	/**
	 * Switch to a different track. By design, selecting a track also starts
	 * playing it — the user clicked a track because they want to hear it.
	 * If they want silence, they hit Play/Pause.
	 */
	async setTrack(id: string): Promise<void> {
		if (id === this.currentTrackId) return;
		await this.ensureRunning();
		this.currentTrackId = id;
		if (this.#ctx) {
			this.#mountTrack(id);
			if (this.music) {
				this.music.setVolume(1);
				await this.music.play();
				this.isPlaying = true;
			}
		}
	}

	/**
	 * Called when the current track's `<audio>` fires `ended`. Advances to
	 * the next track in the catalog, wrapping back to the first after the
	 * last. No-op if the catalog is empty.
	 */
	#advanceToNext(): void {
		if (tracks.length === 0) return;
		const idx = tracks.findIndex((t) => t.id === this.currentTrackId);
		const nextIdx = idx < 0 ? 0 : (idx + 1) % tracks.length;
		const next = tracks[nextIdx];
		if (next) void this.setTrack(next.id);
	}

	#mountTrack(id: string): void {
		const ctx = this.#ctx;
		const master = this.#masterGain;
		if (!ctx || !master) return;
		const track = tracks.find((t) => t.id === id);
		if (!track) return;

		if (this.music) {
			this.music.destroy();
			this.music = null;
		}
		this.music = new AudioSource(ctx, master, {
			url: mediaUrl(track.src),
			loop: false,
			initialVolume: 1,
			onEnded: () => this.#advanceToNext()
		});
	}

	// ── Ambient ────────────────────────────────────────────────────────────
	/**
	 * Set the volume of an ambient layer. If raising from 0 to >0, ensures the
	 * layer is playing; if lowered to 0, pauses it (saves CPU and battery).
	 */
	async setAmbientVolume(id: AmbientLayerId, value: number): Promise<void> {
		const v = clamp(value, 0, 1);
		this.ambientVolumes = { ...this.ambientVolumes, [id]: v };
		const source = this.#ambient.get(id);
		if (!source) return;
		source.setVolume(v);
		if (v > 0 && !source.isPlaying) {
			await source.play();
		} else if (v === 0 && source.isPlaying) {
			source.pause();
		}
	}

	// ── Scene ──────────────────────────────────────────────────────────────
	setScene(id: string): void {
		this.currentSceneId = id;
	}

	// ── Cleanup ────────────────────────────────────────────────────────────
	destroy(): void {
		this.music?.destroy();
		for (const a of this.#ambient.values()) a.destroy();
		this.#ambient.clear();
		try {
			this.#masterGain?.disconnect();
		} catch {
			// noop
		}
		this.#ctx?.close().catch(() => {
			// noop
		});
		this.#ctx = null;
		this.#masterGain = null;
		this.music = null;
		this.isReady = false;
	}
}

function clamp(n: number, min: number, max: number): number {
	return n < min ? min : n > max ? max : n;
}

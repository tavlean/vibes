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
	#music: AudioSource | null = null;
	#ambient = new Map<AmbientLayerId, AudioSource>();

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
				const source = new AudioSource(this.#ctx, this.#masterGain, {
					url: mediaUrl(layer.src),
					loop: true,
					initialVolume: this.ambientVolumes[layer.id]
				});
				this.#ambient.set(layer.id, source);
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
		if (!this.#music && this.currentTrackId) this.#mountTrack(this.currentTrackId);
		if (!this.#music) return;
		this.#music.setVolume(1);
		await this.#music.play();
		this.isPlaying = true;
	}

	pause(): void {
		this.#music?.pause();
		this.isPlaying = false;
	}

	async toggle(): Promise<void> {
		if (this.isPlaying) this.pause();
		else await this.play();
	}

	async setTrack(id: string): Promise<void> {
		if (id === this.currentTrackId) return;
		this.currentTrackId = id;
		const wasPlaying = this.isPlaying;
		if (this.#ctx) {
			this.#mountTrack(id);
			if (wasPlaying && this.#music) {
				this.#music.setVolume(1);
				await this.#music.play();
			}
		}
	}

	#mountTrack(id: string): void {
		const ctx = this.#ctx;
		const master = this.#masterGain;
		if (!ctx || !master) return;
		const track = tracks.find((t) => t.id === id);
		if (!track) return;

		if (this.#music) {
			this.#music.destroy();
			this.#music = null;
		}
		this.#music = new AudioSource(ctx, master, {
			url: mediaUrl(track.src),
			loop: false,
			initialVolume: 1
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
		this.#music?.destroy();
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
		this.#music = null;
		this.isReady = false;
	}
}

function clamp(n: number, min: number, max: number): number {
	return n < min ? min : n > max ? max : n;
}

/**
 * Vibes — AudioSource
 *
 * One source per playable thing: a music track or an ambient layer. Wraps an
 * `<audio>` element + `MediaElementAudioSourceNode` + `GainNode`. The HTML
 * element does the streaming/buffering (no need to decode into AudioBuffer for
 * long files), the GainNode gives us click-free volume control, and the audio
 * element survives in memory so we can pause/resume/seek cheaply.
 *
 * `volume` and `isPlaying` are reactive `$state` — components read/write them
 * via the engine's setters (e.g. `setMasterVolume`, `setAmbientVolume`).
 */

const FADE_SECONDS = 0.05; // ~50ms ramp, just enough to avoid clicks

export interface AudioSourceOptions {
	url: string;
	loop?: boolean;
	/** Initial volume in [0,1]. Default 0 — explicitly fade in to play. */
	initialVolume?: number;
	/** Crossorigin attribute, useful when loading from R2 with CORS. */
	crossOrigin?: 'anonymous' | 'use-credentials' | null;
	/** Fires after the element's `ended` event (i.e. natural finish). */
	onEnded?: () => void;
	/**
	 * Update `currentTime` every animation frame while playing, instead of
	 * waiting for the media element's `timeupdate` (which only fires every
	 * ~250 ms). Use for music sources whose progress is shown to the user.
	 * Ambient layers don't need this — their currentTime isn't displayed.
	 */
	smoothProgress?: boolean;
}

export class AudioSource {
	#element: HTMLAudioElement;
	#sourceNode: MediaElementAudioSourceNode;
	#gain: GainNode;
	#ctx: AudioContext;
	#destroyed = false;
	#smoothProgress = false;
	#rafId: number | undefined;

	/** User-facing volume in [0,1]. Mirrored to the gain node via setVolume. */
	volume = $state(0);
	isPlaying = $state(false);
	isLoaded = $state(false);
	/** Reactive playback position in seconds. Driven by media `timeupdate`. */
	currentTime = $state(0);
	/** Reactive duration in seconds (NaN/0 until metadata loads). */
	duration = $state(0);

	constructor(ctx: AudioContext, destination: AudioNode, options: AudioSourceOptions) {
		this.#ctx = ctx;

		const el = new Audio();
		el.src = options.url;
		el.loop = options.loop ?? false;
		el.preload = 'auto';
		el.crossOrigin = options.crossOrigin ?? 'anonymous';
		// Don't auto-play; require explicit play() (browser policies + UX).
		this.#element = el;

		this.#sourceNode = ctx.createMediaElementSource(el);
		this.#gain = ctx.createGain();
		this.#gain.gain.value = 0;
		this.#sourceNode.connect(this.#gain).connect(destination);

		const initial = options.initialVolume ?? 0;
		this.volume = initial;
		this.#gain.gain.value = initial;
		this.#smoothProgress = options.smoothProgress ?? false;

		el.addEventListener('canplaythrough', () => {
			this.isLoaded = true;
		});
		el.addEventListener('play', () => {
			this.isPlaying = true;
			this.#startProgressLoop();
		});
		el.addEventListener('pause', () => {
			this.isPlaying = false;
			this.#stopProgressLoop();
		});
		el.addEventListener('ended', () => {
			if (!el.loop) this.isPlaying = false;
			this.#stopProgressLoop();
			options.onEnded?.();
		});
		// Fallback for the case where the browser doesn't fire `play` (rare,
		// e.g. on some autoplay paths) — `timeupdate` keeps state correct.
		el.addEventListener('timeupdate', () => {
			this.currentTime = el.currentTime;
		});
		const updateDuration = () => {
			this.duration = Number.isFinite(el.duration) ? el.duration : 0;
		};
		el.addEventListener('loadedmetadata', updateDuration);
		el.addEventListener('durationchange', updateDuration);
	}

	#progressTick = () => {
		this.currentTime = this.#element.currentTime;
		this.#rafId = requestAnimationFrame(this.#progressTick);
	};

	#startProgressLoop(): void {
		if (!this.#smoothProgress) return;
		if (this.#rafId !== undefined) return;
		this.#progressTick();
	}

	#stopProgressLoop(): void {
		if (this.#rafId !== undefined) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = undefined;
		}
	}

	/**
	 * Internal audio element. Exposed for end-to-end test probes that need
	 * to simulate media events (e.g. dispatching 'ended' for auto-advance
	 * verification). Not part of the public engine API — don't use this from
	 * application code.
	 */
	get _element(): HTMLAudioElement {
		return this.#element;
	}

	/** Smooth-ramp the gain to a target value to avoid clicks. */
	setVolume(value: number): void {
		const v = clamp(value, 0, 1);
		this.volume = v;
		const now = this.#ctx.currentTime;
		const g = this.#gain.gain;
		g.cancelScheduledValues(now);
		g.setValueAtTime(g.value, now);
		g.linearRampToValueAtTime(v, now + FADE_SECONDS);
	}

	async play(): Promise<void> {
		if (this.#destroyed) return;
		try {
			await this.#element.play();
		} catch {
			// Autoplay blocked — caller should retry from a user gesture.
		}
	}

	pause(): void {
		if (this.#destroyed) return;
		this.#element.pause();
	}

	/** Stop playback and rewind to start (used when switching tracks). */
	stop(): void {
		if (this.#destroyed) return;
		this.#element.pause();
		try {
			this.#element.currentTime = 0;
		} catch {
			// Some browsers throw if metadata isn't ready yet — safe to ignore.
		}
	}

	/** Replace the underlying source URL (used when switching tracks). */
	setUrl(url: string): void {
		if (this.#destroyed) return;
		this.#element.src = url;
		this.#element.load();
		this.isLoaded = false;
	}

	destroy(): void {
		this.#destroyed = true;
		this.#stopProgressLoop();
		this.#element.pause();
		this.#element.src = '';
		try {
			this.#sourceNode.disconnect();
			this.#gain.disconnect();
		} catch {
			// disconnect throws if already disconnected
		}
	}
}

function clamp(n: number, min: number, max: number): number {
	return n < min ? min : n > max ? max : n;
}

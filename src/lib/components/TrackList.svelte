<script lang="ts">
	/**
	 * Track list — list of tracks as click-to-toggle buttons with a passive
	 * elapsed-time display.
	 *
	 *   - Click any track → if it's the active track, toggle play/pause;
	 *     else switch to it (the engine plays it after select).
	 *   - The active track shows ticking elapsed time (M:SS) + a horizontal
	 *     fill driven by `engine.music.currentTime / .duration`.
	 *   - Inactive tracks sit at 0:00 with no fill.
	 *
	 * Tracks aren't manually scrubbable — the user explicitly wanted a
	 * passive display, not a draggable slider.
	 */
	import { tracks } from '$lib/catalog';
	import { getEngine } from '$lib/audio/context';

	const engine = getEngine();

	function clickTrack(id: string): void {
		if (id === engine.currentTrackId) {
			void engine.toggle();
		} else {
			void engine.setTrack(id);
		}
	}

	function fmt(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
		const total = Math.floor(seconds);
		const m = Math.floor(total / 60);
		const s = total % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

<section class="track-list" aria-label="Tracks">
	<h3 class="heading">Tracks</h3>
	<ul class="rows">
		{#each tracks as track (track.id)}
			{@const isCurrent = track.id === engine.currentTrackId}
			{@const cur = isCurrent ? (engine.music?.currentTime ?? 0) : 0}
			{@const dur = isCurrent ? (engine.music?.duration ?? 0) : 0}
			{@const progress = dur > 0 ? Math.min(1, cur / dur) : 0}
			{@const isPlaying = isCurrent && engine.isPlaying}
			<li>
				<button
					type="button"
					class="track"
					class:current={isCurrent}
					class:playing={isPlaying}
					onclick={() => clickTrack(track.id)}
					aria-pressed={isPlaying}
					aria-label={`${isPlaying ? 'Pause' : 'Play'} ${track.title}`}
				>
					<span class="fill" style="width: {progress * 100}%"></span>
					<span class="title">{track.title}</span>
					<span class="time">{fmt(cur)}</span>
				</button>
			</li>
		{/each}
	</ul>
</section>

<style>
	.track-list {
		font-family: inherit;
	}
	.heading {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.55;
		margin: 0 0 0.5rem 0;
		padding: 0 0.25rem;
		font-weight: 500;
	}
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.track {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		color: inherit;
		padding: 0.55rem 0.75rem;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
		text-align: left;
		overflow: hidden;
		isolation: isolate;
		transition:
			background 150ms ease,
			border-color 150ms ease;
	}
	.track:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.1);
	}
	.track:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
	}
	.track.current {
		background: rgba(255, 255, 255, 0.07);
		border-color: rgba(255, 255, 255, 0.14);
	}
	/* Progress fill — width is driven by RAF in the audio source (60 fps),
	   so no CSS transition is needed; adding one would lag visible progress
	   behind actual playback. */
	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 0;
		background: rgba(255, 255, 255, 0.08);
		z-index: 0;
		pointer-events: none;
	}
	.title,
	.time {
		position: relative;
		z-index: 1;
	}
	.title {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.time {
		opacity: 0.55;
		font-variant-numeric: tabular-nums;
		font-size: 0.78rem;
	}
	.track.current .time {
		opacity: 0.85;
	}
</style>

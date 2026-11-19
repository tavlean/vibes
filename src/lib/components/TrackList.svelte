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
	import { defaults, tracks } from '#lib/catalog.ts';
	import { getRuntime } from '#lib/audio/context.ts';

	const runtime = getRuntime();
	const engine = $derived(runtime.engine);
	const currentTrackId = $derived(engine?.currentTrackId ?? defaults.trackId);

	function clickTrack(id: string): void {
		if (!engine) return;
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

	// Same row vocabulary as Controls / SliderRow.
	const rowBase =
		'relative flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm focus-visible:ring-2 focus-visible:ring-gray-100/40 focus-visible:outline-none';
	const rowInteractive =
		'cursor-pointer overflow-hidden isolate transition-colors duration-150 bg-gray-100/4 border-gray-100/6 hover:bg-gray-100/8 hover:border-gray-100/10';
	const rowCurrent = 'bg-gray-100/7 border-gray-100/14 hover:bg-gray-100/7 hover:border-gray-100/14';
</script>

<section aria-label="Tracks">
	<h3 class="m-0 mb-2 px-1 text-[0.7rem] font-medium tracking-[0.08em] text-gray-100/55 uppercase">
		Tracks
	</h3>
	<ul class="flex list-none flex-col gap-1 m-0 p-0">
		{#each tracks as track (track.id)}
			{@const isCurrent = track.id === currentTrackId}
			{@const cur = isCurrent ? (engine?.music?.currentTime ?? 0) : 0}
			{@const dur = isCurrent ? (engine?.music?.duration ?? 0) : 0}
			{@const progress = dur > 0 ? Math.min(1, cur / dur) : 0}
			{@const isPlaying = isCurrent && (engine?.isPlaying ?? false)}
			<li>
				<button
					type="button"
					class={[rowBase, rowInteractive, isCurrent && rowCurrent]}
					disabled={!engine}
					onclick={() => clickTrack(track.id)}
					aria-pressed={isPlaying}
					aria-label={`${isPlaying ? 'Pause' : 'Play'} ${track.title}`}
				>
					<!-- Progress fill — width is driven by RAF in the audio source
					     (60 fps), so no CSS transition is needed; adding one
					     would lag visible progress behind actual playback. -->
					<span
						class="pointer-events-none absolute inset-y-0 left-0 z-0 bg-gray-100/8"
						style:width="{progress * 100}%"
					></span>
					<span class="relative z-10 flex-1 truncate">{track.title}</span>
					<span
						class={[
							'relative z-10 text-xs tabular-nums',
							isCurrent ? 'text-gray-100/85' : 'text-gray-100/55'
						]}
					>
						{fmt(cur)}
					</span>
				</button>
			</li>
		{/each}
	</ul>
</section>

<script lang="ts">
	/**
	 * The control panel.
	 *
	 * Layout (top → bottom):
	 *   1. Master volume (slider)
	 *   2. Play / Pause (button)
	 *   3. Scene picker (one button per scene)
	 *   4. Ambient mixer (one slider per layer)
	 *   5. Track list (existing TrackList — its own component)
	 *
	 * Every row uses the same styling vocabulary so the panel reads as a
	 * single column of consistent controls. No outer container chrome —
	 * the panel positions itself fixed-right vertically-centered, and
	 * lets the rows speak for themselves.
	 */
	import { ambientLayers, scenes } from '$lib/catalog';
	import { getEngine } from '$lib/audio/context';
	import SliderRow from './SliderRow.svelte';
	import TrackList from './TrackList.svelte';

	const engine = getEngine();
</script>

<aside class="panel" aria-label="Controls">
	<section class="section" aria-label="Playback">
		<SliderRow
			label="Master"
			value={engine.masterVolume}
			onChange={(v) => engine.setMasterVolume(v)}
		/>
		<button
			type="button"
			class="row action"
			onclick={() => void engine.toggle()}
			aria-pressed={engine.isPlaying}
			aria-label={engine.isPlaying ? 'Pause' : 'Play'}
		>
			<span class="label">{engine.isPlaying ? 'Pause' : 'Play'}</span>
			<span class="icon" aria-hidden="true">{engine.isPlaying ? '❚❚' : '▶'}</span>
		</button>
	</section>

	<section class="section" aria-label="Scene">
		<h3 class="heading">Scene</h3>
		<ul class="rows">
			{#each scenes as scene (scene.id)}
				{@const isCurrent = scene.id === engine.currentSceneId}
				<li>
					<button
						type="button"
						class="row"
						class:current={isCurrent}
						onclick={() => engine.setScene(scene.id)}
						aria-pressed={isCurrent}
					>
						<span class="label">{scene.title}</span>
						{#if isCurrent}
							<span class="dot" aria-hidden="true"></span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</section>

	<section class="section" aria-label="Ambient">
		<h3 class="heading">Ambient</h3>
		<ul class="rows">
			{#each ambientLayers as layer (layer.id)}
				<li>
					<SliderRow
						label={layer.title}
						value={engine.ambientVolumes[layer.id]}
						onChange={(v) => engine.setAmbientVolume(layer.id, v)}
					/>
				</li>
			{/each}
		</ul>
	</section>

	<TrackList />
</aside>

<style>
	.panel {
		position: fixed;
		right: 2rem;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		width: 320px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.heading {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.55;
		margin: 0 0 0.25rem 0;
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

	/* Shared row styling — the same rules as SliderRow / TrackList. Buttons
	   in this file (Play/Pause, Scene options) reuse the same vocabulary. */
	.row {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.55rem 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		color: inherit;
		border-radius: 8px;
		font: inherit;
		font-size: 0.85rem;
		text-align: left;
		cursor: pointer;
		transition:
			background 150ms ease,
			border-color 150ms ease;
	}
	.row:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.1);
	}
	.row:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
	}
	.row.current {
		background: rgba(255, 255, 255, 0.07);
		border-color: rgba(255, 255, 255, 0.14);
	}

	.label {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.icon {
		opacity: 0.7;
		font-size: 0.78rem;
		letter-spacing: -0.05em;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: oklch(0.85 0.15 150);
		box-shadow: 0 0 8px oklch(0.85 0.15 150 / 0.5);
	}

	@media (max-width: 640px) {
		.panel {
			right: 1rem;
			left: 1rem;
			width: auto;
			max-height: 80vh;
		}
	}
</style>

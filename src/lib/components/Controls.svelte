<script lang="ts">
	/**
	 * The control panel.
	 *
	 * Layout (top → bottom):
	 *   1. Master volume (slider)
	 *   2. Play / Pause (button)
	 *   3. Scene picker (one button per scene)
	 *   4. Ambient mixer (one slider per layer)
	 *   5. Track list (TrackList component)
	 *
	 * Every row uses the same Tailwind vocabulary so the panel reads as a
	 * single column of consistent controls.
	 */
	import { ambientLayers, scenes } from '$lib/catalog';
	import { SHOW_SCENES } from '$lib/config';
	import { getEngine } from '$lib/audio/context';
	import SliderRow from './SliderRow.svelte';
	import AmbientIcon from './AmbientIcon.svelte';
	import TrackList from './TrackList.svelte';

	const engine = getEngine();

	// Shared row chrome — same look across slider rows, scene buttons, the
	// play/pause action, and tracks. Centralising it here means the visual
	// vocabulary is one constant, not three near-duplicates.
	const rowBase =
		'relative flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm focus-visible:ring-2 focus-visible:ring-gray-100/40 focus-visible:outline-none';
	const rowInteractive =
		'cursor-pointer transition-colors duration-150 bg-gray-100/4 border-gray-100/6 hover:bg-gray-100/8 hover:border-gray-100/10';
	const rowCurrent = 'bg-gray-100/7 border-gray-100/14 hover:bg-gray-100/7 hover:border-gray-100/14';

	const headingClass =
		'm-0 mb-1 px-1 text-[0.7rem] font-medium tracking-[0.08em] text-gray-100/55 uppercase';
	const listClass = 'flex list-none flex-col gap-1 m-0 p-0';
</script>

<aside
	class="fixed top-1/2 right-8 z-10 flex max-h-[90vh] w-80 -translate-y-1/2 flex-col gap-4 overflow-y-auto max-sm:right-4 max-sm:left-4 max-sm:max-h-[80vh] max-sm:w-auto"
	aria-label="Controls"
>
	<section class="flex flex-col gap-1" aria-label="Playback">
		<SliderRow
			label="Master"
			value={engine.masterVolume}
			onChange={(v) => engine.setMasterVolume(v)}
		/>
		<button
			type="button"
			class={[rowBase, rowInteractive]}
			onclick={() => void engine.toggle()}
			aria-pressed={engine.isPlaying}
			aria-label={engine.isPlaying ? 'Pause' : 'Play'}
		>
			<span class="flex-1 truncate">{engine.isPlaying ? 'Pause' : 'Play'}</span>
			<span class="text-xs tracking-tighter text-gray-100/70" aria-hidden="true">
				{engine.isPlaying ? '❚❚' : '▶'}
			</span>
		</button>
	</section>

	<!-- Scene picker — hidden behind SHOW_SCENES. See docs/scenes.md. -->
	{#if SHOW_SCENES}
		<section class="flex flex-col gap-1" aria-label="Scene">
			<h3 class={headingClass}>Scene</h3>
			<ul class={listClass}>
				{#each scenes as scene (scene.id)}
					{@const isCurrent = scene.id === engine.currentSceneId}
					<li>
						<button
							type="button"
							class={[rowBase, rowInteractive, isCurrent && rowCurrent]}
							onclick={() => engine.setScene(scene.id)}
							aria-pressed={isCurrent}
						>
							<span class="flex-1 truncate">{scene.title}</span>
							{#if isCurrent}
								<span
									class="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-glow)]"
									aria-hidden="true"
								></span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="flex flex-col gap-1" aria-label="Ambient">
		<h3 class={headingClass}>Ambient</h3>
		<ul class={listClass}>
			{#each ambientLayers as layer (layer.id)}
				<li>
					<SliderRow
						label={layer.title}
						value={engine.ambientVolumes[layer.id]}
						onChange={(v) => engine.setAmbientVolume(layer.id, v)}
					>
						{#snippet icon()}
							<AmbientIcon name={layer.id} />
						{/snippet}
					</SliderRow>
				</li>
			{/each}
		</ul>
	</section>

	<TrackList />
</aside>

<style>
	/* Tailwind has no built-in scrollbar utilities, so the thin scrollbar on
	   the panel stays here. */
	aside {
		scrollbar-width: thin;
		scrollbar-color: color-mix(in oklab, var(--color-gray-100) 18%, transparent) transparent;
	}
</style>

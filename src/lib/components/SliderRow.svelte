<script lang="ts">
	/**
	 * A single slider row, styled to match TrackList. Used for master volume
	 * and every ambient layer.
	 *
	 * Click anywhere on the row → set value to that horizontal position. Drag
	 * → continuous adjustment. Pointer is captured on pointerdown so drag
	 * keeps tracking even after leaving the row.
	 *
	 * Visual: horizontal fill from the left, a thin vertical thumb at the
	 * current value, decile-tick hints in the background that fade in on
	 * hover/drag (DialKit-style snap reference). Cursor is `grab` at rest,
	 * `grabbing` while dragging.
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		value: number;
		min?: number;
		max?: number;
		/** Snap interval. Defaults to 1% of range. */
		step?: number;
		onChange: (v: number) => void;
		/** Right-side display formatter. Defaults to a 0–100% percentage. */
		valueFormat?: (v: number, min: number, max: number) => string;
		/** Optional leading icon (rendered before the label). */
		icon?: Snippet;
	}

	function defaultFormat(v: number, mn: number, mx: number): string {
		const range = mx - mn;
		if (range <= 0) return '';
		return `${Math.round(((v - mn) / range) * 100)}%`;
	}

	let {
		label,
		value,
		min = 0,
		max = 1,
		step = 0.01,
		onChange,
		valueFormat = defaultFormat,
		icon
	}: Props = $props();

	let dragging = $state(false);

	const fillPct = $derived.by(() => {
		const range = max - min;
		if (range <= 0) return 0;
		return Math.max(0, Math.min(1, (value - min) / range));
	});

	function valueFromClientX(el: HTMLElement, clientX: number): number {
		const rect = el.getBoundingClientRect();
		const t = (clientX - rect.left) / rect.width;
		const clamped = Math.max(0, Math.min(1, t));
		const v = min + clamped * (max - min);
		const snapped = Math.round(v / step) * step;
		return Math.max(min, Math.min(max, snapped));
	}

	function pointerDown(event: PointerEvent & { currentTarget: HTMLElement }) {
		dragging = true;
		event.currentTarget.setPointerCapture(event.pointerId);
		onChange(valueFromClientX(event.currentTarget, event.clientX));
	}
	function pointerMove(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (!dragging) return;
		onChange(valueFromClientX(event.currentTarget, event.clientX));
	}
	function pointerUp(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (!dragging) return;
		dragging = false;
		try {
			event.currentTarget.releasePointerCapture(event.pointerId);
		} catch {
			// already released
		}
	}

	function onkeydown(event: KeyboardEvent) {
		const big = step * 5;
		let v = value;
		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') v += big;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') v -= big;
		else if (event.key === 'Home') v = min;
		else if (event.key === 'End') v = max;
		else return;
		event.preventDefault();
		onChange(Math.max(min, Math.min(max, v)));
	}
</script>

<div
	class={[
		'row',
		'relative flex w-full touch-none items-center justify-between gap-3 overflow-hidden rounded-lg border px-3 py-2 text-left text-sm select-none isolate',
		'border-gray-100/6 bg-gray-100/4',
		'focus-visible:ring-2 focus-visible:ring-gray-100/40 focus-visible:outline-none',
		dragging ? 'cursor-grabbing dragging' : 'cursor-grab'
	]}
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	style:--fill={fillPct}
	onpointerdown={pointerDown}
	onpointermove={pointerMove}
	onpointerup={pointerUp}
	onpointercancel={pointerUp}
	{onkeydown}
>
	<span class="fill" aria-hidden="true"></span>
	<span class="ticks" aria-hidden="true"></span>
	<span class="thumb" aria-hidden="true"></span>
	{#if icon}
		<span class="relative z-20 -mr-1 inline-flex shrink-0 items-center text-gray-100/70" aria-hidden="true">
			{@render icon()}
		</span>
	{/if}
	<span class="relative z-20 flex-1 truncate">{label}</span>
	<span class="relative z-20 text-xs text-gray-100/60 tabular-nums">
		{valueFormat(value, min, max)}
	</span>
</div>

<style>
	/*
	 * Slider geometry. The row chrome (background, border, padding, radius)
	 * lives on the element above; this block is only the slider-specific
	 * bits — fill, ticks, thumb — which can't be expressed cleanly as
	 * Tailwind utilities because they depend on the --fill custom property.
	 */

	/* Filled portion. Animates smoothly when the user clicks elsewhere on
	   the bar; instant during a drag so it tracks the pointer exactly. */
	.fill {
		position: absolute;
		inset: 0 auto 0 0;
		width: calc(var(--fill, 0) * 100%);
		background: color-mix(in oklab, var(--color-gray-100) 8%, transparent);
		z-index: 0;
		pointer-events: none;
		transition: width 150ms cubic-bezier(0.2, 0, 0, 1);
	}
	.row.dragging .fill {
		transition: none;
	}

	/* Decile snap hints — a 12px-tall strip centered vertically. The
	   repeating gradient draws a 1px line every 10% (transparent gap, then
	   1px of colour). Hidden at rest; fade in on hover/focus/drag. */
	.ticks {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 12px;
		transform: translateY(-50%);
		z-index: 1;
		pointer-events: none;
		opacity: 0;
		background-image: repeating-linear-gradient(
			to right,
			transparent 0,
			transparent calc(10% - 1px),
			color-mix(in oklab, var(--color-gray-100) 22%, transparent) calc(10% - 1px),
			color-mix(in oklab, var(--color-gray-100) 22%, transparent) 10%
		);
		transition: opacity 180ms ease;
	}

	/* Vertical thumb line. Its right edge sits 4px inside the fill's right
	   edge; max() keeps the 4px-wide thumb fully visible at value=0 instead
	   of clipping behind overflow:hidden. Hidden at rest; fades in with the
	   ticks. */
	.thumb {
		position: absolute;
		top: 8px;
		bottom: 8px;
		left: max(0px, calc(var(--fill, 0) * 100% - 8px));
		width: 4px;
		border-radius: 2px;
		background: color-mix(in oklab, var(--color-gray-100) 85%, transparent);
		z-index: 2;
		pointer-events: none;
		opacity: 0;
		transition:
			opacity 180ms ease,
			left 150ms cubic-bezier(0.2, 0, 0, 1);
	}
	/* During drag, snap thumb position to the pointer (no position
	   transition). The opacity transition keeps the fade-in/out smooth. */
	.row.dragging .thumb {
		transition: opacity 180ms ease;
	}

	.row:hover .ticks,
	.row:focus-visible .ticks,
	.row.dragging .ticks {
		opacity: 0.7;
	}
	.row:hover .thumb,
	.row:focus-visible .thumb,
	.row.dragging .thumb {
		opacity: 1;
	}
</style>

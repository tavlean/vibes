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
	 *
	 * The selectors in this app (Scene, Tracks) are NOT sliders — they're
	 * separate components and don't get any of this affordance.
	 */
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
		valueFormat = defaultFormat
	}: Props = $props();

	let trackEl: HTMLDivElement | undefined = $state();
	let dragging = $state(false);

	const fillPct = $derived.by(() => {
		const range = max - min;
		if (range <= 0) return 0;
		return Math.max(0, Math.min(1, (value - min) / range));
	});

	function valueFromClientX(clientX: number): number {
		if (!trackEl) return value;
		const rect = trackEl.getBoundingClientRect();
		const t = (clientX - rect.left) / rect.width;
		const clamped = Math.max(0, Math.min(1, t));
		const v = min + clamped * (max - min);
		const snapped = Math.round(v / step) * step;
		return Math.max(min, Math.min(max, snapped));
	}

	function pointerDown(event: PointerEvent) {
		dragging = true;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		onChange(valueFromClientX(event.clientX));
	}
	function pointerMove(event: PointerEvent) {
		if (!dragging) return;
		onChange(valueFromClientX(event.clientX));
	}
	function pointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		try {
			(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
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
	class="row"
	class:dragging
	bind:this={trackEl}
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	style="--fill: {fillPct}"
	onpointerdown={pointerDown}
	onpointermove={pointerMove}
	onpointerup={pointerUp}
	onpointercancel={pointerUp}
	{onkeydown}
>
	<span class="fill" aria-hidden="true"></span>
	<span class="ticks" aria-hidden="true"></span>
	<span class="thumb" aria-hidden="true"></span>
	<span class="label">{label}</span>
	<span class="value">{valueFormat(value, min, max)}</span>
</div>

<style>
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
		cursor: grab;
		user-select: none;
		overflow: hidden;
		isolation: isolate;
		touch-action: none;
	}
	.row:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
	}
	.row.dragging {
		cursor: grabbing;
	}

	/* Filled portion. Animates smoothly when the user clicks elsewhere on
	   the bar; instant during a drag so it tracks the pointer exactly. */
	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: calc(var(--fill, 0) * 100%);
		background: rgba(255, 255, 255, 0.08);
		z-index: 0;
		pointer-events: none;
		transition: width 150ms cubic-bezier(0.2, 0, 0, 1);
	}
	.row.dragging .fill {
		transition: none;
	}

	/* Decile snap hints — short vertical dashes centered vertically in the
	   row (not full height; that's what makes them read as "hints" rather
	   than as a visual change to the row itself). Hidden at rest, fade in
	   on hover/focus/drag. */
	.ticks {
		position: absolute;
		inset: 14px 0;
		z-index: 1;
		pointer-events: none;
		opacity: 0;
		background-image: repeating-linear-gradient(
			to right,
			transparent 0,
			transparent calc(10% - 1px),
			rgba(255, 255, 255, 0.22) calc(10% - 1px),
			rgba(255, 255, 255, 0.22) 10%
		);
		transition: opacity 180ms ease;
	}
	.row:hover .ticks,
	.row:focus-visible .ticks,
	.row.dragging .ticks {
		opacity: 0.7;
	}

	/* Vertical thumb line at the current value. Hidden at rest; fades in
	   on hover/focus/drag — same affordance pattern as the ticks.
	   Positioned a few pixels inside the fill's right edge so the fill
	   visibly extends past the thumb, rather than the thumb sitting on
	   the boundary. The `max(2px, …)` keeps the thumb fully on-screen at
	   the left edge when the value is at (or near) zero. */
	.thumb {
		position: absolute;
		top: 8px;
		bottom: 8px;
		left: max(2px, calc(var(--fill, 0) * 100% - 6px));
		transform: translateX(-50%);
		width: 4px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.85);
		z-index: 2;
		pointer-events: none;
		opacity: 0;
		transition:
			opacity 180ms ease,
			left 150ms cubic-bezier(0.2, 0, 0, 1);
	}
	.row:hover .thumb,
	.row:focus-visible .thumb,
	.row.dragging .thumb {
		opacity: 1;
	}
	.row.dragging .thumb {
		transition: opacity 180ms ease;
	}

	.label,
	.value {
		position: relative;
		z-index: 3;
	}
	.label {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.value {
		opacity: 0.6;
		font-variant-numeric: tabular-nums;
		font-size: 0.78rem;
	}
</style>

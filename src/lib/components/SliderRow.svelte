<script lang="ts">
	/**
	 * A single slider row, styled to match TrackList. Used for master volume
	 * and every ambient layer.
	 *
	 * Click anywhere on the row → set value to that horizontal position. Drag
	 * → continuous adjustment. Pointer is captured on pointerdown so drag
	 * keeps tracking even after leaving the row.
	 *
	 * Visual: horizontal fill from the left showing current value, label on
	 * the left, formatted value on the right.
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
	bind:this={trackEl}
	role="slider"
	tabindex="0"
	aria-label={label}
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	onpointerdown={pointerDown}
	onpointermove={pointerMove}
	onpointerup={pointerUp}
	onpointercancel={pointerUp}
	{onkeydown}
>
	<span class="fill" style="width: {fillPct * 100}%"></span>
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
		cursor: pointer;
		user-select: none;
		overflow: hidden;
		isolation: isolate;
		touch-action: none;
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
	.label,
	.value {
		position: relative;
		z-index: 1;
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

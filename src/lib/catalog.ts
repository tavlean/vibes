/**
 * Vibes — catalog
 *
 * The single file Tav edits to add/rename music tracks, ambient layers, and
 * background scenes. Adding a new track is just:
 *
 *   1. Drop the file in `static/audio/music/`
 *   2. Add an entry to the `tracks` array below
 *
 * Filenames in `src` are resolved through `mediaUrl()` so they work both for
 * local files and (later) for R2-hosted media.
 */

import type { AmbientLayer, Scene, Track } from './types';

/** Music tracks. Tav's beats and instrumentals. Played one at a time. */
export const tracks: Track[] = [
	{
		id: 'sample-one',
		title: 'Sample One',
		artist: 'Tav',
		src: 'audio/music/sample-one.mp3'
	},
	{
		id: 'sample-two',
		title: 'Sample Two',
		artist: 'Tav',
		src: 'audio/music/sample-two.mp3'
	},
	{
		id: 'sample-three',
		title: 'Sample Three',
		artist: 'Tav',
		src: 'audio/music/sample-three.mp3'
	}
];

/** Ambient layers — looped, mixed alongside the music. */
export const ambientLayers: AmbientLayer[] = [
	{ id: 'rain', title: 'Rain', src: 'audio/ambient/rain.mp3' },
	{ id: 'thunder', title: 'Thunder', src: 'audio/ambient/thunder.mp3' },
	{ id: 'traffic', title: 'Traffic', src: 'audio/ambient/traffic.mp3' },
	{ id: 'cafe', title: 'Café', src: 'audio/ambient/cafe.mp3' },
	{ id: 'fireplace', title: 'Fireplace', src: 'audio/ambient/fireplace.mp3' },
	{ id: 'vinyl', title: 'Vinyl', src: 'audio/ambient/vinyl.mp3' }
];

/** Looping background videos. */
export const scenes: Scene[] = [
	{ id: 'night-rain', title: 'Night Rain', src: 'video/night-rain.mp4' },
	{ id: 'forest', title: 'Forest', src: 'video/forest.mp4' },
	{ id: 'fireplace', title: 'Fireplace', src: 'video/fireplace.mp4' }
];

/** Defaults — applied on first load. */
export const defaults = {
	trackId: tracks[0]?.id,
	sceneId: scenes[0]?.id,
	masterVolume: 0.8,
	ambientVolumes: {
		rain: 0,
		thunder: 0,
		traffic: 0,
		cafe: 0,
		fireplace: 0,
		vinyl: 0
	} satisfies Record<AmbientLayer['id'], number>
} as const;

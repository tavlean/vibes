/**
 * Vibes — shared types
 *
 * One file, three small types — kept together because they're the public shape
 * of the catalog and they tend to evolve in lockstep.
 */

export type TrackId = string;
export type SceneId = string;
export type AmbientLayerId =
	| 'rain'
	| 'thunder'
	| 'traffic'
	| 'cafe'
	| 'fireplace'
	| 'vinyl';

/** A music track Tav has produced. Plays one at a time. */
export interface Track {
	id: TrackId;
	title: string;
	/** Path relative to the media base. Resolved through `mediaUrl()`. */
	src: string;
	/** Optional artist/credit string for "now playing" UIs later. */
	artist?: string;
}

/** A looping background video. */
export interface Scene {
	id: SceneId;
	title: string;
	/** Path relative to the media base. Resolved through `mediaUrl()`. */
	src: string;
	/** Optional poster image while the video is loading. */
	poster?: string;
}

/** A loopable ambient sound that can be mixed alongside the music. */
export interface AmbientLayer {
	id: AmbientLayerId;
	title: string;
	/** Path relative to the media base. */
	src: string;
}

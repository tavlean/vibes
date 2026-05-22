/**
 * Vibes — audio runtime context
 *
 * The context value is set synchronously during SSR and hydration, while the
 * browser-only AudioEngine is attached after mount. Descendants can render a
 * stable disabled shell until `runtime.engine` exists.
 */

import { createContext } from 'svelte';
import type { AudioEngine } from './engine.svelte';

export interface AudioRuntime {
	engine: AudioEngine | null;
}

export const [getRuntime, setRuntime] = createContext<AudioRuntime>();

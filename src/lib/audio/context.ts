/**
 * Vibes — engine context
 *
 * `[getEngine, setEngine]` typed pair from `createContext` (Svelte 5.40+) so
 * any descendant component can grab the AudioEngine without prop drilling and
 * without using stringly-typed context keys.
 */

import { createContext } from 'svelte';
import type { AudioEngine } from './engine.svelte';

export const [getEngine, setEngine] = createContext<AudioEngine>();

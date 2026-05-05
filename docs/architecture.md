# Architecture

One page: full-bleed looping video, DialKit floating panel, six ambient
layers + one music track mixed via Web Audio.

## Audio graph

One `AudioContext` per page-load. Each playable thing (music track, ambient
layer) is an `AudioSource` (`src/lib/audio/source.svelte.ts`):

```
<audio> → MediaElementAudioSourceNode → GainNode ─┐
                                                   ├→ master GainNode → destination
<audio> → MediaElementAudioSourceNode → GainNode ─┘
                                ...
```

Streaming via `<audio>` (rather than decoding to `AudioBuffer`) is deliberate:
free buffering, range requests, low memory — matters for multi-MB music files.

Volume changes use `linearRampToValueAtTime` over ~50ms. Setting `gain.value`
directly causes audible clicks; never do that.

## State model

`AudioEngine` (`src/lib/audio/engine.svelte.ts`) is a class with `$state`
fields. Instantiated once in `+layout.svelte`, exposed via Svelte 5.40+
`createContext` — typed `[getEngine, setEngine]` pair, no string keys.

`.svelte.ts` filename suffix is required for runes inside a non-component
module. Plain `.ts` will error.

## AudioContext lifecycle

Browsers block AudioContext until a user gesture. `engine.ensureRunning()`
lazily constructs the context + all sources on first call. The "tap to begin"
button on the page is the unlock; after that, every subsequent control
interaction works.

`isReady` flips true once the context exists — used by the page to hide the
unlock button.

## Reactivity rules in this codebase

- `$state` for engine fields and source state (volume, isPlaying, etc.).
- `$derived` only where there's a pure computation (none in current code; the
  catalog lookups in `engine.currentTrack` / `currentScene` are getters).
- `$effect` is reserved for syncing reactive state into Web Audio nodes — the
  canonical "external system" use case. The `$effect`s in `Controls.svelte`
  read DialKit values and write engine setters; they don't form a cycle
  because each effect reads one source-of-truth and writes a different one.
- No stores. No `setContext`/`getContext` with string keys.

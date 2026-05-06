# Architecture

One page: full-bleed looping video, a fixed-right control panel, six ambient
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
lazily constructs the context + all sources on first call. There's no
explicit unlock affordance — `play()`, `setTrack()`, and any user-driven
setter route through `ensureRunning` so the first interaction with any
control unlocks audio.

If a user adjusts an ambient slider above zero before the context exists,
the engine remembers the volume; once the context comes up, that layer
auto-starts at the stored volume.

## Control panel

`src/lib/components/Controls.svelte` is the panel. Custom Svelte components,
no external UI library:

- `SliderRow.svelte` — pointer-capture-driven slider used for master volume
  and each ambient layer.
- Inline `<button>` rows for Play/Pause and the scene picker.
- `TrackList.svelte` — passive elapsed-time display per track, click-to-
  select / click-to-toggle.

UI components write to engine state through the engine's setters
(`setMasterVolume`, `setAmbientVolume`, `setScene`, `setTrack`, `toggle`).
They read from `$state` fields directly (`engine.masterVolume`,
`engine.ambientVolumes[id]`, `engine.currentTrackId`, `engine.music`).

## Reactivity rules in this codebase

- `$state` for engine fields and source state (volume, isPlaying, etc.).
- `$derived` for pure computations — e.g. SliderRow's fill percentage.
- `$effect` is the escape hatch for external-system syncs (Web Audio gain
  ramps live inside the engine setters; not in components).
- No stores. No `setContext`/`getContext` with string keys.

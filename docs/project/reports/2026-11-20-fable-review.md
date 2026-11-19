# Whole-project review (2026-11-20)

Read-only review of all of `src/`, `static/` and the docs at commit `80f500c`.
Findings come from reading the code; nothing here was reproduced in a browser
unless stated. Ranked by value. Sizes: S under an hour, M half a day, L more.

## 1. Ambient sliders do not unlock audio, so ambience alone is impossible (S)

- Evidence: `src/lib/audio/engine.svelte.ts:190-201` (`setAmbientVolume`) and
  `:99-109` (`setMasterVolume`) never call `ensureRunning()`; only `play()`
  (`:113`) and `setTrack()` (`:138`) do. Before the context exists the ambient
  map is empty, so `:194` returns early.
- The docs promise the opposite: `docs/architecture.md:35-39` and the comment
  at `src/routes/+page.svelte:39-41` say any control unlocks audio.
- Why it matters: dragging Rain to 50% as the first action is silent. The only
  way to hear rain is to press Play, which also starts music. "Rain only" is a
  core use of a focus app and it takes three steps today.
- Fix: `await this.ensureRunning()` at the top of `setAmbientVolume`. Touch
  `pointerdown` is not a user activation, so also call it from the slider's
  `pointerup` path (or an `onCommit` prop on `SliderRow`).

## 2. `engine.isPlaying` can lie; media errors are swallowed (S)

- Evidence: `engine.svelte.ts:117-118` and `:144-145` set `isPlaying = true`
  after `music.play()`, but `source.svelte.ts:140-147` catches every rejection
  (blocked autoplay, 404, abort by a quick pause). No `error` listener exists
  on the element (`source.svelte.ts:73-98`).
- Single-track case: on `ended`, `#advanceToNext` calls `setTrack` with the
  same id, which returns at `engine.svelte.ts:137`. Playback stops and the
  button still says Pause. The catalog has one real track today
  (`catalog.ts:17-36`, the other two are 24 KB placeholders).
- Fix: make `isPlaying` a getter over `this.music?.isPlaying`, add an `error`
  listener that surfaces a state the UI can show, and have `#advanceToNext`
  restart the track when it is the only one.

## 3. R2 move will produce silence without CORS, and docs do not say so (S)

- Evidence: `source.svelte.ts:59` sets `crossOrigin = 'anonymous'` and `:63`
  routes the element through `createMediaElementSource`. Cross-origin media
  without `Access-Control-Allow-Origin` fails to load in that mode. Neither
  `docs/media-and-deploy.md` nor `creator-docs/02-after-your-files-are-in.md`
  mentions CORS (grep for "cors" returns nothing).
- Why it matters: the R2 path is the stated next step, and the failure is
  silent because of finding 2.
- Fix: add the R2 CORS rule (allowed origin, GET, HEAD, Range header) to both
  docs. Add a note that Pages caps files at 25 MiB, which forces R2 for video.

## 4. Each track switch builds a new audio element; auto-advance is fragile (M)

- Evidence: `engine.svelte.ts:170-182` destroys and recreates the source on
  every switch, then `:160` plays it from an `ended` callback with no gesture.
  `source.svelte.ts:155-171` already has `stop()` and `setUrl()` for reuse but
  nothing calls them.
- Why it matters: iOS Safari is strict about `play()` on a fresh element
  outside a gesture, so auto-advance may stop on phones (not tested). Hard
  destroy also cuts audio without the gain ramp the docs insist on
  (`docs/architecture.md:20-21`), as does `pause()` (`source.svelte.ts:149`).
- Fix: keep one music `AudioSource` for the page, switch with `setUrl()`, and
  ramp gain to 0 over 50 ms before pause or switch.

## 5. All six ambient files download on first gesture (S)

- Evidence: `engine.svelte.ts:69-84` creates every layer up front and
  `source.svelte.ts:58` sets `preload = 'auto'`.
- Why it matters: harmless with 40 KB placeholders, wasteful once real loops
  are several MB each, most of all on mobile data.
- Fix: `preload = 'none'` for ambient sources, or create a layer the first
  time its volume leaves 0.

## 6. Nothing is remembered between visits (S)

- Evidence: state lives only in `$state` fields (`engine.svelte.ts:34-41`);
  no `localStorage` anywhere in `src/`.
- Why it matters: a returning listener rebuilds the same mix every time.
- Fix: persist master volume, ambient volumes and track id; restore in the
  engine constructor (it only runs in the browser, `+layout.svelte:21-23`).

## 7. Phone rough edges in the panel (S)

- `SliderRow.svelte:65` sets `touch-none`, and the panel is mostly sliders
  inside `overflow-y-auto` (`Controls.svelte:42`), so a short phone cannot
  scroll the panel by dragging on rows. Use `touch-action: pan-y`.
- `max-h-[90vh]` and `[80vh]` ignore mobile browser bars; use `dvh`.
- No Media Session metadata or handlers, so no lock-screen title or controls.
  A few lines in the engine using `Track.artist`, which is unused today
  (`types.ts:25`).

## 8. Slider accessibility and keyboard (S)

- `SliderRow.svelte:75-77` announces raw 0 to 1 values; add `aria-valuetext`
  with the percentage the row already shows.
- `+page.svelte:25-28` handles Space on `window` even when a button has focus,
  so Space on a non-current track may toggle the current one instead of (or as
  well as) selecting it. Skip the shortcut when the target is a `BUTTON`.
- Volume is linear gain (`engine.svelte.ts:108`), so the bottom third of each
  slider does most of the audible work. Map slider value squared to gain.

## 9. No automated safety net, and a push deploys (M)

- Evidence: no tests, no linter, no `.github/` workflow; `AGENTS.md` gate is
  check plus build only. `source.svelte.ts:119-127` exposes `_element` for
  end-to-end probes that were never written.
- Fix: one Playwright smoke test (load, press Play, assert the element is
  playing, dispatch `ended`, assert advance), a unit test for `mediaUrl`, and
  a small CI job running check, build and the smoke test. Add Prettier:
  `catalog.ts` uses 4 spaces and double quotes, the rest tabs and single.

## 10. Dead code and drift (S)

- Unused: `AudioSource.stop/setUrl/isLoaded` (until finding 4), `isReady`
  (`engine.svelte.ts:43`), `src/lib/index.ts`, empty `src/lib/assets/`,
  `static/audio/music/sample-one.mp3` (not in the catalog).
- Duplicates: row class strings in `Controls.svelte:30-34` and
  `TrackList.svelte:40-44` despite the "centralising" comment; `clamp` and
  `FADE_SECONDS` in both audio files; two imports of the catalog at
  `Controls.svelte:15,17`.
- Docs: `docs/architecture.md:28` names `[getEngine, setEngine]`, the code has
  `getRuntime/setRuntime` with a null engine until mount (`context.ts:12-16`).
  `docs/project/brief.md` calls all three tracks samples; Wanderland is real
  (8.3 MB in git, which also sits oddly with the AGENTS.md media rule).
  `creator-docs/01-your-tasks.md:59,78` still describe `sample-one`.

## 11. Small config and performance items (S)

- No `static/_headers`: add `Cache-Control: immutable` for `/_app/immutable/*`
  and a long cache for media.
- `static/site.webmanifest`: the SVG icon claims `512x512` and both icons use
  `"any maskable"`; use `sizes: "any"` and separate purposes, add a 192 px PNG.
- `TrackList.svelte:70-73` animates `width` every frame; `transform: scaleX`
  avoids layout. Minor at three rows.
- The scene id lives in the audio engine (`engine.svelte.ts:37,204`) though it
  is not audio state. Move it out when scenes come back.

## Suggested order

1, 2 and 3 together (one small engine change plus docs), then 4 and 5 before
real media lands, then 9 so later work is protected.

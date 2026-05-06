# Scenes

A "scene" is a looped background video (e.g. *Night Rain*) plus the picker
button that switches between them. The scene picker lives in the right-side
control panel; the chosen video plays full-bleed under the UI via
`VideoBackground.svelte`.

## Currently hidden

The scene UI is **disabled** in production. Both render points are wrapped
in `{#if SHOW_SCENES}`:

- The picker section in [`Controls.svelte`](../src/lib/components/Controls.svelte)
- The `<VideoBackground>` mount in [`+page.svelte`](../src/routes/+page.svelte)

The flag lives in [`src/lib/config.ts`](../src/lib/config.ts). Flip it to
`true` to bring the scene picker and the video back. Nothing else needs to
change.

The audio engine still tracks `currentSceneId` and exposes `setScene()`, and
the catalog still lists scenes — so the data path is intact. The only thing
hidden is the surface that lets a viewer pick one.

## Why hidden

Tav wants to evaluate the panel against true black before deciding what
the scene system should do. The night-rain video bleeds a strong blue
through the panel's low-alpha surfaces and changes how every other colour
reads.

## Re-enabling

1. Set `SHOW_SCENES = true` in `src/lib/config.ts`.
2. (Optional) Adjust the default scene in `src/lib/catalog.ts` — `scenes[0]`
   is what the engine picks on first load.
3. (Optional) Tune the brightness/saturation overlay on the video in
   `VideoBackground.svelte` if a particular scene reads too strongly.

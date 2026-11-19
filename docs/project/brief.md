# Vibes brief

Written 2026-11-19 during a maintenance pass, from the code and docs only (no
interview). Refresh with the brief skill before substantial new work.

## What it is

A personal focus app: a full-bleed looping video, T.A.V's music, and six
ambient layers (rain, thunder, traffic, cafe, fireplace, vinyl) mixed in the
browser with Web Audio. One page, no accounts, no backend. Built with
SvelteKit 3 and adapter-static, deployed to Cloudflare Pages from `main`.

## Current state (2026-11-19)

- Works end to end with placeholder media: three sample tracks, the ambient
  set, and scene videos.
- The scene picker and background video are hidden behind `SHOW_SCENES`
  (docs/scenes.md).
- Media ships from `static/`; moving to R2 is planned once the library grows
  (docs/media-and-deploy.md).
- No tests and no linter; the gate is `pnpm run check && pnpm run build`.

## Open questions for Tavlean

- Is Vibes still active, and what is next: real media, bringing scenes back,
  or the R2 move?
- Should the site keep polling for new versions? Kit 3 defaults to hourly;
  it is off to match the old behavior.
- Worth adding Prettier and a minimal Playwright smoke test?

## Pointers

- Docs index: docs/README.md
- Owner tasks and deploy steps: creator-docs/
- Style tie-breakers: AGENTS.md

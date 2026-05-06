# Media & deploy

## mediaUrl()

All audio/video URLs go through `mediaUrl()` in `src/lib/media.ts`. It reads
`import.meta.env.PUBLIC_MEDIA_BASE_URL` (declared in `src/app.d.ts`):

- Unset → returns `/audio/...` (served from `/static`).
- Set (e.g. `https://media.example.com`) → returns `${base}/audio/...`.

Migrating media to R2 / a CDN is one env-var change. Components stay untouched.
Don't bypass this helper.

## Catalog is the editing surface

`src/lib/catalog.ts` is the only file you edit to add/rename tracks, ambient
layers, or scenes. The control panel reads from it declaratively — adding a
new track or scene is one entry in the array.

If you add a 7th ambient layer, you must also:
1. Add the id to the `AmbientLayerId` union in `src/lib/types.ts`.
2. Add a default in `defaults.ambientVolumes` (still in catalog.ts).
The Controls panel iterates `ambientLayers` directly, so no extra UI wiring.

## Adapter

`@sveltejs/adapter-static` with `prerender = true` and `ssr = false` in
`+layout.ts`. Build outputs a folder of plain HTML/JS/CSS to `build/`.
Cloudflare Pages serves it entirely from edge cache; no Worker invocations,
no per-request quota concerns.

Switch to `adapter-cloudflare` only if a server route is genuinely needed —
one-line change in `svelte.config.js`, plus a `wrangler.jsonc`.

## Build output sanity check

After `npm run build`, `build/` should contain:

- `index.html` (the prerendered shell)
- `404.html` (SPA fallback)
- `_app/immutable/...` (hashed JS/CSS bundles)
- `audio/`, `video/` (copied from `static/`)
- `robots.txt`

If `audio/` or `video/` is missing, files weren't in `static/` at build time.
If `_app/` is missing, the build silently failed — check the Vite output.

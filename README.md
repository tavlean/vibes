# Vibes

A focus-mode / "vibe" app for playing your own beats and instrumentals layered
with ambient sounds (rain, thunder, traffic, café, fireplace, vinyl) over a
looping background video. Built for Tav and friends.

## Stack

- **SvelteKit** (Svelte 5, runes mode), **TypeScript**
- **Tailwind CSS v4** for global styles + utility classes
- **DialKit** floating control panel — provides every slider, toggle, dropdown,
  and action button in the UI
- **Web Audio API** — one `AudioContext`, one `<audio>` + `GainNode` per source,
  master gain mix
- **`adapter-static`** → fully prerendered SPA → **Cloudflare Pages** edge cache
- Media files in `/static` for v1; env-var-swappable Cloudflare R2 base URL
  (`PUBLIC_MEDIA_BASE_URL`) for v2

## Run locally

```sh
npm install
npm run dev
```

Then open <http://localhost:5173>.

The placeholder media files in `static/audio/` and `static/video/` are
intentionally silent / flat-color so the UI works end-to-end before real files
are dropped in.

## Where to start

- **You're picking this up** → read [`creator-docs/01-your-tasks.md`](./creator-docs/01-your-tasks.md)
- **Files are in, what's next** → [`creator-docs/02-after-your-files-are-in.md`](./creator-docs/02-after-your-files-are-in.md)
- **Catalog (tracks, ambient layers, scenes)** → [`src/lib/catalog.ts`](./src/lib/catalog.ts)

## Structure

```
src/
├ lib/
│ ├ audio/
│ │ ├ engine.svelte.ts    AudioEngine class — owns AudioContext, master gain
│ │ ├ source.svelte.ts    AudioSource class — one per track or ambient layer
│ │ └ context.ts          createContext-based engine context (Svelte 5.40+)
│ ├ components/
│ │ ├ VideoBackground.svelte   full-bleed looping <video>, crossfades on scene
│ │ │                           change via {#key} + fade transitions
│ │ └ Controls.svelte           DialKit panel + bridge to AudioEngine
│ ├ catalog.ts            Tracks, ambient layers, scenes (you edit this)
│ ├ media.ts              mediaUrl() — handles v1→v2 migration
│ └ types.ts              Track, Scene, AmbientLayer
├ routes/
│ ├ +layout.svelte        Provides engine context, mounts <DialRoot />
│ ├ +layout.ts            prerender = true; ssr = false
│ └ +page.svelte          Composes the page + Space-to-toggle keybinding
├ app.css                 Tailwind + DialKit imports + dark-theme tokens
├ app.d.ts                ImportMetaEnv augmentation for PUBLIC_MEDIA_BASE_URL
└ app.html
static/
├ audio/music/            Your beats (replace placeholder MP3s)
├ audio/ambient/          6 ambient loops
└ video/                  3 background videos
scripts/
└ patch-dialkit.mjs       Workaround for missing files in dialkit@1.2.0 dist
                            (auto-runs on `npm install` via postinstall)
```

## Build for production

```sh
npm run build      # outputs static files to ./build
npm run preview    # serves ./build locally on :4173 to verify
```

The output is a folder of plain HTML/JS/CSS — drop it on any static host. On
Cloudflare Pages, it's served entirely from the edge cache; viral spikes don't
trigger Worker invocations.

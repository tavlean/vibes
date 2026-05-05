# Your tasks — Vibes

You're picking up a working app. Everything is wired and runs locally — but
right now the audio files are silent placeholders and the videos are flat
colored rectangles. This doc walks through what to do, in plain language, in
the order it makes sense.

You don't need to do all of this in one sitting. The app keeps working at every
step.

---

## 0. Get it running once, just to see

Open a terminal in this folder and run:

```sh
npm install
npm run dev
```

Then visit <http://localhost:5173> in your browser. You'll see:

- A dark page (it's a flat-color "video" right now)
- A small **tap to begin** pill in the centre — click it once. This is required
  by browser policy: audio can't start until you make any user gesture.
- A small floating control bubble in the bottom-right corner — that's
  **DialKit**. Click it to expand the panel.

In the panel you'll see a **Master** slider, **Track** dropdown, **Play/Pause**
button, **Scene** dropdown, and an **Ambient** folder with six volume sliders
(Rain, Thunder, Traffic, Café, Fireplace, Vinyl).

It all works — moving the master slider attenuates everything, the ambient
sliders fade layers in and out, etc. It's just silent because the placeholder
files contain no actual sound.

When you're done poking around, hit `Ctrl-C` in the terminal to stop it.

---

## 1. Drop in your music tracks

Take three (or any number, but three is the seeded default) of your favourite
beats/instrumentals as MP3 files and put them in:

```
static/audio/music/
```

A few practical recommendations:

- **Format:** MP3 at ~192 kbps, or AAC. Both are universally supported.
- **Loudness:** normalise to roughly -14 LUFS so tracks feel comparable in
  volume. Most modern DAWs (Logic, Ableton, FL) have a built-in loudness meter.
- **Filenames:** lowercase, hyphenated, no spaces. e.g.
  `midnight-drive.mp3`, `slow-burn.mp3`.

Replace the existing `sample-one.mp3`, `sample-two.mp3`, `sample-three.mp3` —
or delete them and use new filenames. Either way, the next step makes the app
match your filenames.

---

## 2. Update the catalog

Open this file:

```
src/lib/catalog.ts
```

Near the top you'll see a `tracks` array:

```ts
export const tracks: Track[] = [
  {
    id: 'sample-one',
    title: 'Sample One',
    artist: 'Tav',
    src: 'audio/music/sample-one.mp3'
  },
  // ... two more
];
```

Edit each entry so the `id`, `title`, and `src` match your files.

- **`id`** — a short URL-safe slug (lowercase letters, numbers, hyphens). Used
  internally; the user never sees it.
- **`title`** — what shows in the Track dropdown.
- **`artist`** — optional, "Tav" by default.
- **`src`** — the path under `static/`, with no leading slash.

Add or remove entries as you like. The dropdown will reflect them automatically.

---

## 3. Get six ambient sound loops

Six files, each a clean ~30-second seamless loop, into:

```
static/audio/ambient/
```

with these exact filenames (because the catalog already references them):

| File | What it should sound like |
|---|---|
| `rain.mp3` | Light to medium rain |
| `thunder.mp3` | Distant rolling thunder |
| `traffic.mp3` | City hum / distant traffic |
| `cafe.mp3` | Coffee shop ambience, light chatter |
| `fireplace.mp3` | Wood crackling |
| `vinyl.mp3` | Vinyl record surface noise / lo-fi crackle |

**Where to find royalty-free loops:**

- [freesound.org](https://freesound.org/) — search the term, filter by Creative
  Commons 0 license. Look for tagged "loop" or "seamless".
- [mixkit.co/free-sound-effects](https://mixkit.co/free-sound-effects/) — free
  for personal and commercial use, no attribution required.
- [zapsplat.com](https://www.zapsplat.com/) — free with a free account.

If your loop isn't perfectly seamless, you can clean it up in any audio editor
(Audacity is free) by crossfading the start and end.

---

## 4. Get three background videos

Three short looping MP4s into:

```
static/video/
```

with these filenames:

- `night-rain.mp4`
- `forest.mp4`
- `fireplace.mp4`

Each should be a **seamless 10–20 second loop**, **1080p**, **H.264**, around
**3–8 MB** if possible (the smaller the better — they have to download fast).

**Where to find royalty-free loops:**

- [pexels.com/videos](https://www.pexels.com/videos/) — free, large library,
  excellent quality
- [coverr.co](https://coverr.co/) — free, designed for backgrounds
- [mixkit.co/free-stock-video](https://mixkit.co/free-stock-video/)

If a video isn't already a clean loop, you can re-encode it as one with
`ffmpeg`:

```sh
# Re-encode to H.264, 1080p, looping cleanly
ffmpeg -i source.mp4 -vf "scale=1920:-2,fps=30" -c:v libx264 -preset slow \
  -crf 26 -an -movflags +faststart -t 15 night-rain.mp4
```

The `-an` flag strips audio, which we don't need (the video is muted on the
page anyway).

To rename or replace videos, just edit the `scenes` array in
`src/lib/catalog.ts` — same pattern as the tracks.

---

## 5. Verify everything works

Run the dev server again:

```sh
npm run dev
```

Walk through each of:

- Each music track plays (try the dropdown)
- Each ambient layer plays when you raise its slider
- Master slider attenuates the whole mix
- Each video plays and loops
- The scene dropdown crossfades between videos
- Press `Space` to toggle play/pause without touching the panel

If everything works, you're done with the main creative work.

---

## 6. (When you're ready) Deploy & R2 migration

Open the next doc — [`02-after-your-files-are-in.md`](./02-after-your-files-are-in.md)
— for:

- Pushing to GitHub
- Connecting to Cloudflare Pages
- (Later) Moving media to Cloudflare R2 so the repo stays small

Those steps need your Cloudflare login, so they're a separate chapter you can
run when you have time.

---

## Notes & gotchas

- **Browser autoplay policy.** The first interaction (clicking "tap to begin"
  or any DialKit control) unlocks audio. After that, everything Just Works for
  the rest of the session. This is a browser rule, not something we can skip.
- **DialKit panel position.** It lives bottom-right by default. You can drag
  the closed bubble to a different corner — it remembers.
- **Saving "vibes" / presets.** DialKit has a built-in preset manager (the
  little version dropdown in the panel toolbar). You can save your current
  state as a "Version", switch between them, and copy the JSON to your
  clipboard. We'll wire this to a "share-a-vibe" URL in v2.
- **Build to test the production version locally.** Run `npm run build` and
  then `npm run preview`. The output is a folder of plain static files in
  `build/`.

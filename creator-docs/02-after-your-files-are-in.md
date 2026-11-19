# After your files are in — Vibes

Open this doc once you've finished
[`01-your-tasks.md`](./01-your-tasks.md) and have real audio + video files in
place. Hand it back to me ("we're picking up from creator-docs/02") and we can
work through any of these in order, or skip ahead.

---

## A. Push to a GitHub remote

The repo is local-only right now. To deploy via Cloudflare Pages' Git
integration, it needs to live somewhere Cloudflare can reach.

```sh
# from the repo root
gh repo create vibes --private --source=. --remote=origin --push
```

Or, if you'd rather create the remote in the GitHub UI first, set it manually:

```sh
git remote add origin git@github.com:<your-username>/vibes.git
git branch -M main
git push -u origin main
```

I'll handle this for you when you ask — it just needs your `gh` auth.

---

## B. Connect Cloudflare Pages

1. In the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Pick the `vibes` repo.
3. Build settings:
   - **Framework preset:** SvelteKit (static)
   - **Build command:** `pnpm run build`
   - **Build output directory:** `build`
   - **Node version:** 20+ (set in dashboard environment variables as
     `NODE_VERSION = 20` if needed)
4. Save and deploy.

Cloudflare will auto-deploy on every push to `main` after this. The site is
fully static, so it serves entirely from the edge — no Worker invocations,
no Worker-request quota concerns.

### Custom domain
**Workers & Pages → your project → Custom domains → Set up a custom
domain.** Cloudflare handles DNS + SSL automatically if the domain is on
Cloudflare; otherwise it gives you a CNAME target.

---

## C. Move media to R2 (when files start growing)

Right now the audio + video files live in `static/` and ship with the build.
That's fine for a dozen or so files. Once your music library grows, you'll
want to move them to R2 so:

- The git repo stays lean
- You can swap individual tracks without redeploying
- You can still run on Cloudflare's free tier (R2 has zero egress fees)

### 1. Create the bucket

```sh
# Install Wrangler if you haven't (one-time, global):
pnpm add -g wrangler

# Log in (opens browser):
wrangler login

# Create the bucket:
wrangler r2 bucket create vibes-media
```

### 2. Connect a custom domain (so cache works properly)

In the Cloudflare dashboard → **R2** → `vibes-media` → **Settings** →
**Public access** → **Connect Domain**. Pick something like
`media.<yourdomain>`. Cloudflare creates the DNS record + cert for you.

This is **important**: serving R2 through a custom domain on your zone is what
lets Cloudflare's CDN cache the files. The raw `r2.dev` URL bypasses cache.

### 3. Set cache headers

For each object you upload, set a long cache lifetime. From the Wrangler CLI:

```sh
wrangler r2 object put vibes-media/audio/music/midnight-drive.mp3 \
  --file ./static/audio/music/midnight-drive.mp3 \
  --content-type audio/mpeg \
  --cache-control "public, max-age=31536000, immutable"
```

Or upload via the dashboard, then add cache headers via a Transform Rule on
the custom domain.

### 4. Bulk upload everything currently in `/static`

```sh
# from the repo root, this script uploads with proper headers in one go
for f in $(find static/audio static/video -type f); do
  rel="${f#static/}"
  case "$f" in
    *.mp3) mime="audio/mpeg" ;;
    *.mp4) mime="video/mp4" ;;
    *.webm) mime="video/webm" ;;
    *) mime="application/octet-stream" ;;
  esac
  wrangler r2 object put "vibes-media/$rel" \
    --file "$f" \
    --content-type "$mime" \
    --cache-control "public, max-age=31536000, immutable"
done
```

### 5. Point the app at R2

In the Cloudflare Pages dashboard → your project → **Settings** → **Variables
and Secrets** → add:

```
PUBLIC_MEDIA_BASE_URL = https://media.yourdomain.com
```

(No trailing slash.) Then trigger a redeploy. The app will start fetching all
audio/video from R2 automatically. The `mediaUrl()` helper does this for us
already — no code changes needed.

Once it's working, you can delete the files from `static/` and commit the
empty placeholders so the repo shrinks.

### 6. Verify cache hit rates

In the Cloudflare dashboard → your zone → **Analytics & Logs** → **Caching**.
After some traffic, you should see >95% cache hit rate on media requests. If
it's low, double-check the custom-domain setup and the `Cache-Control`
headers.

---

## D. Things we deferred

Worth picking up next, in roughly this order:

1. **"Share a vibe" URLs** — encode the current panel state (master volume,
   track, scene, ambient mix) into the URL hash so a link reproduces a mood.
   Plus a small "save preset" UI on the panel.
2. **Audio visualizer** — a subtle waveform/peak meter overlay using the Web
   Audio `AnalyserNode`. Already have the audio graph; just need a canvas
   layer.
3. **User-uploaded sounds** — drag-and-drop a custom ambient layer. Stored in
   IndexedDB, no server needed.
4. **PWA / offline** — service worker that pre-caches the current track + a
   single video so the app works during a brief connection drop.
5. **Mobile gesture polish** — long-press to fullscreen, two-finger drag
   on the panel, etc.

---

## E. What I will NOT do without you asking

For your safety / autonomy, I won't take these actions on my own:

- Create accounts (Cloudflare, GitHub, anywhere)
- Run `wrangler login` or any other browser-auth step
- Enter payment details anywhere
- Push to a remote that isn't already configured
- Force-push to `main`
- Delete the repo or any data

When you're ready for any of those, just say so and I'll walk you through it
or do the parts I can do safely.

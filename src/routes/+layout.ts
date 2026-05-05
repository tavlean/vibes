// Prerender the entire site as static HTML/JS/CSS. Combined with adapter-static,
// this means the production build is a folder of plain files that Cloudflare
// Pages (or any static host) serves straight from the edge cache. No Worker
// invocations.
export const prerender = true;
// SPA-style: client takes over after first paint. Disable SSR — the audio/video
// app is fully client-side and there's no server to render against in production.
export const ssr = false;

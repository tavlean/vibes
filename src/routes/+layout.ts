// Prerender the entire site as static HTML/JS/CSS. Combined with adapter-static,
// this means the production build is a folder of plain files that Cloudflare
// Pages (or any static host) serves straight from the edge cache. No Worker
// invocations.
export const prerender = true;

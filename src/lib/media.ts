/**
 * Vibes — media URL helper
 *
 * Every component resolves audio/video paths through this function. In v1 it
 * just returns a leading-slash path that hits files in `/static`. In v2, when
 * the user moves files to Cloudflare R2, set `PUBLIC_MEDIA_BASE_URL` (e.g.
 * `https://media.example.com`) at build time and every URL automatically
 * points at R2 — no component changes needed.
 *
 * Read via `import.meta.env` (rather than `$env/static/public`) so the build
 * works whether the variable is defined or not — undefined → local paths.
 */

const RAW_BASE: string | undefined = import.meta.env.PUBLIC_MEDIA_BASE_URL;
const base = (RAW_BASE ?? '').replace(/\/$/, '');

/**
 * Resolve a catalog `src` (e.g. `audio/music/midnight-drive.mp3`) to a full URL.
 * Leading slashes on `path` are tolerated.
 */
export function mediaUrl(path: string): string {
	const clean = path.replace(/^\/+/, '');
	if (base) return `${base}/${clean}`;
	return `/${clean}`;
}

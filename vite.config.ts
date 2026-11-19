import adapter from '@sveltejs/adapter-static';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Pure static SPA. The whole app prerenders to plain HTML/JS/CSS, so it's
			// served entirely from Cloudflare's edge cache, with no Worker invocations.
			// `fallback` is set as a safety net for any future dynamic route.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '404.html',
				precompress: false,
				strict: true
			}),
			// SvelteKit 3 polls `_app/version.json` hourly by default; keep the
			// SvelteKit 2 behavior of not polling.
			version: { pollInterval: 0 }
		})
	]
});

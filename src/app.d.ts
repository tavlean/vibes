// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface ImportMetaEnv {
		/**
		 * Optional base URL for media (audio, video) assets. When set (e.g. to
		 * a Cloudflare R2 custom domain), `mediaUrl()` prepends it to all
		 * catalog paths. When unset, files are served from `/static` directly.
		 */
		readonly PUBLIC_MEDIA_BASE_URL?: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};

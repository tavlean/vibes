# Worklog

Newest first.

## 2026-11-19: pnpm, SvelteKit 3, project standard

- Moved from npm to pnpm 12.21.0 (`packageManager` in package.json). `pnpm import` kept every version; the strict tree surfaced no undeclared deps and no native build scripts.
- Upgraded SvelteKit 2.65.2 to 3.3.1, Vite 8.1.2 to 8.3.8, Svelte 5.56.3 to 5.58.0, adapter-static 3.0.10 to 4.0.1, vite-plugin-svelte 7.1.0 to 7.3.1, Tailwind 4.2.4 to 4.3.5, svelte-check 4.4.8 to 4.7.8, @types/node 25 to 24 (matches Node 24).
- Kit 3 changes applied: config moved from svelte.config.js into `sveltekit()` in vite.config.ts; `$lib` imports became `#lib` subpath imports (package.json `imports`) with explicit `.ts` extensions; `asset()` paths lost their leading slash; tsconfig extends `$app/tsconfig`; version polling kept off.
- Gotcha: TypeScript 7 breaks svelte-check ("Cannot read properties of undefined (reading 'readFile')"), so TypeScript stays on 6.0.3.
- Added the standard files: AGENTS.md, CLAUDE.md, brief, design placeholder, worklog, ledger.
- Verified: svelte-check clean, build clean, preview serves `/`, favicon and manifest, page renders with no console errors.

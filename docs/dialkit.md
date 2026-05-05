# DialKit

The entire control panel is DialKit. We don't build custom sliders/toggles.
Two integration points only:

- `src/routes/+layout.svelte` mounts `<DialRoot />`
- `src/lib/components/Controls.svelte` declares the values + bridges to the engine

## ⚠ Packaging bug — check on every upgrade

`dialkit@1.2.0` ships a broken Svelte build. Components in
`node_modules/dialkit/dist/svelte/components/*.svelte` import from
`'../../shortcut-utils'` and `'../../icons'` — files that aren't published in
`dist/`. Build fails with `UNRESOLVED_IMPORT` without intervention.

**Workaround:** `scripts/patch-dialkit.mjs` writes the missing stubs (values
copied verbatim from `dist/index.js`, the React entry that does bundle them).
Wired into `package.json` as `postinstall` and `prepare`.

**To check on each DialKit upgrade:**

1. `npm install dialkit@latest`
2. Look at `node_modules/dialkit/dist/svelte/components/Slider.svelte` — does
   it still `import { ... } from '../../shortcut-utils';`? If yes, the bug
   persists.
3. Check `ls node_modules/dialkit/dist/` — are `shortcut-utils.js` and
   `icons.js` now present? If yes, the bug is fixed.
4. If fixed: delete `scripts/patch-dialkit.mjs`, remove `postinstall` from
   `package.json`, drop the `node scripts/patch-dialkit.mjs &&` prefix from
   `prepare`. Verify with `rm -rf node_modules && npm install && npm run build`.
5. Track progress upstream: <https://github.com/joshpuckett/dialkit/issues>

## productionEnabled

DialKit hides itself in production builds by default — designed as a dev tool.
For us it IS the user-facing UI, so `<DialRoot productionEnabled />` is
required. Don't remove that prop.

## Control config shape

In `Controls.svelte`:

- `[default, min, max]` → slider. `[default, min, max, step]` for explicit step.
- Bare number → slider with auto-inferred range (0–1 → 0..1 step 0.01, etc.).
- Boolean → toggle.
- `{ type: 'select', options, default? }` → dropdown. Options can be strings or
  `{ value, label }`.
- `{ type: 'action', label? }` → button; no stored value, fires `onAction`.
- Nested object → folder. `_collapsed: true` to start closed.

The `as const` casts on `'select'` / `'action'` aren't decorative — without
them TS widens to `string` and DialKit's typed config rejects the shape.

## Bridge to the engine

DialKit returns one reactive `values` object. Each `$effect` in
`Controls.svelte` reads one field and writes the corresponding engine setter.
Granular dependencies → unrelated changes don't refire each effect.

`onAction` callbacks fire from inside DialKit's button click handler, which
counts as a real user gesture — safe to call `engine.toggle()` (which calls
`ensureRunning()`) from there.

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

## ⚠ Reactivity bug — check on every upgrade

The object returned from `createDialKit()` is **not reactive across the
function boundary** in Svelte. Inside DialKit, the impl is:

```js
let values = $state(resolve());
$effect(() => {
  ...
  DialStore.subscribe(panelId, () => { values = resolve(); });
});
return values;
```

The `values = resolve()` reassignment doesn't propagate to consumers — the
returned reference is bound to the original proxy/object. This is the same
constraint Svelte's docs describe under "you can only export state that isn't
directly reassigned." Verified with playwright probe: `DialStore` updates
correctly but `values.master` never changes from the consumer's view.

**Workaround:** `Controls.svelte` ignores the return value and reads from
`DialStore` directly. Important: `subscribeGlobal()` only fires on panel
register/unregister — value updates only call per-panel `notify(panelId)`.
We have to use `subscribe(panelId, …)`, and find the panel id once it's
registered (see the `tryAttach` helper in `Controls.svelte`).

**To check on each DialKit upgrade:**

1. `npm install dialkit@latest`
2. Inspect `node_modules/dialkit/dist/svelte/createDialKit.svelte.js` — does
   it still do `let values = $state(resolve())` followed by `values = resolve()`
   inside `$effect`? If so, the bug persists.
3. If fixed (e.g. they switch to mutating `values.x = …` instead): you can
   delete the workaround in `Controls.svelte` and use the returned object
   with `$effect` directly. Run the playwright probe at `/tmp/verify-dialkit.mjs`
   (or recreate it) to confirm value updates propagate.

## Control config shape ↔ engine bridge

`Controls.svelte` registers the panel via `createDialKit()`, then runs one
`$effect` that:

1. Subscribes to the panel's DialStore notifications.
2. On each notification (and on mount), `pull()` reads every field via
   `DialStore.getValue(panelId, path)` and pushes into the engine's setters.

Adding a new control means: add it to the `createDialKit` config, then read
it inside `pull()` and route to a new engine setter.

`onAction` callbacks fire synchronously from DialKit's button click handler,
which counts as a real user gesture — safe to call `engine.toggle()`
(which lazily resumes the AudioContext) from there.

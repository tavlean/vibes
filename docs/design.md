# Design

Placeholder: populate in a design session. Until then, the source of truth is
`src/app.css`.

What exists today:

- Black page so the looping background video is the primary surface; the UI
  floats on top in a fixed right-side panel.
- Surfaces use Tailwind's `gray` palette at low alphas so the video bleeds
  through. Opacities are chosen at the call site (`gray-100/X`) so intent is
  visible in the markup.
- One accent token: `--color-accent` (`oklch(0.85 0.15 150)`) plus a glow.
- System font stack, dark color scheme only.

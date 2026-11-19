# Docs

Context for anyone (AI or human) picking up this codebase. Read the docs
related to your task before working, and update the ones you invalidated
during or right after it: a task is not complete while a doc it touched is
stale.

## Conventions for these docs

- One topic per file. Short.
- Only things that aren't intuitive from reading the code, with the reason.
- No teaching of general framework, language or browser concepts.
- State the current way as if it had always been the way; git keeps history.
- Absolute dates. No em dashes.
- Index entries below are 5 to 8 words, enough to know whether to open.

## Index

- [architecture.md](./architecture.md): audio engine, state, control panel
- [media-and-deploy.md](./media-and-deploy.md): media URL layer, static build, R2 path
- [scenes.md](./scenes.md): scene picker is hidden; how to bring it back
- [design.md](./design.md): design tokens and visual idioms (placeholder)
- [project/](./project/): brief, worklog, ledger, project identity

## Sibling: `creator-docs/`

`/creator-docs` is for the project owner (Tav): what files to drop in and how
to deploy. Not for devs maintaining the code; that's here.

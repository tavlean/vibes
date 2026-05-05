# Docs

Context for anyone (AI or human) picking up this codebase. **Read these docs
first** — they cover the non-obvious project-specific stuff.

## Conventions for these docs

- One topic per file. Short.
- Only things that aren't intuitive from reading the code.
- No teaching of general framework / language / browser concepts.
- No "why we chose X over Y" rationale unless that choice still influences
  daily work.
- If something is true and surprising, write it down. Otherwise don't.
- Index entries below are 5–8 words — enough to know whether to open.

## Index

- [architecture.md](./architecture.md) — Audio engine shape, state, lifecycle
- [dialkit.md](./dialkit.md) — DialKit usage; required postinstall patch
- [media-and-deploy.md](./media-and-deploy.md) — Media URL layer, static build, R2 path

## Sibling: `creator-docs/`

`/creator-docs` is for the project owner (Tav) — what files to drop in, how to
deploy. Not for devs maintaining the code; that's here.

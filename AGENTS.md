Vibes is a personal focus web app: a looping background video, T.A.V's music tracks, and mixable ambient sound layers, built as a fully static SvelteKit site on Cloudflare Pages. Start with docs/README.md (the docs index) and docs/project/brief.md (what this is and where it stands). Read the docs related to your task BEFORE working and update the ones you invalidated after; the index routes you, so load only what the task needs.

## Style tie-breakers
Match the surrounding code by default. When the surroundings are mixed or absent and you are unsure which local style to follow, prefer these files:
- `src/lib/audio/source.svelte.ts` (audio and state logic)
- `src/lib/components/SliderRow.svelte` (UI component)

## Hard rules (every task; all how-to detail lives in docs/)
- Commit checkpoint-sized changes regularly. Push finished work whose gates pass without asking; never force-push. A push to main deploys through Cloudflare Pages.
- One source of truth per topic.
- The site must stay fully static (adapter-static, prerendered). Do not add server routes or disable SSR without approval; see docs/media-and-deploy.md.
- Never commit large media into `static/` beyond the current set without approval; big media belongs in R2 (docs/media-and-deploy.md).
- Before finishing code work: `pnpm run check && pnpm run build`. Add nothing, break nothing.
- No em dashes in anything you write; rewrite the sentence to be simpler instead.
- Note your gotcha discoveries in your final report so the worklog can capture them.
- Svelte work: follow ~/.agents/svelte-mcp.md (read the docs through the Svelte MCP tools; svelte-check is the gate, no autofixer loop).

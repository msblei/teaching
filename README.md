# teaching.mariusbleif.com

Workshop tools by Marius Bleif. One Astro project for all of them: static
visualizers are prerendered, dynamic apps add server endpoints that run as
Netlify Functions.

## Development

```bash
pnpm install
cp .env.example .env   # set OPENROUTER_API_KEY, ADMIN_PASSWORD
pnpm dev
pnpm build
```

## Structure

- `src/data/apps.ts`: registry of tools, rendered on the index page
- `src/pages/<slug>/`: each tool's page
- `src/pages/[slug].astro`: code screen for planned topics (`kind: "placeholder"`); a real page at `src/pages/<slug>/` replaces it
- `src/pages/api/<slug>/`: server endpoints of dynamic tools (`prerender = false`)
- `src/apps/<slug>/`: each tool's code (UI, shared, server), self-contained
- `src/lib/i18n.ts`: DE/EN (both rendered, one hidden; islands listen for `langchange`)
- `src/lib/workshop-access.ts`: per-page access (`guard` for API calls, `pageGate` for pages) and hourly call cap
- `src/lib/admin.ts`, `src/lib/openrouter.ts`: the hidden admin page's login and stored secrets

## Admin (`/admin`, not linked)

Set `ADMIN_PASSWORD` in Netlify, then open `/admin` to set who may use each
workshop page and to paste, check or remove the OpenRouter key.

Each page in `src/data/apps.ts` is **Off**, **Code** (its own codes, with a
ready link per code, `?code=...`) or **Public** (no code). Changes apply at
once. A page nobody has set yet is off; in local dev it is public. A new page
needs either `guard()` on its API routes or `pageGate()` in its frontmatter
(with `prerender = false`), because a prerendered page can't be locked.

For the key: it is checked against OpenRouter, stored in Netlify Blobs
and live at once (no redeploy). The page shows the masked key, the credit
left on the key and the account, and when the key expires. Without a key,
participants get "No API key active yet. Please wait for your instructor."
A key set there wins over `OPENROUTER_API_KEY`; leave that env var empty in
Netlify so removing the key really switches the apps off.

## Tools

### From LLM to Agent (`/llm-to-agent`)

20 minutes, three stages in one chat page: a plain model, then tools
(eBay search, listing details, new price on toppreise.ch), then a goal.
The browser runs the agent loop one step per request, so participants can
watch model, tool, model happen.

- Stage 3 is one goal card with blanks (kit, items, budget, extra wishes):
  a goal with a checkable end that a single search can't meet. While it runs,
  a tracker above the composer shows items found, total against budget and
  the step count. The agent reports through a `track_goal` tool that the
  harness answers itself: links must come from tool results, prices are taken
  from those results, and the harness does the sums.
- The harness sets the step limit (15 requests with a goal, 8 without). The
  last request forbids tool calls, so a run always ends with an answer.
- A photo can be attached to any message (camera button in the composer);
  sent without text it asks what the thing is and what it is worth used.

- Access is set on `/admin`; with a code, `?code=` in the link works too.
- Models run through OpenRouter. A Claude | GPT picker swaps the model at any stage
  (defaults `anthropic/claude-haiku-5.5` and `openai/gpt-6-luna`, same price tier;
  override with `LLM_TO_AGENT_CLAUDE_MODEL` / `LLM_TO_AGENT_GPT_MODEL`).
- "Under the hood" (header switch) shows the same conversation as a sequence
  diagram: Model | App | Tools, with every request, answer and tool call.

**Data sources.** Second-hand listings come from eBay's official Browse API
(`EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` from a Production keyset on
developer.ebay.com): used, fixed-price items on ebay.ch from any country that
(item price without shipping; see the note on buyer location in
`server/sources/ebay.ts`). Without keys the search runs
on demo data. tutti.ch was the source until 2026-11-11, when it started
answering every automated request with a bot challenge. toppreise.ch is read
directly from its normal pages, with an honest user agent
(`teaching.mariusbleif.com workshop app`). Results are cached and shared by everyone
(`CACHE_MINUTES`, default 30), identical requests at the same moment are
combined, and if a site is unreachable the app serves stale cache, then demo
data (marked "demo data").

`node scripts/prewarm.ts <base-url> <code>` fills the cache before
a session and shows quickly whether the live sites answer from the server.

### AI Coding Workshop (`/ai-coding-workshop`)

Landing page for [msblei/AI_coding_workshop](https://github.com/msblei/AI_coding_workshop).
The "Join session" button appears only while the self-hosted IDE fleet at
`ai-coding-workshop.mariusbleif.com` answers.

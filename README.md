# teaching.mariusbleif.com

Workshop tools by Marius Bleif. One Astro project for all of them: static
visualizers are prerendered, dynamic apps add server endpoints that run as
Netlify Functions.

## Development

```bash
pnpm install
cp .env.example .env   # set WORKSHOP_CODES, OPENROUTER_API_KEY, ADMIN_PASSWORD
pnpm dev
pnpm build
```

## Structure

- `src/data/apps.ts`: registry of tools, rendered on the index page
- `src/pages/<slug>/`: each tool's page
- `src/pages/api/<slug>/`: server endpoints of dynamic tools (`prerender = false`)
- `src/apps/<slug>/`: each tool's code (UI, shared, server), self-contained
- `src/lib/i18n.ts`: DE/EN (both rendered, one hidden; islands listen for `langchange`)
- `src/lib/workshop-access.ts`: workshop code check and hourly call cap for dynamic tools
- `src/lib/admin.ts`, `src/lib/openrouter.ts`: the hidden admin page's login and stored secrets

## Admin (`/admin`, not linked)

Set `ADMIN_PASSWORD` in Netlify, then open `/admin` to paste, check or remove
the OpenRouter key. It is checked against OpenRouter, stored in Netlify Blobs
and live at once (no redeploy). The page shows the masked key, the credit
left on the key and the account, and when the key expires. Without a key,
participants get "No API key active yet. Please wait for your instructor."
A key set there wins over `OPENROUTER_API_KEY`; leave that env var empty in
Netlify so removing the key really switches the apps off.

## Tools

### From LLM to Agent (`/llm-to-agent`)

20 minutes, three stages in one chat page: a plain model, then tools
(tutti.ch search, listing details, new price on toppreise.ch), then
instructions as mission cards. The browser runs the agent loop one step per
request, so participants can watch model, tool, model happen.

- Participants need the workshop code (`?code=` in the link works too).
- Models run through OpenRouter. A Claude | GPT picker swaps the model at any stage
  (defaults `anthropic/claude-haiku-5.5` and `openai/gpt-6-luna`, same price tier;
  override with `LLM_TO_AGENT_CLAUDE_MODEL` / `LLM_TO_AGENT_GPT_MODEL`).
- "Under the hood" (header switch) shows the same conversation as a sequence
  diagram: Model | App | Tools, with every request, answer and tool call.

**Data sources.** tutti.ch and toppreise.ch are read directly from their
normal pages, with an honest user agent (`teaching.mariusbleif.com workshop app`).
tutti's robots.txt allows search (`/de/q/`) and listing pages (`/de/vi/`); its
`/api/` is off limits and not used. Tested 2026-11-07: 10 parallel searches in
0.3 to 0.5 s each. Results are cached and shared by everyone
(`CACHE_MINUTES`, default 30), identical requests at the same moment are
combined, and if a site is unreachable the app serves stale cache, then demo
data (marked "demo data").

`node scripts/prewarm.ts <base-url> <code>` fills the cache before
a session and shows quickly whether the live sites answer from the server.

### AI Coding Workshop (`/ai-coding-workshop`)

Landing page for [msblei/AI_coding_workshop](https://github.com/msblei/AI_coding_workshop).
The "Join session" button appears only while the self-hosted IDE fleet at
`ai-coding-workshop.mariusbleif.com` answers.

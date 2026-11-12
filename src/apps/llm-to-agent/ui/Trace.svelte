<script lang="ts">
  // "Under the hood": the conversation as a sequence diagram with three
  // lanes. The app sits in the middle: it sends requests to the model, and
  // when the model asks for a tool, the app (not the model) calls the
  // website and adds the result to the next, bigger request.
  import type { Chat, TraceEvent, TraceMsg } from "./agent";
  import { GOAL_TOOL } from "../shared/types";
  import { S } from "./strings";
  import Icon from "./Icon.svelte";
  import type { Lang } from "../../../lib/i18n";

  let { chat, lang, modelLabel }: { chat: Chat; lang: Lang; modelLabel: string } = $props();

  let open = $state<Record<string, boolean>>({});
  const toggle = (k: string) => (open[k] = !open[k]);

  const kb = (b: number) => (b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`);
  const num = (n: number) => n.toLocaleString("de-CH");
  const sec = (ms?: number) => (ms === undefined ? "" : `${(ms / 1000).toFixed(1)} s`);
  const role = (r: TraceMsg["role"]) => (r === "system" ? S.roleSystem : r === "user" ? S.roleUser : r === "assistant" ? S.roleAssistant : S.roleTool)[lang];
  const source = (s?: string) => (s === "live" ? S.sourceLive : s === "cache" ? S.sourceCache : s === "demo" ? S.sourceDemo : null);
  const pretty = (json: string) => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };
  const key = (e: TraceEvent, i: number) => `${e.kind}-${i}`;

  // Number of the message you sent at trace index i (1, 2, 3, ...).
  const turns = $derived(chat.trace.reduce<number[]>((acc, e, i) => ((acc[i] = (acc[i - 1] ?? 0) + (e.kind === "user" ? 1 : 0)), acc), []));
  const turnOf = (i: number) => turns[i] ?? 0;
</script>

{#snippet arrow(dir: "left" | "right", label: string)}
  <!-- Spans the two lanes the message travels between. -->
  <div class="relative mb-1.5 hidden h-5 sm:block">
    <div class="absolute left-1/4 right-1/4 top-1/2 border-t border-accent/60"></div>
    <div class={`absolute top-1/2 -translate-y-1/2 ${dir === "left" ? "left-1/4 -translate-x-0.5" : "right-1/4 translate-x-0.5"}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" class="text-accent" aria-hidden="true">
        <path d={dir === "left" ? "M10 0L0 5l10 5z" : "M0 0l10 5-10 5z"} fill="currentColor" />
      </svg>
    </div>
    <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-bg px-2 text-xs text-accent">{label}</span>
  </div>
  <p class="mb-1 text-xs text-accent sm:hidden">{label}</p>
{/snippet}

{#snippet code(text: string)}
  <pre class="mt-2 max-h-80 overflow-auto rounded-lg border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-strong">{text}</pre>
{/snippet}

<div class="relative">
  <!-- Lane lines -->
  <div class="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden="true">
    {#each [1, 3, 5] as x}
      <div class="absolute bottom-0 top-0 border-l border-dashed border-line" style:left={`${(x / 6) * 100}%`}></div>
    {/each}
  </div>

  <!-- Lane headers -->
  <div class="sticky top-0 z-10 mb-4 grid grid-cols-3 gap-2 bg-bg/95 py-3 text-center backdrop-blur">
    <div>
      <p class="text-strong">{S.laneModel[lang]}</p>
      <p class="truncate text-xs opacity-60">{modelLabel}</p>
    </div>
    <div>
      <p class="text-strong">{S.laneApp[lang]}</p>
      <p class="truncate text-xs opacity-60">{S.laneAppSub[lang]}</p>
    </div>
    <div>
      <p class="text-strong">{S.laneTools[lang]}</p>
      <p class="truncate text-xs opacity-60">{S.laneToolsSub[lang]}</p>
    </div>
  </div>

  {#if !chat.trace.length}
    <p class="relative py-10 text-center opacity-60"><span class="bg-bg px-2">{S.traceEmpty[lang]}</span></p>
  {/if}

  <div class="relative flex flex-col gap-4 pb-4 text-left">
    {#each chat.trace as e, i (key(e, i))}
      {#if e.kind === "user"}
        <!-- Each message you send starts a new section, easy to find when scrolling. -->
        <section data-turn={turnOf(i)} class={`scroll-mt-20 ${turnOf(i) > 1 ? "mt-14" : ""}`}>
          <div class="relative mb-5 flex items-center gap-4">
            <span class="h-0.5 flex-1 rounded-full bg-accent/60"></span>
            <span class="rounded-full bg-accent px-5 py-2 text-base uppercase tracking-[0.18em] text-accent-fg shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]">
              {S.turn[lang]} <span class="tabular-nums">{turnOf(i)}</span>
            </span>
            <span class="h-0.5 flex-1 rounded-full bg-accent/60"></span>
          </div>
          <div class="grid grid-cols-3">
            <div class="col-span-3 sm:col-span-1 sm:col-start-2">
              <div class="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-strong shadow-sm">
                <p class="text-xs text-accent">{S.you[lang]}</p>
                <p class="mt-0.5 whitespace-pre-wrap">{e.text}{e.image ? " [+ photo]" : ""}</p>
              </div>
            </div>
          </div>
        </section>
      {:else if e.kind === "request"}
        <div class="grid grid-cols-3">
          <div class="col-span-3 sm:col-span-2 sm:col-start-1">
            {@render arrow("left", `${S.request[lang]} #${e.n} · ${kb(e.bytes)}`)}
            <div class="rounded-xl border border-line bg-surface p-3 text-sm">
              <p class="text-xs opacity-60">
                {e.model} · {e.messages.length} {S.messagesN[lang]} · {e.tools.length ? `${e.tools.length} ${S.toolsN[lang]}` : S.noTools[lang]}
              </p>
              <ul class="mt-2 flex flex-col gap-1">
                {#each e.messages as m}
                  <li class={`flex gap-2 rounded-md px-2 py-1 ${m.isNew ? "bg-accent/10 ring-1 ring-accent/40" : "opacity-60"}`}>
                    <span class="w-28 shrink-0 text-xs leading-5">{role(m.role)}</span>
                    <span class="min-w-0 flex-1 truncate font-mono text-xs leading-5 text-strong">{m.preview}</span>
                    {#if m.isNew}<span class="shrink-0 text-xs leading-5 text-accent">{S.isNew[lang]}</span>{/if}
                  </li>
                {/each}
              </ul>
              <button type="button" onclick={() => toggle(key(e, i))} class="mt-2 text-xs underline-offset-4 opacity-70 hover:underline hover:opacity-100">
                {open[key(e, i)] ? S.hideRequest[lang] : S.showRequest[lang]}
              </button>
              {#if open[key(e, i)]}{@render code(e.raw)}{/if}
            </div>
          </div>
        </div>
      {:else if e.kind === "response"}
        <div class="grid grid-cols-3">
          <div class="col-span-3 sm:col-span-2 sm:col-start-1">
            {@render arrow("right", e.streaming ? S.waiting[lang] : `${S.response[lang]} #${e.n} · ${sec(e.ms)}${e.tokens ? ` · ${num(e.tokens.in)} ${S.tokensIn[lang]}, ${num(e.tokens.out)} ${S.tokensOut[lang]}` : ""}`)}
            <div class={`rounded-xl border p-3 text-sm ${e.final ? "border-accent/50 bg-surface" : "border-line bg-surface"}`}>
              {#if e.streaming && !e.text}
                <p class="flex items-center gap-2 opacity-60"><span class="dot"></span>{S.waiting[lang]}</p>
              {/if}
              {#if e.text}
                <p class="line-clamp-6 whitespace-pre-wrap text-strong">{e.text}</p>
              {/if}
              {#if e.calls.length}
                <p class="mt-1 text-xs opacity-70">{S.wantsTool[lang]}:</p>
                {#each e.calls as c}
                  <p class="mt-1 break-all font-mono text-xs text-accent">{c.name}({c.args})</p>
                {/each}
              {/if}
              {#if e.final && !e.streaming}
                <p class="mt-2 flex items-center gap-1 text-xs text-accent"><Icon name="check" size={14} />{S.finalAnswer[lang]}</p>
              {/if}
            </div>
          </div>
        </div>
      {:else if e.kind === "tool-call"}
        <div class="grid grid-cols-3">
          <div class="col-span-3 sm:col-span-2 sm:col-start-2">
            {@render arrow("right", e.name)}
            <div class="rounded-xl border border-line bg-surface p-3 text-sm">
              <p class="text-xs opacity-60">{e.name === GOAL_TOOL ? S.harnessChecks[lang] : S.appCalls[lang]}</p>
              <p class="mt-1 break-all font-mono text-xs text-strong">{e.url ? `GET ${e.url}` : `${e.name}(${e.args})`}</p>
            </div>
          </div>
        </div>
      {:else if e.kind === "tool-result"}
        <div class="grid grid-cols-3">
          <div class="col-span-3 sm:col-span-2 sm:col-start-2">
            {@render arrow("left", `${S.result[lang]} · ${sec(e.ms)}`)}
            <div class="rounded-xl border border-line bg-surface p-3 text-sm">
              {#if e.error}
                <p class="text-danger">{e.error}</p>
              {:else}
                <p class="text-strong">
                  {e.summary[lang]}
                  {#if source(e.source)}<span class="ml-1 text-xs opacity-60">· {source(e.source)?.[lang]}</span>{/if}
                </p>
                <p class="mt-1 text-xs opacity-60">{S.backToModel[lang]}</p>
                <button type="button" onclick={() => toggle(key(e, i))} class="mt-2 text-xs underline-offset-4 opacity-70 hover:underline hover:opacity-100">
                  {open[key(e, i)] ? S.hideData[lang] : S.showData[lang]}
                </button>
                {#if open[key(e, i)]}{@render code(pretty(e.raw))}{/if}
              {/if}
            </div>
          </div>
        </div>
      {:else if e.kind === "divider"}
        <div class="flex items-center gap-3 text-sm opacity-70">
          <span class="h-px flex-1 bg-line"></span>
          <span class="bg-bg px-1">{S.instructions[lang]}: {e.label[lang]}</span>
          <span class="h-px flex-1 bg-line"></span>
        </div>
      {:else if e.kind === "error"}
        <p class="text-center text-sm text-danger"><span class="bg-bg px-2">{e.text}</span></p>
      {/if}
    {/each}
  </div>
</div>

<style>
  .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 9999px;
    background: var(--accent);
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(0.7); opacity: 0.5; }
    50% { transform: scale(1); opacity: 1; }
  }
</style>

<script lang="ts" module>
  export type Msg = { role: "user" | "assistant" | "notice"; text: string };
</script>

<script lang="ts">
  // The shop's assistant, as a chat bubble in the corner like on any shop
  // site. Levels 1, 2 and 5 are played here.
  import { tick } from "svelte";
  import Icon from "../../../components/app/Icon.svelte";
  import FlagText from "./FlagText.svelte";
  import { MAX_INPUT } from "../shared/types";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let {
    lang,
    open = $bindable(),
    active,
    messages,
    busy,
    beacon = false,
    onsend,
    onreset,
    oncopy,
  }: {
    lang: Lang;
    open: boolean;
    /** False while the current level is played elsewhere: Bea is paused. */
    active: boolean;
    messages: Msg[];
    busy: boolean;
    /** Mark the chat button as the place where the level is played. */
    beacon?: boolean;
    onsend: (text: string) => void;
    /** Start over: Bea forgets the conversation. */
    onreset: () => void;
    oncopy: (flag: string) => void;
  } = $props();

  let text = $state("");
  let input: HTMLTextAreaElement | undefined = $state();
  let scroller: HTMLElement | undefined = $state();

  function send(e?: Event) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || busy || !active) return;
    text = "";
    onsend(t);
  }

  $effect(() => {
    void messages.length;
    void busy;
    void open;
    tick().then(() => scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" }));
  });
  /** The chat was opened at least once: the teaser has done its job. */
  let greeted = $state(false);
  $effect(() => {
    if (open) greeted = true;
  });
  $effect(() => {
    if (open && active) tick().then(() => input?.focus());
  });
</script>

{#if open}
  <section class="panel fixed bottom-28 right-3 z-40 flex h-[min(34rem,calc(100dvh-15rem))] w-[min(25rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-bg font-sans text-[15px] shadow-2xl" aria-label={S.chatTitle[lang]}>
    <header class="flex items-center gap-2.5 bg-accent px-4 py-3 text-accent-fg">
      <span class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-fg/15">
        <Icon name="bot" size={20} />
        {#if active}<span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-accent bg-emerald-500"></span>{/if}
      </span>
      <span class="min-w-0 font-semibold">{S.chatTitle[lang]}</span>
      {#if active}
        <button type="button" onclick={onreset} disabled={busy || !messages.length} aria-label={S.chatNew[lang]} title={S.chatNew[lang]} class="ml-auto rounded-lg p-1 opacity-80 transition enabled:hover:bg-accent-fg/15 enabled:hover:opacity-100 disabled:opacity-40">
          <Icon name="new-chat" size={18} />
        </button>
      {/if}
      <button type="button" onclick={() => (open = false)} aria-label={S.close[lang]} class={`rounded-lg p-1 opacity-80 hover:bg-accent-fg/15 hover:opacity-100 ${active ? "" : "ml-auto"}`}><Icon name="x" size={18} /></button>
    </header>

    <div bind:this={scroller} class="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3 text-[0.95rem]">
      <p class="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-surface px-3 py-2">{active ? S.chatHello[lang] : S.chatPaused[lang]}</p>
      {#each messages as m}
        {#if m.role === "user"}
          <p class="max-w-[85%] self-end whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-surface-2 px-3 py-2 text-strong">{m.text}</p>
        {:else if m.role === "assistant"}
          <p class="max-w-[85%] self-start whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-surface px-3 py-2">
            <FlagText text={m.text} {lang} {oncopy} />
          </p>
        {:else}
          <p class="flex items-start gap-1.5 self-center rounded-xl border border-danger/50 px-3 py-1.5 text-center text-sm text-danger"><Icon name="shield" size={15} class="mt-0.5 shrink-0" />{m.text}</p>
        {/if}
      {/each}
      {#if busy}<p class="flex items-center gap-2 self-start px-1 text-sm opacity-60"><span class="dot"></span>{S.thinking[lang]}</p>{/if}
    </div>

    <form onsubmit={send} class="flex items-end gap-2 border-t border-line px-2.5 pt-2.5">
      <textarea
        bind:this={input}
        bind:value={text}
        rows="2"
        maxlength={MAX_INPUT}
        disabled={!active}
        placeholder={S.chatPlaceholder[lang]}
        aria-label={S.chatPlaceholder[lang]}
        onkeydown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.isComposing) send(e);
        }}
        class="min-w-0 flex-1 resize-none rounded-2xl border border-line bg-surface px-3 py-2 text-strong outline-none placeholder:opacity-50 focus:border-accent/60 disabled:opacity-50"
      ></textarea>
      <button type="submit" disabled={!text.trim() || busy || !active} aria-label={S.send[lang]} class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition enabled:hover:brightness-110 disabled:opacity-40">
        <Icon name="send" size={18} />
      </button>
    </form>
    <p class="px-3 pb-2 pt-1.5 text-center text-[11px] opacity-50">{S.chatLegal[lang]}</p>
  </section>
{:else if active && !greeted}
  <!-- What a shop's chat does when left alone: it says hello first. -->
  <button type="button" onclick={() => (open = true)} class="teaser fixed bottom-[7.25rem] right-3 z-40 rounded-2xl rounded-br-md border border-line bg-bg px-3.5 py-2 font-sans text-sm text-strong shadow-xl max-sm:hidden">{S.chatTeaser[lang]}</button>
{/if}

<button
  type="button"
  onclick={() => (open = !open)}
  aria-label={S.chatOpen[lang]}
  title={S.chatOpen[lang]}
  class={`fixed bottom-12 right-3 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-xl transition hover:brightness-110 ${beacon && !open ? "pi-beacon" : ""}`}
>
  <Icon name={open ? "x" : "chat"} size={26} />
</button>

<style>
  .panel {
    animation: up 0.25s ease-out both;
  }
  /* Says hello, stays a while, then gets out of the way of the page. */
  .teaser {
    animation: teaser 9s ease-out 1.2s both;
  }
  @keyframes teaser {
    0% { opacity: 0; transform: translateY(12px); }
    4%, 94% { opacity: 1; transform: none; }
    100% { opacity: 0; visibility: hidden; }
  }
  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--accent);
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .panel, .dot { animation: none; }
    .teaser { display: none; }
  }
</style>

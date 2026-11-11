<script lang="ts">
  import type { Lang } from "../../../lib/i18n";
  import { setTheme, type Theme } from "../../../lib/theme";
  import Icon from "./Icon.svelte";
  import LangPicker from "./LangPicker.svelte";
  import { HEADER_CLASS, BRAND_CLASS, ICON_BTN_CLASS } from "../../../lib/site";
  import { S } from "./strings";

  let {
    lang,
    theme,
    view = $bindable(),
    busy,
    reached,
    locked = false,
    onjump,
    onnewchat,
  }: {
    lang: Lang;
    theme: Theme;
    view: "chat" | "trace";
    busy: boolean;
    /** Which of the three agent parts are in use: model, tools, goal. */
    reached: [boolean, boolean, boolean];
    /** No workshop code yet: the toolbar is shown but can't be used. */
    locked?: boolean;
    onjump: (step: 1 | 2 | 3) => void;
    onnewchat: () => void;
  } = $props();

  const steps = [S.model, S.tools, S.instructions];
</script>

<!-- The site-wide header, same as on every other page. -->
<header class={HEADER_CLASS}>
  <a href="/" class={BRAND_CLASS}>teaching</a>
  <div class="ml-auto flex items-center gap-1">
    <LangPicker {lang} />
    <button type="button" onclick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={S.theme[lang]} title={S.theme[lang]} class={ICON_BTN_CLASS}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
    </button>
  </div>
</header>

<!-- The app's own toolbar, below the site header. -->
<div inert={locked} aria-disabled={locked} class={`grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pb-2 transition-opacity ${locked ? "pointer-events-none select-none opacity-30" : ""}`}>
  <!-- What participants normally see, or what really happens. -->
  <div class="flex justify-self-start rounded-full border border-line p-0.5 text-sm" role="tablist">
    {#each [["chat", S.viewChat], ["trace", S.viewTrace]] as const as [v, label]}
      <button
        type="button"
        role="tab"
        aria-selected={view === v}
        onclick={() => (view = v)}
        class={`rounded-full px-3 py-1 transition ${view === v ? "bg-surface-2 text-strong" : "opacity-60 hover:opacity-100"}`}
      >
        {label[lang]}
      </button>
    {/each}
  </div>

  <!-- The three parts of an agent. Click to jump (handy when presenting). -->
  <nav class="hidden items-center gap-1 sm:flex" aria-label="Progress">
    {#each steps as label, i}
      {#if i > 0}<span class={`h-px w-6 ${reached[i] ? "bg-accent" : "bg-line"}`}></span>{/if}
      <button
        type="button"
        onclick={() => onjump((i + 1) as 1 | 2 | 3)}
        disabled={busy}
        class={`flex items-center gap-1.5 rounded-full px-2 py-1 text-sm transition hover:bg-surface-2 ${reached[i] ? "text-strong" : "opacity-50"}`}
      >
        <span class={`h-2 w-2 rounded-full ${reached[i] ? "bg-accent" : "ring-1 ring-line"}`}></span>
        {label[lang]}
      </button>
    {/each}
  </nav>

  <button type="button" onclick={onnewchat} disabled={busy} aria-label={S.newChat[lang]} title={S.newChat[lang]} class={`col-start-3 justify-self-end ${ICON_BTN_CLASS} disabled:opacity-30`}>
    <Icon name="new-chat" size={19} />
  </button>
</div>

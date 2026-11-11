<script lang="ts">
  // Message box in the style of chat web apps: auto-growing text field, a
  // tools menu (once unlocked), active tool and instruction chips, round
  // send button. Enter sends, Shift+Enter makes a new line.
  import { TOOL_NAMES, type ToolName } from "../shared/types";
  import { TOOL_LABELS } from "../shared/tools";
  import type { Text, Lang } from "../../../lib/i18n";
  import { S } from "./strings";
  import Icon from "./Icon.svelte";
  import { prepareImage, type Photo } from "./agent";

  let {
    lang,
    busy,
    toolsUnlocked,
    enabled = $bindable(),
    menuOpen = $bindable(false),
    instructionsLabel = null,
    onclearinstructions,
    onsend,
    onengage,
  }: {
    lang: Lang;
    busy: boolean;
    toolsUnlocked: boolean;
    enabled: Record<ToolName, boolean>;
    menuOpen?: boolean;
    instructionsLabel?: Text | null;
    onclearinstructions: () => void;
    onsend: (text: string, image?: Photo) => void;
    /** The user turns to the text field (focus, or a click into it while focused). */
    onengage?: () => void;
  } = $props();

  let draft = $state("");
  let box: HTMLDivElement | undefined = $state();
  let field: HTMLTextAreaElement | undefined = $state();

  const anyTool = $derived(TOOL_NAMES.some((t) => enabled[t]));
  // Onboarding nudge: tools just became available and none is on yet.
  const nudge = $derived(toolsUnlocked && !anyTool && !instructionsLabel);

  // A photo goes out with the next message; the models can see.
  let photo = $state<Photo | null>(null);
  async function onPhoto(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = ""; // the same photo can be picked again
    if (!f) return;
    try {
      photo = await prepareImage(f);
      field?.focus();
    } catch {}
  }

  function send() {
    const text = draft.trim() || (photo ? S.photoDefault[lang] : "");
    if (!text || busy) return;
    onsend(text, photo ?? undefined);
    photo = null;
    draft = "";
    queueMicrotask(grow);
  }

  function grow() {
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 200)}px`;
  }

  function onkey(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  }

  // Close the tools menu on any click that is not on the menu or its button
  // (including the text field), and when the text field gets focus.
  let menu: HTMLDivElement | undefined = $state();
  let trigger: HTMLButtonElement | undefined = $state();
  function outside(e: MouseEvent) {
    const t = e.target as Node;
    if (menuOpen && !menu?.contains(t) && !trigger?.contains(t)) menuOpen = false;
  }
</script>

<svelte:window onclick={outside} onkeydown={(e) => e.key === "Escape" && (menuOpen = false)} />

<div bind:this={box} class="relative rounded-[1.75rem] border border-line bg-surface px-3 pb-2.5 pt-3 shadow-[0_2px_16px_rgb(0_0_0/0.12)] focus-within:border-accent/50">
  {#if photo}
    <div class="relative mb-2 ml-2 inline-block">
      <img src={`data:${photo.mediaType};base64,${photo.data}`} alt="" class="h-16 w-16 rounded-xl object-cover" />
      <button type="button" onclick={() => (photo = null)} aria-label={S.removePhoto[lang]} class="absolute -right-2 -top-2 rounded-full border border-line bg-surface p-0.5 hover:bg-surface-2">
        <Icon name="x" size={14} />
      </button>
    </div>
  {/if}
  <textarea
    bind:this={field}
    onfocus={() => {
      menuOpen = false;
      onengage?.();
    }}
    onpointerdown={() => onengage?.()}
    bind:value={draft}
    oninput={grow}
    onkeydown={onkey}
    rows="1"
    placeholder={S.placeholder[lang]}
    aria-label={S.placeholder[lang]}
    class="block max-h-[200px] w-full resize-none bg-transparent px-2 text-[1.05rem] text-strong outline-none placeholder:text-fg placeholder:opacity-60"
  ></textarea>

  <div class="mt-2 flex items-center gap-1.5">
    <label title={S.attachPhoto[lang]} class="flex h-[2.125rem] w-[2.125rem] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line transition hover:bg-surface-2 hover:text-strong">
      <input type="file" accept="image/*" class="sr-only" onchange={onPhoto} aria-label={S.attachPhoto[lang]} />
      <Icon name="camera" size={17} />
    </label>
    {#if toolsUnlocked}
      <button
        bind:this={trigger}
        type="button"
        data-tour="tools-button"
        onclick={() => (menuOpen = !menuOpen)}
        aria-expanded={menuOpen}
        class={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
          nudge ? "nudge border-accent text-accent" : "border-line hover:bg-surface-2 hover:text-strong"
        }`}
      >
        <Icon name="tools" size={16} />
        {nudge ? S.addTools[lang] : S.tools[lang]}
      </button>
    {/if}

    <div class="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
      {#each TOOL_NAMES.filter((t) => enabled[t]) as t}
        <span class="flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-sm text-accent" title={TOOL_LABELS[t].label[lang]}>
          <Icon name={TOOL_LABELS[t].icon} size={14} />
          <span class="hidden sm:inline">{TOOL_LABELS[t].label[lang]}</span>
        </span>
      {/each}
      {#if instructionsLabel}
        <span class="flex shrink-0 items-center gap-1 rounded-full border border-accent/50 py-0.5 pl-2.5 pr-1 text-sm text-accent">
          {instructionsLabel[lang]}
          <button type="button" onclick={onclearinstructions} aria-label={S.removeInstructions[lang]} class="rounded-full p-0.5 hover:bg-accent/15">
            <Icon name="x" size={14} />
          </button>
        </span>
      {/if}
    </div>

    <button
      type="button"
      onclick={send}
      disabled={busy || (!draft.trim() && !photo)}
      aria-label={S.send[lang]}
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition hover:brightness-110 disabled:opacity-30"
    >
      <Icon name="send" size={18} />
    </button>
  </div>

  {#if menuOpen}
    <div bind:this={menu} data-tour="tools-menu" class="absolute bottom-full left-0 z-20 mb-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-1.5 shadow-xl" role="menu">
      {#each TOOL_NAMES as t}
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={enabled[t]}
          disabled={!!instructionsLabel}
          onclick={() => (enabled[t] = !enabled[t])}
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2 disabled:opacity-60"
        >
          <Icon name={TOOL_LABELS[t].icon} size={18} class="shrink-0" />
          <span class="min-w-0 flex-1">
            <span class="block text-strong">{TOOL_LABELS[t].label[lang]}</span>
            <span class="block text-sm opacity-70">{TOOL_LABELS[t].desc[lang]}</span>
          </span>
          <span class={`relative h-5 w-9 shrink-0 rounded-full transition ${enabled[t] ? "bg-accent" : "bg-surface-2 ring-1 ring-line"}`}>
            <span class={`absolute top-0.5 h-4 w-4 rounded-full bg-bg shadow transition-all ${enabled[t] ? "left-[1.125rem]" : "left-0.5"}`}></span>
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .nudge {
    animation: nudge 2s ease-in-out infinite;
  }
  @keyframes nudge {
    0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 45%, transparent); }
    50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 0%, transparent); }
  }
</style>

<script lang="ts">
  import type { Chat } from "./agent";
  import { MODEL_LABELS } from "../shared/types";
  import Markdown from "./Markdown.svelte";
  import ToolRow from "./ToolRow.svelte";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let { chat, lang }: { chat: Chat; lang: Lang } = $props();

  // Name the model on each answer only once a chat mixes models.
  const mixed = $derived(new Set(chat.items.flatMap((i) => (i.kind === "assistant" ? [i.model] : []))).size > 1);
  // "Thinking" until text streams in or a tool runs.
  const waiting = $derived(
    chat.busy && chat.items.at(-1)?.kind !== "assistant" && !chat.items.some((i) => i.kind === "tool" && i.status === "running"),
  );
</script>

<div class="flex flex-col gap-4">
  {#each chat.items as item}
    {#if item.kind === "user"}
      <div class="ml-auto max-w-[80%] rounded-3xl bg-surface-2 px-4 py-2.5 text-strong">
        {#if item.image}<img src={item.image} alt="" class="mb-2 max-h-56 rounded-xl" />{/if}
        <p class="whitespace-pre-wrap">{item.text}</p>
      </div>
    {:else if item.kind === "assistant"}
      <div>
        {#if mixed}<p class="mb-1 text-sm text-accent">{MODEL_LABELS[item.model]}</p>{/if}
        <Markdown text={item.text} {lang} />
      </div>
    {:else if item.kind === "tool"}
      <ToolRow {item} {lang} />
    {:else if item.kind === "divider"}
      <div class="my-2 flex items-center gap-3 text-sm opacity-70">
        <span class="h-px flex-1 bg-line"></span>
        <span>{S.instructions[lang]}: {item.label[lang]}</span>
        <span class="h-px flex-1 bg-line"></span>
      </div>
    {:else}
      <p class="text-sm opacity-60">{S[item.key][lang]}</p>
    {/if}
  {/each}

  {#if waiting}
    <div class="flex items-center gap-2 opacity-60" aria-live="polite">
      <span class="dot"></span>
      <span class="text-sm">{S.thinking[lang]}</span>
    </div>
  {/if}
</div>

<style>
  .dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 9999px;
    background: var(--accent);
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(0.7); opacity: 0.5; }
    50% { transform: scale(1); opacity: 1; }
  }
</style>

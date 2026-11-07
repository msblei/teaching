<script lang="ts">
  import { renderMarkdown } from "./markdown";
  import { S } from "./strings";
  import Icon from "./Icon.svelte";
  import type { Lang } from "../../../lib/i18n";

  let { text, lang }: { text: string; lang: Lang } = $props();
  const parts = $derived(renderMarkdown(text));
  let copied = $state(-1);

  async function copy(i: number, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      copied = i;
      setTimeout(() => (copied = -1), 1500);
    } catch {}
  }
</script>

<div class="md">
  {#each parts as part, i}
    {#if part.kind === "html"}
      {@html part.html}
    {:else}
      <div class="my-3 overflow-hidden rounded-xl border border-line bg-surface">
        <div class="flex items-center justify-end border-b border-line px-2 py-1">
          <button type="button" onclick={() => copy(i, part.text)} class="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-surface-2 hover:text-strong">
            <Icon name={copied === i ? "check" : "copy"} size={15} />
            {copied === i ? S.copied[lang] : S.copy[lang]}
          </button>
        </div>
        <pre class="whitespace-pre-wrap p-4 font-sans text-[0.95rem] leading-relaxed text-strong">{part.text}</pre>
      </div>
    {/if}
  {/each}
</div>

<style>
  .md { color: var(--strong); line-height: 1.65; }
  .md :global(p) { margin: 0.6rem 0; }
  .md :global(h4) { margin: 1rem 0 0.3rem; font-weight: 700; }
  .md :global(ul), .md :global(ol) { margin: 0.5rem 0; padding-left: 1.4rem; }
  .md :global(ul) { list-style: disc; }
  .md :global(ol) { list-style: decimal; }
  .md :global(li) { margin: 0.3rem 0; }
  .md :global(a) { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
  .md :global(code) { background: var(--surface-2); padding: 0 0.3rem; border-radius: 4px; }
  .md :global(.tbl) { overflow-x: auto; margin: 0.7rem 0; }
  .md :global(table) { border-collapse: collapse; font-size: 0.95rem; }
  .md :global(th) { font-weight: 700; }
  .md :global(th), .md :global(td) { border-bottom: 1px solid var(--line); padding: 0.4rem 0.7rem 0.4rem 0; text-align: left; }
</style>

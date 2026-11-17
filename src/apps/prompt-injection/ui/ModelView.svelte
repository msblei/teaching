<script lang="ts">
  // The teaching view: the text a model received, exactly as it was sent.
  // First the shop's instructions, then the message. Nothing is added: no
  // labels, no markers. The player's own part is only tinted. For the model
  // nothing separates the two, and that is the whole problem.
  import Icon from "../../../components/app/Icon.svelte";
  import type { Sent } from "../shared/types";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let { sent, lang, open = false, bare = false }: { sent: Sent; lang: Lang; open?: boolean; /** Just the text, no frame or toggle. */ bare?: boolean } = $props();
  let shown = $state(false);
  // Opens by itself once the attack worked: that is when it is worth reading.
  $effect(() => {
    if (open) shown = true;
  });

</script>

{#snippet text()}
  <pre class="whitespace-pre-wrap break-words rounded-lg border border-line bg-surface p-3 font-mono text-[0.82rem] leading-relaxed">{sent.system}

{#each sent.parts as p}{#if p.mine}<mark class="rounded bg-accent/25 px-0.5 text-strong">{p.text}</mark>{:else}{p.text}{/if}{/each}</pre>
{/snippet}

{#if bare}
  {@render text()}
{:else}
  <div class="rounded-xl border border-line bg-surface text-sm">
    <button type="button" onclick={() => (shown = !shown)} aria-expanded={shown} class="flex w-full items-center gap-2 px-3 py-2 text-left">
      <Icon name="eye" size={16} class="shrink-0 text-accent" />
      <span class="text-strong">{S.seenTitle[lang]}</span>
      <Icon name="chevron-right" size={14} class={`ml-auto shrink-0 opacity-50 transition ${shown ? "rotate-90" : ""}`} />
    </button>
    {#if shown}
      <div class="border-t border-line px-3 py-2.5">
        <p class="mb-2 opacity-70">{S.seenSub[lang]}</p>
        {@render text()}
      </div>
    {/if}
  </div>
{/if}

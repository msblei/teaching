<script lang="ts">
  // Text that may contain a flag. Every FLAG{...} becomes a glowing chip;
  // clicking it copies the flag.
  import Icon from "../../../components/app/Icon.svelte";
  import { FLAG_RE } from "./game";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let { text, lang, oncopy }: { text: string; lang: Lang; oncopy?: (flag: string) => void } = $props();

  const parts = $derived.by(() => {
    const out: { flag?: string; text?: string }[] = [];
    let last = 0;
    for (const m of text.matchAll(FLAG_RE)) {
      if (m.index! > last) out.push({ text: text.slice(last, m.index) });
      out.push({ flag: m[0] });
      last = m.index! + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  });

  let copied = $state("");
  function copy(flag: string) {
    // Not awaited: the clipboard can take its time (or refuse), the game moves on either way.
    navigator.clipboard?.writeText(flag).catch(() => {});
    copied = flag;
    oncopy?.(flag);
    setTimeout(() => (copied = ""), 1500);
  }
</script>

{#each parts as p}{#if p.flag}<button type="button" data-tour="flag-chip" onclick={() => copy(p.flag!)} title={S.flagCopy[lang]} class="chip mx-0.5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-2 py-0.5 align-baseline font-mono text-[0.92em] text-accent-fg">
      <Icon name={copied === p.flag ? "check" : "flag"} size={14} />{p.flag}
    </button>{:else}{p.text}{/if}{/each}

<style>
  .chip {
    animation: glow 1.6s ease-in-out infinite;
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent); }
    50% { box-shadow: 0 0 14px 3px color-mix(in srgb, var(--accent) 55%, transparent); }
  }
  @media (prefers-reduced-motion: reduce) {
    .chip { animation: none; }
  }
</style>

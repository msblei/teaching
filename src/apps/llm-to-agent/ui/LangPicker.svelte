<script lang="ts">
  // Language dropdown for the header, same style as the model picker.
  import { setLang, type Lang } from "../../../lib/i18n";
  import Icon from "./Icon.svelte";

  let { lang }: { lang: Lang } = $props();
  let open = $state(false);
  let root: HTMLDivElement | undefined = $state();

  const LANGS: { key: Lang; short: string; name: string }[] = [
    { key: "de", short: "DE", name: "Deutsch" },
    { key: "en", short: "EN", name: "English" },
  ];
</script>

<svelte:window
  onclick={(e) => open && root && !root.contains(e.target as Node) && (open = false)}
  onkeydown={(e) => e.key === "Escape" && (open = false)}
/>

<div bind:this={root} class="relative">
  <button
    type="button"
    onclick={() => (open = !open)}
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label="Language"
    class="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm opacity-70 transition hover:bg-surface-2 hover:opacity-100"
  >
    {LANGS.find((l) => l.key === lang)?.short}
    <Icon name="chevron-down" size={14} class="opacity-60" />
  </button>

  {#if open}
    <div class="absolute right-0 top-full z-30 mt-1 w-44 rounded-2xl border border-line bg-surface p-1.5 shadow-xl" role="menu">
      {#each LANGS as l}
        <button
          type="button"
          role="menuitemradio"
          aria-checked={lang === l.key}
          onclick={() => (setLang(l.key), (open = false))}
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface-2"
        >
          <span class="flex-1 text-strong">{l.name}</span>
          {#if lang === l.key}<Icon name="check" size={18} class="text-accent" />{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

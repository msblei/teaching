<script lang="ts">
  // The current mission, as a card that floats over the shop in the bottom
  // left corner, like a quest note in a game. It sits on top of the page and
  // never moves it. A click on its head folds it down to a small tab, and
  // another opens it again.
  import Icon from "../../../components/app/Icon.svelte";
  import { LEVEL_INFO } from "../shared/levels";
  import type { Level } from "../shared/types";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let { lang, level }: { lang: Lang; /** The level being played, or null when all are solved. */ level: Level | null } = $props();

  let folded = $state(false);
  // A new level opens the card again.
  $effect(() => {
    void level;
    folded = false;
  });
</script>

<aside class="note fixed bottom-12 left-3 z-40 overflow-hidden rounded-2xl border border-accent/50 bg-bg" class:folded aria-label={S.mission[lang]}>
  {#if level}
    {@const info = LEVEL_INFO[level]}
    <button type="button" onclick={() => (folded = !folded)} aria-expanded={!folded} class="flex w-full items-center gap-2 bg-accent px-3 py-2 text-left text-accent-fg">
      <Icon name="target" size={18} class="shrink-0" />
      <span class="shrink-0">{S.level[lang]} {level}</span>
      <span class="title min-w-0 flex-1 truncate">{info.title[lang]}</span>
      <Icon name="chevron-down" size={16} class={`ml-auto shrink-0 transition-transform duration-300 ${folded ? "rotate-180" : ""}`} />
    </button>
    <div class="body">
      <div class="min-h-0 overflow-hidden">
        <div class="w-[25rem] max-w-[calc(100vw-5.75rem)] px-3.5 py-3">
          <p class="leading-relaxed">{info.story[lang]}</p>
          <p class="mt-2.5 text-[1.05rem] leading-snug text-strong">{info.goal[lang]}</p>
        </div>
      </div>
    </div>
  {:else}
    <p class="flex items-center gap-2 px-3.5 py-2.5 text-strong"><Icon name="trophy" size={18} class="text-accent" />{S.allDone[lang]}</p>
  {/if}
</aside>

<style>
  .note {
    width: min(25rem, calc(100vw - 5.75rem));
    box-shadow:
      0 22px 50px -12px rgb(0 0 0 / 0.65),
      0 0 0 1px rgb(0 0 0 / 0.2);
    transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    animation: in 0.3s ease-out both;
  }
  /* Folded: a tab narrower than the shop's sidebar. */
  .note.folded {
    width: 9.5rem;
  }
  .body {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .folded .body {
    grid-template-rows: 0fr;
  }
  .title {
    transition: opacity 0.2s;
  }
  .folded .title {
    opacity: 0;
  }
  @keyframes in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .note, .body, .title { animation: none; transition: none; }
  }
</style>

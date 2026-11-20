<script lang="ts">
  // The line between the game and the shop: a browser's address bar. What is
  // above it is the workshop, what is below it is "the website". The address
  // follows the player through the shop.
  import Icon from "../../../components/app/Icon.svelte";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let { lang, path, canBack, onback, onreload }: { lang: Lang; /** Everything after the host, starting with "/". */ path: string; canBack: boolean; onback: () => void; onreload: () => void } = $props();
  const btn = "rounded-full p-1.5 transition enabled:hover:bg-bg/70 disabled:opacity-30";
</script>

<div class="shrink-0 border-b border-line bg-surface-2 font-sans">
  <div class="mx-auto flex max-w-[1100px] items-center gap-1 px-3 py-1.5">
    <button type="button" onclick={onback} disabled={!canBack} aria-label={S.navBack[lang]} title={S.navBack[lang]} class={btn}><Icon name="arrow-left" size={16} /></button>
    <button type="button" onclick={() => history.forward()} aria-label={S.navForward[lang]} title={S.navForward[lang]} class={`${btn} max-sm:hidden`}><Icon name="arrow-right" size={16} /></button>
    <button type="button" onclick={onreload} aria-label={S.navReload[lang]} title={S.navReload[lang]} class={btn}><Icon name="refresh" size={15} /></button>
    <p class="ml-1 flex min-w-0 flex-1 items-center gap-2 rounded-full bg-bg px-3.5 py-1 text-[13px]">
      <Icon name="lock" size={13} class="shrink-0 opacity-60" />
      <span class="truncate"><span class="text-strong">www.digibrocki.ch</span><span class="opacity-60">{path}</span></span>
    </p>
  </div>
</div>

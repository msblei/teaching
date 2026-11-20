<script lang="ts">
  // The cart, sliding in from the right as in most shops. It works up to the
  // checkout, which stays closed: nothing is sold here.
  import Icon from "../../../components/app/Icon.svelte";
  import type { Item } from "../shared/catalog";
  import { photoUrl } from "../shared/photos";
  import { chf } from "./meta";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  const SHIPPING = 7;
  let { lang, open = $bindable(), items, onremove, onopen }: { lang: Lang; open: boolean; items: Item[]; onremove: (id: string) => void; onopen: (id: string) => void } = $props();

  let closedNote = $state(false);
  const subtotal = $derived(items.reduce((s, i) => s + i.price, 0));
  $effect(() => {
    if (!open) closedNote = false;
  });
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && (open = false)} />

{#if open}
  <!-- Above the site header (z-50), like the other dialogs: its language and theme buttons sat on top of the drawer. -->
  <div class="fixed inset-0 z-[55] font-sans text-[15px]">
    <button type="button" class="shade absolute inset-0 cursor-default bg-black/50" aria-label={S.close[lang]} onclick={() => (open = false)}></button>
    <aside class="drawer absolute inset-y-0 right-0 flex w-[min(26rem,100vw)] flex-col border-l border-line bg-bg shadow-2xl" aria-label={S.cart[lang]}>
      <header class="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <Icon name="cart" size={20} />
        <h2 class="text-lg font-semibold text-strong">{S.cart[lang]}</h2>
        <span class="text-sm opacity-60">({items.length})</span>
        <button type="button" onclick={() => (open = false)} aria-label={S.close[lang]} class="ml-auto rounded-lg p-1.5 opacity-70 hover:bg-surface-2 hover:opacity-100"><Icon name="x" size={18} /></button>
      </header>

      {#if items.length}
        <ul class="flex-1 divide-y divide-line overflow-y-auto px-4">
          {#each items as item (item.id)}
            <li class="flex gap-3 py-3.5">
              <button type="button" onclick={() => onopen(item.id)} class="shrink-0"><img src={photoUrl(item.id)} alt="" class="h-20 w-20 rounded-lg object-cover" /></button>
              <div class="flex min-w-0 flex-1 flex-col">
                <button type="button" onclick={() => onopen(item.id)} class="text-left leading-snug text-strong hover:underline">{item.title[lang]}</button>
                <span class="mt-0.5 text-[13px] opacity-60">{item.condition[lang]}, {item.place}</span>
                <span class="mt-auto flex items-center justify-between pt-1.5">
                  <button type="button" onclick={() => onremove(item.id)} class="flex items-center gap-1 text-[13px] opacity-70 hover:text-danger hover:opacity-100"><Icon name="trash" size={15} />{S.remove[lang]}</button>
                  <span class="font-semibold tabular-nums text-strong">{chf(item.price)}</span>
                </span>
              </div>
            </li>
          {/each}
        </ul>
        <footer class="border-t border-line bg-surface px-4 py-4">
          <dl class="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
            <dt>{S.subtotal[lang]}</dt>
            <dd class="tabular-nums">{chf(subtotal)}</dd>
            <dt>{S.shipping[lang]}</dt>
            <dd class="tabular-nums">{chf(SHIPPING)}</dd>
            <dt class="pt-1.5 text-base font-semibold text-strong">{S.totalSum[lang]}</dt>
            <dd class="pt-1.5 text-base font-semibold tabular-nums text-strong">{chf(subtotal + SHIPPING)}</dd>
          </dl>
          <button type="button" onclick={() => (closedNote = true)} class="mt-3 w-full rounded-full bg-accent py-2.5 font-semibold text-accent-fg transition hover:brightness-110">{S.checkout[lang]}</button>
          {#if closedNote}<p class="mt-2.5 flex gap-2 text-[13px] leading-snug"><Icon name="lock" size={15} class="mt-0.5 shrink-0 text-accent" />{S.checkoutClosed[lang]}</p>{/if}
          <p class="mt-3 text-center text-xs opacity-60">{S.footPay[lang]}</p>
        </footer>
      {:else}
        <div class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Icon name="cart" size={44} class="opacity-30" />
          <p>{S.cartEmptyText[lang]}</p>
          <button type="button" onclick={() => (open = false)} class="rounded-full border border-line px-4 py-2 transition hover:bg-surface-2">{S.cartKeep[lang]}</button>
        </div>
      {/if}
    </aside>
  </div>
{/if}

<style>
  .drawer {
    animation: slide 0.25s ease-out both;
  }
  .shade {
    animation: fade 0.25s ease-out both;
  }
  @keyframes slide {
    from { transform: translateX(100%); }
    to { transform: none; }
  }
  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .drawer, .shade { animation: none; }
  }
</style>

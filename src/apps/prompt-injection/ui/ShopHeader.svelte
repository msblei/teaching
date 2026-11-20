<script lang="ts">
  // The top of the shop, as on any web shop: an announcement, then logo,
  // search, account, wishlist and cart, then the categories, then the
  // promises about shipping. The announcement is the feature level 4 is about.
  import Icon, { type IconName } from "../../../components/app/Icon.svelte";
  import { CATEGORIES, type Item } from "../shared/catalog";
  import Logo from "./Logo.svelte";
  import { chf } from "./meta";
  import { S } from "./strings";
  import type { Lang, Text } from "../../../lib/i18n";

  let {
    lang,
    name,
    page,
    category,
    query = $bindable(),
    wishOn,
    wishCount,
    cartCount,
    cartTotal,
    beaconSell = false,
    onhome,
    oncategory,
    onsearch,
    onsell,
    onabout,
    onwish,
    oncart,
  }: {
    lang: Lang;
    /** The player's name: they are logged in to the shop as a customer. */
    name: string;
    page: "home" | "item" | "sell" | "about";
    category: Item["category"] | null;
    query: string;
    /** The wishlist is what the shop front shows right now. */
    wishOn: boolean;
    wishCount: number;
    cartCount: number;
    cartTotal: number;
    /** Mark "Sell" as the place where the level is played. */
    beaconSell?: boolean;
    onhome: () => void;
    oncategory: (c: Item["category"] | null) => void;
    onsearch: () => void;
    onsell: () => void;
    onabout: () => void;
    onwish: () => void;
    oncart: () => void;
  } = $props();

  const USPS: [IconName, Text][] = [["pin", S.usp1], ["truck", S.usp2], ["return", S.usp3], ["shield", S.usp4]];
  const browsing = $derived(page === "home" && !wishOn);
  const tab = (on: boolean) => `whitespace-nowrap border-b-2 px-3 py-2.5 transition hover:text-strong ${on ? "border-accent text-strong" : "border-transparent"}`;
  const tool = "relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition hover:bg-surface-2";
  const count = "absolute -right-0.5 -top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold tabular-nums text-accent-fg";
</script>

<!-- Announcement: the feature level 4 is about, the way a shop would shout it. -->
<div class="bg-accent px-4 py-1.5 text-center text-[13px] text-accent-fg">
  <Icon name="bot" size={15} class="mr-1 inline align-[-2px]" />{S.agentNews[lang]}
  <button type="button" onclick={onabout} class="ml-1 font-semibold underline underline-offset-2">{S.agentMore[lang]}</button>
</div>

<div class="z-20 border-b border-line bg-bg md:sticky md:top-0">
  <div class="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
    <button type="button" onclick={onhome} class="db-serif shrink-0 text-left" aria-label="DigiBrocki"><Logo size={34} name /></button>

    <form
      role="search"
      onsubmit={(e) => {
        e.preventDefault();
        onsearch();
      }}
      class="order-last flex w-full items-center rounded-full border border-line bg-surface pl-4 focus-within:border-accent md:order-none md:w-auto md:flex-1"
    >
      <input bind:value={query} oninput={onsearch} type="search" placeholder={S.search[lang]} aria-label={S.search[lang]} class="min-w-0 flex-1 bg-transparent py-2 text-strong outline-none placeholder:opacity-50" />
      <button type="submit" aria-label={S.searchGo[lang]} title={S.searchGo[lang]} class="m-1 flex h-8 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition hover:brightness-110"><Icon name="search" size={17} /></button>
    </form>

    <div class="ml-auto flex items-center">
      <button type="button" onclick={onsell} class={tool}>
        <Icon name="user" size={22} />
        <span class="text-left leading-tight max-lg:hidden">
          <span class="block max-w-[9rem] truncate text-xs opacity-70">{S.hello[lang].replace("{name}", name)}</span>
          <span class="block text-[13px] font-semibold text-strong">{S.account[lang]}</span>
        </span>
      </button>
      <button type="button" onclick={onwish} aria-label={S.wishlist[lang]} title={S.wishlist[lang]} class={tool}>
        <Icon name="heart" size={22} class={wishOn ? "fill-current text-accent" : ""} />
        {#if wishCount}<span class={count}>{wishCount}</span>{/if}
      </button>
      <button type="button" onclick={oncart} aria-label={S.cart[lang]} title={S.cart[lang]} class={tool}>
        <span class="relative">
          <Icon name="cart" size={22} />
          {#if cartCount}<span class={`${count} -right-2 -top-2`}>{cartCount}</span>{/if}
        </span>
        <span class="text-[13px] font-semibold tabular-nums text-strong max-sm:hidden">{chf(cartTotal)}</span>
      </button>
    </div>
  </div>

  <nav class="mx-auto flex max-w-[1100px] flex-wrap items-center px-1 text-sm sm:px-2">
    <button type="button" onclick={() => oncategory(null)} class={tab(browsing && !category)}>{S.allItems[lang]}</button>
    {#each CATEGORIES as c}
      <button type="button" onclick={() => oncategory(c.id)} class={tab((browsing && category === c.id))}>{c.label[lang]}</button>
    {/each}
    <span class="mx-2 h-4 w-px bg-line max-sm:hidden"></span>
    <button type="button" onclick={onsell} class={`${tab(page === "sell")} ${beaconSell ? "pi-beacon rounded" : ""}`}>{S.sell[lang]}</button>
    <button type="button" onclick={onabout} class={tab(page === "about")}>{S.navAbout[lang]}</button>
  </nav>
</div>

<!-- What every shop promises right under its menu. -->
<div class="border-b border-line bg-surface">
  <ul class="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-[13px]">
    {#each USPS as [icon, text], i}
      <li class={`flex items-center gap-1.5 ${i > 1 ? "max-md:hidden" : ""}`}><Icon name={icon} size={15} class="text-accent" />{text[lang]}</li>
    {/each}
  </ul>
</div>

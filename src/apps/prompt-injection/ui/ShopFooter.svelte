<script lang="ts">
  // The shop's own footer: link columns, newsletter, ways to pay, small
  // print. Every link leads somewhere in the shop. The last line says the
  // shop is made up.
  import Icon from "../../../components/app/Icon.svelte";
  import { CATEGORIES, type Item } from "../shared/catalog";
  import Logo from "./Logo.svelte";
  import { S } from "./strings";
  import type { Lang } from "../../../lib/i18n";

  let { lang, oncategory, onsell, onabout }: { lang: Lang; oncategory: (c: Item["category"] | null) => void; onsell: () => void; onabout: () => void } = $props();

  let mail = $state("");
  let subscribed = $state(false);
  const link = "text-left underline-offset-4 opacity-80 hover:underline hover:opacity-100";
  const head = "mb-2.5 text-[13px] font-semibold uppercase tracking-wider text-strong";
</script>

<footer class="mt-6 border-t border-line bg-surface text-sm">
  <!-- Newsletter -->
  <div class="border-b border-line">
    <div class="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-6">
      <div class="mr-auto">
        <p class="db-serif text-xl text-strong">{S.newsletterTitle[lang]}</p>
        <p class="opacity-70">{S.newsletterText[lang]}</p>
      </div>
      {#if subscribed}
        <p class="flex max-w-md items-start gap-2"><Icon name="check" size={17} class="mt-0.5 shrink-0 text-accent" />{S.newsletterDone[lang]}</p>
      {:else}
        <form
          onsubmit={(e) => {
            e.preventDefault();
            mail = "";
            subscribed = true;
          }}
          class="flex w-full max-w-md items-center rounded-full border border-line bg-bg pl-4 focus-within:border-accent"
        >
          <Icon name="mail" size={17} class="shrink-0 opacity-60" />
          <input bind:value={mail} type="email" required autocomplete="off" placeholder={S.newsletterPlaceholder[lang]} aria-label={S.newsletterPlaceholder[lang]} class="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-strong outline-none placeholder:opacity-50" />
          <button type="submit" class="m-1 rounded-full bg-accent px-4 py-1.5 font-semibold text-accent-fg transition hover:brightness-110">{S.newsletterGo[lang]}</button>
        </form>
      {/if}
    </div>
  </div>

  <div class="mx-auto grid max-w-[1100px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
    <div class="max-md:col-span-2">
      <span class="db-serif"><Logo size={30} name /></span>
      <p class="mt-3 flex items-start gap-2"><Icon name="pin" size={16} class="mt-0.5 shrink-0 text-accent" />{S.footAddress[lang]}</p>
      <p class="mt-1.5 flex items-start gap-2"><Icon name="clock" size={16} class="mt-0.5 shrink-0 text-accent" />{S.hours[lang]}</p>
    </div>
    <div>
      <p class={head}>{S.navShop[lang]}</p>
      <ul class="flex flex-col gap-1.5">
        <li><button type="button" onclick={() => oncategory(null)} class={link}>{S.allItems[lang]}</button></li>
        {#each CATEGORIES as c}
          <li><button type="button" onclick={() => oncategory(c.id)} class={link}>{c.label[lang]}</button></li>
        {/each}
      </ul>
    </div>
    <div>
      <p class={head}>{S.footSelling[lang]}</p>
      <ul class="flex flex-col gap-1.5">
        <li><button type="button" onclick={onsell} class={link}>{S.myListings[lang]}</button></li>
        <li><button type="button" onclick={onabout} class={link}>{S.footFees[lang]}</button></li>
        <li><button type="button" onclick={onabout} class={link}>{S.agentAboutTitle[lang]}</button></li>
      </ul>
    </div>
    <div>
      <p class={head}>{S.footHelp[lang]}</p>
      <ul class="flex flex-col gap-1.5">
        <li><button type="button" onclick={onabout} class={link}>{S.footShipping[lang]}</button></li>
        <li><button type="button" onclick={onabout} class={link}>{S.footContact[lang]}</button></li>
        <li><button type="button" onclick={onabout} class={link}>{S.navAbout[lang]}</button></li>
      </ul>
    </div>
  </div>

  <div class="border-t border-line">
    <div class="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 text-[13px]">
      <ul class="flex flex-wrap items-center gap-1.5" aria-label={S.payWith[lang]}>
        {#each ["TWINT", "Visa", "Mastercard", "PostFinance", S.payInvoice[lang]] as p}
          <li class="rounded border border-line bg-bg px-2 py-1 text-xs font-semibold tracking-wide text-strong">{p}</li>
        {/each}
      </ul>
      <p class="ml-auto flex flex-wrap gap-x-4 gap-y-1 opacity-70">
        <span>© {new Date().getFullYear()} DigiBrocki</span>
        {#each [S.footTerms, S.footPrivacy, S.footImprint] as t}
          <button type="button" onclick={onabout} class="underline-offset-4 hover:underline">{t[lang]}</button>
        {/each}
      </p>
    </div>
    <p class="mx-auto max-w-[1100px] px-4 pb-24 text-xs opacity-60">{S.footDemo[lang]}</p>
  </div>
</footer>

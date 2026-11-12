<script lang="ts">
  // One tool call, shown like a chat app's "Searched the web" row:
  // collapsed by default, expands to the raw results.
  import type { Item } from "./agent";
  import { TOOL_LABELS } from "../shared/tools";
  import { S } from "./strings";
  import Icon from "./Icon.svelte";
  import type { Lang } from "../../../lib/i18n";

  let { item, lang }: { item: Extract<Item, { kind: "tool" }>; lang: Lang } = $props();
  let open = $state(false);
  const meta = $derived(TOOL_LABELS[item.name]);
  const r = $derived(item.result);

  const subject = $derived(
    typeof item.input.query === "string"
      ? item.input.query
      : typeof item.input.product === "string"
        ? item.input.product
        : r?.tool === "get_listing"
          ? r.listing.title
          : "",
  );
  // Nothing to open when a search or price check came back empty.
  const empty = $derived(r?.tool === "search_ebay" ? !r.listings.length : r?.tool === "check_new_price" ? !r.offers.length : false);
  const canOpen = $derived(item.status === "error" ? !!item.error : item.status !== "running" && !empty);
  const chf = (n: number) => `CHF ${n.toLocaleString("de-CH")}`;
</script>

<div class="my-1 text-[0.95rem]">
  <button
    type="button"
    onclick={() => (open = !open)}
    disabled={!canOpen}
    class="group flex max-w-full items-center gap-2 rounded-lg py-1 pr-2 text-left opacity-80 transition enabled:hover:opacity-100"
  >
    <Icon name={meta.icon} size={16} class="shrink-0" />
    <span class={`shrink-0 ${item.status === "running" ? "shimmer" : ""}`}>
      {item.status === "running" ? meta.running[lang] : meta.done[lang]}
    </span>
    {#if subject}<span class="truncate opacity-70">{subject}</span>{/if}
    {#if item.status === "error"}
      <span class="shrink-0 text-danger">{S.toolError[lang]}</span>
    {:else if empty}
      <span class="shrink-0 opacity-60">· {S.nothingFound[lang]}</span>
    {:else if r?.tool === "search_ebay"}
      <span class="shrink-0 opacity-60">· {r.listings.length} {S.results[lang]}</span>
    {/if}
    {#if r?.source === "demo"}
      <span class="shrink-0 rounded border border-line px-1.5 text-xs opacity-70">{S.demoData[lang]}</span>
    {/if}
    {#if canOpen}
      <Icon name="chevron-right" size={14} class={`shrink-0 opacity-50 transition ${open ? "rotate-90" : ""}`} />
    {/if}
  </button>

  {#if open && canOpen}
    <div class="mb-2 ml-6 mt-1 rounded-xl border border-line bg-surface p-3 text-sm">
      {#if item.status === "error"}
        <p>{item.error}</p>
      {:else if r?.tool === "search_ebay"}
        <ul class="flex flex-col gap-2">
          {#each r.listings as l}
            <li class="flex items-center gap-3">
              <a href={l.url} target="_blank" rel="noopener" class="min-w-0 flex-1 truncate text-strong hover:underline">{l.title}</a>
              <span class="shrink-0 tabular-nums">{chf(l.price)}</span>
            </li>
          {/each}
        </ul>
      {:else if r?.tool === "check_new_price"}
        <ul class="flex flex-col gap-1">
          {#each r.offers as o}
            <li class="flex gap-3"><a href={o.url} target="_blank" rel="noopener" class="flex-1 text-strong hover:underline">{o.product}</a><span>{chf(o.lowestPrice)}</span></li>
          {/each}
        </ul>
      {:else if r?.tool === "get_listing"}
        <p class="text-strong">{r.listing.title} · {chf(r.listing.price)}</p>
        {#if r.listing.sellerName}
          <p class="mt-1">
            {r.listing.sellerName}{#if r.listing.sellerSince}, {S.memberSince[lang]} {new Date(r.listing.sellerSince).getFullYear()}{/if}{#if r.listing.location} · {r.listing.location}{/if}
          </p>
        {/if}
        {#if r.listing.description}<p class="mt-1">{r.listing.description}</p>{/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .shimmer {
    background: linear-gradient(90deg, var(--fg) 30%, var(--strong) 50%, var(--fg) 70%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 1.6s linear infinite;
  }
  @keyframes shimmer {
    from { background-position: 100% 0; }
    to { background-position: -100% 0; }
  }
</style>

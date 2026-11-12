<script lang="ts">
  // The goal, visible while the agent works: which items are found, the
  // total against the budget, and how many steps are used. All numbers are
  // the harness's own check of the agent's reports (see checkGoal).
  import type { Chat } from "./agent";
  import { S } from "./strings";
  import Icon from "./Icon.svelte";
  import type { Lang } from "../../../lib/i18n";

  let { chat, lang }: { chat: Chat; lang: Lang } = $props();

  let open = $state(true);
  const goal = $derived(chat.goal!);
  const found = $derived(goal.items.filter((i) => i.found).length);
  const over = $derived(goal.total > goal.budget);
  // The bar is the way to the goal: full when every item is found.
  const share = $derived(goal.items.length ? (found / goal.items.length) * 100 : 0);
  const chf = (n: number) => `CHF ${n.toLocaleString("de-CH")}`;
  const status = $derived(goal.reached ? "reached" : chat.busy || !chat.step ? "working" : "missed");
</script>

<div class="rounded-2xl border bg-surface px-4 py-3 text-sm transition-colors {goal.reached ? 'border-accent' : 'border-line'}" aria-live="polite">
  <button type="button" onclick={() => (open = !open)} aria-expanded={open} class="flex w-full items-center gap-2 text-left">
    <Icon name={goal.reached ? "check" : "target"} size={18} class="shrink-0 text-accent" />
    <span class="text-strong">
      {#if status === "reached"}{S.goalReached[lang]}{:else if status === "missed"}{S.goalMissed[lang]}{:else}{S.instructions[lang]}{/if}
    </span>
    <span class="tabular-nums opacity-70">
      · {found}/{goal.items.length} {S.goalItems[lang]} ·
      <span class={over ? "text-danger" : ""}>{chf(goal.total)}</span> / {goal.budget.toLocaleString("de-CH")}
    </span>
    {#if chat.busy && chat.step}
      <span class="ml-auto shrink-0 tabular-nums opacity-70">{S.step[lang]} {chat.step.n}/{chat.step.max}</span>
    {/if}
    <Icon name="chevron-right" size={14} class={`shrink-0 opacity-50 transition ${chat.busy && chat.step ? "" : "ml-auto"} ${open ? "rotate-90" : ""}`} />
  </button>

  <!-- Items found; red while the total is over budget -->
  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
    <div class="h-full rounded-full transition-all duration-500 {over ? 'bg-danger' : 'bg-accent'}" style:width={`${share}%`}></div>
  </div>

  {#if open}
    <ul class="mt-2.5 flex flex-col gap-1.5">
      {#each goal.items as item}
        <li class="flex items-center gap-2">
          <span class={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.found ? "bg-accent text-accent-fg" : "ring-1 ring-line"}`}>
            {#if item.found}<Icon name="check" size={11} />{/if}
          </span>
          <span class={`shrink-0 ${item.found ? "text-strong" : "opacity-70"}`}>{item.name}</span>
          {#if item.found && item.url}
            <a href={item.url} target="_blank" rel="noopener" class="min-w-0 flex-1 truncate opacity-70 underline-offset-4 hover:underline hover:opacity-100">
              {item.title}{#if item.location}<span class="hidden sm:inline"> · {item.location}</span>{/if}
            </a>
            <span class="shrink-0 tabular-nums text-strong">{chf(item.price ?? 0)}</span>
          {:else}
            <span class="flex-1 opacity-50">{S.goalOpen[lang]}</span>
          {/if}
        </li>
      {/each}
    </ul>
    {#if goal.note}<p class="mt-2 opacity-70">{goal.note}</p>{/if}
  {/if}
</div>

<script lang="ts">
  // The leaderboard, for the projector: the three best and nobody else, so
  // it can only ever honour, never shame. Refreshes by itself. Whoever is
  // logged in on /admin in this browser also gets the address to type in,
  // the prompts that cracked each level (without names) and the reset button.
  import { onMount } from "svelte";
  import { FOOTER_CLASS, FOOTER_LINK_CLASS, SITE_URL, copyright } from "../../../lib/site";
  import { getLang, type Lang } from "../../../lib/i18n";
  import { getTheme, type Theme } from "../../../lib/theme";
  import AppHeader from "../../../components/app/AppHeader.svelte";
  import Icon from "../../../components/app/Icon.svelte";
  import { LEVEL_INFO } from "../shared/levels";
  import { LEVELS, type Board, type Level, type Winning } from "../shared/types";
  import { ApiError, checkCode, getBoard, getWinning, loadMe, resetBoard, saveCode, savedCode } from "./game";
  import { S } from "./strings";

  let lang = $state<Lang>(getLang());
  let theme = $state<Theme>(getTheme());
  let gate = $state<"checking" | "open" | "code" | "off">("checking");
  let board = $state<Board | null>(null);
  const me = loadMe();

  async function refresh() {
    try {
      board = await getBoard(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) gate = err.code === "off" ? "off" : "code";
    }
  }

  onMount(() => {
    const onLang = () => (lang = getLang());
    const onTheme = () => (theme = getTheme());
    window.addEventListener("langchange", onLang);
    window.addEventListener("themechange", onTheme);
    let timer: ReturnType<typeof setInterval> | undefined;
    (async () => {
      const candidate = new URLSearchParams(location.search).get("code") || savedCode();
      gate = await checkCode(candidate);
      if (gate !== "open") return;
      if (candidate) saveCode(candidate);
      await refresh();
      // Only the admin endpoints answer whoever is logged in on /admin; the cookie itself is out of the page's reach.
      getWinning(1).then(() => (admin = true)).catch(() => {});
      timer = setInterval(() => document.visibilityState === "visible" && refresh(), 3000);
    })();
    return () => {
      window.removeEventListener("langchange", onLang);
      window.removeEventListener("themechange", onTheme);
      clearInterval(timer);
    };
  });

  // ---- Presenter: solutions per level, reset ----
  let openLevel = $state<Level | null>(null);
  let prompts = $state<Winning[] | null>(null);
  let needAdmin = $state(false);
  /** Logged in on /admin in this browser: only then is the reset button shown. */
  let admin = $state(false);
  async function toggle(l: Level) {
    needAdmin = false;
    if (openLevel === l) return void (openLevel = null);
    openLevel = l;
    prompts = null;
    try {
      prompts = (await getWinning(l)).prompts;
    } catch {
      needAdmin = true;
      openLevel = null;
    }
  }
  let sure = $state(false);
  async function clear() {
    if (!sure) return void (sure = true);
    sure = false;
    try {
      await resetBoard();
      openLevel = null;
      await refresh();
    } catch {
      needAdmin = true;
    }
  }

  const playHref = `/prompt-injection${savedCode() ? `?code=${encodeURIComponent(savedCode())}` : ""}`;
  /** What the room types into the browser, so it is spelled out rather than taken from location. */
  const PLAY_URL = "teaching.mariusbleif.com/prompt-injection";
</script>

<div class="flex h-dvh flex-col">
  <AppHeader {lang} {theme} />
  <main class="flex-1 overflow-y-auto px-4">
    {#if gate === "off" || gate === "code"}
      <p class="mt-24 text-center text-xl opacity-70">{gate === "off" ? S.codeOff[lang] : S.codeWrong[lang]}</p>
    {:else if board}
      <div class="mx-auto flex max-w-[900px] flex-col gap-8 pb-10 pt-6">
        {#if admin}
        <a href={playHref} class="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 rounded-3xl border border-line bg-surface px-5 py-4 text-center">
          <span class="text-sm uppercase tracking-wide opacity-60">{S.boardJoin[lang]}</span>
          <span class="break-all font-mono text-2xl text-strong sm:text-3xl">{PLAY_URL}</span>
        </a>
        {/if}

        <div class="flex flex-wrap items-end justify-between gap-3">
          <h1 class="flex items-center gap-3 text-4xl text-strong"><Icon name="trophy" size={34} class="text-accent" />{S.boardTitle[lang]}</h1>
          <p class="opacity-70"><span class="tabular-nums">{board.players}</span> {S.boardPlayers[lang]}{#if !admin}, <a href={playHref} class="underline-offset-4 hover:underline">{S.boardJoin[lang]}</a>{/if}</p>
        </div>

        {#if !board.top.length}
          <p class="py-20 text-center text-2xl opacity-60">{S.boardEmpty[lang]}</p>
        {:else}
          <ol class="grid gap-4 sm:grid-cols-3">
            {#each board.top as p, i (i)}
              <li class={`flex flex-col gap-3 rounded-3xl border p-6 ${i === 0 ? "border-accent bg-accent/10 sm:-translate-y-2" : "border-line bg-surface"}`}>
                <span class={`flex h-11 w-11 items-center justify-center rounded-full text-xl tabular-nums ${i === 0 ? "bg-accent text-accent-fg" : "bg-surface-2 text-strong"}`}>{i + 1}</span>
                <span class="truncate text-3xl text-strong">{p.name}</span>
                <span class="text-4xl tabular-nums text-accent">{p.score}<span class="ml-2 text-base opacity-70">{S.points[lang]}</span></span>
                <span class="flex gap-1.5">
                  {#each LEVELS as l}<span class={`h-3 w-3 rounded-full ${p.solved.includes(l) ? "bg-accent" : "ring-1 ring-line"}`}></span>{/each}
                </span>
              </li>
            {/each}
          </ol>
        {/if}

        <!-- For the debrief, presenter only: how many solved each level, and how -->
        {#if admin}
        <section class="flex flex-col gap-2">
          <h2 class="text-sm uppercase tracking-wide opacity-60">{S.boardSolutions[lang]}</h2>
          {#each LEVELS as l}
            {@const n = board.perLevel[l] ?? 0}
            <div class="rounded-2xl border border-line bg-surface">
              <button type="button" onclick={() => toggle(l)} aria-expanded={openLevel === l} class="flex w-full items-center gap-3 px-4 py-2.5 text-left">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm tabular-nums ring-1 ring-line">{l}</span>
                <span class="min-w-0 flex-1 truncate text-strong">{LEVEL_INFO[l].title[lang]}</span>
                <span class="hidden h-1.5 w-32 overflow-hidden rounded-full bg-surface-2 sm:block"><span class="block h-full rounded-full bg-accent transition-all duration-500" style:width={`${board.players ? (n / board.players) * 100 : 0}%`}></span></span>
                <span class="w-24 text-right text-sm tabular-nums opacity-70">{n} {S.boardSolved[lang]}</span>
                <Icon name="chevron-right" size={14} class={`shrink-0 opacity-50 transition ${openLevel === l ? "rotate-90" : ""}`} />
              </button>
              {#if openLevel === l}
                <div class="border-t border-line px-4 py-3">
                  {#if !prompts}
                    <p class="opacity-60">…</p>
                  {:else if !prompts.length}
                    <p class="opacity-60">{S.boardNoPrompts[lang]}</p>
                  {:else}
                    <ul class="flex flex-col gap-2">
                      {#each prompts as w}
                        <li class="whitespace-pre-wrap break-words rounded-xl bg-surface-2 px-3 py-2 font-mono text-sm text-strong">{w.prompt || "?"}</li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
          {#if needAdmin}<p class="text-sm text-danger">{S.boardAdmin[lang]}</p>{/if}
        </section>

        <button type="button" onclick={clear} onblur={() => (sure = false)} class={`self-end rounded-full border px-3 py-1.5 text-sm transition ${sure ? "border-danger text-danger" : "border-line opacity-60 hover:opacity-100"}`}>
          {sure ? S.boardResetSure[lang] : S.boardReset[lang]}
        </button>
        {/if}
      </div>
    {/if}
  </main>
  <footer class={FOOTER_CLASS}>
    <a href={SITE_URL} class={FOOTER_LINK_CLASS}>{copyright()}</a>
  </footer>
</div>

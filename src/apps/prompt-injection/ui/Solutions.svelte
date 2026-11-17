<script lang="ts">
  // The presenter's answer sheet: for each level the story the players see,
  // what runs behind it (model, host, instructions, win check) and the model
  // solutions. The inside part comes from an admin-only endpoint, so nothing
  // of it is in this page's code: without the /admin login it shows nothing.
  import { onMount } from "svelte";
  import { FOOTER_CLASS, FOOTER_LINK_CLASS, SITE_URL, copyright } from "../../../lib/site";
  import { getLang, type Lang, type Text } from "../../../lib/i18n";
  import { getTheme, type Theme } from "../../../lib/theme";
  import AppHeader from "../../../components/app/AppHeader.svelte";
  import Icon from "../../../components/app/Icon.svelte";
  import { LEVEL_INFO } from "../shared/levels";
  import type { Level } from "../shared/types";
  import { getSolutions } from "./game";
  import { S } from "./strings";

  type Sample = { lang: Lang; text: string; works: boolean; note: string };
  type Inside = { level: Level; model: string; providers: string[]; prompt: string; input: string; tools: string[]; blocked: string[]; win: Text; samples: Sample[] };

  let lang = $state<Lang>(getLang());
  let theme = $state<Theme>(getTheme());
  let levels = $state<Inside[] | null>(null);
  let denied = $state(false);

  onMount(() => {
    const onLang = () => (lang = getLang());
    const onTheme = () => (theme = getTheme());
    window.addEventListener("langchange", onLang);
    window.addEventListener("themechange", onTheme);
    getSolutions<{ levels: Inside[] }>().then(
      (r) => (levels = r.levels),
      () => (denied = true),
    );
    return () => {
      window.removeEventListener("langchange", onLang);
      window.removeEventListener("themechange", onTheme);
    };
  });

  let copied = $state("");
  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    copied = text;
    setTimeout(() => (copied = ""), 1200);
  }
</script>

{#snippet samples(list: Sample[])}
  <ul class="flex flex-col gap-2">
    {#each list as s}
      <li class="rounded-xl border border-line bg-surface px-3 py-2">
        <p class="flex items-start gap-2">
          <span class="mt-0.5 shrink-0 rounded bg-surface-2 px-1.5 text-xs uppercase">{s.lang}</span>
          <span class="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-sm text-strong">{s.text}</span>
          <button type="button" onclick={() => copy(s.text)} aria-label="Copy" class="shrink-0 rounded p-1 opacity-60 hover:bg-surface-2 hover:opacity-100"><Icon name={copied === s.text ? "check" : "copy"} size={15} /></button>
        </p>
        <p class="mt-1 text-sm opacity-70">{s.note}</p>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="flex h-dvh flex-col">
  <AppHeader {lang} {theme} />
  <main class="flex-1 overflow-y-auto px-4">
    <div class="mx-auto flex max-w-[900px] flex-col gap-8 pb-12 pt-6">
      <div>
        <h1 class="flex items-center gap-3 text-4xl text-strong"><Icon name="shield" size={32} class="text-accent" />{S.solTitle[lang]}</h1>
        <p class="mt-2 opacity-70">{S.solSub[lang]}</p>
      </div>

      {#if denied}
        <p class="rounded-xl border border-danger/50 px-4 py-3 text-danger">{S.boardAdmin[lang]}</p>
      {:else if levels}
        {#each levels as l}
          {@const info = LEVEL_INFO[l.level]}
          <section class="flex flex-col gap-4 border-t border-line pt-6">
            <header>
              <p class="text-sm text-accent">{S.level[lang]} {l.level}</p>
              <h2 class="text-2xl text-strong">{info.title[lang]}</h2>
              <p class="mt-1 text-sm opacity-70">{S.modelUsed[lang]}: <span class="font-mono text-strong">{l.model}</span>{#if l.providers.length}, {S.solProvider[lang]} {l.providers[0]}{/if}</p>
            </header>

            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 leading-relaxed">
              <dt class="text-accent">{S.where[lang]}</dt>
              <dd>{info.where[lang]}</dd>
              <dt class="text-accent">{S.angle[lang]}</dt>
              <dd>{info.angle[lang]}</dd>
              <dt class="text-accent">{S.goal[lang]}</dt>
              <dd class="text-strong">{info.goal[lang]}</dd>
              <dt class="text-accent">{S.solWin[lang]}</dt>
              <dd>{l.win[lang]}</dd>
            </dl>

            <div>
              <h3 class="mb-1.5 text-sm uppercase tracking-wide opacity-60">{S.solPrompt[lang]}</h3>
              <pre class="whitespace-pre-wrap break-words rounded-xl border border-line bg-surface p-3 font-mono text-[0.82rem] leading-relaxed">{l.prompt}</pre>
            </div>
            {#if l.level === 3 || l.level === 4}
              <div>
                <h3 class="mb-1.5 text-sm uppercase tracking-wide opacity-60">{S.solInput[lang]}</h3>
                <pre class="whitespace-pre-wrap break-words rounded-xl border border-line bg-surface p-3 font-mono text-[0.82rem] leading-relaxed">{l.input}</pre>
                {#each l.tools as t}<p class="mt-1.5 font-mono text-sm opacity-80">{t}</p>{/each}
              </div>
            {/if}
            {#if l.blocked.length}
              <div>
                <h3 class="mb-1.5 text-sm uppercase tracking-wide opacity-60">{S.solFilter[lang]}</h3>
                <p class="font-mono text-sm">{l.blocked.join(", ")}</p>
              </div>
            {/if}

            <div>
              <h3 class="mb-1.5 text-sm uppercase tracking-wide opacity-60">{S.solWorks[lang]}</h3>
              {@render samples(l.samples.filter((s) => s.works))}
            </div>
            <div>
              <h3 class="mb-1.5 text-sm uppercase tracking-wide opacity-60">{S.solFails[lang]}</h3>
              {@render samples(l.samples.filter((s) => !s.works))}
            </div>

            <div>
              <h3 class="mb-1.5 text-sm uppercase tracking-wide opacity-60">{S.solHints[lang]}</h3>
              <ol class="flex list-decimal flex-col gap-1 pl-5 leading-relaxed">
                {#each info.hints as h}<li>{h[lang]}</li>{/each}
              </ol>
            </div>

            <div>
              <h3 class="mb-1.5 text-sm uppercase tracking-wide opacity-60">{S.why[lang]}</h3>
              <p class="text-strong">{info.lesson[lang]}</p>
              <p class="mt-1 leading-relaxed">{info.why[lang]}</p>
            </div>
          </section>
        {/each}
      {/if}
    </div>
  </main>
  <footer class={FOOTER_CLASS}>
    <a href={SITE_URL} class={FOOTER_LINK_CLASS}>{copyright()}</a>
  </footer>
</div>

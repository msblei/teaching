<script lang="ts">
  // One chat page that grows into an agent, like a SaaS onboarding:
  //   1. plain chat with a model
  //   2. after UNLOCK_AFTER messages, "Add tools" appears in the composer
  //   3. after UNLOCK_AFTER messages with tools, the goal card appears: one
  //      goal with a checkable end, tracked above the composer while it runs
  // A photo can be attached to any message at any stage.
  // The header steps jump between stages (useful when presenting).
  import { onMount, tick } from "svelte";
  import { getLang, type Lang, type Text } from "../../../lib/i18n";
  import { getTheme, type Theme } from "../../../lib/theme";
  import { TOOL_NAMES, type ModelInfo, type ModelKey, type ToolName } from "../shared/types";
  import { runTurn, checkCode, newChat, ApiError, CODE_KEY, type Chat, type Photo } from "./agent";
  import { GOAL_STEPS } from "../shared/missions";
  import GoalTracker from "./GoalTracker.svelte";
  import Header from "./Header.svelte";
  import Messages from "./Messages.svelte";
  import Trace from "./Trace.svelte";
  import ModelPicker from "./ModelPicker.svelte";
  import Composer from "./Composer.svelte";
  import MissionPanel, { type Start } from "./MissionPanel.svelte";
  import LevelUp from "./LevelUp.svelte";
  import Spotlight from "./Spotlight.svelte";
  import { S } from "./strings";
  import { FOOTER_CLASS, FOOTER_LINK_CLASS, SITE_URL, copyright } from "../../../lib/site";

  const UNLOCK_AFTER = 2;

  // Language and theme follow <html data-lang / data-theme>.
  let lang = $state<Lang>(getLang());
  let theme = $state<Theme>(getTheme());
  onMount(() => {
    const onLang = () => (lang = getLang());
    const onTheme = () => (theme = getTheme());
    window.addEventListener("langchange", onLang);
    window.addEventListener("themechange", onTheme);
    return () => {
      window.removeEventListener("langchange", onLang);
      window.removeEventListener("themechange", onTheme);
    };
  });

  // Exact model names for the picker.
  let models = $state<ModelInfo[]>([]);
  onMount(async () => {
    try {
      models = await (await fetch("/api/llm-to-agent/models")).json();
    } catch {}
  });

  // Access gate, set per page on /admin: public pages open at once, otherwise
  // a workshop code (?code= in the link works too), or a note if the page is off.
  let gate = $state<"checking" | "open" | "code" | "off">("checking");
  let codeInput = $state("");
  let codeWrong = $state(false);
  onMount(async () => {
    let saved = "";
    try {
      saved = localStorage.getItem(CODE_KEY) ?? "";
    } catch {}
    const candidate = new URLSearchParams(location.search).get("code") || saved;
    const state = await checkCode(candidate);
    if (state === "open" && candidate) saveCode(candidate);
    gate = state;
  });
  function saveCode(c: string) {
    try {
      localStorage.setItem(CODE_KEY, c);
    } catch {}
  }
  async function submitCode(e: Event) {
    e.preventDefault();
    codeWrong = false;
    const state = await checkCode(codeInput.trim());
    if (state === "open") saveCode(codeInput.trim());
    else codeWrong = state === "code";
    gate = state;
  }

  // Conversation and onboarding state
  const noTools = (): Record<ToolName, boolean> => ({ search_tutti: false, get_listing: false, check_new_price: false });

  let chat = $state<Chat>(newChat());
  let model = $state<ModelKey>("claude");
  let view = $state<"chat" | "trace">("chat");
  const modelInfo = $derived(models.find((m) => m.key === model));
  let enabled = $state(noTools());
  let toolsUnlocked = $state(false);
  let missionsUnlocked = $state(false);
  let plainTurns = $state(0);
  let toolTurns = $state(0);
  let instructions = $state<{ label: Text; system: string } | null>(null);
  function clearInstructions() {
    instructions = null;
    chat.goal = null;
  }

  // Onboarding: a "level unlocked" moment, then a spotlight on the one
  // element to click next (everything else is dimmed and blocked).
  // A level earned by chatting waits until the user turns back to the text
  // field, so it never pops up while they are still reading the answer.
  let levelUp = $state<2 | 3 | null>(null);
  let pending = $state<2 | 3 | null>(null);
  let tour = $state<"tools" | "missions" | null>(null);
  let menuOpen = $state(false);

  function unlock(level: 2 | 3) {
    pending = null;
    if (level === 2 ? toolsUnlocked : missionsUnlocked) return;
    toolsUnlocked = true;
    if (level === 3) missionsUnlocked = true;
    levelUp = level;
  }
  function earn(level: 2 | 3) {
    pending = level;
    // After Enter the field still has focus; release it so the next click
    // or tap into it is a deliberate "I'm done reading".
    if (document.activeElement instanceof HTMLTextAreaElement) document.activeElement.blur();
  }
  function engage() {
    if (pending && !chat.busy) unlock(pending);
  }
  function levelDone() {
    if (!levelUp) return; // Enter and the button can both fire
    tour = levelUp === 2 ? "tools" : "missions";
    levelUp = null;
  }
  const spot = $derived(
    tour === "tools"
      ? menuOpen
        ? { target: "tools-menu", hint: S.tourToolsMenu }
        : { target: "tools-button", hint: S.tourToolsButton }
      : tour === "missions"
        ? { target: "missions", hint: S.tourMissions }
        : null,
  );
  // A step of the tour is done once its goal is reached.
  $effect(() => {
    if (tour === "tools" && TOOL_NAMES.some((t) => enabled[t])) tour = null;
    if (tour === "missions" && instructions) tour = null;
  });

  const tools = $derived(TOOL_NAMES.filter((t) => enabled[t]));
  // A step lights up as soon as it is unlocked.
  const reached = $derived<[boolean, boolean, boolean]>([true, toolsUnlocked, missionsUnlocked]);
  const empty = $derived(chat.items.length === 0);
  const showMissions = $derived(missionsUnlocked && !instructions && !chat.busy);
  const toolChip = $derived(tools.length && !instructions && !chat.busy && toolTurns < S.chipsTools.length ? S.chipsTools[toolTurns] : null);

  async function send(text: string, image?: Photo) {
    const used = [...tools];
    let ok = false;
    try {
      ok = await runTurn(chat, { text, image }, {
        model,
        modelId: modelInfo?.id ?? model,
        tools: used,
        system: instructions?.system,
        goal: !!instructions,
        maxSteps: instructions ? GOAL_STEPS : undefined,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        try {
          localStorage.removeItem(CODE_KEY);
        } catch {}
        gate = err.code === "off" ? "off" : "code";
        return;
      }
    }
    // Only answered messages count towards the next level.
    if (!ok) return;
    if (!used.length) {
      if (++plainTurns >= UNLOCK_AFTER && !toolsUnlocked) earn(2);
    } else if (!instructions) {
      if (++toolTurns >= UNLOCK_AFTER && !missionsUnlocked) earn(3);
    }
  }

  function startMission(s: Start) {
    for (const t of TOOL_NAMES) enabled[t] = true;
    toolsUnlocked = missionsUnlocked = true;
    pending = null;
    // New instructions start a fresh model context; earlier messages stay visible.
    const label = { de: s.label, en: s.label };
    chat.items.push({ kind: "divider", label });
    chat.trace.push({ kind: "divider", label });
    chat.messages = [];
    chat.goal = s.goal;
    instructions = { label, system: s.system };
    send(s.kickoff);
  }

  function newConversation() {
    chat = newChat();
    instructions = null;
  }

  function jump(step: 1 | 2 | 3) {
    if (step === 1) {
      newConversation();
      enabled = noTools();
      toolsUnlocked = missionsUnlocked = false;
      plainTurns = toolTurns = 0;
      levelUp = tour = pending = null;
    } else {
      unlock(step);
    }
  }

  // Keep the newest step in view. Opening "under the hood" jumps to the start
  // of your latest message instead, so you can read what it set off from the top.
  let scroller: HTMLElement | undefined = $state();
  let shownView: "chat" | "trace" = "chat";
  $effect(() => {
    const sig =
      chat.items.map((i) => (i.kind === "tool" ? i.status : i.kind === "assistant" ? i.text.length : i.kind)).join() +
      chat.trace.length +
      chat.busy +
      (chat.goal?.updates ?? 0) +
      showMissions;
    void sig;
    const switched = view !== shownView;
    shownView = view;
    tick().then(() => {
      if (!scroller) return;
      const turns = scroller.querySelectorAll<HTMLElement>("[data-turn]");
      if (switched && view === "trace" && turns.length) turns[turns.length - 1].scrollIntoView({ block: "start" });
      else scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    });
  });
</script>

{#snippet composerZone()}
  <div class="flex flex-col gap-2">
    {#if showMissions}
      <MissionPanel {lang} onstart={startMission} onopen={() => tour === "missions" && (tour = null)} />
    {/if}
    {#if instructions && chat.goal}
      <GoalTracker {chat} {lang} />
    {/if}
    {#if toolChip}
      <div class="flex">
        <button type="button" onclick={() => send(toolChip[lang])} class="rounded-full border border-line px-3.5 py-1.5 text-left text-sm transition hover:bg-surface-2 hover:text-strong">
          {toolChip[lang]}
        </button>
      </div>
    {/if}
    <Composer
      {lang}
      busy={chat.busy}
      {toolsUnlocked}
      bind:enabled
      bind:menuOpen
      instructionsLabel={instructions?.label ?? null}
      onclearinstructions={clearInstructions}
      onsend={send}
      onengage={engage}
    />
    <div class="flex justify-end text-sm">
      <ModelPicker bind:model {models} disabled={chat.busy} />
    </div>
  </div>
{/snippet}

<div class="flex h-dvh flex-col">
  <Header {lang} {theme} bind:view busy={chat.busy} {reached} locked={gate !== "open"} onjump={jump} onnewchat={newConversation} />

  {#if gate !== "open"}
    <main class="flex flex-1 items-center justify-center px-4">
      {#if gate === "off"}
        <p class="text-center text-xl opacity-70">{S.codeOff[lang]}</p>
      {:else if gate === "code"}
        <form onsubmit={submitCode} class="w-full max-w-sm">
          <label for="code" class="mb-3 block text-center text-2xl text-strong">{S.codeTitle[lang]}</label>
          <div class="flex gap-2 rounded-full border border-line bg-surface p-1.5 focus-within:border-accent/50">
            <input id="code" bind:value={codeInput} autocomplete="off" autocapitalize="off" class="min-w-0 flex-1 bg-transparent px-3 text-strong outline-none" />
            <button type="submit" class="rounded-full bg-accent px-4 py-1.5 text-accent-fg">{S.codeGo[lang]}</button>
          </div>
          {#if codeWrong}<p class="mt-2 text-center text-sm text-danger">{S.codeWrong[lang]}</p>{/if}
        </form>
      {/if}
    </main>
  {:else if empty && view === "chat"}
    <main class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-10">
      <h1 class="mb-8 text-center text-3xl text-strong">{S.greeting[lang]}</h1>
      <div class="w-full max-w-[760px]">
        {@render composerZone()}
        {#if !tools.length && !showMissions}
          <div class="mt-3 flex flex-wrap justify-center gap-2">
            {#each S.chipsModel as c}
              <button type="button" onclick={() => send(c[lang])} class="rounded-full border border-line px-3.5 py-1.5 text-sm transition hover:bg-surface-2 hover:text-strong">{c[lang]}</button>
            {/each}
          </div>
        {/if}
      </div>
    </main>
  {:else}
    <main bind:this={scroller} class="flex-1 overflow-y-auto">
      {#if view === "chat"}
        <div class="mx-auto max-w-[760px] px-4 py-6">
          <Messages {chat} {lang} />
        </div>
      {:else}
        <div class="mx-auto max-w-[1100px] px-4">
          <Trace {chat} {lang} modelLabel={modelInfo?.id ?? model} />
        </div>
      {/if}
    </main>
    <div class="mx-auto w-full max-w-[760px] px-4">
      {@render composerZone()}
    </div>
  {/if}

  <footer class={FOOTER_CLASS}>
    <a href={SITE_URL} class={FOOTER_LINK_CLASS}>{copyright()}</a>
  </footer>
</div>

{#if levelUp}
  <LevelUp level={levelUp} {lang} ondone={levelDone} />
{:else if spot && gate === "open"}
  <Spotlight target={spot.target} hint={spot.hint} {lang} onskip={() => (tour = null)} />
{/if}


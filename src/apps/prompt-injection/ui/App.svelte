<script lang="ts">
  // DigiBroki: a second-hand shop with AI features, and five levels of
  // breaking them.
  //   1  the chat assistant gives the staff code to anyone who says they are staff
  //   2  the chat assistant has a rule against it, and breaks it
  //   3  a review rewrites the AI summary
  //   4  a listing text makes a buyer's agent buy the wrong thing
  //   5  the chat again, behind a "firewall"
  // The shop is scenery the player is free to wander. The game is the strip
  // under the header (progress, hints, flag box, score) and the mission card
  // floating over the shop in the corner. A glowing frame marks where the current level is
  // played, without blocking anything else. Story cards carry the plot
  // between levels and explain afterwards why the attack worked.
  import { onMount } from "svelte";
  import { FOOTER_CLASS, FOOTER_LINK_CLASS, SITE_URL, copyright } from "../../../lib/site";
  import { getLang, type Lang, type Text } from "../../../lib/i18n";
  import { getTheme, type Theme } from "../../../lib/theme";
  import AppHeader from "../../../components/app/AppHeader.svelte";
  import Icon from "../../../components/app/Icon.svelte";
  import LevelUp from "../../../components/app/LevelUp.svelte";
  import { CAMERA_ID, CATEGORIES, ITEMS, OWN_ID, itemById, type Item } from "../shared/catalog";
  import { PHOTOS } from "../shared/photos";
  import { LEVEL_INFO, TAKEAWAYS } from "../shared/levels";
  import { LEVELS, MAX_NAME, MAX_TURNS, type AttemptResult, type Level, type Sent, type Turn } from "../shared/types";
  import AddressBar from "./AddressBar.svelte";
  import CartDrawer from "./CartDrawer.svelte";
  import ChallengeBar from "./ChallengeBar.svelte";
  import ChatWidget, { type Msg } from "./ChatWidget.svelte";
  import Logo from "./Logo.svelte";
  import Mission from "./Mission.svelte";
  import ModelView from "./ModelView.svelte";
  import Product from "./Product.svelte";
  import Sell from "./Sell.svelte";
  import Shop from "./Shop.svelte";
  import ShopFooter from "./ShopFooter.svelte";
  import ShopHeader from "./ShopHeader.svelte";
  import StoryCard from "./StoryCard.svelte";
  import { ApiError, attempt, checkCode, join, loadMe, saveCode, savedCode, saveMe, submitFlag, type Me } from "./game";
  import { S } from "./strings";

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

  // Access gate, set on /admin: public, a workshop code (?code= works too), or off.
  let gate = $state<"checking" | "open" | "code" | "off">("checking");
  let codeInput = $state("");
  let codeWrong = $state(false);
  onMount(async () => {
    const candidate = new URLSearchParams(location.search).get("code") || savedCode();
    const state = await checkCode(candidate);
    if (state === "open" && candidate) saveCode(candidate);
    gate = state;
  });
  async function submitCode(e: Event) {
    e.preventDefault();
    codeWrong = false;
    const state = await checkCode(codeInput.trim());
    if (state === "open") saveCode(codeInput.trim());
    else codeWrong = state === "code";
    gate = state;
  }

  // ---- Player ----
  let me = $state<Me | null>(loadMe());
  let nameInput = $state("");
  let joining = $state(false);
  async function enter(e: Event) {
    e.preventDefault();
    if (nameInput.trim().length < 2 || joining) return;
    joining = true;
    try {
      const j = await join(nameInput.trim());
      me = { token: j.token, name: j.name, solved: [], score: 0, reveals: {}, models: {} };
      saveMe(me);
      card = { kind: "intro" };
    } catch (err) {
      fail(err);
    } finally {
      joining = false;
    }
  }

  /** The level being played: the first one not solved yet. */
  const level = $derived<Level | null>(me ? (LEVELS.find((l) => !me!.solved.includes(l)) ?? null) : null);
  const info = $derived(level ? LEVEL_INFO[level] : null);

  // ---- Where the player is in the shop ----
  // Each page of the shop has its own address (#/item/…, #/sell, #/about),
  // so the browser's back and forward buttons move through the shop.
  type View = { page: "home" } | { page: "item"; id: string } | { page: "sell" } | { page: "about" };
  const toHash = (v: View) => (v.page === "home" ? "" : v.page === "item" ? `#/item/${v.id}` : `#/${v.page}`);
  function fromHash(hash: string): View {
    const [, page, id] = hash.split("/");
    if (page === "item" && id && itemById(id)) return { page: "item", id };
    return page === "sell" || page === "about" ? { page } : { page: "home" };
  }
  let view = $state<View>({ page: "home" });
  let chatOpen = $state(false);
  let scroller: HTMLElement | undefined = $state();
  function go(v: View) {
    if (toHash(v) !== toHash(view)) {
      history.pushState(null, "", location.pathname + location.search + toHash(v));
      depth++;
    }
    view = v;
    scroller?.scrollTo({ top: 0 });
  }
  onMount(() => {
    view = fromHash(location.hash);
    const onPop = () => {
      depth = Math.max(0, depth - 1);
      view = fromHash(location.hash);
      scroller?.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  });

  // ---- Shop scenery: search, category, wishlist, cart. None of it reaches a level. ----
  let query = $state("");
  let category = $state<Item["category"] | null>(null);
  let wish = $state<string[]>([]);
  let wishOnly = $state(false);
  let cart = $state<string[]>([]);
  let cartOpen = $state(false);
  /** Pages opened inside the shop, for the address bar's back button. */
  let depth = $state(0);
  const cartItems = $derived(cart.map((id) => itemById(id)!).filter(Boolean));
  function browse(c: Item["category"] | null) {
    category = c;
    query = "";
    wishOnly = false;
    go({ page: "home" });
  }
  function toggleWish(id: string) {
    wish = wish.includes(id) ? wish.filter((w) => w !== id) : [...wish, id];
  }
  function addToCart(id: string) {
    if (!cart.includes(id)) cart.push(id);
    cartOpen = true;
  }
  /** The address the shop would have for what is on screen. */
  const path = $derived.by(() => {
    const de = lang === "de";
    const base = `/${lang}`;
    if (view.page === "item") return `${base}/${de ? "artikel" : "item"}/${view.id}`;
    if (view.page === "sell") return `${base}/${de ? "konto/inserate" : "account/listings"}`;
    if (view.page === "about") return `${base}/${de ? "ueber-uns" : "about"}`;
    if (wishOnly) return `${base}/${de ? "merkliste" : "wishlist"}`;
    const cat = category ? `/${CATEGORIES.find((c) => c.id === category)!.label[lang].toLowerCase()}` : "/";
    return `${base}${cat}${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`;
  });

  // ---- Attempts ----
  let busy = $state(false);
  let error = $state<Text | null>(null);
  /** What the player sent last in each level: handed in with the flag, and shown in the explanation. */
  let lastPrompt = $state<Record<number, string>>({});
  /** A flag is on screen for this level and not handed in yet. */
  let flagShown = $state<Record<number, boolean>>({});
  let chats = $state<Record<number, Msg[]>>({});
  let myReview = $state<{ text: string; stars: number } | null>(null);
  let reviewResult = $state<AttemptResult | null>(null);
  /** Level 4: what each shopping agent that came by made of the listing, newest first. */
  let visits = $state<AttemptResult[]>([]);
  /** The player's listing text: what they last saved, or what the listing came with. */
  const myDescription = $derived(lastPrompt[4] ?? itemById(OWN_ID)!.text[lang]);

  function fail(err: unknown) {
    const code = err instanceof ApiError ? err.code : "";
    if (err instanceof ApiError && err.status === 401 && code !== "bad_player") gate = code === "off" ? "off" : "code";
    else if (code === "bad_player") {
      // The token is no longer known (new server secret): start over with a new name.
      me = null;
    } else error = code === "no_key" ? S.noKey : code === "busy" || code === "rate_limited" ? S.errBusy : S.errGeneric;
  }

  async function sendChat(text: string) {
    if (!me || !level || busy) return;
    const l = level;
    // Read the list back through `chats`: only that one is reactive.
    chats[l] ??= [];
    const msgs = chats[l];
    msgs.push({ role: "user", text });
    lastPrompt[l] = text;
    error = null;
    busy = true;
    try {
      // The whole conversation goes to the model, as in a real chat.
      const r = await attempt(me, l, { messages: turnsOf(msgs) }, lang);
      if (r.blocked) {
        // A stopped message never reached Bea.
        msgs.pop();
        msgs.push({ role: "notice", text: `${text}\n${S.blocked[lang].replace("{w}", r.blocked)}` });
      } else {
        msgs.push({ role: "assistant", text: r.reply });
        if (r.flag) flagShown[l] = true;
      }
    } catch (err) {
      msgs.pop();
      fail(err);
    } finally {
      busy = false;
    }
  }

  /** The conversation as the model gets it: the player's and Bea's messages, newest last, without firewall notices. */
  const turnsOf = (msgs: Msg[]): Turn[] =>
    msgs
      .filter((m) => m.role !== "notice")
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role as Turn["role"], content: m.text }));

  async function sendText(l: 3 | 4, text: string, stars = 5) {
    if (!me || busy) return;
    lastPrompt[l] = text;
    if (l === 3) myReview = { text, stars };
    error = null;
    busy = true;
    try {
      const r = await attempt(me, l, l === 3 ? { text, stars } : { text }, lang);
      if (l === 3) reviewResult = r;
      else visits.unshift(r);
      if (r.flag) flagShown[l] = true;
    } catch (err) {
      fail(err);
    } finally {
      busy = false;
    }
  }

  // ---- Hints: free, opened one at a time ----
  let hintsOpened = $state<Record<number, number>>({});
  const opened = $derived(level ? (hintsOpened[level] ?? 0) : 0);

  // ---- Where the level is played: a glowing frame, nothing is blocked ----
  const tried = $derived(level ? lastPrompt[level] !== undefined : false);
  const beacon = $derived.by(() => {
    if (!level || !info || card || levelUp || flagShown[level]) return "";
    if (info.place === "chat") return chatOpen ? "" : "chat";
    if (info.place === "review") return view.page === "item" && view.id === CAMERA_ID ? (tried ? "" : "review") : view.page === "home" ? "camera" : "";
    return view.page === "sell" ? (tried ? "" : "listing") : "sell";
  });

  // ---- Flags, points and the story between levels ----
  type Card = { kind: "intro" } | { kind: "story"; level: Level } | { kind: "lesson"; level: Level } | { kind: "done" };
  let card = $state<Card | null>(null);
  let levelUp = $state<{ level: Level; points: number; place: number } | null>(null);

  async function handIn(flag: string): Promise<boolean> {
    if (!me || !level) return false;
    const l = level;
    try {
      const r = await submitFlag(me, l, flag, lastPrompt[l] ?? "");
      if (!r.ok) return false;
      me.solved = r.solved ?? [...me.solved, l];
      me.score = r.score ?? me.score;
      if (r.reveal) me.reveals[l] = r.reveal;
      if (r.model) me.models[l] = r.model;
      saveMe(me);
      flagShown[l] = false;
      chatOpen = false;
      levelUp = { level: l, points: r.points ?? 0, place: r.place ?? 1 };
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  }

  function showLesson() {
    // Read the level before clearing it: the overlay's own markup depends on it.
    const up = levelUp;
    levelUp = null;
    if (up) card = { kind: "lesson", level: up.level };
  }
  function afterLesson(l: Level) {
    const next = (l + 1) as Level;
    card = LEVELS.includes(next) ? { kind: "story", level: next } : { kind: "done" };
  }
  function startLevel() {
    card = null;
    chatOpen = false;
    cartOpen = false;
    // The whole shop front again, whatever was searched or filtered before.
    query = "";
    category = null;
    wishOnly = false;
    go({ page: "home" });
  }

  /** What the model was sent in a solved level, exactly: the instructions, then the message with the player's part. */
  function sentIn(l: Level): Sent | null {
    const result = l === 3 ? reviewResult : l === 4 ? (visits[0] ?? null) : null;
    if (result?.sent) return result.sent;
    const system = me?.reveals[l];
    if (!system) return null;
    // The conversation up to the message that did it; Bea's last answer came back, it was not sent.
    const turns = turnsOf(chats[l] ?? []);
    if (turns.at(-1)?.role === "assistant") turns.pop();
    return { system, parts: turns.flatMap((t, i) => [...(i ? [{ text: "\n\n" }] : []), { text: t.content, mine: t.role === "user" }]) };
  }

  const shownItem = $derived(view.page === "item" ? itemById(view.id) : undefined);
  const boardHref = $derived(`/prompt-injection/board${savedCode() ? `?code=${encodeURIComponent(savedCode())}` : ""}`);
</script>

<div class="flex h-dvh flex-col">
  <AppHeader {lang} {theme} />

  {#if gate === "checking"}
    <main class="flex-1"></main>
  {:else}
    <!-- The shop is on screen whatever the gate says. While the gate is closed it is out of reach behind the code dialog. -->
    <div class="contents" inert={gate !== "open"}>
    {#if me}
      <ChallengeBar
        {lang}
        {level}
        solved={me.solved}
        name={me.name}
        score={me.score}
        hints={info ? info.hints.slice(0, opened).map((h) => h[lang]) : []}
        canOpenHint={!!info && opened < info.hints.length}
        flagWaiting={!!level && !!flagShown[level]}
        {boardHref}
        onsubmit={handIn}
        onopenhint={() => level && (hintsOpened[level] = opened + 1)}
      />
    {/if}

    <!-- Above this line is the workshop, below it "the website". -->
    <AddressBar {lang} {path} canBack={depth > 0} onback={() => history.back()} onreload={() => scroller?.scrollTo({ top: 0, behavior: "smooth" })} />

    <!-- The shop. It has its own typeface for running text and keeps the site's serif for its name and headings. -->
    <main bind:this={scroller} class="flex-1 overflow-y-auto font-sans text-[15px]">
      <ShopHeader
        {lang}
        name={me?.name ?? ""}
        page={view.page}
        {category}
        bind:query
        wishOn={wishOnly && view.page === "home"}
        wishCount={wish.length}
        cartCount={cart.length}
        cartTotal={cartItems.reduce((s, i) => s + i.price, 0)}
        beaconSell={beacon === "sell"}
        onhome={() => browse(null)}
        oncategory={browse}
        onsearch={() => {
          wishOnly = false;
          category = null;
          if (view.page !== "home") go({ page: "home" });
        }}
        onsell={() => go({ page: "sell" })}
        onabout={() => go({ page: "about" })}
        onwish={() => {
          wishOnly = !(wishOnly && view.page === "home");
          go({ page: "home" });
        }}
        oncart={() => (cartOpen = true)}
      />
      <div class="mx-auto min-h-[60vh] max-w-[1100px] px-4 pb-12 pt-6">
        {#if error}
          <p class="mb-4 flex items-center justify-between gap-3 rounded-xl border border-danger/50 px-3 py-2 text-danger">
            {error[lang]}
            <button type="button" onclick={() => (error = null)} aria-label={S.close[lang]} class="rounded p-0.5 hover:bg-surface-2"><Icon name="x" size={16} /></button>
          </p>
        {/if}

        {#if view.page === "sell"}
          <Sell
            {lang}
            phase={level === 4 ? "open" : level && level < 4 ? "locked" : "done"}
            beacon={beacon === "listing"}
            busy={busy && level === 4}
            description={myDescription}
            {visits}
            onback={() => go({ page: "home" })}
            onopen={(id) => go({ page: "item", id })}
            onsave={(t) => sendText(4, t)}
            oncopy={() => {}}
          />
        {:else if view.page === "about"}
          <div class="max-w-2xl">
            <nav class="mb-4 flex items-center gap-1.5 text-[13px] opacity-70">
              <button type="button" onclick={() => browse(null)} class="underline-offset-4 hover:underline">{S.navShop[lang]}</button>
              <Icon name="chevron-right" size={12} />
              <span class="text-strong">{S.navAbout[lang]}</span>
            </nav>
            <h1 class="db-serif text-3xl text-strong">{S.aboutTitle[lang]}</h1>
            <p class="mt-3 leading-relaxed">{S.aboutText[lang]}</p>
            <p class="mt-3 text-sm opacity-70">{S.footDemo[lang]}</p>
            <h2 id="agent" class="db-serif mt-7 text-xl text-strong">{S.agentAboutTitle[lang]}</h2>
            <p class="mt-1 leading-relaxed">{S.agentAboutText[lang]}</p>
            <h2 class="db-serif mt-7 text-xl text-strong">{S.footShipping[lang]}</h2>
            <p class="mt-1 leading-relaxed">{S.aboutShipText[lang]}</p>
            <h2 class="db-serif mt-7 text-xl text-strong">{S.footFees[lang]}</h2>
            <p class="mt-1 leading-relaxed">{S.aboutFeesText[lang]}</p>
            <h2 class="db-serif mt-7 text-xl text-strong">{S.footContact[lang]}</h2>
            <p class="mt-1 leading-relaxed">{S.aboutContactText[lang]}</p>
            <p class="mt-2 flex items-start gap-2 text-sm"><Icon name="pin" size={16} class="mt-0.5 shrink-0 text-accent" />{S.footAddress[lang]}</p>
            <p class="mt-1 flex items-start gap-2 text-sm"><Icon name="clock" size={16} class="mt-0.5 shrink-0 text-accent" />{S.hours[lang]}</p>
            <h2 class="db-serif mt-7 text-xl text-strong">{S.credits[lang]}</h2>
            <p class="mt-1 text-sm opacity-70">{S.creditsText[lang]}</p>
            <ul class="mt-2 flex flex-col gap-1 text-sm">
              {#each ITEMS.filter((i) => PHOTOS[i.id]) as i}
                <li>{i.title[lang]}: <a href={PHOTOS[i.id].page} target="_blank" rel="noopener" class="underline underline-offset-2">{PHOTOS[i.id].author}</a>, {PHOTOS[i.id].licence}</li>
              {/each}
            </ul>
          </div>
        {:else if shownItem}
          {@const camera = shownItem.id === CAMERA_ID}
          <Product
            item={shownItem}
            {lang}
            canReview={camera && level === 3}
            beacon={camera && beacon === "review"}
            busy={busy && camera && level === 3}
            mine={camera ? myReview : null}
            result={camera ? reviewResult : null}
            ownText={myDescription}
            playerName={me?.name ?? ""}
            inCart={cart.includes(shownItem.id)}
            wished={wish.includes(shownItem.id)}
            onedit={() => go({ page: "sell" })}
            onback={() => browse(null)}
            oncategory={browse}
            onopen={(id) => go({ page: "item", id })}
            oncart={() => addToCart(shownItem.id)}
            onwish={() => toggleWish(shownItem.id)}
            onreview={(t, n) => sendText(3, t, n)}
            oncopy={() => {}}
          />
        {:else}
          <Shop {lang} beaconId={beacon === "camera" ? CAMERA_ID : ""} bind:query bind:category {wish} {wishOnly} onopen={(id) => go({ page: "item", id })} onwish={toggleWish} onsell={() => go({ page: "sell" })} />
        {/if}
      </div>

      <!-- The shop's own footer scrolls with the shop. -->
      <ShopFooter {lang} oncategory={browse} onsell={() => go({ page: "sell" })} onabout={() => go({ page: "about" })} />
    </main>

    <!-- The site's footer, as on every page: below the shop's frame, always in view. -->
    <footer class={`${FOOTER_CLASS} border-t border-line`}>
      <a href={SITE_URL} class={FOOTER_LINK_CLASS}>{copyright()}</a>
    </footer>

    <CartDrawer {lang} bind:open={cartOpen} items={cartItems} onremove={(id) => (cart = cart.filter((c) => c !== id))} onopen={(id) => { cartOpen = false; go({ page: "item", id }); }} />

    {#if me && !card && !levelUp}<Mission {lang} {level} />{/if}

    {#if me}
      <ChatWidget
        {lang}
        bind:open={chatOpen}
        active={info?.place === "chat"}
        messages={level && info?.place === "chat" ? (chats[level] ?? []) : []}
        busy={busy && info?.place === "chat"}
        beacon={beacon === "chat"}
        onsend={sendChat}
        onreset={() => level && (chats[level] = [])}
        oncopy={() => {}}
      />
    {/if}
    </div>
  {/if}
</div>

{#if gate === "code" || gate === "off"}
  <!-- Closed gate: the shop stays in view behind it, as behind the name prompt. -->
  <div class="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={S.codeTitle[lang]}>
    {#if gate === "off"}
      <p class="w-full max-w-sm rounded-3xl border border-line bg-bg p-6 text-center text-xl text-strong shadow-2xl">{S.codeOff[lang]}</p>
    {:else}
      <form onsubmit={submitCode} class="w-full max-w-sm rounded-3xl border border-line bg-bg p-6 shadow-2xl">
        <label for="code" class="block text-2xl text-strong">{S.codeTitle[lang]}</label>
        <div class="mt-4 flex gap-2 rounded-full border border-line bg-surface p-1.5 focus-within:border-accent/50">
          <!-- svelte-ignore a11y_autofocus -->
          <input id="code" bind:value={codeInput} autofocus autocomplete="off" autocapitalize="off" class="min-w-0 flex-1 bg-transparent px-3 text-strong outline-none" />
          <button type="submit" class="rounded-full bg-accent px-4 py-1.5 text-accent-fg">{S.codeGo[lang]}</button>
        </div>
        {#if codeWrong}<p class="mt-2 text-sm text-danger">{S.codeWrong[lang]}</p>{/if}
      </form>
    {/if}
  </div>
{/if}

{#if gate === "open"}
  {#if !me}
    <!-- First visit: pick a name for the leaderboard. -->
    <div class="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={S.nameTitle[lang]}>
      <form onsubmit={enter} class="w-full max-w-sm rounded-3xl border border-line bg-bg p-6 shadow-2xl">
        <label for="name" class="block text-2xl text-strong">{S.nameTitle[lang]}</label>
        <p class="mt-1 text-sm opacity-70">{S.nameSub[lang]}</p>
        <div class="mt-4 flex gap-2 rounded-full border border-line bg-surface p-1.5 focus-within:border-accent/50">
          <!-- svelte-ignore a11y_autofocus -->
          <input id="name" bind:value={nameInput} maxlength={MAX_NAME} autocomplete="off" autofocus placeholder={S.namePlaceholder[lang]} class="min-w-0 flex-1 bg-transparent px-3 text-strong outline-none placeholder:opacity-50" />
          <button type="submit" disabled={nameInput.trim().length < 2 || joining} class="rounded-full bg-accent px-4 py-1.5 text-accent-fg disabled:opacity-40">{S.nameGo[lang]}</button>
        </div>
        {#if error}<p class="mt-2 text-sm text-danger">{error[lang]}</p>{/if}
      </form>
    </div>
  {:else if levelUp}
    <LevelUp
      icon="flag"
      title={S.plusPoints[lang].replace("{n}", String(levelUp.points))}
      sub={`${(levelUp.place === 1 ? S.placeFirst : S.placeNth)[lang].replace("{l}", String(levelUp.level)).replace("{p}", String(levelUp.place))} ${S.total[lang].replace("{n}", String(me.score))}`}
      label={S.solved[lang].replace("{n}", String(levelUp.level))}
      {lang}
      timeout={0}
      ondone={showLesson}
    />
  {:else if card?.kind === "intro"}
    <StoryCard icon="target" kicker={S.introKicker[lang]} title={S.introTitle[lang]} action={S.introGo[lang]} onaction={() => (card = { kind: "story", level: 1 })}>
      <p>{S.introText[lang]}</p>
    </StoryCard>
  {:else if card?.kind === "story"}
    {@const l = card.level}
    {@const i = LEVEL_INFO[l]}
    <StoryCard icon="target" kicker={`${S.level[lang]} ${l}`} title={i.title[lang]} action={S.go[lang]} onaction={startLevel}>
      <p>{i.story[lang]}</p>
      <p class="text-lg text-strong">{i.goal[lang]}</p>
    </StoryCard>
  {:else if card?.kind === "lesson"}
    {@const l = card.level}
    {@const sent = sentIn(l)}
    <StoryCard icon="bulb" kicker={S.why[lang]} title={LEVEL_INFO[l].lesson[lang]} action={l < 5 ? S.next[lang].replace("{n}", String(l + 1)) : S.finish[lang]} onaction={() => afterLesson(l)} wide>
      <p>{LEVEL_INFO[l].why[lang]}</p>
      {#if sent}
        <div>
          <p class="mb-1.5 text-sm opacity-70">{S.told[lang]}</p>
          <div class="max-h-[24rem] overflow-y-auto"><ModelView {sent} {lang} bare /></div>
        </div>
      {/if}
      {#if me.models[l]}<p class="text-sm opacity-70">{S.modelUsed[lang]}: <span class="font-mono text-strong">{me.models[l]}</span></p>{/if}
    </StoryCard>
  {:else if card?.kind === "done"}
    <StoryCard icon="shield" kicker={`${S.allDone[lang]}: ${me.score} ${S.points[lang]}`} title={S.doneTitle[lang]} action={S.close[lang]} onaction={() => (card = null)}>
      <p>{S.doneSub[lang]}</p>
      <ul class="flex flex-col gap-2">
        {#each TAKEAWAYS as t}
          <li class="flex gap-2"><Icon name="check" size={17} class="mt-1 shrink-0 text-accent" /><span class="text-strong">{t[lang]}</span></li>
        {/each}
      </ul>
    </StoryCard>
  {/if}
{/if}

<style>
  /* Inside the shop the running text is sans; its name and headings keep the site's serif. */
  :global(.db-serif) {
    font-family: "Latin Modern Roman", serif;
  }
  /* Where the current level is played: a pulsing frame. It marks the spot and blocks nothing. */
  :global(.pi-beacon) {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
    animation: pi-beacon 1.6s ease-out infinite;
  }
  @keyframes pi-beacon {
    0% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 55%, transparent); }
    100% { box-shadow: 0 0 0 22px transparent; }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.pi-beacon) { animation: none; }
  }
</style>

<script lang="ts">
  // Hidden admin page: log in with ADMIN_PASSWORD, then set, check or
  // remove the OpenRouter key. The server only ever returns a masked key.
  import { onMount } from "svelte";
  import { getLang, type Lang } from "../../lib/i18n";

  type Info = { valid: boolean; usage?: number; limit?: number | null; limitRemaining?: number | null; expiresAt?: string | null; accountRemaining?: number | null };
  type Codes = { codes: string[]; source: "admin" | "env" | null; envCodes: boolean };
  type Status = { active: false } | { active: true; masked: string; source: "admin" | "env"; savedAt: string | null; info: Info | null };

  const T = {
    title: { de: "Admin", en: "Admin" },
    password: { de: "Passwort", en: "Password" },
    login: { de: "Anmelden", en: "Log in" },
    logout: { de: "Abmelden", en: "Log out" },
    wrong: { de: "Falsches Passwort.", en: "Wrong password." },
    tooMany: { de: "Zu viele Versuche. Bitte in einer Stunde nochmals.", en: "Too many attempts. Try again in an hour." },
    keyTitle: { de: "OpenRouter-Key", en: "OpenRouter key" },
    active: { de: "Aktiv", en: "Active" },
    none: { de: "Kein Key aktiv", en: "No key active" },
    noneHint: {
      de: "Teilnehmende sehen beim Senden: Warte kurz auf die Kursleitung.",
      en: "Participants see on send: please wait for your instructor.",
    },
    fromAdmin: { de: "hier gesetzt", en: "set here" },
    fromEnv: { de: "aus der Env-Variable OPENROUTER_API_KEY (nur in Netlify entfernbar)", en: "from the env var OPENROUTER_API_KEY (remove it in Netlify)" },
    invalid: { de: "OpenRouter lehnt diesen Key ab (ungültig oder gelöscht).", en: "OpenRouter rejects this key (invalid or deleted)." },
    spent: { de: "verbraucht", en: "spent" },
    keyLeft: { de: "auf dem Key übrig", en: "left on the key" },
    accountLeft: { de: "Guthaben auf dem Konto", en: "account balance" },
    expires: { de: "läuft ab", en: "expires" },
    newKey: { de: "Neuer Key", en: "New key" },
    save: { de: "Prüfen und speichern", en: "Check and save" },
    replace: { de: "Ersetzen", en: "Replace" },
    remove: { de: "Key entfernen", en: "Remove key" },
    refresh: { de: "Aktualisieren", en: "Refresh" },
    badKey: { de: "OpenRouter kennt diesen Key nicht.", en: "OpenRouter does not accept this key." },
    unreachable: { de: "OpenRouter ist gerade nicht erreichbar.", en: "OpenRouter can't be reached right now." },
    error: { de: "Das hat nicht geklappt.", en: "That didn't work." },
    codesTitle: { de: "Workshop-Codes", en: "Workshop codes" },
    codesNone: { de: "Kein Code aktiv: niemand kommt in die App.", en: "No code active: nobody can use the app." },
    codesFromEnv: { de: "aus der Env-Variable WORKSHOP_CODES", en: "from the env var WORKSHOP_CODES" },
    codesHint: { de: "Mehrere mit Komma trennen. Kleinbuchstaben, Zahlen, Bindestrich.", en: "Separate several with commas. Lowercase letters, digits, hyphens." },
    codesSave: { de: "Speichern", en: "Save" },
    codesRemove: { de: "Alle Codes entfernen", en: "Remove all codes" },
    codesRemoveHint: { de: "Sperrt die App, auch wenn in Netlify WORKSHOP_CODES gesetzt ist.", en: "Locks the app, even if WORKSHOP_CODES is set in Netlify." },
    codesReset: { de: "Codes aus Netlify wieder verwenden", en: "Use the Netlify codes again" },
    codesBad: { de: "Ungültig: 3 bis 40 Zeichen, nur a-z, 0-9 und Bindestrich.", en: "Invalid: 3 to 40 characters, only a-z, 0-9 and hyphens." },
    link: { de: "Link mit Code", en: "Link with code" },
    copy: { de: "Kopieren", en: "Copy" },
    copied: { de: "Kopiert", en: "Copied" },
  } as const;

  let lang = $state<Lang>(getLang());
  onMount(() => {
    const on = () => (lang = getLang());
    window.addEventListener("langchange", on);
    return () => window.removeEventListener("langchange", on);
  });

  let view = $state<"loading" | "login" | "panel" | "off">("loading");
  let status = $state<Status | null>(null);
  let codes = $state<Codes | null>(null);
  let codesInput = $state("");
  let codesError = $state<keyof typeof T | null>(null);
  let copied = $state<string | null>(null);
  let password = $state("");
  let newKey = $state("");
  let busy = $state(false);
  let error = $state<keyof typeof T | null>(null);

  async function api(method: string, path: string, body?: unknown) {
    const res = await fetch(`/api/admin/${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { res, json };
  }

  async function load() {
    const [key, c] = await Promise.all([api("GET", "openrouter"), api("GET", "workshop-codes")]);
    if (key.res.status === 404) view = "off";
    else if (key.res.status === 401) view = "login";
    else if (key.res.ok) {
      status = key.json;
      if (c.res.ok) setCodes(c.json);
      view = "panel";
    }
  }
  function setCodes(c: Codes) {
    codes = c;
    codesInput = c.codes.join(", ");
  }
  onMount(load);

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    busy = true;
    error = null;
    try {
      await fn();
    } catch {
      error = "error";
    } finally {
      busy = false;
    }
  }

  const login = (e: Event) => {
    e.preventDefault();
    run(async () => {
      const { res } = await api("POST", "login", { password });
      if (res.ok) {
        password = "";
        await load();
      } else error = res.status === 429 ? "tooMany" : "wrong";
    });
  };

  const save = (e: Event) => {
    e.preventDefault();
    run(async () => {
      const { res, json } = await api("PUT", "openrouter", { key: newKey });
      if (res.ok) {
        status = json;
        newKey = "";
      } else if (res.status === 401) view = "login";
      else error = json.error === "invalid_key" ? "badKey" : json.error === "openrouter_unreachable" ? "unreachable" : "error";
    });
  };

  const remove = () =>
    run(async () => {
      const { res, json } = await api("DELETE", "openrouter");
      if (res.ok) status = json;
      else if (res.status === 401) view = "login";
      else error = "error";
    });

  const saveCodes = (e: Event) => {
    e.preventDefault();
    codesError = null;
    run(async () => {
      const { res, json } = await api("PUT", "workshop-codes", { codes: codesInput });
      if (res.ok) setCodes(json);
      else if (res.status === 401) view = "login";
      else codesError = json.error === "invalid_codes" ? "codesBad" : "error";
    });
  };

  const removeCodes = (reset = false) =>
    run(async () => {
      const { res, json } = await api("DELETE", reset ? "workshop-codes?reset=1" : "workshop-codes");
      if (res.ok) setCodes(json);
      else if (res.status === 401) view = "login";
    });

  const linkFor = (c: string) => `${location.origin}/llm-to-agent?code=${encodeURIComponent(c)}`;
  async function copy(c: string) {
    try {
      await navigator.clipboard.writeText(linkFor(c));
      copied = c;
      setTimeout(() => copied === c && (copied = null), 1500);
    } catch {}
  }

  const logout = () =>
    run(async () => {
      await api("DELETE", "login");
      status = null;
      view = "login";
    });

  const usd = (n: number) => `$${n.toFixed(2)}`;
  const when = (iso: string) =>
    new Date(iso).toLocaleString(lang === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const btn = "rounded-lg px-4 py-2 transition disabled:opacity-50";
  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-strong outline-none focus:border-accent/60";
</script>

<h1 class="text-4xl tracking-tight text-strong">{T.title[lang]}</h1>

{#if view === "off"}
  <p class="mt-6 opacity-70">ADMIN_PASSWORD is not set.</p>
{:else if view === "login"}
  <form onsubmit={login} class="mt-8 flex max-w-sm flex-col gap-3">
    <label for="pw" class="text-sm opacity-70">{T.password[lang]}</label>
    <input id="pw" type="password" bind:value={password} autocomplete="current-password" class={input} />
    <button type="submit" disabled={busy || !password} class={`${btn} self-start bg-accent text-accent-fg hover:brightness-110`}>{T.login[lang]}</button>
    {#if error}<p class="text-sm text-danger">{T[error][lang]}</p>{/if}
  </form>
{:else if view === "panel" && status}
  <section class="mt-8 rounded-xl border border-line bg-surface p-5">
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="text-xl text-strong">{T.keyTitle[lang]}</h2>
      <button type="button" onclick={() => run(load)} disabled={busy} class="text-sm opacity-60 hover:underline hover:opacity-100">{T.refresh[lang]}</button>
    </div>

    {#if status.active}
      <p class="mt-3 flex items-center gap-2">
        <span class={`h-2.5 w-2.5 rounded-full ${status.info?.valid === false ? "bg-danger" : "bg-green-500"}`}></span>
        <span class="text-strong">{T.active[lang]}:</span>
        <code class="font-mono text-sm text-strong">{status.masked}</code>
      </p>
      <p class="mt-1 text-sm opacity-70">
        {status.source === "admin" ? T.fromAdmin[lang] : T.fromEnv[lang]}{status.savedAt ? `, ${when(status.savedAt)}` : ""}
      </p>
      {#if status.info?.valid === false}
        <p class="mt-3 text-sm text-danger">{T.invalid[lang]}</p>
      {:else if status.info}
        <ul class="mt-3 flex flex-col gap-0.5 text-sm">
          {#if status.info.usage !== undefined}<li>{usd(status.info.usage)} {T.spent[lang]}</li>{/if}
          {#if status.info.limitRemaining != null}<li>{usd(status.info.limitRemaining)} {T.keyLeft[lang]}{status.info.limit != null ? ` (${usd(status.info.limit)})` : ""}</li>{/if}
          {#if status.info.accountRemaining != null}<li>{usd(status.info.accountRemaining)} {T.accountLeft[lang]}</li>{/if}
          {#if status.info.expiresAt}<li>{T.expires[lang]} {when(status.info.expiresAt)}</li>{/if}
        </ul>
      {/if}
    {:else}
      <p class="mt-3 flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full bg-line"></span>
        <span class="text-strong">{T.none[lang]}</span>
      </p>
      <p class="mt-1 text-sm opacity-70">{T.noneHint[lang]}</p>
    {/if}

    <form onsubmit={save} class="mt-6 flex flex-col gap-2">
      <label for="key" class="text-sm opacity-70">{status.active ? T.replace[lang] : T.newKey[lang]}</label>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input id="key" type="password" bind:value={newKey} placeholder="sk-or-v1-…" autocomplete="off" spellcheck="false" class={`${input} font-mono text-sm`} />
        <button type="submit" disabled={busy || !newKey.trim()} class={`${btn} shrink-0 bg-accent text-accent-fg hover:brightness-110`}>{T.save[lang]}</button>
      </div>
    </form>

    {#if status.active && status.source === "admin"}
      <button type="button" onclick={remove} disabled={busy} class={`${btn} mt-4 border border-line hover:border-danger hover:text-danger`}>{T.remove[lang]}</button>
    {/if}
    {#if error}<p class="mt-3 text-sm text-danger">{T[error][lang]}</p>{/if}
  </section>

  {#if codes}
    <section class="mt-6 rounded-xl border border-line bg-surface p-5">
      <h2 class="text-xl text-strong">{T.codesTitle[lang]}</h2>
      {#if codes.codes.length}
        <p class="mt-1 text-sm opacity-70">{codes.source === "env" ? T.codesFromEnv[lang] : T.fromAdmin[lang]}</p>
        <ul class="mt-3 flex flex-col gap-1.5">
          {#each codes.codes as c}
            <li class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <code class="font-mono text-strong">{c}</code>
              <span class="min-w-0 flex-1 truncate font-mono text-xs opacity-60">{linkFor(c)}</span>
              <button type="button" onclick={() => copy(c)} class="text-xs opacity-70 hover:underline hover:opacity-100">{copied === c ? T.copied[lang] : T.copy[lang]}</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-3 flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-line"></span>
          <span class="text-strong">{T.codesNone[lang]}</span>
        </p>
      {/if}

      <form onsubmit={saveCodes} class="mt-5 flex flex-col gap-2">
        <div class="flex flex-col gap-2 sm:flex-row">
          <input bind:value={codesInput} placeholder="zurich26, demo" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label={T.codesTitle[lang]} class={`${input} font-mono text-sm`} />
          <button type="submit" disabled={busy || !codesInput.trim()} class={`${btn} shrink-0 bg-accent text-accent-fg hover:brightness-110`}>{T.codesSave[lang]}</button>
        </div>
        <p class="text-xs opacity-60">{T.codesHint[lang]}</p>
      </form>
      {#if codes.codes.length}
        <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" onclick={() => removeCodes()} disabled={busy} class={`${btn} border border-line hover:border-danger hover:text-danger`}>{T.codesRemove[lang]}</button>
          <span class="text-xs opacity-60">{T.codesRemoveHint[lang]}</span>
        </div>
      {/if}
      {#if codes.source === "admin" && codes.envCodes}
        <button type="button" onclick={() => removeCodes(true)} disabled={busy} class="mt-3 block text-sm opacity-60 hover:underline hover:opacity-100">{T.codesReset[lang]}</button>
      {/if}
      {#if codesError}<p class="mt-3 text-sm text-danger">{T[codesError][lang]}</p>{/if}
    </section>
  {/if}

  <button type="button" onclick={logout} class="mt-6 text-sm opacity-60 hover:underline hover:opacity-100">{T.logout[lang]}</button>
{/if}

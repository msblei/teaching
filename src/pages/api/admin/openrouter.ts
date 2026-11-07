import type { APIRoute } from "astro";
import { adminGuard, deleteStoredSecret, setStoredSecret } from "../../../lib/admin";
import { OPENROUTER_SECRET, keyInfo, maskKey, openrouterKey, type KeyInfo } from "../../../lib/openrouter";

export const prerender = false;

// Status of the OpenRouter key, and setting / removing it. The full key
// never leaves the server.
async function status() {
  const k = await openrouterKey();
  if (!k) return Response.json({ active: false });
  let info: KeyInfo | null = null;
  try {
    info = await keyInfo(k.key);
  } catch {}
  return Response.json({ active: true, masked: maskKey(k.key), source: k.source, savedAt: k.savedAt ?? null, info });
}

export const GET: APIRoute = ({ request }) => adminGuard(request) ?? status();

export const PUT: APIRoute = async ({ request }) => {
  const denied = adminGuard(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { key?: unknown };
  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!/^\S{20,300}$/.test(key)) return Response.json({ error: "invalid_key" }, { status: 400 });
  let info: KeyInfo;
  try {
    info = await keyInfo(key);
  } catch {
    return Response.json({ error: "openrouter_unreachable" }, { status: 502 });
  }
  if (!info.valid) return Response.json({ error: "invalid_key" }, { status: 400 });
  await setStoredSecret(OPENROUTER_SECRET, key);
  return status();
};

export const DELETE: APIRoute = async ({ request }) => {
  const denied = adminGuard(request);
  if (denied) return denied;
  await deleteStoredSecret(OPENROUTER_SECRET);
  return status();
};

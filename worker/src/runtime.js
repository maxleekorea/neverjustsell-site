import app from "./main.js";

const SIGNED_TICKET_PREFIX = "v1";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function base64UrlDecode(value) {
  const normalized = String(value)
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function ticketKey(env) {
  if (!env.CAFE24_CLIENT_SECRET) throw new Error("Cafe24 client secret is missing");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`neverjustsell-community-ticket:${env.CAFE24_CLIENT_SECRET}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

async function verifySignedTicket(env, ticket) {
  const parts = String(ticket || "").split(".");
  if (parts.length !== 3 || parts[0] !== SIGNED_TICKET_PREFIX) return null;

  let signature;
  let payloadBytes;
  try {
    signature = base64UrlDecode(parts[2]);
    payloadBytes = base64UrlDecode(parts[1]);
  } catch {
    return null;
  }

  const valid = await crypto.subtle.verify(
    "HMAC",
    await ticketKey(env),
    signature,
    encoder.encode(parts[1])
  );
  if (!valid) return null;

  let payload;
  try {
    payload = JSON.parse(decoder.decode(payloadBytes));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload?.v !== 1 || !payload?.s || !Number.isFinite(payload?.e)) return null;
  if (payload.e < now || (Number.isFinite(payload.i) && payload.i > now + 30)) return null;

  return {
    member_id: String(payload.s),
    authenticated_at: Number.isFinite(payload.i)
      ? new Date(payload.i * 1000).toISOString()
      : null,
    identifier_received: true
  };
}

async function redeemCommunityTicket(request, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }

  const payload = await request.clone().json().catch(() => ({}));
  const ticket = String(payload.ticket || "").trim();
  if (!ticket) return json({ ok: false, error: "ticket_required" }, { status: 400 });

  const identity = await verifySignedTicket(env, ticket);
  if (!identity) {
    return json({ ok: false, error: "ticket_invalid_or_expired" }, { status: 401 });
  }

  return json({ ok: true, ...identity });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/community-auth/redeem") {
      try {
        return await redeemCommunityTicket(request, env);
      } catch (error) {
        return json(
          {
            ok: false,
            error: "community_ticket_redeem_failed",
            detail: String(error?.message || error)
          },
          { status: 500 }
        );
      }
    }

    return app.fetch(request, env, ctx);
  }
};

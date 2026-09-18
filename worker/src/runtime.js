import app from "./main.js";

const SIGNED_TICKET_PREFIX = "v1";
const SIGNED_TICKET_TTL_SECONDS = 120;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
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
    ["sign", "verify"]
  );
}

async function createSignedTicket(env, identity) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    v: 1,
    sub: String(identity.member_id),
    iat: now,
    exp: now + SIGNED_TICKET_TTL_SECONDS,
    identifier_received: Boolean(identity.identifier_received),
    nonce: crypto.randomUUID()
  };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await ticketKey(env),
    encoder.encode(encodedPayload)
  );
  return `${SIGNED_TICKET_PREFIX}.${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
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
  if (payload?.v !== 1 || !payload?.sub || !Number.isFinite(payload?.exp)) return null;
  if (payload.exp < now || payload.iat > now + 30) return null;

  return {
    member_id: String(payload.sub),
    authenticated_at: Number.isFinite(payload.iat)
      ? new Date(payload.iat * 1000).toISOString()
      : null,
    identifier_received: Boolean(payload.identifier_received)
  };
}

async function redeemOpaqueTicketLocally(ticket, request, env, ctx) {
  const redeemUrl = new URL("/community-auth/redeem", request.url);
  const redeemRequest = new Request(redeemUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket })
  });
  const response = await app.fetch(redeemRequest, env, ctx);
  if (!response.ok) return null;
  const identity = await response.json().catch(() => null);
  return identity?.member_id ? identity : null;
}

async function replaceCommunityRedirectTicket(response, request, env, ctx) {
  if (response.status < 300 || response.status >= 400) return response;
  const location = response.headers.get("Location");
  if (!location) return response;

  let target;
  try {
    target = new URL(location);
  } catch {
    return response;
  }

  const ticket = target.searchParams.get("ticket");
  if (!ticket || ticket.startsWith(`${SIGNED_TICKET_PREFIX}.`)) return response;

  const identity = await redeemOpaqueTicketLocally(ticket, request, env, ctx);
  if (!identity) return response;

  const signedTicket = await createSignedTicket(env, identity);
  target.searchParams.set("ticket", signedTicket);

  const headers = new Headers(response.headers);
  headers.set("Location", target.toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/community-auth/redeem" && request.method === "POST") {
      const payload = await request.clone().json().catch(() => ({}));
      const ticket = String(payload.ticket || "").trim();
      if (ticket.startsWith(`${SIGNED_TICKET_PREFIX}.`)) {
        const identity = await verifySignedTicket(env, ticket);
        if (!identity) {
          return json({ ok: false, error: "ticket_invalid_or_expired" }, { status: 401 });
        }
        return json({ ok: true, ...identity });
      }
    }

    const response = await app.fetch(request, env, ctx);

    if (url.pathname === "/oauth/cafe24/callback") {
      try {
        return await replaceCommunityRedirectTicket(response, request, env, ctx);
      } catch (error) {
        console.error("community ticket bridge failed", error);
        return response;
      }
    }

    return response;
  }
};

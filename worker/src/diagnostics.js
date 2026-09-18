import runtime from "./runtime.js";

const CAFE24_CUSTOMER_DOMAIN = "https://neverjustsell.cafe24.com";
const DEFAULT_COMMUNITY_ORIGIN = "https://community.neverjustsell.com";
const encoder = new TextEncoder();

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function allowedCommunityOrigins(env) {
  const configured = String(env.COMMUNITY_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([DEFAULT_COMMUNITY_ORIGIN, ...configured]);
}

function validCommunityReturn(value, env) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:") return null;
    if (!allowedCommunityOrigins(env).has(url.origin)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

async function ticketKey(env) {
  if (!env.CAFE24_CLIENT_SECRET) throw new Error("Cafe24 client secret is missing");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`neverjustsell-community-ticket:${env.CAFE24_CLIENT_SECRET}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function makeSelfTestTicket(env) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { v: 1, s: "self-test", i: now, e: now + 120 };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await ticketKey(env),
    encoder.encode(encodedPayload)
  );
  return `v1.${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function handleFullLogout(request, env, ctx) {
  const url = new URL(request.url);
  if (url.pathname !== "/session/logout/redirect") return null;

  const returnTo =
    validCommunityReturn(url.searchParams.get("return_to"), env) ||
    `${DEFAULT_COMMUNITY_ORIGIN}/`;

  const localLogoutRequest = new Request(new URL("/session/logout", request.url), {
    method: "GET",
    headers: request.headers
  });
  const localLogoutResponse = await runtime.fetch(localLogoutRequest, env, ctx);

  const cafe24Logout = new URL(`${CAFE24_CUSTOMER_DOMAIN}/exec/front/Member/logout/`);
  cafe24Logout.searchParams.set("returnUrl", returnTo);

  const headers = new Headers({
    Location: cafe24Logout.toString(),
    "Cache-Control": "no-store"
  });
  const authCookie = localLogoutResponse.headers.get("Set-Cookie");
  if (authCookie) headers.append("Set-Cookie", authCookie);

  return new Response(null, { status: 302, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const logoutResponse = await handleFullLogout(request, env, ctx);
    if (logoutResponse) return logoutResponse;

    if (url.pathname === "/community-auth/health") {
      try {
        const ticket = await makeSelfTestTicket(env);
        const redeemRequest = new Request(new URL("/community-auth/redeem", request.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket })
        });
        const redeemResponse = await runtime.fetch(redeemRequest, env, ctx);
        const body = await redeemResponse.clone().json().catch(() => null);
        return json({
          ok: redeemResponse.ok && body?.ok === true && body?.member_id === "self-test",
          runtime: "community-auth-direct-ticket-v2",
          secret_present: Boolean(env.CAFE24_CLIENT_SECRET),
          redeem_status: redeemResponse.status,
          redeem_error: body?.error || null
        }, { status: redeemResponse.ok ? 200 : 503 });
      } catch (error) {
        return json({
          ok: false,
          runtime: "community-auth-direct-ticket-v2",
          secret_present: Boolean(env.CAFE24_CLIENT_SECRET),
          error: String(error?.message || error)
        }, { status: 503 });
      }
    }

    return runtime.fetch(request, env, ctx);
  }
};

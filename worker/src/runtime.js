import app from "./main.js";

const CAFE24_CUSTOMER_DOMAIN = "https://neverjustsell.cafe24.com";
const CAFE24_REDIRECT_URI =
  "https://neverjustsell-course-access.max-lee-korea.workers.dev/oauth/cafe24/callback";
const CUSTOMER_SCOPE = "mall.read_customer_identifier";
const CUSTOMER_STATE_PREFIX = "cafe24:customer-oauth-state:";
const SESSION_PREFIX = "cafe24:customer-session:";
const SESSION_COOKIE = "njs_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_COMMUNITY_ORIGIN = "https://community.neverjustsell.com";
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

function html(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(body, { ...init, headers });
}

function redirectWithCookie(location, cookie) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function basicAuth(clientId, clientSecret) {
  return btoa(`${clientId}:${clientSecret}`);
}

function allowedCommunityOrigins(env) {
  const configured = String(env.COMMUNITY_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([DEFAULT_COMMUNITY_ORIGIN, ...configured]);
}

function validCommunityReturnUrl(value, env) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    if (!allowedCommunityOrigins(env).has(url.origin) && url.hostname !== "localhost") return null;
    if (url.pathname !== "/auth/callback") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function sessionCookie(sessionId) {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
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

async function createSignedTicket(env, memberId) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    v: 1,
    s: String(memberId),
    i: now,
    e: now + SIGNED_TICKET_TTL_SECONDS
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

async function handleCustomerStart(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/oauth/cafe24/customer/start") return null;

  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
    return json({ ok: false, error: "cafe24_not_configured" }, { status: 503 });
  }

  const returnTo = validCommunityReturnUrl(url.searchParams.get("return_to"), env);
  const state = crypto.randomUUID();
  await env.CAFE24_AUTH.put(
    `${CUSTOMER_STATE_PREFIX}${state}`,
    JSON.stringify({ return_to: returnTo }),
    { expirationTtl: 600 }
  );

  const authUrl = new URL(`${CAFE24_CUSTOMER_DOMAIN}/api/v2/oauth/authorize`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", env.CAFE24_CLIENT_ID);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", CAFE24_REDIRECT_URI);
  authUrl.searchParams.set("scope", CUSTOMER_SCOPE);
  authUrl.searchParams.set("shop_no", "1");

  // Route through the storefront member-login page first. After an explicit
  // community logout, this guarantees that the user sees the Cafe24 ID/password
  // form before returning to the OAuth authorization endpoint. The OAuth
  // redirect_uri itself remains unchanged and continues to match Developers.
  const loginUrl = new URL(`${CAFE24_CUSTOMER_DOMAIN}/member/login.html`);
  loginUrl.searchParams.set("returnUrl", `${authUrl.pathname}${authUrl.search}`);

  return Response.redirect(loginUrl.toString(), 302);
}

async function exchangeCustomerCodeForToken(code, env) {
  const response = await fetch(`${CAFE24_CUSTOMER_DOMAIN}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(env.CAFE24_CLIENT_ID, env.CAFE24_CLIENT_SECRET)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: CAFE24_REDIRECT_URI
    }).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 customer token request failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

async function getCustomerIdentifier(customerAccessToken) {
  const response = await fetch(
    `${CAFE24_CUSTOMER_DOMAIN}/api/v2/customers/identifier`,
    {
      headers: {
        Authorization: `Basic ${customerAccessToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 customer identifier failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

async function handleCustomerCallback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !env.CAFE24_AUTH) return null;

  const stateKey = `${CUSTOMER_STATE_PREFIX}${state}`;
  const rawState = await env.CAFE24_AUTH.get(stateKey);
  if (!rawState) return null;
  if (!code) return json({ ok: false, error: "missing_code" }, { status: 400 });

  await env.CAFE24_AUTH.delete(stateKey);

  let stateRecord = {};
  try {
    stateRecord = JSON.parse(rawState);
  } catch {
    stateRecord = {};
  }

  const tokenData = await exchangeCustomerCodeForToken(code, env);
  const identifierData = await getCustomerIdentifier(tokenData.access_token);
  const record = {
    member_id: tokenData.user_id || null,
    identifier: identifierData.identifier || null,
    shop_no: identifierData.identifier?.shop_no || tokenData.shop_no || 1,
    scopes: Array.isArray(tokenData.scopes) ? tokenData.scopes : [],
    authenticated_at: new Date().toISOString()
  };

  if (!record.member_id || !record.identifier?.user_identifier) {
    throw new Error("Cafe24 customer identity is incomplete");
  }

  const sessionId = crypto.randomUUID();
  await env.CAFE24_AUTH.put(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(record),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  const communityReturn = validCommunityReturnUrl(stateRecord.return_to, env);
  if (communityReturn) {
    const ticket = await createSignedTicket(env, record.member_id);
    const target = new URL(communityReturn);
    target.searchParams.set("ticket", ticket);
    return redirectWithCookie(target.toString(), sessionCookie(sessionId));
  }

  return html(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>회원 인증 완료</title></head><body style="font-family:Arial,sans-serif;max-width:720px;margin:60px auto;padding:0 24px;line-height:1.6"><h1>카페24 회원 인증 완료</h1><p>회원별 보안 세션이 생성되었습니다.</p></body></html>`,
    { headers: { "Set-Cookie": sessionCookie(sessionId) } }
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/oauth/cafe24/customer/start") {
      try {
        const customerStartResponse = await handleCustomerStart(request, env);
        if (customerStartResponse) return customerStartResponse;
      } catch (error) {
        return json(
          {
            ok: false,
            error: "customer_auth_start_failed",
            detail: String(error.message || error)
          },
          { status: 502 }
        );
      }
    }

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

    if (url.pathname === "/oauth/cafe24/callback") {
      try {
        const customerResponse = await handleCustomerCallback(request, env);
        if (customerResponse) return customerResponse;
      } catch (error) {
        return json(
          {
            ok: false,
            error: "customer_auth_failed",
            detail: String(error.message || error)
          },
          { status: 502 }
        );
      }
    }

    return app.fetch(request, env, ctx);
  }
};

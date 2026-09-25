import app from "./index.js";
import {
  CLASSROOM_ORIGIN,
  COMMERCE_ORIGIN as CAFE24_CUSTOMER_DOMAIN,
  CAFE24_ADMIN_ORIGIN as CAFE24_ADMIN_DOMAIN,
  CAFE24_CUSTOMER_SCOPE as CUSTOMER_SCOPE,
  CAFE24_ADMIN_SCOPES as ADMIN_SCOPES,
  cafe24RedirectUri,
  allowedCommunityOrigins,
  validCustomerReturn,
  validCommunityReturn
} from "./config.js";
import { bootstrapCafe24Catalog } from "./system-operations.js";

const REQUIRED_ADMIN_SCOPES = [...ADMIN_SCOPES];
const CUSTOMER_STATE_PREFIX = "cafe24:customer-oauth-state:";
const ADMIN_STATE_PREFIX = "cafe24:admin-oauth-state:";
const SESSION_PREFIX = "cafe24:customer-session:";
const ADMIN_TOKEN_KEY = "cafe24:admin-token";
const SESSION_COOKIE = "njs_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SIGNED_TICKET_PREFIX = "v1";
const SIGNED_TICKET_TTL_SECONDS = 120;
const encoder = new TextEncoder();

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

function basicAuth(clientId, clientSecret) {
  return btoa(`${clientId}:${clientSecret}`);
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function sessionCookie(sessionId) {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function redirectWithCookies(location, cookies = []) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  for (const cookie of cookies.filter(Boolean)) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

async function exchangeCode(code, env, admin = false) {
  const domain = admin ? CAFE24_ADMIN_DOMAIN : CAFE24_CUSTOMER_DOMAIN;
  const response = await fetch(`${domain}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(env.CAFE24_CLIENT_ID, env.CAFE24_CLIENT_SECRET)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: cafe24RedirectUri(env)
    }).toString()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Cafe24 token request failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function getCustomerIdentifier(accessToken) {
  const response = await fetch(`${CAFE24_CUSTOMER_DOMAIN}/api/v2/customers/identifier`, {
    headers: {
      Authorization: `Basic ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Cafe24 customer identifier failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function createCustomerSession(token, identifier, env) {
  const memberId = token.user_id || null;
  if (!memberId || !identifier.identifier?.user_identifier) {
    throw new Error("Cafe24 customer identity is incomplete");
  }

  const sessionId = crypto.randomUUID();
  const record = {
    member_id: memberId,
    identifier: identifier.identifier,
    shop_no: identifier.identifier?.shop_no || token.shop_no || 1,
    scopes: Array.isArray(token.scopes) ? token.scopes : [],
    authenticated_at: new Date().toISOString()
  };
  await env.CAFE24_AUTH.put(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(record), {
    expirationTtl: SESSION_TTL_SECONDS
  });
  return { sessionId, record };
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
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`neverjustsell-community-ticket:${env.CAFE24_CLIENT_SECRET}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function createCommunityTicket(env, memberId) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { v: 1, s: String(memberId), i: now, e: now + SIGNED_TICKET_TTL_SECONDS };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await ticketKey(env),
    encoder.encode(encodedPayload)
  );
  return `${SIGNED_TICKET_PREFIX}.${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function startAuthorization(request, env, mode) {
  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
    return json({ ok: false, error: "cafe24_not_configured" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const state = crypto.randomUUID();
  let authUrl;

  if (mode === "admin") {
    await env.CAFE24_AUTH.put(`${ADMIN_STATE_PREFIX}${state}`, "1", { expirationTtl: 600 });
    authUrl = new URL(`${CAFE24_ADMIN_DOMAIN}/api/v2/oauth/authorize`);
    authUrl.searchParams.set("scope", ADMIN_SCOPES.join(","));
  } else {
    const rawReturnTo = requestUrl.searchParams.get("return_to");
    const communityReturn = validCommunityReturn(rawReturnTo, env);
    const customerReturn = validCustomerReturn(rawReturnTo);
    const returnTo = communityReturn || customerReturn;
    if (rawReturnTo && !returnTo) {
      return json({ ok: false, error: "invalid_customer_return_to" }, { status: 400 });
    }
    await env.CAFE24_AUTH.put(
      `${CUSTOMER_STATE_PREFIX}${state}`,
      JSON.stringify({ return_to: returnTo }),
      { expirationTtl: 600 }
    );
    authUrl = new URL(`${CAFE24_CUSTOMER_DOMAIN}/api/v2/oauth/authorize`);
    authUrl.searchParams.set("scope", CUSTOMER_SCOPE);
    authUrl.searchParams.set("shop_no", "1");
  }

  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", env.CAFE24_CLIENT_ID);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", cafe24RedirectUri(env));
  return Response.redirect(authUrl.toString(), 302);
}

async function finishAuthorization(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const oauthErrorDescription =
    url.searchParams.get("error_description") ||
    url.searchParams.get("error_message") ||
    url.searchParams.get("message");

  if (oauthError) {
    return json(
      {
        ok: false,
        error: "cafe24_authorization_denied",
        oauth_error: oauthError,
        detail: oauthErrorDescription || null,
        state_received: Boolean(state)
      },
      { status: 400 }
    );
  }

  if (!state || !code || !env.CAFE24_AUTH) return null;

  const [customerRaw, adminRaw] = await Promise.all([
    env.CAFE24_AUTH.get(`${CUSTOMER_STATE_PREFIX}${state}`),
    env.CAFE24_AUTH.get(`${ADMIN_STATE_PREFIX}${state}`)
  ]);

  if (!customerRaw && !adminRaw) return null;

  await Promise.all([
    customerRaw ? env.CAFE24_AUTH.delete(`${CUSTOMER_STATE_PREFIX}${state}`) : Promise.resolve(),
    adminRaw ? env.CAFE24_AUTH.delete(`${ADMIN_STATE_PREFIX}${state}`) : Promise.resolve()
  ]);

  if (adminRaw) {
    const token = await exchangeCode(code, env, true);
    await env.CAFE24_AUTH.put(ADMIN_TOKEN_KEY, JSON.stringify(token));

    let catalog = null;
    let catalogError = null;
    try {
      catalog = await bootstrapCafe24Catalog(env);
    } catch (error) {
      catalogError = String(error?.message || error);
    }

    const categories = catalog?.categories || {};
    const categoryRows = ["강의", "전자책", "프로그램", "일반상품"]
      .map((name) => `<li><strong>${name}</strong> · category_no=${categories[name] ?? "확인 필요"}</li>`)
      .join("");

    return html(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Cafe24 연결 완료</title></head>
<body style="font-family:Arial,'Noto Sans KR',sans-serif;max-width:720px;margin:60px auto;padding:0 24px;line-height:1.7">
<h1>Cafe24 연결 완료</h1>
<p>Admin API 권한 갱신이 완료되었습니다.</p>
${catalog?.ok ? `<h2>상품 분류 자동 구성 완료</h2><ul>${categoryRows}</ul><p>테스트 상품 #13은 <strong>강의</strong> 분류에 배치했습니다.</p>` : `<h2>상품 분류 구성 확인 필요</h2><p>${catalogError || "상품 분류 자동 구성을 완료하지 못했습니다."}</p>`}
<p><a href="/oauth/cafe24/status">연결 상태 확인</a></p>
</body></html>`);
  }

  const token = await exchangeCode(code, env, false);
  const identifier = await getCustomerIdentifier(token.access_token);
  const { sessionId, record } = await createCustomerSession(token, identifier, env);
  const cookies = [sessionCookie(sessionId)];

  let stateRecord = {};
  try {
    stateRecord = JSON.parse(customerRaw || "{}");
  } catch {
    stateRecord = {};
  }
  const communityReturn = validCommunityReturn(stateRecord.return_to, env);
  if (communityReturn) {
    const target = new URL(communityReturn);
    target.searchParams.set("ticket", await createCommunityTicket(env, record.member_id));
    return redirectWithCookies(target.toString(), cookies);
  }

  const customerReturn = validCustomerReturn(stateRecord.return_to);
  if (customerReturn) {
    return redirectWithCookies(customerReturn, cookies);
  }

  return redirectWithCookies(`${CLASSROOM_ORIGIN}/classroom`, cookies);
}

async function hardenedAdminStatus(request, env, ctx) {
  const response = await app.fetch(request, env, ctx);
  const body = await response.clone().json().catch(() => null);
  if (!body?.connected) return response;

  const scopes = Array.isArray(body.scopes) ? body.scopes : [];
  const missing = REQUIRED_ADMIN_SCOPES.filter((scope) => !scopes.includes(scope));
  if (missing.length === 0) return response;

  return json({
    ok: false,
    connected: false,
    error: "admin_scope_invalid",
    current_scopes: scopes,
    missing_scopes: missing,
    reauthorize_url: "/oauth/cafe24/start"
  }, { status: 409 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/oauth/cafe24/start") {
      return startAuthorization(request, env, "admin");
    }

    if (url.pathname === "/oauth/cafe24/customer/start") {
      return startAuthorization(request, env, "customer");
    }

    if (url.pathname === "/oauth/cafe24/callback") {
      try {
        const response = await finishAuthorization(request, env);
        if (response) return response;
        return json({ ok: false, error: "invalid_or_expired_state" }, { status: 401 });
      } catch (error) {
        return json({
          ok: false,
          error: "cafe24_oauth_failed",
          detail: String(error?.message || error)
        }, { status: 502 });
      }
    }

    if (url.pathname === "/oauth/cafe24/status") {
      return hardenedAdminStatus(request, env, ctx);
    }

    return app.fetch(request, env, ctx);
  }
};

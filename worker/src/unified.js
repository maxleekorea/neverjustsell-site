import app from "./diagnostics.js";

const CAFE24_CUSTOMER_DOMAIN = "https://neverjustsell.cafe24.com";
const CAFE24_REDIRECT_URI =
  "https://neverjustsell-course-access.max-lee-korea.workers.dev/oauth/cafe24/callback";
const CUSTOMER_SCOPE = "mall.read_customer_identifier";
const SITE_STATE_PREFIX = "cafe24:site-oauth-state:";
const SESSION_PREFIX = "cafe24:customer-session:";
const SESSION_COOKIE = "njs_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const REQUIRED_ADMIN_SCOPES = ["mall.read_product", "mall.read_order"];

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function basicAuth(clientId, clientSecret) {
  return btoa(`${clientId}:${clientSecret}`);
}

function sessionCookie(sessionId) {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function validSiteReturn(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    const allowed = new Set([
      "https://neverjustsell-site.max-lee-korea.workers.dev",
      "https://www.neverjustsell.com",
      "https://neverjustsell.com"
    ]);
    if (url.protocol !== "https:" || !allowed.has(url.origin)) return null;
    return `${url.origin}/`;
  } catch {
    return null;
  }
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
    throw new Error(`Cafe24 customer token request failed (${response.status}): ${JSON.stringify(payload)}`);
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

async function startSiteLogin(request, env) {
  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
    return json({ ok: false, error: "cafe24_not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const returnTo = validSiteReturn(url.searchParams.get("return_to"));
  if (!returnTo) return json({ ok: false, error: "invalid_return_to" }, { status: 400 });

  const state = crypto.randomUUID();
  await env.CAFE24_AUTH.put(
    `${SITE_STATE_PREFIX}${state}`,
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
  return Response.redirect(authUrl.toString(), 302);
}

async function finishSiteLogin(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !env.CAFE24_AUTH) return null;

  const key = `${SITE_STATE_PREFIX}${state}`;
  const raw = await env.CAFE24_AUTH.get(key);
  if (!raw) return null;
  await env.CAFE24_AUTH.delete(key);
  if (!code) return json({ ok: false, error: "missing_code" }, { status: 400 });

  const stateRecord = JSON.parse(raw);
  const returnTo = validSiteReturn(stateRecord.return_to);
  if (!returnTo) return json({ ok: false, error: "invalid_return_to" }, { status: 400 });

  const token = await exchangeCustomerCodeForToken(code, env);
  const identifier = await getCustomerIdentifier(token.access_token);
  const memberId = token.user_id || null;
  if (!memberId || !identifier.identifier?.user_identifier) {
    throw new Error("Cafe24 customer identity is incomplete");
  }

  const sessionId = crypto.randomUUID();
  await env.CAFE24_AUTH.put(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify({
      member_id: memberId,
      identifier: identifier.identifier,
      shop_no: identifier.identifier?.shop_no || token.shop_no || 1,
      scopes: Array.isArray(token.scopes) ? token.scopes : [],
      authenticated_at: new Date().toISOString()
    }),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  const headers = new Headers({ Location: returnTo, "Cache-Control": "no-store" });
  headers.set("Set-Cookie", sessionCookie(sessionId));
  return new Response(null, { status: 302, headers });
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

    if (url.pathname === "/site-login") {
      return startSiteLogin(request, env);
    }

    if (url.pathname === "/oauth/cafe24/callback") {
      try {
        const response = await finishSiteLogin(request, env);
        if (response) return response;
      } catch (error) {
        return json({
          ok: false,
          error: "site_login_failed",
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

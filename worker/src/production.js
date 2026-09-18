import app from "./unified.js";

const CAFE24_CUSTOMER_DOMAIN = "https://neverjustsell.cafe24.com";
const CAFE24_ADMIN_DOMAIN = "https://neverjustsell.cafe24api.com";
const DEFAULT_REDIRECT_URI =
  "https://classroom.neverjustsell.com/oauth/cafe24/callback";
const CUSTOMER_SCOPE = "mall.read_customer_identifier";
const ADMIN_SCOPES = ["mall.read_product", "mall.read_order"];
const CUSTOMER_STATE_PREFIX = "cafe24:customer-oauth-state:";
const ADMIN_STATE_PREFIX = "cafe24:admin-oauth-state:";
const ADMIN_TOKEN_KEY = "cafe24:admin-token";
const DEFAULT_COMMUNITY_ORIGIN = "https://community.neverjustsell.com";

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

function redirectUri(env) {
  try {
    const value = new URL(String(env.CAFE24_REDIRECT_URI || DEFAULT_REDIRECT_URI));
    if (value.protocol !== "https:") return DEFAULT_REDIRECT_URI;
    return value.toString();
  } catch {
    return DEFAULT_REDIRECT_URI;
  }
}

function configured(env) {
  return Boolean(env.CAFE24_CLIENT_ID && env.CAFE24_CLIENT_SECRET && env.CAFE24_AUTH);
}

function allowedCommunityOrigins(env) {
  const configuredOrigins = String(env.COMMUNITY_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([DEFAULT_COMMUNITY_ORIGIN, ...configuredOrigins]);
}

function validCommunityReturn(value, env) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:") return null;
    if (!allowedCommunityOrigins(env).has(url.origin)) return null;
    if (url.pathname !== "/auth/callback") return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function startCommunityLogin(request, env) {
  if (!configured(env)) {
    return json({ ok: false, error: "cafe24_not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const returnTo = validCommunityReturn(url.searchParams.get("return_to"), env);
  if (!returnTo) {
    return json({ ok: false, error: "invalid_community_return_to" }, { status: 400 });
  }

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
  authUrl.searchParams.set("redirect_uri", redirectUri(env));
  authUrl.searchParams.set("scope", CUSTOMER_SCOPE);
  authUrl.searchParams.set("shop_no", "1");
  return Response.redirect(authUrl.toString(), 302);
}

async function startAdminLogin(env) {
  if (!configured(env)) {
    return json({ ok: false, error: "cafe24_not_configured" }, { status: 503 });
  }

  const state = crypto.randomUUID();
  await env.CAFE24_AUTH.put(`${ADMIN_STATE_PREFIX}${state}`, "1", {
    expirationTtl: 600
  });

  const authUrl = new URL(`${CAFE24_ADMIN_DOMAIN}/api/v2/oauth/authorize`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", env.CAFE24_CLIENT_ID);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri(env));
  authUrl.searchParams.set("scope", ADMIN_SCOPES.join(" "));
  return Response.redirect(authUrl.toString(), 302);
}

async function finishAdminLogin(request, env) {
  if (!configured(env)) return null;
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code) return null;

  const stateKey = `${ADMIN_STATE_PREFIX}${state}`;
  const exists = await env.CAFE24_AUTH.get(stateKey);
  if (!exists) return null;
  await env.CAFE24_AUTH.delete(stateKey);

  const response = await fetch(`${CAFE24_ADMIN_DOMAIN}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(env.CAFE24_CLIENT_ID, env.CAFE24_CLIENT_SECRET)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(env)
    }).toString()
  });

  const token = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({
      ok: false,
      error: "admin_token_exchange_failed",
      detail: token
    }, { status: 502 });
  }

  await env.CAFE24_AUTH.put(ADMIN_TOKEN_KEY, JSON.stringify(token));
  return html(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Cafe24 연결 완료</title></head><body style="font-family:Arial,sans-serif;max-width:720px;margin:60px auto;padding:0 24px;line-height:1.6"><h1>Cafe24 연결 완료</h1><p>Admin API 인증이 새 classroom 도메인으로 연결되었습니다.</p><p>이 창을 닫아도 됩니다.</p></body></html>`);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/oauth/cafe24/customer/start") {
      return startCommunityLogin(request, env);
    }

    if (url.pathname === "/oauth/cafe24/start") {
      return startAdminLogin(env);
    }

    if (url.pathname === "/oauth/cafe24/callback") {
      const adminResponse = await finishAdminLogin(request, env);
      if (adminResponse) return adminResponse;
    }

    if (url.pathname === "/migration-health") {
      return json({
        ok: true,
        host: url.hostname,
        redirect_uri: redirectUri(env),
        site_origin: env.SITE_ORIGIN || null,
        community_origins: [...allowedCommunityOrigins(env)],
        admin_scopes: ADMIN_SCOPES
      });
    }

    return app.fetch(request, env, ctx);
  }
};

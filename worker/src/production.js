import app from "./unified.js";

const CAFE24_CUSTOMER_DOMAIN = "https://neverjustsell.cafe24.com";
const DEFAULT_REDIRECT_URI =
  "https://classroom.neverjustsell.com/oauth/cafe24/callback";
const CUSTOMER_SCOPE = "mall.read_customer_identifier";
const CUSTOMER_STATE_PREFIX = "cafe24:customer-oauth-state:";
const DEFAULT_COMMUNITY_ORIGIN = "https://community.neverjustsell.com";

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
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
    if (url.pathname !== "/auth/callback") return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function startCommunityLogin(request, env) {
  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/oauth/cafe24/customer/start") {
      return startCommunityLogin(request, env);
    }

    if (url.pathname === "/migration-health") {
      return json({
        ok: true,
        host: url.hostname,
        redirect_uri: redirectUri(env),
        site_origin: env.SITE_ORIGIN || null,
        community_origins: [...allowedCommunityOrigins(env)]
      });
    }

    return app.fetch(request, env, ctx);
  }
};

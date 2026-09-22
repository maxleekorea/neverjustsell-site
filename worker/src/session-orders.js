import baseApp from "./index.js";
import {
  CAFE24_ADMIN_ORIGIN,
  CAFE24_CUSTOMER_SCOPE as CUSTOMER_SCOPE,
  SITE_ORIGIN,
  APEX_ORIGIN
} from "./config.js";

const CUSTOMER_TEST_KEY = "cafe24:customer-test";
const SESSION_PREFIX = "cafe24:customer-session:";
const SESSION_COOKIE = "njs_session";
const ADMIN_TOKEN_KEY = "cafe24:admin-token";
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const ACCESS_TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000;

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function configReady(env) {
  return Boolean(env.CAFE24_CLIENT_ID && env.CAFE24_CLIENT_SECRET && env.CAFE24_AUTH);
}

function siteCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  if (origin !== SITE_ORIGIN && origin !== APEX_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function basicAuth(clientId, clientSecret) {
  return btoa(`${clientId}:${clientSecret}`);
}

function dateDaysAgo(daysAgo = 0) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function parseCafe24Timestamp(value) {
  if (!value) return NaN;
  const text = String(value).trim();
  if (!text) return NaN;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) return Date.parse(text);
  return Date.parse(`${text}+09:00`);
}

function shouldRefreshAdminToken(token) {
  const expiresAt = parseCafe24Timestamp(token?.expires_at);
  if (Number.isFinite(expiresAt)) {
    return Date.now() >= expiresAt - TOKEN_REFRESH_MARGIN_MS;
  }

  const issuedAt = parseCafe24Timestamp(token?.issued_at);
  if (Number.isFinite(issuedAt)) {
    return Date.now() >= issuedAt + ACCESS_TOKEN_LIFETIME_MS - TOKEN_REFRESH_MARGIN_MS;
  }

  return false;
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export async function getCustomerSession(request, env) {
  if (!env.CAFE24_AUTH) return null;
  const sessionId = parseCookies(request)[SESSION_COOKIE];
  if (!sessionId) return null;
  const raw = await env.CAFE24_AUTH.get(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;

  try {
    return { sessionId, record: JSON.parse(raw) };
  } catch {
    return null;
  }
}

async function deleteCustomerSession(request, env) {
  const sessionId = parseCookies(request)[SESSION_COOKIE];
  if (sessionId && env.CAFE24_AUTH) {
    await env.CAFE24_AUTH.delete(`${SESSION_PREFIX}${sessionId}`);
  }
}

async function refreshAdminToken(refreshToken, env) {
  const response = await fetch(`${CAFE24_ADMIN_ORIGIN}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(env.CAFE24_CLIENT_ID, env.CAFE24_CLIENT_SECRET)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 admin token refresh failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

async function saveRefreshedAdminToken(refreshToken, env) {
  if (!refreshToken) throw new Error("Cafe24 refresh token is missing");
  const token = await refreshAdminToken(refreshToken, env);
  await env.CAFE24_AUTH.put(ADMIN_TOKEN_KEY, JSON.stringify(token));
  return token;
}

async function getAdminToken(env) {
  const raw = await env.CAFE24_AUTH.get(ADMIN_TOKEN_KEY);
  if (!raw) throw new Error("Cafe24 Admin access token is not connected");

  let token = JSON.parse(raw);
  if (shouldRefreshAdminToken(token)) {
    token = await saveRefreshedAdminToken(token.refresh_token, env);
  }
  return token;
}

async function fetchAdminGet(apiUrl, accessToken) {
  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

export async function cafe24AdminGet(path, env, params = {}) {
  let token = await getAdminToken(env);
  const apiUrl = new URL(`${CAFE24_ADMIN_ORIGIN}/api/v2/admin${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      apiUrl.searchParams.set(key, String(value));
    }
  }

  let result = await fetchAdminGet(apiUrl, token.access_token);

  if (result.response.status === 401) {
    const latestRaw = await env.CAFE24_AUTH.get(ADMIN_TOKEN_KEY);
    const latest = latestRaw ? JSON.parse(latestRaw) : token;

    if (latest?.access_token && latest.access_token !== token.access_token) {
      token = latest;
    } else {
      token = await saveRefreshedAdminToken(latest?.refresh_token || token.refresh_token, env);
    }

    result = await fetchAdminGet(apiUrl, token.access_token);
  }

  if (!result.response.ok) {
    throw new Error(
      `Cafe24 Admin API failed (${result.response.status}): ${JSON.stringify(result.payload)}`
    );
  }

  return result.payload;
}

export async function getOrderSummaryForMember(memberId, env) {
  const startDate = dateDaysAgo(89);
  const endDate = dateDaysAgo(0);
  const payload = await cafe24AdminGet("/orders", env, {
    shop_no: 1,
    start_date: startDate,
    end_date: endDate,
    date_type: "order_date",
    member_id: memberId,
    embed: "items",
    limit: 100
  });

  const orders = Array.isArray(payload.orders) ? payload.orders : [];
  const paymentStatuses = [...new Set(orders.map((o) => o.payment_status).filter(Boolean))];
  const paidFlags = [...new Set(orders.map((o) => o.paid).filter(Boolean))];
  const canceledFlags = [...new Set(orders.map((o) => o.canceled).filter(Boolean))];
  const productNos = [
    ...new Set(
      orders.flatMap((order) =>
        Array.isArray(order.items)
          ? order.items.map((item) => item.product_no).filter(Boolean)
          : []
      )
    )
  ];
  const itemStatuses = [
    ...new Set(
      orders.flatMap((order) =>
        Array.isArray(order.items)
          ? order.items.map((item) => item.order_status).filter(Boolean)
          : []
      )
    )
  ];

  return {
    startDate,
    endDate,
    orders,
    paymentStatuses,
    paidFlags,
    canceledFlags,
    productNos,
    itemStatuses
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/session/status" && request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: siteCorsHeaders(request)
      });
    }

    if (url.pathname === "/session/status") {
      const corsHeaders = siteCorsHeaders(request);
      const session = await getCustomerSession(request, env);
      if (!session) {
        return json(
          { ok: true, authenticated: false },
          { headers: corsHeaders }
        );
      }

      return json({
        ok: true,
        authenticated: true,
        member_id_received: Boolean(session.record.member_id),
        identifier_received: Boolean(session.record.identifier?.user_identifier),
        shop_no: session.record.shop_no || null,
        scope_ok: Array.isArray(session.record.scopes)
          ? session.record.scopes.includes(CUSTOMER_SCOPE)
          : false,
        authenticated_at: session.record.authenticated_at || null,
        session_mode: "per_browser"
      }, { headers: corsHeaders });
    }

    if (url.pathname === "/session/logout") {
      await deleteCustomerSession(request, env);
      return json(
        { ok: true, authenticated: false },
        { headers: { "Set-Cookie": expiredSessionCookie() } }
      );
    }

    if (
      url.pathname === "/cafe24/member-orders" ||
      url.pathname === "/cafe24/member-orders-test"
    ) {
      if (!configReady(env)) {
        return json({ ok: false, error: "cafe24_not_configured" }, { status: 503 });
      }

      try {
        let memberId = null;
        let sessionMode = "per_browser";
        const session = await getCustomerSession(request, env);

        if (session?.record?.member_id) {
          memberId = session.record.member_id;
        } else if (url.pathname.endsWith("-test")) {
          const raw = await env.CAFE24_AUTH.get(CUSTOMER_TEST_KEY);
          if (raw) {
            const legacy = JSON.parse(raw);
            memberId = legacy.token?.user_id || null;
            sessionMode = "legacy_test";
          }
        }

        if (!memberId) {
          return json({ ok: false, error: "customer_session_missing" }, { status: 401 });
        }

        const summary = await getOrderSummaryForMember(memberId, env);
        return json({
          ok: true,
          member_authenticated: true,
          member_id_used: true,
          session_mode: sessionMode,
          order_check_range: {
            start_date: summary.startDate,
            end_date: summary.endDate
          },
          order_count: summary.orders.length,
          payment_statuses: summary.paymentStatuses,
          paid_flags: summary.paidFlags,
          canceled_flags: summary.canceledFlags,
          product_nos: summary.productNos,
          item_statuses: summary.itemStatuses
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error: "member_order_lookup_failed",
            detail: String(error?.message || error)
          },
          { status: 502 }
        );
      }
    }

    return baseApp.fetch(request, env, ctx);
  }
};

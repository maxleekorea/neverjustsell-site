import app from "./entry.js";

const CAFE24_ADMIN_DOMAIN = "https://neverjustsell.cafe24api.com";
const SESSION_PREFIX = "cafe24:customer-session:";
const SESSION_COOKIE = "njs_session";
const ADMIN_TOKEN_KEY = "cafe24:admin-token";
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const VALID_PAYMENT_STATUSES = new Set(["T", "A", "P"]);
const REVOKED_STATUS_PREFIXES = new Set(["C", "R", "E"]);

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function basicAuth(clientId, clientSecret) {
  return btoa(`${clientId}:${clientSecret}`);
}

function dateDaysAgo(daysAgo = 0) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
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

async function getCustomerSession(request, env) {
  if (!env.CAFE24_AUTH) return null;
  const sessionId = parseCookies(request)[SESSION_COOKIE];
  if (!sessionId) return null;
  const raw = await env.CAFE24_AUTH.get(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function refreshAdminToken(refreshToken, env) {
  const response = await fetch(`${CAFE24_ADMIN_DOMAIN}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(
        env.CAFE24_CLIENT_ID,
        env.CAFE24_CLIENT_SECRET
      )}`,
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

async function getAdminToken(env) {
  if (!env.CAFE24_AUTH) throw new Error("Cafe24 KV binding is missing");
  const raw = await env.CAFE24_AUTH.get(ADMIN_TOKEN_KEY);
  if (!raw) throw new Error("Cafe24 Admin access token is not connected");

  let token = JSON.parse(raw);
  const expiresAt = Date.parse(token.expires_at || "");
  if (
    Number.isFinite(expiresAt) &&
    Date.now() >= expiresAt - TOKEN_REFRESH_MARGIN_MS
  ) {
    if (!token.refresh_token) throw new Error("Cafe24 refresh token is missing");
    token = await refreshAdminToken(token.refresh_token, env);
    await env.CAFE24_AUTH.put(ADMIN_TOKEN_KEY, JSON.stringify(token));
  }
  return token;
}

async function cafe24AdminGet(path, env, params = {}) {
  const token = await getAdminToken(env);
  const apiUrl = new URL(`${CAFE24_ADMIN_DOMAIN}/api/v2/admin${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      apiUrl.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json"
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 Admin API failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

function isPaymentConfirmed(order, item) {
  if (item?.paid === "T" || item?.payment_status === "T") return true;
  if (order?.paid === "T" || order?.payment_confirmation === "T") return true;
  return VALID_PAYMENT_STATUSES.has(order?.payment_status || "");
}

function isItemRevoked(order, item) {
  if (order?.canceled === "T") return true;
  if (order?.refund_status === "T") return true;

  const status = String(item?.order_status || order?.order_status || "");
  if (!status) return false;
  return REVOKED_STATUS_PREFIXES.has(status.slice(0, 1));
}

function hasValidCourseItem(order, productNo) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.some((item) => {
    if (Number(item?.product_no) !== productNo) return false;
    if (!isPaymentConfirmed(order, item)) return false;
    if (isItemRevoked(order, item)) return false;

    const status = String(item?.order_status || order?.order_status || "");
    return !status || status.startsWith("N");
  });
}

async function checkCourseAccess(request, env, url) {
  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
    return json(
      { ok: false, access: false, error: "cafe24_not_configured" },
      { status: 503 }
    );
  }

  const productNo = Number(url.searchParams.get("product_no"));
  if (!Number.isInteger(productNo) || productNo <= 0) {
    return json(
      {
        ok: false,
        access: false,
        error: "invalid_product_no",
        example: "/course-access?product_no=123"
      },
      { status: 400 }
    );
  }

  const session = await getCustomerSession(request, env);
  if (!session?.member_id) {
    return json(
      {
        ok: true,
        authenticated: false,
        access: false,
        reason: "login_required",
        auth_url: "/oauth/cafe24/customer/start"
      },
      { status: 401 }
    );
  }

  const startDate = dateDaysAgo(89);
  const endDate = dateDaysAgo(0);
  const payload = await cafe24AdminGet("/orders", env, {
    shop_no: 1,
    start_date: startDate,
    end_date: endDate,
    date_type: "order_date",
    member_id: session.member_id,
    product_no: productNo,
    embed: "items",
    limit: 100
  });

  const orders = Array.isArray(payload.orders) ? payload.orders : [];
  const access = orders.some((order) => hasValidCourseItem(order, productNo));

  return json({
    ok: true,
    authenticated: true,
    access,
    reason: access ? "paid_purchase_verified" : "no_valid_paid_purchase",
    product_no: productNo,
    matching_order_count: orders.length,
    check_range: {
      start_date: startDate,
      end_date: endDate
    },
    verified_at: new Date().toISOString()
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/course-access") {
      try {
        return await checkCourseAccess(request, env, url);
      } catch (error) {
        return json(
          {
            ok: false,
            access: false,
            error: "course_access_check_failed",
            detail: String(error?.message || error)
          },
          { status: 502 }
        );
      }
    }

    return app.fetch(request, env, ctx);
  }
};

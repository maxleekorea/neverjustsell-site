import app from "./index.js";

const CAFE24_CUSTOMER_DOMAIN = "https://neverjustsell.cafe24.com";
const CAFE24_ADMIN_DOMAIN = "https://neverjustsell.cafe24api.com";
const CAFE24_REDIRECT_URI =
  "https://neverjustsell-course-access.max-lee-korea.workers.dev/oauth/cafe24/callback";
const CUSTOMER_SCOPE = "mall.read_customer_identifier";
const CUSTOMER_STATE_PREFIX = "cafe24:customer-oauth-state:";
const CUSTOMER_TEST_KEY = "cafe24:customer-test";
const SESSION_PREFIX = "cafe24:customer-session:";
const SESSION_COOKIE = "njs_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ADMIN_TOKEN_KEY = "cafe24:admin-token";
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function html(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(body, { ...init, headers });
}

function basicAuth(clientId, clientSecret) {
  return btoa(`${clientId}:${clientSecret}`);
}

function configReady(env) {
  return Boolean(
    env.CAFE24_CLIENT_ID &&
      env.CAFE24_CLIENT_SECRET &&
      env.CAFE24_AUTH
  );
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

function sessionCookie(sessionId) {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

async function createCustomerSession(env, record) {
  const sessionId = crypto.randomUUID();
  await env.CAFE24_AUTH.put(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(record),
    { expirationTtl: SESSION_TTL_SECONDS }
  );
  return sessionId;
}

async function getCustomerSession(request, env) {
  if (!env.CAFE24_AUTH) return null;
  const sessionId = parseCookies(request)[SESSION_COOKIE];
  if (!sessionId) return null;
  const raw = await env.CAFE24_AUTH.get(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    return { sessionId, record };
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

async function exchangeCustomerCodeForToken(code, env) {
  const response = await fetch(`${CAFE24_CUSTOMER_DOMAIN}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(
        env.CAFE24_CLIENT_ID,
        env.CAFE24_CLIENT_SECRET
      )}`,
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

async function getOrderSummaryForMember(memberId, env) {
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
  const paymentStatuses = [
    ...new Set(orders.map((o) => o.payment_status).filter(Boolean))
  ];
  const paidFlags = [...new Set(orders.map((o) => o.paid).filter(Boolean))];
  const canceledFlags = [
    ...new Set(orders.map((o) => o.canceled).filter(Boolean))
  ];
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

    if (url.pathname === "/oauth/cafe24/customer/start") {
      if (!configReady(env)) {
        return json(
          { ok: false, error: "cafe24_not_configured" },
          { status: 503 }
        );
      }

      const state = crypto.randomUUID();
      await env.CAFE24_AUTH.put(`${CUSTOMER_STATE_PREFIX}${state}`, "1", {
        expirationTtl: 600
      });

      const authUrl = new URL(
        `${CAFE24_CUSTOMER_DOMAIN}/api/v2/oauth/authorize`
      );
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", env.CAFE24_CLIENT_ID);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("redirect_uri", CAFE24_REDIRECT_URI);
      authUrl.searchParams.set("scope", CUSTOMER_SCOPE);
      authUrl.searchParams.set("shop_no", "1");

      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === "/oauth/cafe24/callback") {
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");

      if (state && env.CAFE24_AUTH) {
        const customerStateKey = `${CUSTOMER_STATE_PREFIX}${state}`;
        const customerState = await env.CAFE24_AUTH.get(customerStateKey);

        if (customerState) {
          if (!code) {
            return json(
              { ok: false, error: "missing_code" },
              { status: 400 }
            );
          }

          await env.CAFE24_AUTH.delete(customerStateKey);

          try {
            const tokenData = await exchangeCustomerCodeForToken(code, env);
            const identifierData = await getCustomerIdentifier(tokenData.access_token);
            const record = {
              member_id: tokenData.user_id || null,
              identifier: identifierData.identifier || null,
              shop_no:
                identifierData.identifier?.shop_no || tokenData.shop_no || 1,
              scopes: Array.isArray(tokenData.scopes) ? tokenData.scopes : [],
              authenticated_at: new Date().toISOString()
            };

            if (!record.member_id || !record.identifier?.user_identifier) {
              throw new Error("Cafe24 customer identity is incomplete");
            }

            const sessionId = await createCustomerSession(env, record);

            // Legacy test record kept briefly only so old diagnostic URLs do not break.
            await env.CAFE24_AUTH.put(
              CUSTOMER_TEST_KEY,
              JSON.stringify({
                token: tokenData,
                identifier: identifierData.identifier || null,
                authenticated_at: record.authenticated_at
              }),
              { expirationTtl: 1800 }
            );

            return html(
              `<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>회원 인증 완료</title></head>
<body style="font-family:Arial,sans-serif;max-width:720px;margin:60px auto;padding:0 24px;line-height:1.6">
<h1>카페24 회원 인증 완료</h1>
<p>회원별 보안 세션이 생성되었습니다.</p>
<p>회원 아이디와 토큰 값은 이 화면에 표시하지 않습니다.</p>
<p><a href="/session/status">세션 상태 확인</a></p>
</body></html>`,
              { headers: { "Set-Cookie": sessionCookie(sessionId) } }
            );
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
      }
    }

    if (url.pathname === "/session/status") {
      const session = await getCustomerSession(request, env);
      if (!session) {
        return json({ ok: true, authenticated: false });
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
      });
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
        return json(
          { ok: false, error: "cafe24_not_configured" },
          { status: 503 }
        );
      }

      try {
        let memberId = null;
        let sessionMode = "per_browser";
        const session = await getCustomerSession(request, env);
        if (session?.record?.member_id) {
          memberId = session.record.member_id;
        } else if (url.pathname.endsWith("-test")) {
          // Temporary fallback for the old diagnostic endpoint only.
          const raw = await env.CAFE24_AUTH.get(CUSTOMER_TEST_KEY);
          if (raw) {
            const legacy = JSON.parse(raw);
            memberId = legacy.token?.user_id || null;
            sessionMode = "legacy_test";
          }
        }

        if (!memberId) {
          return json(
            { ok: false, error: "customer_session_missing" },
            { status: 401 }
          );
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
            detail: String(error.message || error)
          },
          { status: 502 }
        );
      }
    }

    return app.fetch(request, env, ctx);
  }
};

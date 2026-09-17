const ALLOWED_ORIGINS = new Set([
  "https://neverjustsell.com",
  "https://www.neverjustsell.com"
]);

const CAFE24_MALL_ID = "neverjustsell";
const CAFE24_PRIMARY_DOMAIN = "https://www.neverjustsell.com";
const CAFE24_REDIRECT_URI =
  "https://neverjustsell-course-access.max-lee-korea.workers.dev/oauth/cafe24/callback";
const CAFE24_SCOPES = ["mall.read_product", "mall.read_order"];
const CUSTOMER_SCOPE = "mall.read_customer_identifier";
const TOKEN_KEY = "cafe24:admin-token";
const ADMIN_STATE_PREFIX = "cafe24:admin-oauth-state:";
const CUSTOMER_STATE_PREFIX = "cafe24:customer-oauth-state:";
const CUSTOMER_TEST_KEY = "cafe24:customer-test";
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const ACCESS_TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000;

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Vary": "Origin"
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(data, init = {}, origin = "") {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value);
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

function html(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(body, { ...init, headers });
}

function configReady(env) {
  return Boolean(
    env.CAFE24_CLIENT_ID &&
      env.CAFE24_CLIENT_SECRET &&
      env.CAFE24_AUTH
  );
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

async function tokenRequest(params, env) {
  const response = await fetch(
    `https://${CAFE24_MALL_ID}.cafe24api.com/api/v2/oauth/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(
          env.CAFE24_CLIENT_ID,
          env.CAFE24_CLIENT_SECRET
        )}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(params).toString()
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 token request failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

async function customerTokenRequest(params, env) {
  const response = await fetch(`${CAFE24_PRIMARY_DOMAIN}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(
        env.CAFE24_CLIENT_ID,
        env.CAFE24_CLIENT_SECRET
      )}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(params).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 customer token request failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

async function exchangeCodeForToken(code, env) {
  return tokenRequest(
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: CAFE24_REDIRECT_URI
    },
    env
  );
}

async function exchangeCustomerCodeForToken(code, env) {
  return customerTokenRequest(
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: CAFE24_REDIRECT_URI
    },
    env
  );
}

async function refreshAdminToken(refreshToken, env) {
  return tokenRequest(
    {
      grant_type: "refresh_token",
      refresh_token: refreshToken
    },
    env
  );
}

function shouldRefreshToken(token) {
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

async function saveRefreshedAdminToken(refreshToken, env) {
  if (!refreshToken) throw new Error("Cafe24 refresh token is missing");
  const token = await refreshAdminToken(refreshToken, env);
  await env.CAFE24_AUTH.put(TOKEN_KEY, JSON.stringify(token));
  return token;
}

async function getAdminToken(env) {
  if (!env.CAFE24_AUTH) return null;

  const raw = await env.CAFE24_AUTH.get(TOKEN_KEY);
  if (!raw) return null;

  let token = JSON.parse(raw);
  if (shouldRefreshToken(token)) {
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

async function cafe24AdminGet(path, env, params = {}) {
  let token = await getAdminToken(env);
  if (!token?.access_token) {
    throw new Error("Cafe24 Admin access token is not connected");
  }

  const apiUrl = new URL(
    `https://${CAFE24_MALL_ID}.cafe24api.com/api/v2/admin${path}`
  );
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      apiUrl.searchParams.set(key, String(value));
    }
  }

  let result = await fetchAdminGet(apiUrl, token.access_token);

  if (result.response.status === 401) {
    const latestRaw = await env.CAFE24_AUTH.get(TOKEN_KEY);
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

async function getCustomerIdentifier(customerAccessToken) {
  const response = await fetch(
    `${CAFE24_PRIMARY_DOMAIN}/api/v2/customers/identifier`,
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

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/health") {
      return json(
        {
          ok: true,
          service: "neverjustsell-course-access",
          cafe24_configured: configReady(env)
        },
        {},
        origin
      );
    }

    if (url.pathname === "/oauth/cafe24/start") {
      if (!configReady(env)) {
        return json(
          {
            ok: false,
            error: "cafe24_not_configured",
            required: ["CAFE24_CLIENT_ID", "CAFE24_CLIENT_SECRET", "CAFE24_AUTH"]
          },
          { status: 503 },
          origin
        );
      }

      const state = crypto.randomUUID();
      await env.CAFE24_AUTH.put(`${ADMIN_STATE_PREFIX}${state}`, "1", {
        expirationTtl: 600
      });

      const authUrl = new URL(
        `https://${CAFE24_MALL_ID}.cafe24api.com/api/v2/oauth/authorize`
      );
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", env.CAFE24_CLIENT_ID);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("redirect_uri", CAFE24_REDIRECT_URI);
      authUrl.searchParams.set("scope", CAFE24_SCOPES.join(" "));

      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === "/oauth/cafe24/customer/start") {
      if (!configReady(env)) {
        return json(
          { ok: false, error: "cafe24_not_configured" },
          { status: 503 },
          origin
        );
      }

      const state = crypto.randomUUID();
      await env.CAFE24_AUTH.put(`${CUSTOMER_STATE_PREFIX}${state}`, "1", {
        expirationTtl: 600
      });

      const authUrl = new URL(`${CAFE24_PRIMARY_DOMAIN}/api/v2/oauth/authorize`);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", env.CAFE24_CLIENT_ID);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("redirect_uri", CAFE24_REDIRECT_URI);
      authUrl.searchParams.set("scope", CUSTOMER_SCOPE);
      authUrl.searchParams.set("shop_no", "1");

      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === "/oauth/cafe24/callback") {
      if (!configReady(env)) {
        return json(
          { ok: false, error: "cafe24_not_configured" },
          { status: 503 },
          origin
        );
      }

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        return json(
          { ok: false, error: "missing_code_or_state" },
          { status: 400 },
          origin
        );
      }

      const customerStateKey = `${CUSTOMER_STATE_PREFIX}${state}`;
      const adminStateKey = `${ADMIN_STATE_PREFIX}${state}`;
      const [customerState, adminState] = await Promise.all([
        env.CAFE24_AUTH.get(customerStateKey),
        env.CAFE24_AUTH.get(adminStateKey)
      ]);

      if (customerState) {
        await env.CAFE24_AUTH.delete(customerStateKey);
        try {
          const tokenData = await exchangeCustomerCodeForToken(code, env);
          const identifierData = await getCustomerIdentifier(tokenData.access_token);

          await env.CAFE24_AUTH.put(
            CUSTOMER_TEST_KEY,
            JSON.stringify({
              token: tokenData,
              identifier: identifierData.identifier || null,
              authenticated_at: new Date().toISOString()
            }),
            { expirationTtl: 1800 }
          );

          return html(`<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>회원 인증 완료</title></head>
<body style="font-family:Arial,sans-serif;max-width:720px;margin:60px auto;padding:0 24px;line-height:1.6">
<h1>카페24 회원 인증 완료</h1>
<p>로그인 회원을 안전하게 식별하는 테스트가 완료되었습니다.</p>
<p>회원 아이디와 토큰 값은 이 화면에 표시하지 않습니다.</p>
<p>이 창을 닫고 ChatGPT로 돌아가면 됩니다.</p>
</body></html>`);
        } catch (error) {
          return json(
            {
              ok: false,
              error: "customer_auth_failed",
              detail: String(error.message || error)
            },
            { status: 502 },
            origin
          );
        }
      }

      if (!adminState) {
        return json(
          { ok: false, error: "invalid_or_expired_state" },
          { status: 401 },
          origin
        );
      }
      await env.CAFE24_AUTH.delete(adminStateKey);

      try {
        const tokenData = await exchangeCodeForToken(code, env);
        await env.CAFE24_AUTH.put(TOKEN_KEY, JSON.stringify(tokenData));

        return html(`<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cafe24 연결 완료</title></head>
<body style="font-family:Arial,sans-serif;max-width:720px;margin:60px auto;padding:0 24px;line-height:1.6">
<h1>Cafe24 연결 완료</h1>
<p>Never Just Sell 백엔드가 Cafe24 Admin API 인증을 완료했습니다.</p>
<p>이 창을 닫고 ChatGPT로 돌아가면 됩니다.</p>
</body></html>`);
      } catch (error) {
        return json(
          { ok: false, error: "token_exchange_failed", detail: String(error.message || error) },
          { status: 502 },
          origin
        );
      }
    }

    if (url.pathname === "/oauth/cafe24/status") {
      if (!env.CAFE24_AUTH) {
        return json(
          { ok: false, connected: false, error: "storage_not_configured" },
          { status: 503 },
          origin
        );
      }

      try {
        const token = await getAdminToken(env);
        if (!token) {
          return json({ ok: true, connected: false }, {}, origin);
        }

        return json(
          {
            ok: true,
            connected: true,
            mall_id: token.mall_id || CAFE24_MALL_ID,
            shop_no: token.shop_no || 1,
            scopes: token.scopes || [],
            expires_at: token.expires_at || null,
            refresh_token_expires_at: token.refresh_token_expires_at || null,
            automatic_refresh: true
          },
          {},
          origin
        );
      } catch (error) {
        return json(
          {
            ok: false,
            connected: false,
            error: "token_refresh_failed",
            detail: String(error.message || error)
          },
          { status: 502 },
          origin
        );
      }
    }

    if (url.pathname === "/oauth/cafe24/customer/status") {
      const raw = env.CAFE24_AUTH
        ? await env.CAFE24_AUTH.get(CUSTOMER_TEST_KEY)
        : null;
      if (!raw) {
        return json({ ok: true, customer_authenticated: false }, {}, origin);
      }

      const record = JSON.parse(raw);
      return json(
        {
          ok: true,
          customer_authenticated: true,
          member_id_received: Boolean(record.token?.user_id),
          identifier_received: Boolean(record.identifier?.user_identifier),
          shop_no: record.identifier?.shop_no || record.token?.shop_no || null,
          scope_ok: Array.isArray(record.token?.scopes)
            ? record.token.scopes.includes(CUSTOMER_SCOPE)
            : false,
          authenticated_at: record.authenticated_at || null
        },
        {},
        origin
      );
    }

    if (url.pathname === "/cafe24/api-check") {
      try {
        const startDate = dateDaysAgo(30);
        const endDate = dateDaysAgo(0);

        const [products, orders] = await Promise.all([
          cafe24AdminGet("/products", env, {
            shop_no: 1,
            limit: 1,
            fields: "product_no,product_name"
          }),
          cafe24AdminGet("/orders/count", env, {
            shop_no: 1,
            start_date: startDate,
            end_date: endDate,
            date_type: "order_date"
          })
        ]);

        const firstProduct = Array.isArray(products.products)
          ? products.products[0] || null
          : null;

        return json(
          {
            ok: true,
            admin_api: "connected",
            product_read: true,
            order_read: true,
            order_check_range: {
              start_date: startDate,
              end_date: endDate
            },
            first_product: firstProduct
              ? {
                  product_no: firstProduct.product_no,
                  product_name: firstProduct.product_name
                }
              : null,
            order_count: Number.isFinite(Number(orders.count))
              ? Number(orders.count)
              : orders.count ?? null
          },
          {},
          origin
        );
      } catch (error) {
        return json(
          {
            ok: false,
            admin_api: "failed",
            detail: String(error.message || error)
          },
          { status: 502 },
          origin
        );
      }
    }

    if (url.pathname === "/") {
      return json(
        {
          ok: true,
          message: "Never Just Sell course access backend is running."
        },
        {},
        origin
      );
    }

    return json(
      { ok: false, error: "not_found" },
      { status: 404 },
      origin
    );
  }
};
const ALLOWED_ORIGINS = new Set([
  "https://neverjustsell.com",
  "https://www.neverjustsell.com"
]);

const CAFE24_MALL_ID = "neverjustsell";
const CAFE24_REDIRECT_URI =
  "https://neverjustsell-course-access.max-lee-korea.workers.dev/oauth/cafe24/callback";
const CAFE24_SCOPES = ["mall.read_product", "mall.read_order"];
const TOKEN_KEY = "cafe24:admin-token";
const STATE_PREFIX = "cafe24:oauth-state:";

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

async function exchangeCodeForToken(code, env) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: CAFE24_REDIRECT_URI
  });

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
      body: body.toString()
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 token exchange failed (${response.status}): ${JSON.stringify(payload)}`
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
      await env.CAFE24_AUTH.put(`${STATE_PREFIX}${state}`, "1", {
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

      const stateKey = `${STATE_PREFIX}${state}`;
      const validState = await env.CAFE24_AUTH.get(stateKey);
      if (!validState) {
        return json(
          { ok: false, error: "invalid_or_expired_state" },
          { status: 401 },
          origin
        );
      }
      await env.CAFE24_AUTH.delete(stateKey);

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

      const raw = await env.CAFE24_AUTH.get(TOKEN_KEY);
      if (!raw) {
        return json({ ok: true, connected: false }, {}, origin);
      }

      const token = JSON.parse(raw);
      return json(
        {
          ok: true,
          connected: true,
          mall_id: token.mall_id || CAFE24_MALL_ID,
          shop_no: token.shop_no || 1,
          scopes: token.scopes || [],
          expires_at: token.expires_at || null,
          refresh_token_expires_at: token.refresh_token_expires_at || null
        },
        {},
        origin
      );
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

const ALLOWED_ORIGINS = new Set([
  "https://neverjustsell.com",
  "https://www.neverjustsell.com"
]);

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

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/health") {
      return json(
        { ok: true, service: "neverjustsell-course-access" },
        {},
        origin
      );
    }

    if (url.pathname === "/oauth/cafe24/callback") {
      const hasCode = Boolean(url.searchParams.get("code"));
      const hasState = Boolean(url.searchParams.get("state"));

      // The endpoint exists now so it can be registered in Cafe24 Developers.
      // Token exchange and secure storage will be enabled after the app
      // credentials and Worker storage binding are configured.
      return json(
        {
          ok: true,
          service: "neverjustsell-course-access",
          callback: "cafe24",
          ready: true,
          authorization_response_received: hasCode && hasState,
          next: "configure_cafe24_app_credentials_and_token_storage"
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

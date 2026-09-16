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

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/health") {
      return Response.json(
        { ok: true, service: "neverjustsell-course-access" },
        { headers: corsHeaders(origin) }
      );
    }

    if (url.pathname === "/") {
      return Response.json(
        {
          ok: true,
          message: "Never Just Sell course access backend is running."
        },
        { headers: corsHeaders(origin) }
      );
    }

    return Response.json(
      { ok: false, error: "not_found" },
      { status: 404, headers: corsHeaders(origin) }
    );
  }
};

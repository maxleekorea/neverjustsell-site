import app from "./router.js";

function redirectWithCookie(location, cookie) {
  const headers = new Headers({
    Location: location,
    "Cache-Control": "no-store"
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/oauth/cafe24/callback") {
      const response = await app.fetch(request, env, ctx);
      const setCookie = response.headers.get("Set-Cookie") || "";

      if (response.ok && setCookie.includes("njs_session=")) {
        return redirectWithCookie(new URL("/classroom", url.origin).toString(), setCookie);
      }

      return response;
    }

    return app.fetch(request, env, ctx);
  }
};

import app from "./router.js";

const CAFE24_LOGOUT_URL = "https://www.neverjustsell.com/exec/front/Member/logout/";

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

    if (url.pathname === "/session/logout-sync") {
      const logoutRequest = new Request(new URL("/session/logout", url.origin), {
        method: "GET",
        headers: request.headers
      });
      const response = await app.fetch(logoutRequest, env, ctx);
      const setCookie = response.headers.get("Set-Cookie") || "";
      return redirectWithCookie(CAFE24_LOGOUT_URL, setCookie);
    }

    return app.fetch(request, env, ctx);
  }
};

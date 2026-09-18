import app from "./router.js";

const CAFE24_LOGOUT_URL = "https://www.neverjustsell.com/exec/front/Member/logout/";
const CLASSROOM_SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function redirectWithCookie(location, cookie) {
  const headers = new Headers({
    Location: location,
    "Cache-Control": "no-store"
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

async function expireStaleClassroomSession(request, env, ctx, url) {
  if (url.pathname !== "/classroom" && url.pathname !== "/course-access") return null;

  const statusRequest = new Request(new URL("/session/status", url.origin), {
    method: "GET",
    headers: request.headers
  });
  const statusResponse = await app.fetch(statusRequest, env, ctx);
  const status = await statusResponse.json().catch(() => null);

  if (!status?.authenticated || !status.authenticated_at) return null;

  const authenticatedAt = Date.parse(status.authenticated_at);
  if (!Number.isFinite(authenticatedAt)) return null;
  if (Date.now() - authenticatedAt < CLASSROOM_SESSION_MAX_AGE_MS) return null;

  const logoutRequest = new Request(new URL("/session/logout", url.origin), {
    method: "GET",
    headers: request.headers
  });
  const logoutResponse = await app.fetch(logoutRequest, env, ctx);
  const setCookie = logoutResponse.headers.get("Set-Cookie") || "";
  return redirectWithCookie(url.toString(), setCookie);
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

    const staleSessionRedirect = await expireStaleClassroomSession(request, env, ctx, url);
    if (staleSessionRedirect) return staleSessionRedirect;

    return app.fetch(request, env, ctx);
  }
};

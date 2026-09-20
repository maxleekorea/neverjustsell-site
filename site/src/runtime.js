import app from "./index.js";

const DEFAULT_AUTH_ORIGIN = "https://classroom.neverjustsell.com";
const SITE_LOGIN_COOKIE = "njs_site_authenticated";
const SITE_LOGIN_TTL_SECONDS = 60 * 60 * 24 * 30;
const CANONICAL_SITE_ORIGIN = "https://www.neverjustsell.com";

function cleanOrigin(value, fallback) {
  try {
    return new URL(String(value || fallback)).origin;
  } catch {
    return fallback;
  }
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    cookies[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return cookies;
}

function siteLoginCookie() {
  return `${SITE_LOGIN_COOKIE}=1; Path=/; Max-Age=${SITE_LOGIN_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function expiredSiteLoginCookie() {
  return `${SITE_LOGIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

async function decorateLoginState(response, authenticated) {
  const contentType = response.headers.get("Content-Type") || "";
  if (!authenticated || !contentType.includes("text/html")) return response;

  const body = await response.text();
  const decorated = body.replace('<a href="/login">로그인</a>', '<a href="/logout">로그아웃</a>');
  return new Response(decorated, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const authOrigin = cleanOrigin(env.AUTH_ORIGIN, DEFAULT_AUTH_ORIGIN);

    // Production uses www as the single canonical public origin. The preview
    // workers.dev hostname is intentionally left untouched during migration.
    if (url.hostname === "neverjustsell.com") {
      const target = new URL(`${url.pathname}${url.search}`, CANONICAL_SITE_ORIGIN);
      return Response.redirect(target.toString(), 308);
    }

    if (url.pathname === "/login") {
      const target = new URL("/site-login", authOrigin);
      target.searchParams.set("return_to", `${url.origin}/auth/complete`);
      return Response.redirect(target.toString(), 302);
    }

    if (url.pathname === "/auth/complete") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Cache-Control": "no-store",
          "Set-Cookie": siteLoginCookie()
        }
      });
    }

    if (url.pathname === "/logout") {
      const target = new URL("/session/logout-sync", authOrigin);
      const headers = new Headers({
        Location: target.toString(),
        "Cache-Control": "no-store"
      });
      headers.set("Set-Cookie", expiredSiteLoginCookie());
      return new Response(null, { status: 302, headers });
    }

    const response = await app.fetch(request, env, ctx);
    const authenticated = parseCookies(request)[SITE_LOGIN_COOKIE] === "1";
    return decorateLoginState(response, authenticated);
  }
};

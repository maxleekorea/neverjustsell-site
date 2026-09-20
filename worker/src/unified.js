import app from "./diagnostics.js";
import {
  CLASSROOM_ORIGIN,
  COMMERCE_ORIGIN as CAFE24_CUSTOMER_DOMAIN,
  CAFE24_ADMIN_ORIGIN as CAFE24_ADMIN_DOMAIN,
  CAFE24_CUSTOMER_SCOPE as CUSTOMER_SCOPE,
  CAFE24_ADMIN_SCOPES as ADMIN_SCOPES,
  cafe24RedirectUri,
  allowedCommunityOrigins,
  validCommunityReturn
} from "./config.js";

const REQUIRED_ADMIN_SCOPES = [...ADMIN_SCOPES];
const CUSTOMER_STATE_PREFIX = "cafe24:customer-oauth-state:";
const ADMIN_STATE_PREFIX = "cafe24:admin-oauth-state:";
const SESSION_PREFIX = "cafe24:customer-session:";
const ADMIN_TOKEN_KEY = "cafe24:admin-token";
const SESSION_COOKIE = "njs_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SIGNED_TICKET_PREFIX = "v1";
const SIGNED_TICKET_TTL_SECONDS = 120;
const encoder = new TextEncoder();

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function html(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(body, { ...init, headers });
}

function basicAuth(clientId, clientSecret) {
  return btoa(`${clientId}:${clientSecret}`);
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

function redirectWithCookies(location, cookies = []) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  for (const cookie of cookies.filter(Boolean)) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}



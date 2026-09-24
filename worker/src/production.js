import authApp from "./unified.js";
import diagnosticsApp from "./diagnostics.js";
import ticketApp from "./runtime.js";
import classroomApp from "./main.js";
import sessionOrdersApp from "./session-orders.js";
import baseApp from "./index.js";
import vimeoApp from "./vimeo.js";
import courseAdminApp from "./course-admin.js";
import { promoteScheduledPresales } from "./course-store.js";
import {
  CLASSROOM_ORIGIN,
  LEGACY_CLASSROOM_HOST,
  CAFE24_ADMIN_SCOPES,
  cafe24RedirectUri,
  allowedCommunityOrigins
} from "./config.js";

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(JSON.stringify(data), { ...init, headers });
}

const AUTH_ROUTES = new Set([
  "/oauth/cafe24/start",
  "/oauth/cafe24/customer/start",
  "/oauth/cafe24/callback",
  "/oauth/cafe24/status"
]);

const DIAGNOSTIC_ROUTES = new Set([
  "/session/logout/redirect",
  "/session/logout-sync",
  "/community-auth/health"
]);

const TICKET_ROUTES = new Set([
  "/community-auth/redeem"
]);

const CLASSROOM_ROUTES = new Set([
  "/robots.txt",
  "/system-check",
  "/classroom",
  "/classroom/progress",
  "/library",
  "/course-access"
]);

const SESSION_ORDER_ROUTES = new Set([
  "/session/status",
  "/session/logout",
  "/cafe24/member-orders",
  "/cafe24/member-orders-test"
]);

const VIMEO_ROUTES = new Set([
  "/vimeo/status",
  "/vimeo/course-candidates",
  "/vimeo/videos"
]);

const BASE_ROUTES = new Set([
  "/",
  "/health",
  "/oauth/cafe24/customer/status",
  "/cafe24/api-check"
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Old workers.dev bookmarks are compatibility-only. Production users
    // always land on the canonical classroom custom domain.
    if (url.hostname === LEGACY_CLASSROOM_HOST) {
      const target = new URL(`${url.pathname}${url.search}`, CLASSROOM_ORIGIN);
      return Response.redirect(target.toString(), 302);
    }

    // One public route owner per capability. Lower modules may still contain
    // legacy fallback code during migration, but production dispatch never
    // sends the same route through multiple wrappers.
    if (AUTH_ROUTES.has(url.pathname)) {
      return authApp.fetch(request, env, ctx);
    }

    if (DIAGNOSTIC_ROUTES.has(url.pathname)) {
      return diagnosticsApp.fetch(request, env, ctx);
    }

    if (TICKET_ROUTES.has(url.pathname)) {
      return ticketApp.fetch(request, env, ctx);
    }

    if (
      CLASSROOM_ROUTES.has(url.pathname) ||
      url.pathname === "/courses" ||
      url.pathname.startsWith("/courses/")
    ) {
      return classroomApp.fetch(request, env, ctx);
    }

    if (SESSION_ORDER_ROUTES.has(url.pathname)) {
      return sessionOrdersApp.fetch(request, env, ctx);
    }

    if (VIMEO_ROUTES.has(url.pathname)) {
      return vimeoApp.fetch(request, env, ctx);
    }

    if (url.pathname === "/course-admin" || url.pathname.startsWith("/course-admin/")) {
      return courseAdminApp.fetch(request, env, ctx);
    }

    if (url.pathname === "/migration-health") {
      return json({
        ok: true,
        host: url.hostname,
        redirect_uri: cafe24RedirectUri(env),
        site_origin: env.SITE_ORIGIN || null,
        community_origins: [...allowedCommunityOrigins(env)],
        admin_scopes: CAFE24_ADMIN_SCOPES,
        route_owner: "production-dispatch-v2"
      });
    }

    if (BASE_ROUTES.has(url.pathname)) {
      return baseApp.fetch(request, env, ctx);
    }

    return json({ ok: false, error: "not_found" }, { status: 404 });
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(promoteScheduledPresales(env));
  }
};

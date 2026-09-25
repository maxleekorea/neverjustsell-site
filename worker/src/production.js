import { WorkerEntrypoint } from "cloudflare:workers";
import authApp from "./unified.js";
import diagnosticsApp from "./diagnostics.js";
import ticketApp from "./runtime.js";
import classroomApp from "./main.js";
import sessionOrdersApp from "./session-orders.js";
import baseApp from "./index.js";
import vimeoApp from "./vimeo.js";
import courseAdminApp from "./course-admin.js";
import programHostApp from "./program-host.js";
import { ensureProgramSchema } from "./program-schema.js";
import { getProgramCommunityProjection } from "./program-access.js";
import { runPendingSystemOperations, getPaymentE2EProductStatus, getPaymentE2EFlowStatus, getCafe24CatalogStatus, getAllCurrentProductsShippingStatus, getDigitalProductPropertyVisibilityStatus, getDigitalProductDetailUxStatus } from "./system-operations.js";

const PRODUCTION_BUILD = "2026-09-25-auto-order-v2";
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
  "/my-space",
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

const productionWorker = {
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

    if (url.pathname === "/program-host" || url.pathname.startsWith("/program-host/")) {
      return programHostApp.fetch(request, env, ctx);
    }

    if (url.pathname === "/system-check/digital-product-ux-status" && request.method === "GET") {
      try {
        const status = await getDigitalProductDetailUxStatus(env);
        return json(status, { status: status.ok ? 200 : 503 });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error) }, { status: 503 });
      }
    }

    if (url.pathname === "/system-check/product-detail-properties-status" && request.method === "GET") {
      try {
        const status = await getDigitalProductPropertyVisibilityStatus(env);
        return json(status, { status: status.ok ? 200 : 503 });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error) }, { status: 503 });
      }
    }

    if (url.pathname === "/system-check/shipping-status" && request.method === "GET") {
      try {
        const shipping = await getAllCurrentProductsShippingStatus(env);
        return json(shipping, { status: shipping.ok ? 200 : 503 });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error) }, { status: 503 });
      }
    }

    if (url.pathname === "/system-check/catalog-status" && request.method === "GET") {
      try {
        const catalog = await getCafe24CatalogStatus(env);
        return json(catalog, { status: catalog.ok ? 200 : 503 });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error) }, { status: 503 });
      }
    }

    if (url.pathname === "/system-check/payment-e2e/flow-status" && request.method === "GET") {
      try {
        const flow = await getPaymentE2EFlowStatus(env);
        return json(flow, { status: flow.ok ? 200 : 503 });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error) }, { status: 503 });
      }
    }

    if (url.pathname === "/system-check/payment-e2e/status" && request.method === "GET") {
      try {
        const product = await getPaymentE2EProductStatus(env);
        return json(product, { status: product.ok ? 200 : 503 });
      } catch (error) {
        return json({
          ok: false,
          product_no: 13,
          error: String(error?.message || error)
        }, { status: 503 });
      }
    }

    if (url.pathname === "/migration-health") {
      try {
        const programSchema = env.COURSE_DB
          ? await ensureProgramSchema(env)
          : { ok: false, skipped: true, reason: "COURSE_DB binding missing" };
        const systemOperations = env.COURSE_DB
          ? await runPendingSystemOperations(env)
          : { ok: false, skipped: true, reason: "COURSE_DB binding missing", results: [] };
        return json({
          ok: true,
          host: url.hostname,
          redirect_uri: cafe24RedirectUri(env),
          site_origin: env.SITE_ORIGIN || null,
          community_origins: [...allowedCommunityOrigins(env)],
          admin_scopes: CAFE24_ADMIN_SCOPES,
          route_owner: "production-dispatch-v3",
          production_build: PRODUCTION_BUILD,
          program_schema: programSchema,
          system_operations: systemOperations
        });
      } catch (error) {
        return json({
          ok: false,
          host: url.hostname,
          route_owner: "production-dispatch-v3",
          program_schema_error: String(error?.message || error)
        }, { status: 503 });
      }
    }

    if (BASE_ROUTES.has(url.pathname)) {
      return baseApp.fetch(request, env, ctx);
    }

    return json({ ok: false, error: "not_found" }, { status: 404 });
  }
};


export class CommunityAuthRpc extends WorkerEntrypoint {
  async fetch(request) {
    return productionWorker.fetch(request, this.env, this.ctx);
  }

  async communityAccessHealth() {
    return {
      ok: true,
      runtime: "community-auth-rpc-v1",
      production_build: PRODUCTION_BUILD
    };
  }

  async getCommunityIdentity(memberId) {
    const normalized = String(memberId || "").trim();
    if (!normalized || normalized.length > 128) {
      throw new Error("invalid_member_id");
    }

    const projection = await getProgramCommunityProjection(
      this.env,
      normalized,
      { syncPurchases: true }
    );
    return {
      ok: true,
      member_id: normalized,
      ...projection
    };
  }

  async getPaymentE2ECommunityIdentity() {
    if (!this.env.COURSE_DB) {
      return { ok: false, error: "course_db_binding_missing" };
    }

    await ensureProgramSchema(this.env);
    const initial = await this.env.COURSE_DB.prepare(
      "SELECT member_id FROM program_enrollments " +
      "WHERE run_id='system-check-payment-program-run' AND source='purchase' " +
      "ORDER BY updated_at DESC LIMIT 1"
    ).first();

    const memberId = String(initial?.member_id || "").trim();
    if (!memberId) {
      return { ok: false, error: "payment_e2e_member_not_found" };
    }

    const projection = await getProgramCommunityProjection(
      this.env,
      memberId,
      { syncPurchases: true }
    );
    const current = await this.env.COURSE_DB.prepare(
      "SELECT status,source_order_id,updated_at FROM program_enrollments " +
      "WHERE run_id='system-check-payment-program-run' AND member_id=? LIMIT 1"
    ).bind(memberId).first();

    return {
      ok: true,
      member_id: memberId,
      enrollment_status: current?.status || null,
      source_order_present: Boolean(current?.source_order_id),
      ...projection
    };
  }
}

export default productionWorker;

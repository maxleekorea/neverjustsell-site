// Dedicated Cloudflare Worker entry for the NEVER JUST SELL community.
import { onRequest } from "../functions/[[path]].js";
import { ensureCommunityProgramSchema } from "./program-schema.js";
import { syncMemberProgramSpaces, revokeProjectedProgramSpaces } from "./program-access.js";

const SESSION_COOKIE = "njs_community_session";
const SESSION_TTL_SECONDS = 2 * 60 * 60;
const PROGRAM_ACCESS_REFRESH_SECONDS = 60;

function validReturnPath(value) {
  const path = String(value || "/");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function sqliteTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const result = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

function sessionCookie(id) {
  return `${SESSION_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function redirect(location, cookie, status = 303) {
  const headers = new Headers({
    Location: location,
    "Cache-Control": "no-store"
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}

async function refreshAuthenticatedProgramAccess(request, env, { force = false } = {}) {
  if (!env.DB || !env.AUTH_BRIDGE) {
    return { authenticated: false, refreshed: false, skipped: true };
  }

  const sessionId = parseCookies(request)[SESSION_COOKIE];
  if (!sessionId) {
    return { authenticated: false, refreshed: false, skipped: true };
  }

  await ensureCommunityProgramSchema(env);
  const row = await env.DB.prepare(
    "SELECT session_id,member_id,access_checked_at," +
    "CASE WHEN access_checked_at IS NULL OR access_checked_at <= datetime('now','-" +
    PROGRAM_ACCESS_REFRESH_SECONDS +
    " seconds') THEN 1 ELSE 0 END AS refresh_due " +
    "FROM sessions WHERE session_id=? AND expires_at > CURRENT_TIMESTAMP LIMIT 1"
  ).bind(sessionId).first();

  if (!row?.member_id) {
    return { authenticated: false, refreshed: false, skipped: true };
  }
  if (!force && Number(row.refresh_due || 0) !== 1) {
    return { authenticated: true, refreshed: false, skipped: true };
  }

  try {
    const identity = await env.AUTH_BRIDGE.getCommunityIdentity(String(row.member_id));
    if (!identity?.ok || String(identity?.member_id || "") !== String(row.member_id)) {
      throw new Error("authoritative_identity_mismatch");
    }

    const projection = await syncMemberProgramSpaces(
      env,
      String(row.member_id),
      identity
    );
    await env.DB.prepare(
      "UPDATE sessions SET access_checked_at=CURRENT_TIMESTAMP WHERE session_id=?"
    ).bind(sessionId).run();

    return {
      authenticated: true,
      refreshed: true,
      projection
    };
  } catch (error) {
    const revoked = await revokeProjectedProgramSpaces(env, String(row.member_id));
    return {
      authenticated: true,
      refreshed: false,
      fail_closed: true,
      revoked_count: Number(revoked?.revoked_count || 0),
      error: String(error?.message || error)
    };
  }
}

async function handlePaymentE2ESpaceStatus(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/auth/payment-e2e-space-status") return null;

  if (!env.DB || !env.AUTH_BRIDGE) {
    return json({ ok: false, error: "community_binding_missing" }, 503);
  }

  await ensureCommunityProgramSchema(env);
  try {
    const identity = await env.AUTH_BRIDGE.getPaymentE2ECommunityIdentity();
    if (!identity?.ok || !identity?.member_id) {
      return json({
        ok: false,
        logged_in_once: false,
        error: identity?.error || "payment_e2e_identity_unavailable"
      }, 503);
    }

    const memberId = String(identity.member_id);
    const member = await env.DB.prepare(
      "SELECT member_id FROM members WHERE member_id=? AND status='active' LIMIT 1"
    ).bind(memberId).first();

    if (!member?.member_id) {
      return json({
        ok: false,
        logged_in_once: false,
        source_program_enrollment: identity.enrollment_status || null,
        error: "community_login_required"
      }, 409);
    }

    await syncMemberProgramSpaces(env, memberId, identity);
    const counts = await env.DB.prepare(
      "SELECT " +
      "SUM(CASE WHEN sm.access_status IN ('active','read_only') THEN 1 ELSE 0 END) AS accessible_count," +
      "SUM(CASE WHEN sm.access_status='revoked' THEN 1 ELSE 0 END) AS revoked_count " +
      "FROM space_members sm JOIN spaces s ON s.id=sm.space_id " +
      "WHERE sm.member_id=? AND sm.access_source='projection' " +
      "AND s.scope_type IN ('program','program_run')"
    ).bind(memberId).first();

    const status = String(identity.enrollment_status || "");
    const accessibleCount = Number(counts?.accessible_count || 0);
    const revokedCount = Number(counts?.revoked_count || 0);
    const sourceHasAccess = status === "active" || status === "completed";
    const consistent = sourceHasAccess
      ? accessibleCount > 0
      : status === "withdrawn"
        ? accessibleCount === 0 && revokedCount > 0
        : accessibleCount === 0;

    return json({
      ok: consistent,
      logged_in_once: true,
      source_program_enrollment: status || null,
      source_program_access_count: Array.isArray(identity.program_access)
        ? identity.program_access.length
        : 0,
      community_accessible_space_count: accessibleCount,
      community_revoked_space_count: revokedCount,
      access_consistent: consistent
    }, consistent ? 200 : 503);
  } catch (error) {
    return json({
      ok: false,
      logged_in_once: false,
      error: String(error?.message || error)
    }, 503);
  }
}

async function handleFullLogout(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/logout") return null;

  const sessionId = parseCookies(request)[SESSION_COOKIE];
  if (sessionId && env.DB) {
    await env.DB.prepare(`DELETE FROM sessions WHERE session_id=?`).bind(sessionId).run();
  }

  const authOrigin = String(
    env.AUTH_BRIDGE_ORIGIN ||
      "https://classroom.neverjustsell.com"
  ).replace(/\/$/, "");
  const target = new URL(`${authOrigin}/session/logout/redirect`);
  target.searchParams.set("return_to", `${url.origin}/`);

  return redirect(target.toString(), expiredSessionCookie(), 302);
}

async function handleBridgeHealth(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/auth/bridge-health") return null;

  if (!env.AUTH_BRIDGE) {
    return json({ ok: false, binding_present: false, error: "auth_bridge_binding_missing" }, 503);
  }

  try {
    const [response, rpcHealth] = await Promise.all([
      env.AUTH_BRIDGE.fetch(
        new Request(
          "https://classroom.neverjustsell.com/community-auth/health",
          { method: "GET" }
        )
      ),
      env.AUTH_BRIDGE.communityAccessHealth()
    ]);
    const payload = await response.json().catch(() => null);
    const rpcReady = rpcHealth?.ok === true;
    const healthy = response.ok && payload?.ok === true && rpcReady;
    return json({
      ok: healthy,
      binding_present: true,
      rpc_ready: rpcReady,
      rpc_runtime: rpcHealth?.runtime || null,
      upstream_status: response.status,
      upstream_runtime: payload?.runtime || null,
      upstream_ok: payload?.ok === true,
      upstream_error: payload?.error || payload?.redeem_error || null
    }, healthy ? 200 : 503);
  } catch (error) {
    return json({
      ok: false,
      binding_present: true,
      error: String(error?.message || error)
    }, 503);
  }
}

async function handleDbHealth(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/auth/db-health") return null;

  if (!env.DB) {
    return json({ ok: false, db_present: false, error: "db_binding_missing" }, 503);
  }

  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  const memberId = `__auth_selftest_${suffix}`;
  const publicId = `selftest${suffix}`;
  const sessionId = crypto.randomUUID();
  const csrf = crypto.randomUUID();
  const expires = sqliteTime(new Date(Date.now() + 5 * 60 * 1000));

  let memberInserted = false;
  let sessionInserted = false;
  let readBack = false;
  let programSchema = null;

  try {
    programSchema = await ensureCommunityProgramSchema(env);
    await env.DB.prepare(
      `INSERT INTO members(member_id,public_id,display_name) VALUES(?,?,?)`
    ).bind(memberId, publicId, "Auth Self Test").run();
    memberInserted = true;

    await env.DB.prepare(
      `INSERT INTO sessions(session_id,member_id,csrf_token,expires_at) VALUES(?,?,?,?)`
    ).bind(sessionId, memberId, csrf, expires).run();
    sessionInserted = true;

    const row = await env.DB.prepare(
      `SELECT s.session_id,m.member_id FROM sessions s JOIN members m ON m.member_id=s.member_id WHERE s.session_id=?`
    ).bind(sessionId).first();
    readBack = Boolean(row?.session_id === sessionId && row?.member_id === memberId);

    return json({
      ok: memberInserted && sessionInserted && readBack && programSchema?.ok === true,
      db_present: true,
      member_insert: memberInserted,
      session_insert: sessionInserted,
      read_back: readBack,
      program_schema: programSchema
    }, memberInserted && sessionInserted && readBack && programSchema?.ok === true ? 200 : 503);
  } catch (error) {
    return json({
      ok: false,
      db_present: true,
      member_insert: memberInserted,
      session_insert: sessionInserted,
      read_back: readBack,
      program_schema: programSchema,
      error: String(error?.message || error)
    }, 503);
  } finally {
    try {
      await env.DB.prepare(`DELETE FROM sessions WHERE session_id=?`).bind(sessionId).run();
    } catch {}
    try {
      await env.DB.prepare(`DELETE FROM members WHERE member_id=?`).bind(memberId).run();
    } catch {}
  }
}

async function handleBoundAuthCallback(request, env) {
  if (!env.AUTH_BRIDGE || !env.DB) return null;

  const url = new URL(request.url);
  if (url.pathname !== "/auth/callback") return null;

  const ticket = String(url.searchParams.get("ticket") || "").trim().slice(0, 512);
  if (!ticket) return null;

  const redeemRequest = new Request(
    "https://classroom.neverjustsell.com/community-auth/redeem",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket })
    }
  );

  const redeem = await env.AUTH_BRIDGE.fetch(redeemRequest);
  const identity = await redeem.json().catch(() => null);
  if (!redeem.ok || !identity?.member_id) {
    return new Response(
      "회원 인증 정보를 확인하지 못했습니다. 커뮤니티 첫 화면에서 다시 로그인해 주세요.",
      {
        status: 401,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive"
        }
      }
    );
  }

  const memberId = String(identity.member_id);
  const publicId = crypto.randomUUID().replaceAll("-", "").slice(0, 18);

  await env.DB.prepare(
    `INSERT INTO members(member_id,public_id,display_name)
     VALUES(?,?,?)
     ON CONFLICT(member_id) DO UPDATE SET updated_at=CURRENT_TIMESTAMP`
  ).bind(memberId, publicId, memberId).run();

  try {
    await syncMemberProgramSpaces(env, memberId, identity);
  } catch (error) {
    console.error("program space projection failed", error);
  }

  const sessionId = crypto.randomUUID();
  const csrf = crypto.randomUUID();
  const expires = sqliteTime(new Date(Date.now() + SESSION_TTL_SECONDS * 1000));

  await env.DB.prepare(
    `INSERT INTO sessions(session_id,member_id,csrf_token,expires_at,access_checked_at)
     VALUES(?,?,?,?,CURRENT_TIMESTAMP)`
  ).bind(sessionId, memberId, csrf, expires).run();

  const returnTo = validReturnPath(url.searchParams.get("return_to"));
  return redirect(returnTo, sessionCookie(sessionId));
}

export default {
  async fetch(request, env, ctx) {
    try {
      const logoutResponse = await handleFullLogout(request, env);
      if (logoutResponse) return logoutResponse;

      const healthResponse = await handleBridgeHealth(request, env);
      if (healthResponse) return healthResponse;

      const dbHealthResponse = await handleDbHealth(request, env);
      if (dbHealthResponse) return dbHealthResponse;

      const paymentE2EResponse = await handlePaymentE2ESpaceStatus(request, env);
      if (paymentE2EResponse) return paymentE2EResponse;

      const authResponse = await handleBoundAuthCallback(request, env);
      if (authResponse) return authResponse;

      const refresh = await refreshAuthenticatedProgramAccess(request, env);
      if (refresh?.error) {
        console.error("program access refresh failed closed", refresh.error);
      }
    } catch (error) {
      console.error("community auth wrapper failed", error);
      return new Response(
        "회원 인증 처리 중 오류가 발생했습니다. 커뮤니티 첫 화면에서 다시 로그인해 주세요.",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow, noarchive"
          }
        }
      );
    }

    return onRequest({
      request,
      env,
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException?.bind(ctx),
      params: {},
      data: {}
    });
  }
};

// Dedicated Cloudflare Worker entry for the NEVER JUST SELL community.
import { onRequest } from "../functions/[[path]].js";

const SESSION_COOKIE = "njs_community_session";
const SESSION_TTL_SECONDS = 2 * 60 * 60;

function validReturnPath(value) {
  const path = String(value || "/");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function sqliteTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function sessionCookie(id) {
  return `${SESSION_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function redirect(location, cookie) {
  const headers = new Headers({
    Location: location,
    "Cache-Control": "no-store"
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

async function handleBoundAuthCallback(request, env) {
  if (!env.AUTH_BRIDGE || !env.DB) return null;

  const url = new URL(request.url);
  if (url.pathname !== "/auth/callback") return null;

  const ticket = String(url.searchParams.get("ticket") || "").trim().slice(0, 512);
  if (!ticket) return null;

  const redeemRequest = new Request(
    "https://neverjustsell-course-access.max-lee-korea.workers.dev/community-auth/redeem",
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

  const sessionId = crypto.randomUUID();
  const csrf = crypto.randomUUID();
  const expires = sqliteTime(new Date(Date.now() + SESSION_TTL_SECONDS * 1000));

  await env.DB.prepare(
    `INSERT INTO sessions(session_id,member_id,csrf_token,expires_at)
     VALUES(?,?,?,?)`
  ).bind(sessionId, memberId, csrf, expires).run();

  const returnTo = validReturnPath(url.searchParams.get("return_to"));
  return redirect(returnTo, sessionCookie(sessionId));
}

export default {
  async fetch(request, env, ctx) {
    try {
      const authResponse = await handleBoundAuthCallback(request, env);
      if (authResponse) return authResponse;
    } catch (error) {
      console.error("community service-bound auth callback failed", error);
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

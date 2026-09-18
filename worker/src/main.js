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

function internalRequest(url, request) {
  return new Request(url, {
    method: "GET",
    headers: request.headers
  });
}

async function readJson(response) {
  return response.clone().json().catch(() => null);
}

async function getSessionStatus(request, env, ctx, origin) {
  const response = await app.fetch(
    internalRequest(new URL("/session/status", origin), request),
    env,
    ctx
  );
  return (await readJson(response)) || { ok: false, authenticated: false };
}

async function expireStaleClassroomSession(request, env, ctx, url) {
  if (url.pathname !== "/classroom" && url.pathname !== "/course-access") return null;

  const status = await getSessionStatus(request, env, ctx, url.origin);
  if (!status?.authenticated || !status.authenticated_at) return null;

  const authenticatedAt = Date.parse(status.authenticated_at);
  if (!Number.isFinite(authenticatedAt)) return null;
  if (Date.now() - authenticatedAt < CLASSROOM_SESSION_MAX_AGE_MS) return null;

  const logoutRequest = internalRequest(new URL("/session/logout", url.origin), request);
  const logoutResponse = await app.fetch(logoutRequest, env, ctx);
  const setCookie = logoutResponse.headers.get("Set-Cookie") || "";
  return redirectWithCookie(url.toString(), setCookie);
}

async function decorateClassroomResponse(response, request, env, ctx, url) {
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  const contentType = headers.get("Content-Type") || "";
  if (!contentType.includes("text/html")) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  let body = await response.text();
  const status = await getSessionStatus(request, env, ctx, url.origin);

  if (status?.authenticated) {
    const currentTop = '<a class="home" href="https://www.neverjustsell.com/">홈으로</a></div>';
    const enhancedTop = '<span style="display:flex;gap:16px;align-items:center"><a class="home" href="https://www.neverjustsell.com/">홈으로</a><a class="home" href="/session/logout-sync">로그아웃</a></span></div>';
    body = body.replace(currentTop, enhancedTop);
  }

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function checkBadge(label, ok, detail) {
  const state = ok === true ? "PASS" : ok === false ? "CHECK" : "INFO";
  const bg = ok === true ? "#183923" : ok === false ? "#4a251e" : "#232323";
  const fg = ok === true ? "#b8f0c7" : ok === false ? "#ffc4b5" : "#c8c8c8";
  return `<div style="display:grid;grid-template-columns:88px 1fr;gap:16px;padding:16px 0;border-bottom:1px solid #292929"><span style="display:inline-flex;align-items:center;justify-content:center;height:28px;border-radius:999px;background:${bg};color:${fg};font-size:11px;font-weight:800;letter-spacing:.08em">${state}</span><div><strong style="display:block;font-size:15px;margin:3px 0 5px">${label}</strong><span style="color:#999;font-size:13px;line-height:1.6">${detail}</span></div></div>`;
}

async function renderSystemCheck(request, env, ctx, url) {
  const session = await getSessionStatus(request, env, ctx, url.origin);

  const freeResponse = await app.fetch(
    internalRequest(new URL("/classroom?course=free-lesson-1", url.origin), request),
    env,
    ctx
  );

  const accessResponse = await app.fetch(
    internalRequest(new URL("/course-access?product_no=13", url.origin), request),
    env,
    ctx
  );
  const access = await readJson(accessResponse);

  const paidResponse = await app.fetch(
    internalRequest(new URL("/classroom?course=paid-course", url.origin), request),
    env,
    ctx
  );

  const sessionOk = Boolean(session?.authenticated);
  const freeOk = freeResponse.status === 200;
  const entitlementApiOk = sessionOk
    ? Boolean(access?.ok && access?.authenticated && accessResponse.status < 500)
    : accessResponse.status === 401;
  const paidExpected = sessionOk && access?.access ? 200 : sessionOk ? 403 : 401;
  const paidOk = paidResponse.status === paidExpected;

  const rows = [
    checkBadge("Worker", true, "강의 시스템 Worker가 정상 응답했습니다."),
    checkBadge("무료 강의", freeOk, `무료 1강 응답 코드: ${freeResponse.status}`),
    checkBadge("회원 세션", sessionOk ? true : null, sessionOk ? "현재 브라우저의 강의실 회원 인증이 유효합니다." : "현재 브라우저는 강의실 비로그인 상태입니다."),
    checkBadge("구매 검증 API", entitlementApiOk, sessionOk ? `product_no=13 접근권: ${access?.access ? "허용" : "미허용"}` : "비로그인 상태에서 구매 검증이 차단됩니다."),
    checkBadge("유료 강의 보호", paidOk, `현재 상태에서 예상 코드 ${paidExpected}, 실제 코드 ${paidResponse.status}`),
    checkBadge("로그아웃 동기화", true, "강의실 로그아웃 → 카페24 로그아웃 경로가 연결되어 있습니다."),
    checkBadge("검색 차단", true, "Worker 강의실에는 noindex/noarchive 헤더를 적용합니다.")
  ].join("");

  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff"
  });

  return new Response(`<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>강의 시스템 점검 | NEVER JUST SELL</title></head>
<body style="margin:0;background:#0b0b0b;color:#f5f5f5;font-family:Arial,'Noto Sans KR',sans-serif">
<main style="width:min(820px,calc(100% - 32px));margin:0 auto;padding:42px 0 70px">
<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:34px"><a href="https://www.neverjustsell.com/" style="color:#fff;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:.16em">NEVER JUST SELL</a><a href="/classroom" style="color:#aaa;font-size:13px">내 강의실</a></div>
<section style="background:#151515;border:1px solid #292929;border-radius:18px;padding:28px">
<div style="font-size:12px;letter-spacing:.12em;color:#999;margin-bottom:9px">SYSTEM CHECK</div>
<h1 style="font-size:clamp(27px,4vw,40px);margin:0 0 10px">강의 시스템 일괄 점검</h1>
<p style="margin:0 0 15px;color:#999;line-height:1.7">한 화면에서 인증, 무료 강의, 구매 검증, 유료 강의 보호, 로그아웃 연결 상태를 함께 확인합니다.</p>
${rows}
</section>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><a href="/classroom?course=free-lesson-1" style="padding:11px 15px;border:1px solid #333;border-radius:999px;color:#ddd;text-decoration:none;font-size:13px">무료 1강 열기</a><a href="/classroom?course=paid-course" style="padding:11px 15px;border:1px solid #333;border-radius:999px;color:#ddd;text-decoration:none;font-size:13px">유료 강의 열기</a><a href="/session/logout-sync" style="padding:11px 15px;border:1px solid #333;border-radius:999px;color:#ddd;text-decoration:none;font-size:13px">통합 로그아웃 테스트</a></div>
</main></body></html>`, { headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    if (url.pathname === "/oauth/cafe24/callback") {
      const response = await app.fetch(request, env, ctx);
      const setCookie = response.headers.get("Set-Cookie") || "";

      if (response.ok && setCookie.includes("njs_session=")) {
        return redirectWithCookie(new URL("/classroom", url.origin).toString(), setCookie);
      }

      return response;
    }

    if (url.pathname === "/session/logout-sync") {
      const logoutRequest = internalRequest(new URL("/session/logout", url.origin), request);
      const response = await app.fetch(logoutRequest, env, ctx);
      const setCookie = response.headers.get("Set-Cookie") || "";
      return redirectWithCookie(CAFE24_LOGOUT_URL, setCookie);
    }

    if (url.pathname === "/system-check") {
      return renderSystemCheck(request, env, ctx, url);
    }

    const staleSessionRedirect = await expireStaleClassroomSession(request, env, ctx, url);
    if (staleSessionRedirect) return staleSessionRedirect;

    const response = await app.fetch(request, env, ctx);
    if (url.pathname === "/classroom") {
      return decorateClassroomResponse(response, request, env, ctx, url);
    }

    return response;
  }
};
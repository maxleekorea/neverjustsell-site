import app from "./entry.js";

const CAFE24_ADMIN_DOMAIN = "https://neverjustsell.cafe24api.com";
const SESSION_PREFIX = "cafe24:customer-session:";
const SESSION_COOKIE = "njs_session";
const ADMIN_TOKEN_KEY = "cafe24:admin-token";
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const VALID_PAYMENT_STATUSES = new Set(["T", "A", "P"]);
const REVOKED_STATUS_PREFIXES = new Set(["C", "R", "E"]);
const ENTITLEMENT_START_DATE = "2026-01-01";
const ORDER_WINDOW_DAYS = 89;

// Temporary technical mapping. Product 11 is only for the completed access-control test.
// Real course products will be added here after Cafe24 assigns their product numbers.
const COURSE_CATALOG = {
  "access-test": {
    productNo: 11,
    title: "강의실 연결 테스트",
    vimeoId: "1227267267",
    visible: false
  }
};

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
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'unsafe-inline'; frame-src https://player.vimeo.com; img-src 'self' data:; base-uri 'none'; form-action 'self'"
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return new Response(body, { ...init, headers });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function basicAuth(clientId, clientSecret) {
  return btoa(`${clientId}:${clientSecret}`);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function todayDate() {
  return isoDate(new Date());
}

function addUtcDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function buildOrderWindows(startDate, endDate) {
  const windows = [];
  let windowEnd = endDate;

  while (windowEnd >= startDate) {
    const candidateStart = addUtcDays(windowEnd, -ORDER_WINDOW_DAYS);
    const windowStart = candidateStart < startDate ? startDate : candidateStart;
    windows.push({ startDate: windowStart, endDate: windowEnd });

    if (windowStart === startDate) break;
    windowEnd = addUtcDays(windowStart, -1);
  }

  return windows;
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

async function getCustomerSession(request, env) {
  if (!env.CAFE24_AUTH) return null;
  const sessionId = parseCookies(request)[SESSION_COOKIE];
  if (!sessionId) return null;
  const raw = await env.CAFE24_AUTH.get(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function refreshAdminToken(refreshToken, env) {
  const response = await fetch(`${CAFE24_ADMIN_DOMAIN}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(
        env.CAFE24_CLIENT_ID,
        env.CAFE24_CLIENT_SECRET
      )}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 admin token refresh failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

async function getAdminToken(env) {
  if (!env.CAFE24_AUTH) throw new Error("Cafe24 KV binding is missing");
  const raw = await env.CAFE24_AUTH.get(ADMIN_TOKEN_KEY);
  if (!raw) throw new Error("Cafe24 Admin access token is not connected");

  let token = JSON.parse(raw);
  const expiresAt = Date.parse(token.expires_at || "");
  if (
    Number.isFinite(expiresAt) &&
    Date.now() >= expiresAt - TOKEN_REFRESH_MARGIN_MS
  ) {
    if (!token.refresh_token) throw new Error("Cafe24 refresh token is missing");
    token = await refreshAdminToken(token.refresh_token, env);
    await env.CAFE24_AUTH.put(ADMIN_TOKEN_KEY, JSON.stringify(token));
  }
  return token;
}

async function cafe24AdminGet(path, env, params = {}) {
  const token = await getAdminToken(env);
  const apiUrl = new URL(`${CAFE24_ADMIN_DOMAIN}/api/v2/admin${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      apiUrl.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json"
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Cafe24 Admin API failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }
  return payload;
}

function isPaymentConfirmed(order, item) {
  if (item?.paid === "T" || item?.payment_status === "T") return true;
  if (order?.paid === "T" || order?.payment_confirmation === "T") return true;
  return VALID_PAYMENT_STATUSES.has(order?.payment_status || "");
}

function isItemRevoked(order, item) {
  if (order?.canceled === "T") return true;
  if (order?.refund_status === "T") return true;

  const status = String(item?.order_status || order?.order_status || "");
  if (!status) return false;
  return REVOKED_STATUS_PREFIXES.has(status.slice(0, 1));
}

function hasValidCourseItem(order, productNo) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.some((item) => {
    if (Number(item?.product_no) !== productNo) return false;
    if (!isPaymentConfirmed(order, item)) return false;
    if (isItemRevoked(order, item)) return false;

    const status = String(item?.order_status || order?.order_status || "");
    return !status || status.startsWith("N");
  });
}

async function getCourseAccessResult(request, env, productNo) {
  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
    return {
      status: 503,
      body: { ok: false, authenticated: false, access: false, error: "cafe24_not_configured" }
    };
  }

  const session = await getCustomerSession(request, env);
  if (!session?.member_id) {
    return {
      status: 401,
      body: {
        ok: true,
        authenticated: false,
        access: false,
        reason: "login_required",
        auth_url: "/oauth/cafe24/customer/start"
      }
    };
  }

  const endDate = todayDate();
  const windows = buildOrderWindows(ENTITLEMENT_START_DATE, endDate);
  let matchingOrderCount = 0;
  let access = false;

  for (const window of windows) {
    const payload = await cafe24AdminGet("/orders", env, {
      shop_no: 1,
      start_date: window.startDate,
      end_date: window.endDate,
      date_type: "order_date",
      member_id: session.member_id,
      product_no: productNo,
      embed: "items",
      limit: 100
    });

    const orders = Array.isArray(payload.orders) ? payload.orders : [];
    matchingOrderCount += orders.length;

    if (orders.some((order) => hasValidCourseItem(order, productNo))) {
      access = true;
      break;
    }
  }

  return {
    status: 200,
    body: {
      ok: true,
      authenticated: true,
      access,
      reason: access ? "paid_purchase_verified" : "no_valid_paid_purchase",
      product_no: productNo,
      matching_order_count: matchingOrderCount,
      check_range: {
        start_date: ENTITLEMENT_START_DATE,
        end_date: endDate
      },
      verified_at: new Date().toISOString()
    }
  };
}

async function checkCourseAccess(request, env, url) {
  const productNo = Number(url.searchParams.get("product_no"));
  if (!Number.isInteger(productNo) || productNo <= 0) {
    return json(
      {
        ok: false,
        access: false,
        error: "invalid_product_no",
        example: "/course-access?product_no=123"
      },
      { status: 400 }
    );
  }

  const result = await getCourseAccessResult(request, env, productNo);
  return json(result.body, { status: result.status });
}

function classroomShell(title, content) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | NEVER JUST SELL</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0b0b0b;color:#f5f5f5;font-family:Arial,"Noto Sans KR",sans-serif}a{color:inherit}.wrap{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:34px 0 64px}.top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:48px}.brand{font-size:14px;letter-spacing:.18em;font-weight:700;text-decoration:none}.home{font-size:13px;color:#aaa;text-decoration:none}.card{background:#151515;border:1px solid #292929;border-radius:18px;padding:28px}.eyebrow{font-size:12px;letter-spacing:.12em;color:#999;margin-bottom:10px}.title{font-size:clamp(26px,4vw,42px);margin:0 0 14px;line-height:1.2}.desc{color:#aaa;line-height:1.75;margin:0}.video{position:relative;width:100%;padding-top:56.25%;margin-top:26px;background:#000;border-radius:14px;overflow:hidden}.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.action{display:inline-block;margin-top:24px;padding:13px 18px;border-radius:999px;background:#f5f5f5;color:#111;text-decoration:none;font-weight:700}.secondary{background:transparent;color:#ddd;border:1px solid #3b3b3b;margin-left:8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:20px}.course{display:block;background:#151515;border:1px solid #292929;border-radius:18px;padding:24px;text-decoration:none}.course h2{font-size:20px;margin:6px 0 10px}.course p{font-size:14px;color:#999;line-height:1.6;margin:0}.note{margin-top:18px;color:#888;font-size:13px;line-height:1.6}@media(max-width:560px){.card{padding:22px}.secondary{margin-left:0;display:table}}
</style>
</head>
<body><main class="wrap"><div class="top"><a class="brand" href="https://www.neverjustsell.com/">NEVER JUST SELL</a><a class="home" href="https://www.neverjustsell.com/">홈으로</a></div>${content}</main></body>
</html>`;
}

function renderLoginRequired(title) {
  return html(
    classroomShell(
      title,
      `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">회원 인증이 필요합니다.</h1><p class="desc">구매한 강의를 확인하려면 카페24 회원 인증을 완료해 주세요.</p><a class="action" href="/oauth/cafe24/customer/start">회원 인증하기</a></section>`
    ),
    { status: 401 }
  );
}

function renderClassroomError(title = "내 강의실") {
  return html(
    classroomShell(
      title,
      `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">강의실을 불러오지 못했습니다.</h1><p class="desc">잠시 후 다시 시도해 주세요.</p></section>`
    ),
    { status: 502 }
  );
}

async function renderClassroomHome(request, env) {
  const session = await getCustomerSession(request, env);
  if (!session?.member_id) return renderLoginRequired("내 강의실");

  const visibleCourses = Object.entries(COURSE_CATALOG).filter(([, course]) => course.visible);
  const accessible = [];

  for (const [slug, course] of visibleCourses) {
    const result = await getCourseAccessResult(request, env, course.productNo);
    if (result.body.access) accessible.push({ slug, course });
  }

  if (accessible.length === 0) {
    return html(
      classroomShell(
        "내 강의실",
        `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">내 강의실</h1><p class="desc">현재 수강 가능한 강의가 없습니다. 결제가 완료된 강의는 이곳에 자동으로 표시됩니다.</p><a class="action" href="https://www.neverjustsell.com/">강의 둘러보기</a></section>`
      )
    );
  }

  const cards = accessible
    .map(
      ({ slug, course }) =>
        `<a class="course" href="/classroom?course=${encodeURIComponent(slug)}"><div class="eyebrow">COURSE</div><h2>${escapeHtml(course.title)}</h2><p>계속 수강하기</p></a>`
    )
    .join("");

  return html(
    classroomShell(
      "내 강의실",
      `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">내 강의실</h1><p class="desc">구매가 확인된 강의만 표시됩니다.</p></section><div class="grid">${cards}</div>`
    )
  );
}

async function renderClassroom(request, env, url) {
  const slug = url.searchParams.get("course");
  if (!slug) return renderClassroomHome(request, env);

  const course = COURSE_CATALOG[slug];
  if (!course) {
    return html(
      classroomShell(
        "강의를 찾을 수 없습니다",
        `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">강의를 찾을 수 없습니다.</h1><p class="desc">주소를 다시 확인해 주세요.</p><a class="action" href="/classroom">내 강의실로</a></section>`
      ),
      { status: 404 }
    );
  }

  const result = await getCourseAccessResult(request, env, course.productNo);

  if (result.status >= 500) return renderClassroomError(course.title);
  if (!result.body.authenticated) return renderLoginRequired(course.title);

  if (!result.body.access) {
    return html(
      classroomShell(
        course.title,
        `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">현재 수강할 수 없습니다.</h1><p class="desc">구매가 확인되지 않았거나 주문이 취소·환불된 강의입니다.</p><a class="action" href="/classroom">내 강의실로</a><a class="action secondary" href="https://www.neverjustsell.com/">강의 둘러보기</a></section>`
      ),
      { status: 403 }
    );
  }

  return html(
    classroomShell(
      course.title,
      `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">${escapeHtml(course.title)}</h1><p class="desc">구매 내역이 확인되었습니다.</p><div class="video"><iframe src="https://player.vimeo.com/video/${encodeURIComponent(course.vimeoId)}?dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${escapeHtml(course.title)}"></iframe></div><a class="action secondary" href="/classroom">내 강의실로</a></section>`
    )
  );
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/course-access") {
      try {
        return await checkCourseAccess(request, env, url);
      } catch (error) {
        return json(
          {
            ok: false,
            access: false,
            error: "course_access_check_failed",
            detail: String(error?.message || error)
          },
          { status: 502 }
        );
      }
    }

    if (url.pathname === "/classroom") {
      try {
        return await renderClassroom(request, env, url);
      } catch {
        return renderClassroomError();
      }
    }

    return app.fetch(request, env, ctx);
  }
};

import app from "./entry.js";
import {
  COURSE_CATALOG,
  findPaidCourseByProductNo,
  getVisiblePaidCourses
} from "./courses.js";

const CAFE24_ADMIN_DOMAIN = "https://neverjustsell.cafe24api.com";
const SESSION_PREFIX = "cafe24:customer-session:";
const SESSION_COOKIE = "njs_session";
const ADMIN_TOKEN_KEY = "cafe24:admin-token";
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const ACCESS_TOKEN_LIFETIME_MS = 2 * 60 * 60 * 1000;
const VALID_PAYMENT_STATUSES = new Set(["T", "A", "P"]);
const REVOKED_STATUS_PREFIXES = new Set(["C", "R", "E"]);
const ENTITLEMENT_START_DATE = "2026-01-01";
const ORDER_WINDOW_DAYS = 89;
const ORDER_PAGE_LIMIT = 1000;
const ORDER_MAX_OFFSET = 15000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

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
  return isoDate(new Date(Date.now() + KST_OFFSET_MS));
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

function parseCafe24Timestamp(value) {
  if (!value) return NaN;
  const text = String(value).trim();
  if (!text) return NaN;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) return Date.parse(text);
  return Date.parse(`${text}+09:00`);
}

function shouldRefreshAdminToken(token) {
  const expiresAt = parseCafe24Timestamp(token?.expires_at);
  if (Number.isFinite(expiresAt)) {
    return Date.now() >= expiresAt - TOKEN_REFRESH_MARGIN_MS;
  }

  const issuedAt = parseCafe24Timestamp(token?.issued_at);
  if (Number.isFinite(issuedAt)) {
    return Date.now() >= issuedAt + ACCESS_TOKEN_LIFETIME_MS - TOKEN_REFRESH_MARGIN_MS;
  }

  return false;
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
      Authorization: `Basic ${basicAuth(env.CAFE24_CLIENT_ID, env.CAFE24_CLIENT_SECRET)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Cafe24 admin token refresh failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function saveRefreshedAdminToken(refreshToken, env) {
  if (!refreshToken) throw new Error("Cafe24 refresh token is missing");
  const token = await refreshAdminToken(refreshToken, env);
  await env.CAFE24_AUTH.put(ADMIN_TOKEN_KEY, JSON.stringify(token));
  return token;
}

async function getAdminToken(env) {
  if (!env.CAFE24_AUTH) throw new Error("Cafe24 KV binding is missing");
  const raw = await env.CAFE24_AUTH.get(ADMIN_TOKEN_KEY);
  if (!raw) throw new Error("Cafe24 Admin access token is not connected");

  let token = JSON.parse(raw);
  if (shouldRefreshAdminToken(token)) {
    token = await saveRefreshedAdminToken(token.refresh_token, env);
  }
  return token;
}

async function fetchAdminGet(apiUrl, accessToken) {
  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function cafe24AdminGet(path, env, params = {}) {
  let token = await getAdminToken(env);
  const apiUrl = new URL(`${CAFE24_ADMIN_DOMAIN}/api/v2/admin${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      apiUrl.searchParams.set(key, String(value));
    }
  }

  let result = await fetchAdminGet(apiUrl, token.access_token);

  if (result.response.status === 401) {
    const latestRaw = await env.CAFE24_AUTH.get(ADMIN_TOKEN_KEY);
    const latest = latestRaw ? JSON.parse(latestRaw) : token;

    if (latest?.access_token && latest.access_token !== token.access_token) {
      token = latest;
    } else {
      token = await saveRefreshedAdminToken(latest?.refresh_token || token.refresh_token, env);
    }

    result = await fetchAdminGet(apiUrl, token.access_token);
  }

  if (!result.response.ok) {
    throw new Error(`Cafe24 Admin API failed (${result.response.status}): ${JSON.stringify(result.payload)}`);
  }
  return result.payload;
}

async function fetchAllOrders(env, params) {
  const orders = [];
  let offset = 0;

  while (offset <= ORDER_MAX_OFFSET) {
    const payload = await cafe24AdminGet("/orders", env, {
      ...params,
      limit: ORDER_PAGE_LIMIT,
      offset
    });
    const page = Array.isArray(payload.orders) ? payload.orders : [];
    orders.push(...page);

    if (page.length < ORDER_PAGE_LIMIT) return orders;
    if (offset === ORDER_MAX_OFFSET) {
      throw new Error("Cafe24 order result exceeds supported pagination range");
    }
    offset += ORDER_PAGE_LIMIT;
  }

  return orders;
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
  return status ? REVOKED_STATUS_PREFIXES.has(status.slice(0, 1)) : false;
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

function getValidPaidProductNos(orders, targetProductNos) {
  const targets = new Set(targetProductNos.map(Number));
  const valid = new Set();

  for (const order of orders) {
    for (const productNo of targets) {
      if (!valid.has(productNo) && hasValidCourseItem(order, productNo)) {
        valid.add(productNo);
      }
    }
  }

  return valid;
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
    const orders = await fetchAllOrders(env, {
      shop_no: 1,
      start_date: window.startDate,
      end_date: window.endDate,
      date_type: "order_date",
      member_id: session.member_id,
      product_no: productNo,
      embed: "items"
    });

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
      check_range: { start_date: ENTITLEMENT_START_DATE, end_date: endDate },
      pagination: { limit: ORDER_PAGE_LIMIT, max_offset: ORDER_MAX_OFFSET },
      verified_at: new Date().toISOString()
    }
  };
}

async function getAccessiblePaidProductNos(request, env, productNos) {
  const session = await getCustomerSession(request, env);
  if (!session?.member_id) {
    return { authenticated: false, productNos: new Set() };
  }

  const targets = [...new Set(productNos.map(Number).filter(Number.isFinite))];
  const accessible = new Set();
  const endDate = todayDate();
  const windows = buildOrderWindows(ENTITLEMENT_START_DATE, endDate);

  for (const window of windows) {
    const orders = await fetchAllOrders(env, {
      shop_no: 1,
      start_date: window.startDate,
      end_date: window.endDate,
      date_type: "order_date",
      member_id: session.member_id,
      embed: "items"
    });

    const validThisWindow = getValidPaidProductNos(orders, targets);
    for (const productNo of validThisWindow) accessible.add(productNo);
    if (accessible.size === targets.length) break;
  }

  return { authenticated: true, productNos: accessible };
}

async function checkCourseAccess(request, env, url) {
  const productNo = Number(url.searchParams.get("product_no"));
  if (!Number.isInteger(productNo) || productNo <= 0) {
    return json(
      { ok: false, access: false, error: "invalid_product_no" },
      { status: 400 }
    );
  }

  const knownCourse = findPaidCourseByProductNo(productNo);
  if (!knownCourse) {
    return json(
      { ok: false, access: false, error: "unknown_course_product" },
      { status: 404 }
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
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(title)} | NEVER JUST SELL</title>
<style>
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:#0b0b0b;color:#f5f5f5;font-family:Arial,"Noto Sans KR",sans-serif}a{color:inherit}.wrap{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:34px 0 64px}.top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:48px}.brand{font-size:14px;letter-spacing:.18em;font-weight:700;text-decoration:none}.home{font-size:13px;color:#aaa;text-decoration:none}.card{background:#151515;border:1px solid #292929;border-radius:18px;padding:28px}.eyebrow{font-size:12px;letter-spacing:.12em;color:#999;margin-bottom:10px}.title{font-size:clamp(26px,4vw,42px);margin:0 0 14px;line-height:1.2}.desc{color:#aaa;line-height:1.75;margin:0}.video{position:relative;width:100%;aspect-ratio:16/9;margin-top:26px;background:#000;border-radius:14px;overflow:hidden}.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.action{display:inline-block;margin-top:24px;padding:13px 18px;border-radius:999px;background:#f5f5f5;color:#111;text-decoration:none;font-weight:700}.secondary{background:transparent;color:#ddd;border:1px solid #3b3b3b;margin-left:8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:20px}.course{display:block;background:#151515;border:1px solid #292929;border-radius:18px;padding:24px;text-decoration:none}.course h2{font-size:20px;margin:6px 0 10px}.course p{font-size:14px;color:#999;line-height:1.6;margin:0}.note{margin-top:18px;color:#888;font-size:13px;line-height:1.6}.lesson-list{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.lesson-link{display:inline-block;padding:10px 14px;border:1px solid #343434;border-radius:999px;color:#bbb;text-decoration:none;font-size:14px}.lesson-link.active{background:#f5f5f5;color:#111;border-color:#f5f5f5}@media(max-width:560px){.wrap{width:calc(100% - 20px);padding:20px 0 44px}.top{margin-bottom:24px;align-items:flex-start}.brand{font-size:12px}.card{padding:18px;border-radius:14px}.title{font-size:clamp(25px,8vw,34px)}.grid{grid-template-columns:1fr}.course{padding:20px}.lesson-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lesson-link{text-align:center;padding:11px 8px}.video{margin-top:18px;border-radius:10px}.action{width:100%;text-align:center}.secondary{margin-left:0}.top span{gap:10px!important;flex-wrap:wrap;justify-content:flex-end}}
</style>
</head>
<body><main class="wrap"><div class="top"><a class="brand" href="https://www.neverjustsell.com/">NEVER JUST SELL</a><span style="display:flex;gap:16px;align-items:center"><a class="home" href="https://www.neverjustsell.com/">홈</a><a class="home" href="https://community.neverjustsell.com/">커뮤니티</a></span></div>${content}</main></body>
</html>`;
}

function renderLoginRequired(title) {
  return html(
    classroomShell(
      title,
      `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">회원 인증이 필요합니다.</h1><p class="desc">구매한 강의를 확인하려면 카페24 회원 인증을 완료해 주세요.</p><a class="action" href="https://classroom.neverjustsell.com/oauth/cafe24/customer/start">회원 인증하기</a></section>`
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

function renderLessonNotFound(course, slug) {
  return html(
    classroomShell(
      course.title,
      `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">강의를 찾을 수 없습니다.</h1><p class="desc">차시 주소를 다시 확인해 주세요.</p><a class="action" href="/classroom?course=${encodeURIComponent(slug)}">첫 강의로 이동</a></section>`
    ),
    { status: 404 }
  );
}

function getCourseLessons(course) {
  if (Array.isArray(course.lessons) && course.lessons.length > 0) return course.lessons;
  if (course.vimeoId) return [{ id: "lesson-1", title: course.title, vimeoId: course.vimeoId }];
  return [];
}

function resolveLesson(course, url) {
  const lessons = getCourseLessons(course);
  const raw = url?.searchParams.get("lesson");
  if (raw === null || raw === "") {
    return { lessons, lessonNumber: 1, selectedLesson: lessons[0] || null, invalid: false };
  }

  const lessonNumber = Number(raw);
  const invalid = !Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > lessons.length;
  return {
    lessons,
    lessonNumber,
    selectedLesson: invalid ? null : lessons[lessonNumber - 1] || null,
    invalid
  };
}

function renderCoursePlayer(course, label = "MY CLASSROOM", slug = "", url = null) {
  const resolved = resolveLesson(course, url);
  if (resolved.invalid) return renderLessonNotFound(course, slug);

  const { lessons, lessonNumber, selectedLesson } = resolved;
  const player = selectedLesson?.vimeoId
    ? `<div class="video"><iframe src="https://player.vimeo.com/video/${encodeURIComponent(selectedLesson.vimeoId)}?dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${escapeHtml(course.title)} ${escapeHtml(selectedLesson.title)}"></iframe></div>`
    : `<p class="note">영상 연결 준비 중입니다.</p>`;

  const lessonNavigation = lessons.length > 1
    ? `<div class="lesson-list">${lessons.map((lesson, index) => `<a class="lesson-link${index + 1 === lessonNumber ? " active" : ""}" href="/classroom?course=${encodeURIComponent(slug)}&lesson=${index + 1}">${escapeHtml(lesson.title)}</a>`).join("")}</div>`
    : "";

  const lessonTitle = selectedLesson && lessons.length > 1
    ? `<p class="desc">${escapeHtml(selectedLesson.title)}</p>`
    : "";

  return html(
    classroomShell(
      course.title,
      `<section class="card"><div class="eyebrow">${escapeHtml(label)}</div><h1 class="title">${escapeHtml(course.title)}</h1>${lessonTitle}${lessonNavigation}${player}<a class="action secondary" href="${course.accessType === "paid" ? "/classroom" : "https://www.neverjustsell.com/"}">${course.accessType === "paid" ? "내 강의실로" : "홈으로"}</a></section>`
    )
  );
}

async function renderClassroomHome(request, env) {
  const session = await getCustomerSession(request, env);
  if (!session?.member_id) return renderLoginRequired("내 강의실");

  const paidCourses = getVisiblePaidCourses();
  const access = await getAccessiblePaidProductNos(
    request,
    env,
    paidCourses.map(([, course]) => course.productNo)
  );

  const accessible = paidCourses.filter(([, course]) => access.productNos.has(Number(course.productNo)));

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
      ([slug, course]) =>
        `<a class="course" href="/classroom?course=${encodeURIComponent(slug)}"><div class="eyebrow">COURSE</div><h2>${escapeHtml(course.title)}</h2><p>${getCourseLessons(course).length}개 강의 · 계속 수강하기</p></a>`
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

  if (course.accessType === "public") {
    return renderCoursePlayer(course, "FREE CLASS", slug, url);
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

  return renderCoursePlayer(course, "MY CLASSROOM", slug, url);
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

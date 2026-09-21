import app from "./session-orders.js";
import {
  COURSE_CATALOG,
  findPaidCourseByProductNo,
  getVisiblePaidCourses
} from "./courses.js";
import { SITE_ORIGIN, COMMUNITY_ORIGIN, CLASSROOM_ORIGIN } from "./config.js";
import {
  listPublishedD1Courses,
  getPublishedD1Course,
  getCourseProgress,
  touchLessonProgress,
  completeLesson,
  d1CourseToPlayerCourse
} from "./course-store.js";

import { getCustomerSession } from "./session-orders.js";
import {
  getCourseAccessDecision,
  getAccessiblePaidProductNos
} from "./access.js";

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

  const result = await getCourseAccessDecision(request, env, productNo);
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
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:#0b0b0b;color:#f5f5f5;font-family:Arial,"Noto Sans KR",sans-serif}a{color:inherit}.wrap{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:34px 0 64px}.top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:48px}.brand{font-size:14px;letter-spacing:.18em;font-weight:700;text-decoration:none}.home{font-size:13px;color:#aaa;text-decoration:none}.card{background:#151515;border:1px solid #292929;border-radius:18px;padding:28px}.eyebrow{font-size:12px;letter-spacing:.12em;color:#999;margin-bottom:10px}.title{font-size:clamp(26px,4vw,42px);margin:0 0 14px;line-height:1.2}.desc{color:#aaa;line-height:1.75;margin:0}.video{position:relative;width:100%;aspect-ratio:16/9;margin-top:26px;background:#000;border-radius:14px;overflow:hidden}.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.action{display:inline-block;margin-top:24px;padding:13px 18px;border-radius:999px;background:#f5f5f5;color:#111;text-decoration:none;font-weight:700}.secondary{background:transparent;color:#ddd;border:1px solid #3b3b3b;margin-left:8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:20px}.course{display:block;background:#151515;border:1px solid #292929;border-radius:18px;padding:24px;text-decoration:none}.course h2{font-size:20px;margin:6px 0 10px}.course p{font-size:14px;color:#999;line-height:1.6;margin:0}.note{margin-top:18px;color:#888;font-size:13px;line-height:1.6}.lesson-list{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.lesson-link{display:inline-block;padding:10px 14px;border:1px solid #343434;border-radius:999px;color:#bbb;text-decoration:none;font-size:14px}.lesson-link.active{background:#f5f5f5;color:#111;border-color:#f5f5f5}.progress{height:8px;background:#252525;border-radius:999px;overflow:hidden;margin:14px 0 6px}.progress span{display:block;height:100%;background:#f5f5f5}.progress-label{font-size:12px;color:#999}.curriculum{margin-top:22px;border-top:1px solid #292929}.module-title{font-size:12px;color:#888;letter-spacing:.08em;margin:18px 0 8px}.lesson-row{display:flex;align-items:center;gap:8px}.lesson-row .lesson-link{flex:1}.done{font-size:12px;color:#a8e6a8}.nav-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.complete-form{display:inline}.complete-form button{margin-top:24px;padding:13px 18px;border-radius:999px;background:#f5f5f5;color:#111;border:0;font-weight:700;cursor:pointer}@media(max-width:560px){.wrap{width:calc(100% - 20px);padding:20px 0 44px}.top{margin-bottom:24px;align-items:flex-start}.brand{font-size:12px}.card{padding:18px;border-radius:14px}.title{font-size:clamp(25px,8vw,34px)}.grid{grid-template-columns:1fr}.course{padding:20px}.lesson-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lesson-link{text-align:center;padding:11px 8px}.video{margin-top:18px;border-radius:10px}.action{width:100%;text-align:center}.secondary{margin-left:0}.top span{gap:10px!important;flex-wrap:wrap;justify-content:flex-end}}
</style>
</head>
<body><main class="wrap"><div class="top"><a class="brand" href="${SITE_ORIGIN}/">NEVER JUST SELL</a><span style="display:flex;gap:16px;align-items:center"><a class="home" href="${SITE_ORIGIN}/">홈</a><a class="home" href="${COMMUNITY_ORIGIN}/">커뮤니티</a></span></div>${content}</main></body>
</html>`;
}

function redirectToCustomerAuth() {
  return Response.redirect(`${CLASSROOM_ORIGIN}/oauth/cafe24/customer/start`, 302);
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
      `<section class="card"><div class="eyebrow">${escapeHtml(label)}</div><h1 class="title">${escapeHtml(course.title)}</h1>${lessonTitle}${lessonNavigation}${player}<a class="action secondary" href="${course.accessType === "paid" ? "/classroom" : `${SITE_ORIGIN}/`}">${course.accessType === "paid" ? "내 강의실로" : "홈으로"}</a></section>`
    )
  );
}

async function loadAccessibleD1Courses(request, env, memberId) {
  const summaries = await listPublishedD1Courses(env);
  if (summaries.length === 0) return [];
  const full = (await Promise.all(summaries.map((course) => getPublishedD1Course(env, course.slug)))).filter(Boolean);
  const paidProductNos = full
    .filter((course) => course.access_type === "paid" && Number(course.cafe24_product_no) > 0)
    .map((course) => Number(course.cafe24_product_no));
  let paidAccess = new Set();
  if (paidProductNos.length > 0) {
    const access = await getAccessiblePaidProductNos(request, env, paidProductNos);
    paidAccess = access.productNos;
  }
  return full.filter((course) =>
    course.access_type !== "paid" || paidAccess.has(Number(course.cafe24_product_no))
  );
}

function lessonNumberById(course, lessonId) {
  const lessons = Array.isArray(course?.lessons) ? course.lessons : [];
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? index + 1 : 1;
}

function renderD1CoursePlayer(course, progress, slug, url) {
  const playerCourse = d1CourseToPlayerCourse(course);
  const resolved = resolveLesson(playerCourse, url);
  if (resolved.invalid) return renderLessonNotFound(playerCourse, slug);
  const lessons = resolved.lessons;
  const lessonNumber = resolved.lessonNumber;
  const selectedLesson = resolved.selectedLesson;
  const completedIds = progress?.completedIds || new Set();
  const player = selectedLesson?.vimeoId
    ? `<div class="video"><iframe src="https://player.vimeo.com/video/${encodeURIComponent(selectedLesson.vimeoId)}?dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${escapeHtml(playerCourse.title)} ${escapeHtml(selectedLesson.title)}"></iframe></div>`
    : `<p class="note">영상 처리 중이거나 아직 연결되지 않은 차시입니다.</p>`;

  const grouped = new Map();
  for (const lesson of lessons) {
    const group = lesson.moduleTitle || "전체 차시";
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group).push(lesson);
  }
  let curriculum = "";
  for (const [moduleTitle, moduleLessons] of grouped) {
    curriculum += `<div class="module-title">${escapeHtml(moduleTitle)}</div>`;
    curriculum += moduleLessons.map((lesson) => {
      const index = lessons.findIndex((item) => item.id === lesson.id) + 1;
      const active = index === lessonNumber ? " active" : "";
      const done = completedIds.has(lesson.id) ? `<span class="done">완료</span>` : "";
      return `<div class="lesson-row"><a class="lesson-link${active}" href="/classroom?course=${encodeURIComponent(slug)}&lesson=${index}">${index}. ${escapeHtml(lesson.title)}</a>${done}</div>`;
    }).join("");
  }

  const previous = lessonNumber > 1 ? lessonNumber - 1 : null;
  const next = lessonNumber < lessons.length ? lessonNumber + 1 : null;
  const nextTarget = next ? `/classroom?course=${encodeURIComponent(slug)}&lesson=${next}` : `/classroom`;
  const nav = `<div class="nav-row">${previous ? `<a class="action secondary" href="/classroom?course=${encodeURIComponent(slug)}&lesson=${previous}">이전 차시</a>` : ""}<form class="complete-form" method="post" action="/classroom/progress"><input type="hidden" name="course_slug" value="${escapeHtml(slug)}"><input type="hidden" name="lesson_id" value="${escapeHtml(selectedLesson?.id || "")}"><input type="hidden" name="next" value="${escapeHtml(nextTarget)}"><button type="submit">${next ? "완료하고 다음 차시" : "강의 완료"}</button></form></div>`;

  return html(classroomShell(
    playerCourse.title,
    `<section class="card"><div class="eyebrow">${playerCourse.accessType === "paid" ? "MY CLASSROOM" : "FREE COURSE · LOGIN REQUIRED"}</div><h1 class="title">${escapeHtml(playerCourse.title)}</h1><p class="desc">${escapeHtml(selectedLesson?.title || "")}</p>${selectedLesson?.description ? `<p class="note">${escapeHtml(selectedLesson.description)}</p>` : ""}<div class="progress"><span style="width:${Number(progress?.percent || 0)}%"></span></div><div class="progress-label">${Number(progress?.completed || 0)} / ${Number(progress?.total || lessons.length)} 완료 · ${Number(progress?.percent || 0)}%</div><div class="curriculum">${curriculum}</div>${player}${nav}<a class="action secondary" href="/classroom">내 강의실로</a></section>`
  ));
}

async function renderPublishedD1Course(request, env, url, course) {
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) return redirectToCustomerAuth();

  if (course.access_type === "paid") {
    const productNo = Number(course.cafe24_product_no);
    if (!Number.isInteger(productNo) || productNo <= 0) {
      return renderClassroomError(course.title);
    }
    const decision = await getCourseAccessDecision(request, env, productNo);
    if (decision.status >= 500) return renderClassroomError(course.title);
    if (!decision.body.access) {
      return html(classroomShell(course.title, `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">현재 수강할 수 없습니다.</h1><p class="desc">구매가 확인되지 않았거나 주문이 취소·환불된 강의입니다.</p><a class="action" href="/classroom">내 강의실로</a></section>`), { status: 403 });
    }
  }

  const playerCourse = d1CourseToPlayerCourse(course);
  const resolved = resolveLesson(playerCourse, url);
  if (resolved.invalid) return renderLessonNotFound(playerCourse, course.slug);
  if (resolved.selectedLesson) {
    await touchLessonProgress(env, session.record.member_id, course.id, resolved.selectedLesson.id);
  }
  const progress = await getCourseProgress(env, session.record.member_id, playerCourse);
  return renderD1CoursePlayer(course, progress, course.slug, url);
}

async function handleProgressPost(request, env) {
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) return redirectToCustomerAuth();
  const form = await request.formData().catch(() => null);
  const slug = String(form?.get("course_slug") || "").trim();
  const lessonId = String(form?.get("lesson_id") || "").trim();
  const next = String(form?.get("next") || "/classroom");
  const course = await getPublishedD1Course(env, slug);
  if (!course || !course.lessons.some((lesson) => lesson.id === lessonId)) {
    return json({ ok: false, error: "invalid_progress_target" }, { status: 400 });
  }
  if (course.access_type === "paid") {
    const decision = await getCourseAccessDecision(request, env, Number(course.cafe24_product_no));
    if (!decision.body.access) return json({ ok: false, error: "course_access_required" }, { status: 403 });
  }
  await completeLesson(env, session.record.member_id, course.id, lessonId);
  const safeNext = next.startsWith("/classroom") ? next : "/classroom";
  return Response.redirect(new URL(safeNext, CLASSROOM_ORIGIN).toString(), 303);
}

async function renderClassroomHome(request, env) {
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) return redirectToCustomerAuth();

  const d1Courses = await loadAccessibleD1Courses(request, env, session.record.member_id);
  const d1Cards = [];
  for (const course of d1Courses) {
    const playerCourse = d1CourseToPlayerCourse(course);
    const progress = await getCourseProgress(env, session.record.member_id, playerCourse);
    const continueLesson = lessonNumberById(playerCourse, progress.continueLessonId);
    d1Cards.push(`<a class="course" href="/classroom?course=${encodeURIComponent(course.slug)}&lesson=${continueLesson}"><div class="eyebrow">${course.access_type === "paid" ? "PAID COURSE" : "FREE COURSE"}</div><h2>${escapeHtml(course.title)}</h2><p>${playerCourse.lessons.length}개 차시 · ${progress.percent}% 완료 · 계속 수강하기</p><div class="progress"><span style="width:${progress.percent}%"></span></div></a>`);
  }

  const paidCourses = getVisiblePaidCourses();
  const access = paidCourses.length > 0
    ? await getAccessiblePaidProductNos(request, env, paidCourses.map(([, course]) => course.productNo))
    : { productNos: new Set() };
  const staticCards = paidCourses
    .filter(([, course]) => access.productNos.has(Number(course.productNo)))
    .map(([slug, course]) => `<a class="course" href="/classroom?course=${encodeURIComponent(slug)}"><div class="eyebrow">COURSE</div><h2>${escapeHtml(course.title)}</h2><p>${getCourseLessons(course).length}개 차시 · 계속 수강하기</p></a>`);

  const cards = [...d1Cards, ...staticCards];
  if (cards.length === 0) {
    return html(classroomShell("내 강의실", `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">내 강의실</h1><p class="desc">현재 수강 가능한 강의가 없습니다. 회원용 무료 강의와 구매가 확인된 유료 강의가 이곳에 표시됩니다.</p><a class="action" href="${SITE_ORIGIN}/">강의 둘러보기</a></section>`));
  }

  return html(classroomShell("내 강의실", `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">내 강의실</h1><p class="desc">무료 강의는 로그인 후 바로 수강할 수 있고, 유료 강의는 구매 확인 후 표시됩니다.</p></section><div class="grid">${cards.join("")}</div>`));
}

async function renderClassroom(request, env, url) {
  const slug = url.searchParams.get("course");
  if (!slug) return renderClassroomHome(request, env);

  const d1Course = await getPublishedD1Course(env, slug);
  if (d1Course) return renderPublishedD1Course(request, env, url, d1Course);

  const course = COURSE_CATALOG[slug];
  if (!course) {
    return html(classroomShell("강의를 찾을 수 없습니다", `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">강의를 찾을 수 없습니다.</h1><p class="desc">주소를 다시 확인해 주세요.</p><a class="action" href="/classroom">내 강의실로</a></section>`), { status: 404 });
  }

  if (course.accessType === "public") {
    const session = await getCustomerSession(request, env);
    if (!session?.record?.member_id) return redirectToCustomerAuth();
    return renderCoursePlayer(course, "FREE CLASS", slug, url);
  }

  const result = await getCourseAccessDecision(request, env, course.productNo);
  if (result.status >= 500) return renderClassroomError(course.title);
  if (!result.body.authenticated) return redirectToCustomerAuth();
  if (!result.body.access) {
    return html(classroomShell(course.title, `<section class="card"><div class="eyebrow">MY CLASSROOM</div><h1 class="title">현재 수강할 수 없습니다.</h1><p class="desc">구매가 확인되지 않았거나 주문이 취소·환불된 강의입니다.</p><a class="action" href="/classroom">내 강의실로</a><a class="action secondary" href="${SITE_ORIGIN}/">강의 둘러보기</a></section>`), { status: 403 });
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

    if (url.pathname === "/classroom/progress" && request.method === "POST") {
      try {
        return await handleProgressPost(request, env);
      } catch {
        return renderClassroomError();
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

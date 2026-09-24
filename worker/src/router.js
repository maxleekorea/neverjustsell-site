import app from "./session-orders.js";
import {
  COURSE_CATALOG,
  findPaidCourseByProductNo,
  getVisiblePaidCourses
} from "./courses.js";
import { SITE_ORIGIN, COMMUNITY_ORIGIN, CLASSROOM_ORIGIN } from "./config.js";
import {
  listCatalogD1Courses,
  getCatalogD1Course,
  listPublishedD1Courses,
  getPublishedD1Course,
  getCourseProgress,
  touchLessonProgress,
  recordLessonWatch,
  completeLesson,
  d1CourseToPlayerCourse,
  isCourseEnrolled,
  enrollFreeCourse,
  getEnrolledCourseIds
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
    "default-src 'self'; style-src 'unsafe-inline'; script-src 'self' https://player.vimeo.com; frame-src https://player.vimeo.com; img-src 'self' data:; base-uri 'none'; form-action 'self'"
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
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:#0b0b0b;color:#f5f5f5;font-family:Arial,"Noto Sans KR",sans-serif}a{color:inherit}.wrap{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:34px 0 64px}.top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:48px}.brand{font-size:14px;letter-spacing:.18em;font-weight:700;text-decoration:none}.home{font-size:13px;color:#aaa;text-decoration:none}.card{background:#151515;border:1px solid #292929;border-radius:18px;padding:28px}.eyebrow{font-size:12px;letter-spacing:.12em;color:#999;margin-bottom:10px}.title{font-size:clamp(26px,4vw,42px);margin:0 0 14px;line-height:1.2}.desc{color:#aaa;line-height:1.75;margin:0}.video{position:relative;width:100%;aspect-ratio:16/9;margin-top:26px;background:#000;border-radius:14px;overflow:hidden}.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.action{display:inline-block;margin-top:24px;padding:13px 18px;border-radius:999px;background:#f5f5f5;color:#111;text-decoration:none;font-weight:700}.secondary{background:transparent;color:#ddd;border:1px solid #3b3b3b;margin-left:8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:20px}.course{display:block;background:#151515;border:1px solid #292929;border-radius:18px;padding:24px;text-decoration:none}.course h2{font-size:20px;margin:6px 0 10px}.course p{font-size:14px;color:#999;line-height:1.6;margin:0}.note{margin-top:18px;color:#888;font-size:13px;line-height:1.6}.lesson-list{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.lesson-link{display:inline-block;padding:10px 14px;border:1px solid #343434;border-radius:999px;color:#bbb;text-decoration:none;font-size:14px}.lesson-link.active{background:#f5f5f5;color:#111;border-color:#f5f5f5}.lesson-link.locked{opacity:.52;cursor:not-allowed}.preview-badge{color:#a8e6a8;border-color:#31513a}.lock-badge{color:#777}.preview-panel{margin-top:24px;padding-top:22px;border-top:1px solid #292929}.preview-panel h2{font-size:22px;margin:0 0 8px}.preview-panel .video{margin-top:16px}.sales-hero{padding:34px}.sales-hero .title{max-width:800px}.sales-hero .desc{max-width:760px}.sales-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;margin-top:20px;align-items:start}.sales-main{display:grid;gap:16px}.sales-section{background:#151515;border:1px solid #292929;border-radius:18px;padding:26px}.sales-section h2{font-size:22px;margin:0 0 14px}.sales-section h3{font-size:17px;margin:0 0 8px}.sales-section p{color:#aaa;line-height:1.75;white-space:pre-line}.sales-list{margin:0;padding-left:20px;color:#ddd}.sales-list li{margin:9px 0;line-height:1.55}.sales-side{position:sticky;top:20px;background:#151515;border:1px solid #292929;border-radius:18px;padding:22px}.sales-price{font-size:28px;font-weight:800;margin:6px 0 4px}.sales-side .action{width:100%;text-align:center;margin-top:16px}.sales-bottom-cta{text-align:center;padding:28px}.sales-bottom-cta .action{min-width:220px}.sales-note{font-size:12px;color:#777;line-height:1.6;margin-top:10px}.progress{height:8px;background:#252525;border-radius:999px;overflow:hidden;margin:14px 0 6px}.progress span{display:block;height:100%;background:#f5f5f5}.progress-label{font-size:12px;color:#999}.dashboard-section{margin-top:34px}.dashboard-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:12px}.dashboard-head h2{font-size:22px;margin:0}.dashboard-head p{margin:0;color:#777;font-size:13px}.course-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.badge{display:inline-block;padding:4px 8px;border:1px solid #343434;border-radius:999px;font-size:11px;color:#aaa}.course-cta{margin-top:14px;font-size:13px;font-weight:700;color:#ddd}.curriculum{margin-top:22px;border-top:1px solid #292929}.module-title{font-size:12px;color:#888;letter-spacing:.08em;margin:18px 0 8px}.lesson-row{display:flex;align-items:center;gap:8px}.lesson-row .lesson-link{flex:1}.done{font-size:12px;color:#a8e6a8}.nav-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.complete-form{display:inline}.complete-form button{margin-top:24px;padding:13px 18px;border-radius:999px;background:#f5f5f5;color:#111;border:0;font-weight:700;cursor:pointer}@media(max-width:760px){.sales-layout{grid-template-columns:1fr}.sales-side{position:static}.sales-hero{padding:22px}.sales-section{padding:20px}}@media(max-width:560px){.wrap{width:calc(100% - 20px);padding:20px 0 44px}.top{margin-bottom:24px;align-items:flex-start}.brand{font-size:12px}.card{padding:18px;border-radius:14px}.title{font-size:clamp(25px,8vw,34px)}.grid{grid-template-columns:1fr}.course{padding:20px}.lesson-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lesson-link{text-align:center;padding:11px 8px}.video{margin-top:18px;border-radius:10px}.action{width:100%;text-align:center}.secondary{margin-left:0}.top span{gap:10px!important;flex-wrap:wrap;justify-content:flex-end}}
</style>
</head>
<body><main class="wrap"><div class="top"><a class="brand" href="${SITE_ORIGIN}/">NEVER JUST SELL</a><span style="display:flex;gap:16px;align-items:center"><a class="home" href="/classroom">학습 홈</a><a class="home" href="/library">내 강의</a><a class="home" href="/courses">강의 찾기</a><a class="home" href="${COMMUNITY_ORIGIN}/">커뮤니티</a><a class="home" href="${SITE_ORIGIN}/">홈</a></span></div>${content}</main></body>
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


function formatPrice(course) {
  if (course.access_type !== "paid") return "무료";
  const price = Number(course.price_krw || 0);
  return price > 0 ? price.toLocaleString("ko-KR") + "원" : "가격 준비 중";
}

function formatAccessDuration(course) {
  const days = Number(course?.access_duration_days || 0);
  return Number.isInteger(days) && days > 0 ? "수강기간 " + days + "일" : "수강기간 무기한";
}

function courseSalesState(course) {
  const state = String(course?.sales_state || "").trim();
  if (["preparing","presale","selling","paused"].includes(state)) return state;
  return Number(course?.sales_enabled) === 1 ? "selling" : "preparing";
}

function courseSalesLabel(course) {
  return {
    preparing: "판매 준비 중",
    presale: "사전판매 중",
    selling: "판매 중",
    paused: "판매 중단"
  }[courseSalesState(course)] || "판매 준비 중";
}

function isPublicPreviewLesson(course, lesson, lessonIndex = -1) {
  const mandatoryFirstLesson = Number(lessonIndex) === 0;
  const additionalPreview = Boolean(lesson?.isPreview);
  return Boolean(
    course &&
    course.access_type === "paid" &&
    course.status === "published" &&
    lesson &&
    (mandatoryFirstLesson || additionalPreview) &&
    lesson.vimeoId &&
    ["ready", "published"].includes(String(lesson.status || ""))
  );
}

function resolvePublicPreview(course, url) {
  const playerCourse = d1CourseToPlayerCourse(course);
  const lessons = playerCourse.lessons;
  const raw = url?.searchParams.get("preview");
  if (raw === null || raw === "") {
    const firstLesson = lessons[0] || null;
    const allowed = Boolean(firstLesson) && isPublicPreviewLesson(course, firstLesson, 0);
    return {
      requested: allowed,
      valid: true,
      allowed,
      lessonNumber: allowed ? 1 : null,
      lesson: allowed ? firstLesson : null,
      lessons
    };
  }
  const lessonNumber = Number(raw);
  const valid = Number.isInteger(lessonNumber) && lessonNumber >= 1 && lessonNumber <= lessons.length;
  const lesson = valid ? lessons[lessonNumber - 1] : null;
  const allowed = valid && isPublicPreviewLesson(course, lesson, lessonNumber - 1);
  return { requested: true, valid, allowed, lessonNumber, lesson, lessons };
}

function renderPublicPreview(course, preview) {
  if (!preview?.requested) return "";
  if (!preview.valid) {
    return '<div id="preview" class="preview-panel"><p class="note">미리보기 차시를 찾을 수 없습니다.</p></div>';
  }
  if (!preview.allowed) {
    return '<div id="preview" class="preview-panel"><div class="eyebrow">PREVIEW</div><h2>' +
      escapeHtml(preview.lesson?.title || "미리보기") +
      '</h2><p class="note">이 차시는 공개 미리보기가 아닙니다. 구매 후 강의실에서 수강할 수 있습니다.</p></div>';
  }
  return '<div id="preview" class="preview-panel"><div class="eyebrow">' +
    (preview.lessonNumber === 1 ? 'FIRST LESSON · FREE PREVIEW' : 'FREE PREVIEW') +
    '</div><h2>' +
    escapeHtml(preview.lesson.title) + '</h2>' +
    (preview.lesson.description ? '<p class="desc">' + escapeHtml(preview.lesson.description) + '</p>' : '') +
    '<div class="video"><iframe src="https://player.vimeo.com/video/' +
    encodeURIComponent(preview.lesson.vimeoId) +
    '?dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="' +
    escapeHtml(course.title) + ' ' + escapeHtml(preview.lesson.title) + ' 미리보기"></iframe></div></div>';
}

function renderCourseOutline(course, options = {}) {
  const playerCourse = d1CourseToPlayerCourse(course);
  const lessons = playerCourse.lessons;
  if (lessons.length === 0) return '<p class="note">커리큘럼 준비 중입니다.</p>';

  const paidAccess = Boolean(options.paidAccess);
  const enrolled = Boolean(options.enrolled);
  const grouped = new Map();
  lessons.forEach((lesson) => {
    const group = lesson.moduleTitle || "전체 차시";
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group).push(lesson);
  });

  let rows = '<div class="curriculum">' +
    (options.showTitle === false ? '' : '<div class="module-title">커리큘럼</div>');
  for (const [moduleTitle, moduleLessons] of grouped) {
    if (grouped.size > 1 || moduleTitle !== "전체 차시") {
      rows += '<div class="module-title">' + escapeHtml(moduleTitle) + '</div>';
    }
    rows += moduleLessons.map((lesson) => {
      const index = lessons.findIndex((item) => item.id === lesson.id) + 1;
      const label = index + '. ' + escapeHtml(lesson.title);

      if (course.access_type === "public") {
        const content = enrolled
          ? '<a class="lesson-link" href="/classroom?course=' + encodeURIComponent(course.slug) + '&lesson=' + index + '">' + label + '</a>'
          : '<span class="lesson-link locked">' + label + '</span>';
        return '<div class="lesson-row">' + content + '</div>';
      }

      if (paidAccess) {
        return '<div class="lesson-row"><a class="lesson-link" href="/classroom?course=' +
          encodeURIComponent(course.slug) + '&lesson=' + index + '">' + label +
          '</a><span class="badge">수강 가능</span></div>';
      }

      if (isPublicPreviewLesson(course, lesson, index - 1)) {
        return '<div class="lesson-row"><a class="lesson-link" href="/courses/' +
          encodeURIComponent(course.slug) + '?preview=' + index + '#preview">' + label +
          '</a><span class="badge preview-badge">' + (index === 1 ? '첫 차시 무료' : '추가 미리보기') + '</span></div>';
      }

      const previewPending = (index === 1 || lesson.isPreview) && !isPublicPreviewLesson(course, lesson, index - 1);
      return '<div class="lesson-row"><span class="lesson-link locked">' + label +
        '</span><span class="badge lock-badge">' + (previewPending ? '미리보기 준비 중' : '잠김') + '</span></div>';
    }).join('');
  }
  return rows + '</div>';
}

function salesLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderSalesListSection(title, value) {
  const lines = salesLines(value);
  if (lines.length === 0) return "";
  return '<section class="sales-section"><h2>' + escapeHtml(title) + '</h2><ul class="sales-list">' +
    lines.map((line) => '<li>' + escapeHtml(line) + '</li>').join('') +
    '</ul></section>';
}

function renderSalesTextSection(title, value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return '<section class="sales-section"><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(text) + '</p></section>';
}

function renderInstructorSection(course) {
  const name = String(course?.instructor_name || "").trim();
  const bio = String(course?.instructor_bio || "").trim();
  if (!name && !bio) return "";
  return '<section class="sales-section"><div class="eyebrow">INSTRUCTOR</div><h2>강사 소개</h2>' +
    (name ? '<h3>' + escapeHtml(name) + '</h3>' : '') +
    (bio ? '<p>' + escapeHtml(bio) + '</p>' : '') +
    '</section>';
}

async function renderCourseCatalog(request, env) {
  const courses = await listCatalogD1Courses(env);
  const session = await getCustomerSession(request, env);
  const memberId = session?.record?.member_id || null;
  const accessibleCourses = memberId ? await loadAccessibleD1Courses(request, env, memberId) : [];
  const accessibleIds = new Set(accessibleCourses.map((course) => course.id));

  const cards = courses.map((course) => {
    const enrolled = accessibleIds.has(course.id);
    const salesState = courseSalesState(course);
    const label = enrolled
      ? "수강 중"
      : (course.access_type === "paid"
          ? formatPrice(course) + " · " + courseSalesLabel(course)
          : "무료");
    const cta = enrolled
      ? "계속 수강"
      : (course.access_type === "paid"
          ? (salesState === "presale" ? "사전판매 보기" : "강의 보기")
          : "무료 수강 신청");
    return '<a class="course" href="/courses/' + encodeURIComponent(course.slug) + '">' +
      '<div class="eyebrow">' + escapeHtml(label) + '</div>' +
      '<h2>' + escapeHtml(course.title) + '</h2>' +
      '<p>' + escapeHtml(course.summary || "") + '</p>' +
      '<div class="action" style="margin-top:16px">' + escapeHtml(cta) + '</div></a>';
  }).join("");

  const content = courses.length
    ? '<section class="card"><div class="eyebrow">COURSE CATALOG</div><h1 class="title">강의 찾기</h1><p class="desc">수강할 강의를 선택하세요. 무료 강의도 수강 신청 후 내 강의실에 추가됩니다.</p></section><div class="grid">' + cards + '</div>'
    : '<section class="card"><div class="eyebrow">COURSE CATALOG</div><h1 class="title">강의 찾기</h1><p class="desc">현재 신청 가능한 강의가 없습니다.</p></section>';

  return html(classroomShell("강의 찾기", content));
}

async function renderCourseLanding(request, env, slug) {
  const course = await getCatalogD1Course(env, slug);
  if (!course) {
    return html(classroomShell("강의를 찾을 수 없습니다", '<section class="card"><h1 class="title">강의를 찾을 수 없습니다.</h1><a class="action" href="/courses">강의 찾기로</a></section>'), { status: 404 });
  }

  const session = await getCustomerSession(request, env);
  const memberId = session?.record?.member_id || null;
  const enrolled = memberId ? await isCourseEnrolled(env, memberId, course.id) : false;
  const playerCourse = d1CourseToPlayerCourse(course);
  const lessonCount = playerCourse.lessons.length;
  const contentPublished = course.status === "published" && Number(course.visible) === 1;
  const url = new URL(request.url);
  const preview = resolvePublicPreview(course, url);
  const previewCount = playerCourse.lessons.filter((lesson, index) => isPublicPreviewLesson(course, lesson, index)).length;
  let paidAccess = false;
  if (memberId && course.access_type === "paid" && Number(course.cafe24_product_no) > 0) {
    const decision = await getCourseAccessDecision(
      request,
      env,
      Number(course.cafe24_product_no),
      course.id
    );
    paidAccess = Boolean(decision.body.access);
  }

  let cta = "";
  if (course.access_type === "public") {
    if (enrolled && contentPublished) {
      cta = '<a class="action" href="/classroom?course=' + encodeURIComponent(course.slug) + '">수강 계속하기</a>';
    } else if (enrolled) {
      cta = '<span class="action secondary">수강 준비 중</span>';
    } else if (memberId) {
      cta = '<form method="post" action="/courses/enroll"><input type="hidden" name="course_slug" value="' + escapeHtml(course.slug) + '"><button class="action" style="border:0;cursor:pointer" type="submit">무료 수강 신청</button></form>';
    } else {
      const returnTo = CLASSROOM_ORIGIN + '/courses/' + encodeURIComponent(course.slug);
      cta = '<a class="action" href="/oauth/cafe24/customer/start?return_to=' + encodeURIComponent(returnTo) + '">로그인하고 무료 수강 신청</a>';
    }
  } else if (paidAccess && contentPublished) {
    cta = '<a class="action" href="/classroom?course=' + encodeURIComponent(course.slug) + '">수강 계속하기</a>';
  } else if (paidAccess) {
    cta = '<span class="action secondary">수강 준비 중</span>';
  } else {
    const salesState = courseSalesState(course);
    if (salesState === "presale" && course.sales_url) {
      cta = '<a class="action" href="' + escapeHtml(course.sales_url) + '">사전판매 구매하기</a>';
    } else if (salesState === "selling" && course.sales_url) {
      cta = '<a class="action" href="' + escapeHtml(course.sales_url) + '">구매하기</a>';
    } else if (salesState === "paused") {
      cta = '<span class="action secondary">판매 중단</span>';
    } else {
      cta = '<span class="action secondary">판매 준비 중</span>';
    }
  }

  const metaText = lessonCount + '개 차시 · ' +
    (course.access_type === "public" ? '회원 무료' : '구매 후 수강') +
    (course.access_type === "paid" && previewCount > 0 ? ' · 무료 미리보기 ' + previewCount + '개' : '') +
    (course.access_type === "paid" ? ' · ' + courseSalesLabel(course) + ' · ' + formatAccessDuration(course) : '');

  const previewBlock = renderPublicPreview(course, preview);
  const audienceSection = renderSalesListSection("이런 분께 추천합니다", course.target_audience);
  const outcomeSection = renderSalesListSection("이 강의에서 배우는 내용", course.learning_outcomes);
  const instructorSection = renderInstructorSection(course);
  const accessSection = course.access_type === "paid"
    ? renderSalesTextSection("수강 이용 안내", course.access_info)
    : "";
  const refundSection = course.access_type === "paid"
    ? renderSalesTextSection("환불 안내", course.refund_policy_text)
    : "";
  const curriculumSection =
    '<section class="sales-section"><h2>커리큘럼</h2>' +
    renderCourseOutline(course, {
      paidAccess: paidAccess && contentPublished,
      enrolled: enrolled && contentPublished,
      showTitle: false
    }) + '</section>';

  const previewSection = previewBlock
    ? '<section class="sales-section">' + previewBlock + '</section>'
    : '';

  const sideNote = course.access_type === "paid"
    ? ({
        preparing: '현재 신규 구매는 준비 중입니다.',
        presale: '사전판매 중입니다. 결제 후 수강권은 생성되며, 강의 게시 전에는 ‘수강 준비 중’으로 표시됩니다.',
        selling: 'Cafe24 회원으로 구매 후 수강권을 확인하고 게시된 강의를 바로 수강할 수 있습니다.',
        paused: '현재 신규 구매가 중단되어 있습니다. 기존 수강생의 수강권은 유지됩니다.'
      }[courseSalesState(course)] || '현재 신규 구매는 준비 중입니다.')
    : 'Cafe24 회원 로그인 후 무료 수강 신청할 수 있습니다.';

  return html(classroomShell(
    course.title,
    '<section class="card sales-hero"><div class="eyebrow">' + escapeHtml(formatPrice(course)) + '</div>' +
    '<h1 class="title">' + escapeHtml(course.title) + '</h1>' +
    '<p class="desc">' + escapeHtml(course.summary || "") + '</p>' +
    '<p class="note">' + escapeHtml(metaText) + '</p>' +
    cta + '</section>' +
    '<div class="sales-layout"><main class="sales-main">' +
    audienceSection + outcomeSection + previewSection + curriculumSection +
    instructorSection + accessSection + refundSection +
    '<section class="sales-section sales-bottom-cta"><h2>수강을 시작하시겠습니까?</h2>' +
    '<p class="note">' + escapeHtml(formatPrice(course)) + ' · ' + escapeHtml(metaText) + '</p>' +
    cta + '</section></main>' +
    '<aside class="sales-side"><div class="eyebrow">COURSE</div><div class="sales-price">' +
    escapeHtml(formatPrice(course)) + '</div><div class="note">' + escapeHtml(metaText) + '</div>' +
    cta + '<div class="sales-note">' + escapeHtml(sideNote) + '</div></aside></div>'
  ));
}

async function handleFreeEnrollment(request, env) {
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) {
    return redirectToCustomerAuth();
  }

  const form = await request.formData().catch(() => null);
  const slug = String(form?.get("course_slug") || "").trim();
  const course = await getPublishedD1Course(env, slug);
  if (!course || course.access_type !== "public") {
    return json({ ok: false, error: "free_course_not_found" }, { status: 404 });
  }

  await enrollFreeCourse(env, session.record.member_id, course);
  return Response.redirect(
    new URL('/classroom?course=' + encodeURIComponent(course.slug), CLASSROOM_ORIGIN).toString(),
    303
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
  const enrolledIds = await getEnrolledCourseIds(env, memberId);
  return full.filter((course) =>
    course.access_type === "paid"
      ? paidAccess.has(Number(course.cafe24_product_no))
      : enrolledIds.has(course.id)
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
    ? `<div class="video"><iframe id="learning-player" data-learning-player data-course-slug="${escapeHtml(slug)}" data-lesson-id="${escapeHtml(selectedLesson.id)}" src="https://player.vimeo.com/video/${encodeURIComponent(selectedLesson.vimeoId)}?dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${escapeHtml(playerCourse.title)} ${escapeHtml(selectedLesson.title)}"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script><script src="/classroom/player-tracking.js"></script>`
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

  if (course.access_type === "public") {
    const enrolled = await isCourseEnrolled(env, session.record.member_id, course.id);
    if (!enrolled) {
      return html(
        classroomShell(
          course.title,
          '<section class="card"><div class="eyebrow">ENROLLMENT REQUIRED</div><h1 class="title">수강 신청이 필요합니다.</h1><p class="desc">무료 강의도 수강 신청 후 내 강의실에서 이용할 수 있습니다.</p><a class="action" href="/courses/' + encodeURIComponent(course.slug) + '">무료 수강 신청</a></section>'
        ),
        { status: 403 }
      );
    }
  }

  if (course.access_type === "paid") {
    const productNo = Number(course.cafe24_product_no);
    if (!Number.isInteger(productNo) || productNo <= 0) {
      return renderClassroomError(course.title);
    }
    const decision = await getCourseAccessDecision(request, env, productNo, course.id);
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

async function handleWatchPost(request, env) {
  const origin = String(request.headers.get("Origin") || "");
  if (origin && origin !== CLASSROOM_ORIGIN) {
    return json({ ok: false, error: "origin_rejected" }, { status: 403 });
  }
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) return json({ ok: false, error: "login_required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const slug = String(body?.course_slug || "").trim();
  const lessonId = String(body?.lesson_id || "").trim();
  const positionSeconds = Math.max(0, Number(body?.position_seconds || 0) || 0);
  const watchedDeltaSeconds = Math.max(0, Number(body?.watched_delta_seconds || 0) || 0);

  const course = await getPublishedD1Course(env, slug);
  if (!course || !course.lessons.some((lesson) => lesson.id === lessonId)) {
    return json({ ok: false, error: "invalid_progress_target" }, { status: 400 });
  }

  if (course.access_type === "public") {
    const enrolled = await isCourseEnrolled(env, session.record.member_id, course.id);
    if (!enrolled) return json({ ok: false, error: "course_enrollment_required" }, { status: 403 });
  } else {
    const decision = await getCourseAccessDecision(request, env, Number(course.cafe24_product_no), course.id);
    if (!decision.body.access) return json({ ok: false, error: "course_access_required" }, { status: 403 });
  }

  await recordLessonWatch(
    env,
    session.record.member_id,
    course.id,
    lessonId,
    positionSeconds,
    watchedDeltaSeconds
  );
  return json({ ok: true });
}

function learningPlayerTrackingScript() {
  return `(function(){
    const iframe=document.querySelector('[data-learning-player]');
    if(!iframe||!window.Vimeo||!window.Vimeo.Player)return;
    const player=new window.Vimeo.Player(iframe);
    const courseSlug=iframe.dataset.courseSlug||'';
    const lessonId=iframe.dataset.lessonId||'';
    let lastSeconds=null;
    let pending=0;
    let lastSentAt=Date.now();

    async function flush(force){
      if(!pending&&!force)return;
      const delta=Math.max(0,Math.min(30,Math.floor(pending)));
      pending=0;
      lastSentAt=Date.now();
      let position=Number.isFinite(lastSeconds)?lastSeconds:0;
      if(!force){try{position=await player.getCurrentTime();}catch(_){}}
      const payload={course_slug:courseSlug,lesson_id:lessonId,position_seconds:position,watched_delta_seconds:delta};
      const body=JSON.stringify(payload);
      if(force&&navigator.sendBeacon){
        navigator.sendBeacon('/classroom/progress/watch',new Blob([body],{type:'application/json'}));
        return;
      }
      fetch('/classroom/progress/watch',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,credentials:'same-origin'}).catch(function(){});
    }

    player.on('timeupdate',function(data){
      const current=Number(data&&data.seconds);
      if(!Number.isFinite(current))return;
      if(lastSeconds!==null){
        const step=current-lastSeconds;
        if(step>0&&step<=3)pending+=step;
      }
      lastSeconds=current;
      if(pending>=10||Date.now()-lastSentAt>=15000)flush(false);
    });
    player.on('seeked',function(data){lastSeconds=Number(data&&data.seconds)||null;});
    player.on('pause',function(){flush(false);});
    player.on('ended',function(){flush(true);});
    window.addEventListener('pagehide',function(){flush(true);});
  })();`;
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
  if (course.access_type === "public") {
    const enrolled = await isCourseEnrolled(env, session.record.member_id, course.id);
    if (!enrolled) return json({ ok: false, error: "course_enrollment_required" }, { status: 403 });
  } else {
    const decision = await getCourseAccessDecision(request, env, Number(course.cafe24_product_no));
    if (!decision.body.access) return json({ ok: false, error: "course_access_required" }, { status: 403 });
  }
  await completeLesson(env, session.record.member_id, course.id, lessonId);
  const safeNext = next.startsWith("/classroom") ? next : "/classroom";
  return Response.redirect(new URL(safeNext, CLASSROOM_ORIGIN).toString(), 303);
}


function learnerCourseCard(course, playerCourse, progress, label = "") {
  const lessonCount = playerCourse.lessons.length;
  const continueLesson = lessonNumberById(playerCourse, progress.continueLessonId);
  const status = progress.percent === 100
    ? "완료"
    : progress.lastActivity
      ? "학습 중"
      : "수강 시작";
  const eyebrow = label || (course.access_type === "paid" ? "유료 강의" : "무료 강의");
  const cta = progress.percent === 100 ? "다시 보기" : progress.lastActivity ? "이어서 학습" : "학습 시작";

  return '<a class="course" href="/classroom?course=' + encodeURIComponent(course.slug) + '&lesson=' + continueLesson + '">' +
    '<div class="eyebrow">' + escapeHtml(eyebrow) + '</div>' +
    '<h2>' + escapeHtml(course.title) + '</h2>' +
    '<p>' + lessonCount + '개 차시 · ' + progress.percent + '% 완료</p>' +
    '<div class="progress"><span style="width:' + progress.percent + '%"></span></div>' +
    '<div class="course-meta"><span class="badge">' + escapeHtml(status) + '</span><span class="badge">' +
      (course.access_type === "paid" ? "구매 강의" : "무료 신청") + '</span></div>' +
    '<div class="course-cta">' + escapeHtml(cta) + ' →</div></a>';
}

function dashboardSection(title, description, cards, moreHref = null, moreLabel = "전체 보기") {
  if (!cards.length) return "";
  return '<section class="dashboard-section"><div class="dashboard-head"><div><h2>' + escapeHtml(title) +
    '</h2>' + (description ? '<p>' + escapeHtml(description) + '</p>' : '') + '</div>' +
    (moreHref ? '<a class="home" href="' + escapeHtml(moreHref) + '">' + escapeHtml(moreLabel) + ' →</a>' : '') +
    '</div><div class="grid">' + cards.join("") + '</div></section>';
}

async function buildLearnerCourseRows(request, env, memberId) {
  const d1Courses = await loadAccessibleD1Courses(request, env, memberId);
  const rows = [];
  for (const course of d1Courses) {
    const playerCourse = d1CourseToPlayerCourse(course);
    const progress = await getCourseProgress(env, memberId, playerCourse);
    rows.push({ course, playerCourse, progress });
  }
  rows.sort((a, b) => {
    const aTime = a.progress.lastActivity ? Date.parse(a.progress.lastActivity) : 0;
    const bTime = b.progress.lastActivity ? Date.parse(b.progress.lastActivity) : 0;
    return bTime - aTime;
  });
  return rows;
}

async function renderLearnerLibrary(request, env) {
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) return redirectToCustomerAuth();

  const rows = await buildLearnerCourseRows(request, env, session.record.member_id);
  const cards = rows.map(({ course, playerCourse, progress }) =>
    learnerCourseCard(course, playerCourse, progress)
  );

  const paidCourses = getVisiblePaidCourses();
  const access = paidCourses.length > 0
    ? await getAccessiblePaidProductNos(request, env, paidCourses.map(([, course]) => course.productNo))
    : { productNos: new Set() };
  const staticCards = paidCourses
    .filter(([, course]) => access.productNos.has(Number(course.productNo)))
    .map(([slug, course]) =>
      '<a class="course" href="/classroom?course=' + encodeURIComponent(slug) + '">' +
      '<div class="eyebrow">기존 강의</div><h2>' + escapeHtml(course.title) + '</h2>' +
      '<p>' + getCourseLessons(course).length + '개 차시</p><div class="course-cta">학습하기 →</div></a>'
    );

  const allCards = [...cards, ...staticCards];
  const content = allCards.length
    ? '<section class="card"><div class="eyebrow">MY LIBRARY</div><h1 class="title">내 강의</h1><p class="desc">수강 신청했거나 구매한 강의를 한곳에서 관리합니다.</p></section>' +
      dashboardSection("전체 강의", "", allCards)
    : '<section class="card"><div class="eyebrow">MY LIBRARY</div><h1 class="title">내 강의</h1><p class="desc">아직 등록된 강의가 없습니다.</p><a class="action" href="/courses">강의 찾기</a></section>';

  return html(classroomShell("내 강의", content));
}

async function renderClassroomHome(request, env) {
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) return redirectToCustomerAuth();

  const memberId = session.record.member_id;
  const rows = await buildLearnerCourseRows(request, env, memberId);
  const accessibleIds = new Set(rows.map(({ course }) => course.id));

  const inProgress = rows
    .filter(({ progress }) => progress.lastActivity && progress.percent < 100)
    .slice(0, 4)
    .map(({ course, playerCourse, progress }) =>
      learnerCourseCard(course, playerCourse, progress, "이어서 학습")
    );

  const library = rows
    .slice(0, 4)
    .map(({ course, playerCourse, progress }) =>
      learnerCourseCard(course, playerCourse, progress)
    );

  const completed = rows
    .filter(({ progress }) => progress.percent === 100)
    .slice(0, 4)
    .map(({ course, playerCourse, progress }) =>
      learnerCourseCard(course, playerCourse, progress, "완료한 강의")
    );

  const catalog = await listCatalogD1Courses(env);
  const explore = catalog
    .filter((course) => !accessibleIds.has(course.id))
    .slice(0, 2)
    .map((course) =>
      '<a class="course" href="/courses/' + encodeURIComponent(course.slug) + '">' +
      '<div class="eyebrow">' + escapeHtml(formatPrice(course)) + '</div>' +
      '<h2>' + escapeHtml(course.title) + '</h2>' +
      '<p>' + escapeHtml(course.summary || "") + '</p>' +
      '<div class="course-cta">' + (course.access_type === "paid" ? "강의 자세히 보기" : "무료 수강 신청") + ' →</div></a>'
    );

  const sections = [
    dashboardSection("이어서 학습하기", "최근 학습한 강의부터 이어서 볼 수 있습니다.", inProgress),
    dashboardSection("내 강의", "현재 수강 권한이 있는 강의입니다.", library, "/library", "전체 내 강의"),
    dashboardSection("완료한 강의", "완료한 강의를 다시 복습할 수 있습니다.", completed),
    dashboardSection("새로운 강의", "아직 수강 신청하거나 구매하지 않은 강의입니다.", explore, "/courses", "강의 찾기")
  ].join("");

  const empty = sections
    ? ""
    : '<section class="card" style="margin-top:24px"><p class="desc">아직 학습할 강의가 없습니다.</p><a class="action" href="/courses">강의 찾기</a></section>';

  return html(classroomShell(
    "학습 홈",
    '<section class="card"><div class="eyebrow">LEARNING HOME</div><h1 class="title">학습 홈</h1><p class="desc">최근 학습을 이어가고, 내 강의를 확인하고, 새로운 강의를 찾을 수 있습니다.</p></section>' +
    sections + empty
  ));
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

    if (url.pathname === "/library" && request.method === "GET") {
      try {
        return await renderLearnerLibrary(request, env);
      } catch {
        return renderClassroomError("내 강의");
      }
    }

    if (url.pathname === "/courses" && request.method === "GET") {
      try {
        return await renderCourseCatalog(request, env);
      } catch {
        return renderClassroomError("강의 찾기");
      }
    }

    if (url.pathname.startsWith("/courses/") && url.pathname !== "/courses/enroll" && request.method === "GET") {
      try {
        const slug = decodeURIComponent(url.pathname.slice("/courses/".length));
        return await renderCourseLanding(request, env, slug);
      } catch {
        return renderClassroomError("강의 정보");
      }
    }

    if (url.pathname === "/courses/enroll" && request.method === "POST") {
      try {
        return await handleFreeEnrollment(request, env);
      } catch {
        return renderClassroomError("수강 신청");
      }
    }

    if (url.pathname === "/classroom/player-tracking.js" && request.method === "GET") {
      return new Response(learningPlayerTrackingScript(), {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (url.pathname === "/classroom/progress/watch" && request.method === "POST") {
      try {
        return await handleWatchPost(request, env);
      } catch {
        return json({ ok: false, error: "watch_progress_failed" }, { status: 500 });
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

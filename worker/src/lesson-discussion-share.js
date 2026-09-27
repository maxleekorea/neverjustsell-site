import { getCustomerSession } from "./session-orders.js";
import { getCatalogD1Course, isCourseEnrolled } from "./course-store.js";
import { getCourseAccessDecision } from "./access.js";
import { CLASSROOM_ORIGIN } from "./config.js";
import { ensureLessonDiscussionData } from "./lesson-discussions.js";

function cleanText(value, max = 1600) {
  return String(value ?? "").trim().slice(0, max);
}

async function learnerHasAccess(request, env, course, memberId) {
  if (course.access_type === "public") return isCourseEnrolled(env, memberId, course.id);
  const productNo = Number(course.cafe24_product_no || 0);
  if (!productNo) return false;
  const decision = await getCourseAccessDecision(request, env, productNo, course.id);
  return Boolean(decision?.body?.access);
}

function safeReturnPath(value, fallback) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export async function handleLessonDiscussionPostWithCommunityShare(request, env) {
  const origin = String(request.headers.get("Origin") || "");
  if (origin && origin !== CLASSROOM_ORIGIN) {
    return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  }

  const session = await getCustomerSession(request, env);
  const memberId = String(session?.record?.member_id || "").trim();
  if (!memberId) {
    return Response.redirect(`${CLASSROOM_ORIGIN}/oauth/cafe24/customer/start`, 302);
  }

  const form = await request.formData().catch(() => null);
  const courseSlug = cleanText(form?.get("course_slug"), 120);
  const lessonId = cleanText(form?.get("lesson_id"), 160);
  const question = cleanText(form?.get("question"), 1600);
  const shareToCommunity = String(form?.get("share_to_community") || "") === "1";
  const fallback = `/classroom?course=${encodeURIComponent(courseSlug)}`;
  const returnTo = safeReturnPath(form?.get("return_to"), fallback);

  if (question.length < 5) {
    return Response.redirect(new URL(returnTo, CLASSROOM_ORIGIN).toString(), 303);
  }

  const course = await getCatalogD1Course(env, courseSlug);
  if (!course || !Array.isArray(course.lessons) || !course.lessons.some((lesson) => lesson.id === lessonId)) {
    return new Response("강의 또는 차시를 확인할 수 없습니다.", { status: 400 });
  }
  if (!(await learnerHasAccess(request, env, course, memberId))) {
    return new Response("현재 이 강의에 질문을 남길 수 없습니다.", { status: 403 });
  }

  await ensureLessonDiscussionData(env);
  const recent = await env.COURSE_DB.prepare(`SELECT COUNT(*) AS count FROM course_discussions
    WHERE author_member_id=? AND source_type='learner' AND created_at>=datetime('now','-10 minutes')`)
    .bind(memberId).first();
  if (Number(recent?.count || 0) >= 5) {
    return new Response("짧은 시간에 질문을 너무 많이 등록했습니다. 잠시 후 다시 시도해 주세요.", { status: 429 });
  }

  const id = `learner-q-${crypto.randomUUID()}`;
  const visibility = shareToCommunity ? "public" : "course";
  await env.COURSE_DB.prepare(`INSERT INTO course_discussions
    (id,course_id,lesson_id,author_member_id,author_label,source_type,question,visibility,status,is_featured,sort_order)
    VALUES(?,?,?,?,'수강생','learner',?,?, 'open',0,999)`)
    .bind(id, course.id, lessonId, memberId, question, visibility).run();

  const fragment = shareToCommunity ? "#lesson-qna" : "#lesson-qna";
  return Response.redirect(new URL(returnTo + fragment, CLASSROOM_ORIGIN).toString(), 303);
}

function removeSalesPageQa(body) {
  return body.replace(/<style>\s*\.lesson-qna[\s\S]*?<section class="lesson-qna public-qa" id="course-qna">[\s\S]*?<\/section>(?=<\/main><\/body>)/, "");
}

function addShareControl(body) {
  if (body.includes('name="share_to_community"')) return body;
  const marker = '<input type="hidden" name="course_slug"';
  if (!body.includes(marker) || !body.includes('class="qa-form"')) return body;

  const control = `<label class="qa-community-share"><input type="checkbox" name="share_to_community" value="1"><span><strong>커뮤니티에도 공개</strong><small>선택하면 질문 내용이 공개 강의 질문에 함께 표시되어 다른 회원의 답변을 받을 수 있습니다. 선택하지 않으면 이 강의 수강 화면 안에서만 보입니다.</small></span></label>`;
  body = body.replace(marker, control + marker);
  if (!body.includes("qa-community-share{")) {
    body = body.replace("</head>", `<style>.qa-community-share{display:flex!important;align-items:flex-start;gap:10px;margin:12px 0 2px!important;padding:12px;border:1px solid #333;border-radius:12px;background:#101010;font-weight:400!important;cursor:pointer}.qa-community-share input{width:auto!important;margin:3px 0 0;accent-color:#f5f5f5}.qa-community-share span{display:block}.qa-community-share strong{display:block;font-size:13px;color:#eee}.qa-community-share small{display:block;margin-top:3px;color:#888;font-size:11px;line-height:1.55;font-weight:400}</style></head>`);
  }
  return body;
}

export async function injectLessonCommunityShareControl(response, request) {
  if (request.method !== "GET" || response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) {
    return response;
  }
  const url = new URL(request.url);
  let body = await response.text();

  if (url.pathname.startsWith("/courses/")) {
    body = removeSalesPageQa(body);
  }
  if (url.pathname === "/classroom" && url.searchParams.get("course")) {
    body = addShareControl(body);
  }

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body, { status: response.status, headers });
}

export function lessonCommunityShareContract() {
  return {
    ok: true,
    version: "lesson-community-share-v1",
    default_visibility: "course",
    opt_in_field: "share_to_community",
    opt_in_visibility: "public",
    sales_page_course_qa_removed: true,
    automatic_publication: false
  };
}

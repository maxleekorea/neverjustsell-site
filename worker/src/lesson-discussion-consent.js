import { getCustomerSession } from "./session-orders.js";
import { getCatalogD1Course, isCourseEnrolled } from "./course-store.js";
import { getCourseAccessDecision } from "./access.js";
import { CLASSROOM_ORIGIN } from "./config.js";
import { ensureLessonDiscussionData } from "./lesson-discussions.js";

const CONSENT_VERSION = "2026-09-27-lesson-discussion-consent-v1";

function cleanText(value, max = 1600) {
  return String(value || "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

function safeReturnPath(value, fallback) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

async function learnerHasAccess(request, env, course, memberId) {
  if (course.access_type === "public") return isCourseEnrolled(env, memberId, course.id);
  const productNo = Number(course.cafe24_product_no || 0);
  if (!productNo) return false;
  const decision = await getCourseAccessDecision(request, env, productNo, course.id);
  return Boolean(decision?.body?.access);
}

function selectedVisibility(form) {
  return String(form?.get("share_scope") || "course") === "community" ? "community" : "course";
}

export async function handleLessonDiscussionConsentPost(request, env) {
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
  const visibility = selectedVisibility(form);
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
  const id = `learner-q-${crypto.randomUUID()}`;
  await env.COURSE_DB.prepare(`INSERT INTO course_discussions
    (id,course_id,lesson_id,author_member_id,author_label,source_type,question,visibility,status,is_featured,sort_order)
    VALUES(?,?,?,?,'수강생','learner',?,?, 'open',0,999)`)
    .bind(id, course.id, lessonId, memberId, question, visibility).run();

  return Response.redirect(new URL(returnTo + "#lesson-qna", CLASSROOM_ORIGIN).toString(), 303);
}

function consentMarkup() {
  return `<style>
  .qa-share{margin:12px 0 2px;padding:13px 14px;border:1px solid #353535;border-radius:12px;background:#111}
  .qa-share legend{padding:0 5px;color:#ddd;font-size:12px;font-weight:800}
  .qa-share-options{display:grid;gap:8px}
  .qa-share-option{display:flex;align-items:flex-start;gap:9px;padding:9px 10px;border:1px solid #2f2f2f;border-radius:10px;cursor:pointer;color:#ddd;font-size:13px;line-height:1.45}
  .qa-share-option input{margin-top:3px;accent-color:#eee}
  .qa-share-option strong{display:block;color:#f3f3f3;font-size:13px}.qa-share-option span{display:block;color:#8f8f8f;font-size:11px;margin-top:2px}
  .qa-share-note{margin:9px 1px 0;color:#777;font-size:11px;line-height:1.55}
  @media(max-width:560px){.qa-share{padding:11px}.qa-share-option{padding:10px}}
  </style><fieldset class="qa-share"><legend>질문 공개 범위</legend><div class="qa-share-options"><label class="qa-share-option"><input type="radio" name="share_scope" value="course" checked><span><strong>강의 안에서만 공유</strong><span>이 강의를 이용하는 수강생과 운영진이 함께 봅니다.</span></span></label><label class="qa-share-option"><input type="radio" name="share_scope" value="community"><span><strong>커뮤니티에도 공유</strong><span>질문 내용이 커뮤니티에 공개되고 다른 회원도 답변할 수 있습니다.</span></span></label></div><p class="qa-share-note">커뮤니티 공유를 선택해도 공개 화면에는 Cafe24 회원 ID를 표시하지 않습니다. 선택하지 않으면 강의 내부 공유가 기본입니다.</p></fieldset>`;
}

export async function injectLessonDiscussionConsent(response, request) {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname !== "/classroom" || !url.searchParams.get("course")) return response;
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;

  const body = await response.text();
  const marker = `</textarea><input type="hidden" name="course_slug"`;
  if (!body.includes(marker) || body.includes('name="share_scope"')) {
    return new Response(body, { status: response.status, headers: response.headers });
  }

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, `</textarea>${consentMarkup()}<input type="hidden" name="course_slug"`), {
    status: response.status,
    headers
  });
}

export { CONSENT_VERSION };

import { getMemberSession } from "./spaces.js";
import { notifyMember } from "./notifications.js";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraphs(value) {
  return esc(value).replaceAll("\n", "<br>");
}

function redirect(location, status = 303) {
  return new Response(null, { status, headers: { Location: location, "Cache-Control": "no-store" } });
}

async function loadDiscussions(env) {
  if (!env.AUTH_BRIDGE || typeof env.AUTH_BRIDGE.listCommunityCourseDiscussions !== "function") return [];
  const result = await env.AUTH_BRIDGE.listCommunityCourseDiscussions(100);
  return result?.ok && Array.isArray(result.items) ? result.items : [];
}

function page(items, session) {
  const groups = new Map();
  for (const item of items) {
    const key = String(item.course_title || "강의 질문");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const groupHtml = [...groups.entries()].map(([courseTitle, rows]) => {
    const cards = rows.map((item) => {
      const replies = Array.isArray(item.replies) ? item.replies : [];
      const source = item.source_type === "learner" ? "수강생 질문" : "대표 질문";
      const status = replies.length ? `답변 ${replies.length}` : "답변 기다리는 중";
      const replyHtml = replies.map((reply) => `<div class="reply"><div class="reply-who">${esc(reply.author_label || "답변")}</div><div>${paragraphs(reply.body)}</div></div>`).join("");
      const form = session
        ? `<details class="answer"><summary>답변하기</summary><form method="post" action="/course-questions/${encodeURIComponent(item.id)}/reply"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><textarea name="body" maxlength="5000" required placeholder="질문에 도움이 되는 경험이나 답변을 적어 주세요."></textarea><button type="submit">답변 등록</button></form></details>`
        : `<a class="login-answer" href="/login?return_to=${encodeURIComponent(`/course-questions#q-${item.id}`)}">로그인하고 답변하기</a>`;
      const courseUrl = `https://classroom.neverjustsell.com/courses/${encodeURIComponent(item.course_slug || "")}`;
      return `<article class="qa" id="q-${esc(item.id)}"><div class="qa-meta"><span>${esc(source)}</span><span>${esc(item.lesson_title || "")}</span><span>${status}</span></div><h3>${esc(item.question || "")}</h3><div class="replies">${replyHtml || `<div class="waiting">아직 답변이 없습니다.</div>`}</div><div class="qa-actions">${form}<a class="context" href="${courseUrl}">강의 맥락 보기</a></div></article>`;
    }).join("");
    return `<section class="course-group"><div class="course-head"><h2>${esc(courseTitle)}</h2><span>${rows.length}개 질문</span></div><div class="qa-list">${cards}</div></section>`;
  }).join("");

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>강의 질문 | NEVER JUST SELL Community</title><meta name="description" content="강의에서 시작된 질문을 커뮤니티에서 함께 답하는 공간"><style>
*{box-sizing:border-box}body{margin:0;background:#f4f1ec;color:#171512;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(920px,calc(100% - 32px));margin:0 auto}.top{min-height:66px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #ddd6cc}.brand{font-size:14px;font-weight:900;letter-spacing:.06em;text-decoration:none}.nav{display:flex;gap:14px;flex-wrap:wrap;font-size:13px}.hero{padding:52px 0 18px}.eyebrow{font-size:11px;font-weight:850;letter-spacing:.12em;color:#77502e}.hero h1{font-size:clamp(34px,6vw,56px);line-height:1.08;letter-spacing:-.05em;margin:8px 0 12px}.hero p{max-width:720px;color:#6f675f;margin:0}.course-group{margin-top:38px}.course-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:12px}.course-head h2{font-size:25px;margin:0}.course-head span{font-size:12px;color:#7c736a}.qa-list{display:grid;gap:10px}.qa{background:#fff;border:1px solid #ddd5cb;padding:24px;scroll-margin-top:20px}.qa-meta{display:flex;gap:9px;flex-wrap:wrap;font-size:11px;color:#786f66}.qa-meta span:first-child{font-weight:850;color:#765333}.qa h3{font-size:20px;line-height:1.5;margin:8px 0 16px}.replies{display:grid;gap:8px}.reply{background:#f7f4ef;border-left:3px solid #c2a381;padding:13px 15px;font-size:14px}.reply-who{font-size:11px;font-weight:850;color:#765333;margin-bottom:4px}.waiting{font-size:13px;color:#837970}.qa-actions{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-top:14px;padding-top:13px;border-top:1px solid #eee7df}.answer{flex:1}.answer summary{cursor:pointer;font-size:13px;font-weight:850;list-style:none}.answer summary::-webkit-details-marker{display:none}.answer textarea{width:100%;min-height:100px;margin-top:10px;border:1px solid #cfc6bb;padding:11px;font:inherit;resize:vertical}.answer button{margin-top:8px;border:0;background:#171512;color:#fff;padding:9px 13px;font-weight:800;cursor:pointer}.login-answer,.context{font-size:12px;font-weight:750}.context{white-space:nowrap;color:#6f675f}.empty{background:#fff;border:1px solid #ddd5cb;padding:30px;margin-top:28px;color:#716960}.foot{padding:30px 0 50px;border-top:1px solid #ddd6cc;margin-top:50px;color:#81786f;font-size:12px}@media(max-width:650px){.shell{width:calc(100% - 22px)}.top{align-items:flex-start;padding:14px 0}.hero{padding-top:36px}.qa{padding:18px}.qa-actions{display:block}.context{display:inline-block;margin-top:12px}.course-head{align-items:flex-start}}
</style></head><body><header class="shell top"><a class="brand" href="/">NEVER JUST SELL COMMUNITY</a><nav class="nav"><a href="/">커뮤니티</a><a href="/write?intent=question">질문하기</a><a href="/spaces">내 모임</a><a href="/notifications">알림</a><a href="https://classroom.neverjustsell.com/courses">강의</a></nav></header><main class="shell"><section class="hero"><div class="eyebrow">SHARED COURSE DISCUSSIONS</div><h1>강의에서 이어진 질문</h1><p>수강 중 생긴 질문과 대표 질문을 같은 원본으로 관리합니다. 공개된 질문은 누구나 읽을 수 있고, 회원은 이곳에서 답변을 보탤 수 있습니다. 답변은 해당 강의 차시에도 그대로 이어집니다.</p></section>${groupHtml || `<div class="empty">공개된 강의 질문이 아직 없습니다.</div>`}</main><footer class="shell foot">강의와 커뮤니티가 같은 대화를 공유합니다.</footer></body></html>`;
}

export async function handleCourseDiscussionRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/course-questions" && !url.pathname.startsWith("/course-questions/")) return null;

  if (request.method === "GET" && url.pathname === "/course-questions") {
    const [items, session] = await Promise.all([loadDiscussions(env), getMemberSession(request, env)]);
    return new Response(page(items, session), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": session ? "no-store" : "public, max-age=30, s-maxage=60",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });
  }

  const match = url.pathname.match(/^\/course-questions\/([^/]+)\/reply$/);
  if (request.method === "POST" && match) {
    const session = await getMemberSession(request, env);
    if (!session) return redirect(`/login?return_to=${encodeURIComponent("/course-questions")}`, 302);
    const form = await request.formData().catch(() => null);
    if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) {
      return new Response("요청을 확인할 수 없습니다.", { status: 403 });
    }
    const body = String(form.get("body") || "").trim().slice(0, 5000);
    if (!body) return new Response("답변 내용을 입력해 주세요.", { status: 400 });
    let discussionId;
    try { discussionId = decodeURIComponent(match[1]); } catch { return new Response("잘못된 질문 주소입니다.", { status: 400 }); }
    if (!env.AUTH_BRIDGE || typeof env.AUTH_BRIDGE.replyToCommunityCourseDiscussion !== "function") {
      return new Response("강의 질문 연결을 확인할 수 없습니다.", { status: 503 });
    }
    const result = await env.AUTH_BRIDGE.replyToCommunityCourseDiscussion({
      discussion_id: discussionId,
      member_id: String(session.member_id),
      body
    });
    if (!result?.ok) {
      const status = result?.error === "rate_limited" ? 429 : result?.error === "discussion_not_found" ? 404 : 400;
      return new Response(result?.error === "rate_limited" ? "짧은 시간에 답변을 너무 많이 등록했습니다." : "답변을 등록하지 못했습니다.", { status });
    }
    if (result.discussion_author_member_id) {
      await notifyMember(env, {
        memberId: result.discussion_author_member_id,
        actorMemberId: session.member_id,
        type: "course_reply",
        title: `강의 질문 ‘${String(result.question || "").slice(0,80)}’에 새 답변이 달렸습니다.`,
        targetUrl: `/course-questions#q-${encodeURIComponent(discussionId)}`
      });
    }
    return redirect(`/course-questions#q-${encodeURIComponent(discussionId)}`);
  }

  return new Response("페이지를 찾을 수 없습니다.", { status: 404 });
}

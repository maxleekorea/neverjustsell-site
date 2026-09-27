import programReviewApp, { injectProgramReviewLink } from "./program-review.js";
import { ensureProgramSchema } from "./program-schema.js";

function html(message, status = 409) {
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>검토 요청 확인 | NEVER JUST SELL</title></head><body><main style="max-width:680px;margin:70px auto;padding:20px;font-family:Arial,'Noto Sans KR',sans-serif"><h1>검토 요청을 다시 확인해 주세요.</h1><p>${String(message || "처리할 수 없는 상태입니다.").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}</p><p><a href="/program-host/review">제출 검토로 돌아가기</a></p></main></body></html>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}

async function guardReviewAction(request, env) {
  const form = await request.clone().formData().catch(() => null);
  if (!form) return html("검토 요청을 읽을 수 없습니다.", 400);

  const missionId = String(form.get("mission_id") || "").trim();
  const memberId = String(form.get("member_id") || "").trim();
  const decision = String(form.get("decision") || "").trim();
  const note = String(form.get("review_note") || "").trim();

  if (["revision_requested", "rejected"].includes(decision) && !note) {
    return html("수정 요청이나 반려에는 참가자가 다음 행동을 알 수 있도록 검토 메모가 필요합니다.", 400);
  }

  if (!env?.COURSE_DB || !missionId || !memberId) return null;
  await ensureProgramSchema(env);
  const row = await env.COURSE_DB.prepare(
    "SELECT status FROM program_mission_submissions WHERE mission_id=? AND member_id=? LIMIT 1"
  ).bind(missionId, memberId).first();

  if (!row) return html("검토할 제출물을 찾을 수 없습니다.", 404);
  if (String(row.status || "") !== "submitted") {
    return html("이미 검토가 끝난 제출물입니다. 참가자가 다시 제출하면 검토함에 새로 나타납니다.", 409);
  }
  return null;
}

async function filterReviewInbox(response, request) {
  if (request.method !== "GET") return response;
  const url = new URL(request.url);
  if (url.pathname !== "/program-host/review") return response;
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;

  const body = await response.text();
  let removed = 0;
  let filtered = body.replace(/<section class="card">[\s\S]*?<\/section>/g, (section) => {
    if (
      section.includes('<span class="pill">revision_requested</span>') ||
      section.includes('<span class="pill">rejected</span>')
    ) {
      removed += 1;
      return "";
    }
    return section;
  });

  if (removed > 0 && !filtered.includes('class="submission"')) {
    filtered = filtered.replace("</main>", '<div class="empty">현재 검토할 제출물이 없습니다.</div></main>');
  }

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  headers.set("X-NJS-Review-Guard", removed ? `filtered-${removed}` : "clean");
  return new Response(filtered, { status: response.status, headers });
}

const guardedProgramReviewApp = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/program-host/review/action") {
      const rejected = await guardReviewAction(request, env);
      if (rejected) return rejected;
    }
    const response = await programReviewApp.fetch(request, env, ctx);
    return filterReviewInbox(response, request);
  }
};

export { injectProgramReviewLink, filterReviewInbox, guardReviewAction };
export default guardedProgramReviewApp;

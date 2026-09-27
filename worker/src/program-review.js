import { getCustomerSession } from "./session-orders.js";
import { ensureProgramSchema } from "./program-schema.js";
import { canManageProgram } from "./roles.js";
import { recordValueEvent } from "./value-events.js";
import { recomputeProgramCompletion } from "./program-participant.js";
import { CLASSROOM_ORIGIN, SITE_ORIGIN, COMMUNITY_ORIGIN } from "./config.js";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function html(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | NEVER JUST SELL</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f7f9;color:#18181b;font-family:Arial,"Noto Sans KR",sans-serif;line-height:1.6}a{color:inherit}.wrap{width:min(1040px,calc(100% - 28px));margin:auto;padding:30px 0 70px}.top{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:25px}.brand{font-size:12px;font-weight:900;letter-spacing:.12em;text-decoration:none}.nav{display:flex;gap:13px;flex-wrap:wrap;font-size:12px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:20px;margin-bottom:12px}.eyebrow{font-size:11px;letter-spacing:.1em;color:#71717a;font-weight:800}h1{font-size:32px;margin:6px 0 8px}h2{font-size:19px;margin:7px 0}.muted{color:#71717a}.meta{display:flex;gap:7px;flex-wrap:wrap;color:#71717a;font-size:12px}.pill{display:inline-block;border:1px solid #e4e4e7;border-radius:999px;padding:3px 8px}.submission{white-space:pre-wrap;background:#fafafa;border:1px solid #eee;padding:14px;margin:14px 0}.evidence{font-size:12px}.actions{display:grid;grid-template-columns:1fr auto;gap:9px;align-items:end}.actions textarea{width:100%;min-height:76px;border:1px solid #d4d4d8;border-radius:9px;padding:10px;font:inherit;resize:vertical}.buttons{display:flex;gap:7px;flex-wrap:wrap}button,.action{border:0;border-radius:9px;padding:10px 13px;background:#18181b;color:#fff;font:inherit;font-weight:800;cursor:pointer;text-decoration:none}.secondary{background:#fff;color:#18181b;border:1px solid #d4d4d8}.warn{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}.danger{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}.notice{padding:13px 14px;background:#f4f4f5;border-radius:9px;margin-bottom:14px}.ok{background:#f0fdf4;color:#166534}.empty{padding:30px;background:#fff;border:1px dashed #d4d4d8;color:#71717a}@media(max-width:720px){.top{display:block}.nav{margin-top:11px}.actions{grid-template-columns:1fr}.buttons button{flex:1}}
</style></head><body><main class="wrap"><div class="top"><a class="brand" href="/program-host">NEVER JUST SELL · PROGRAM HOST</a><nav class="nav"><a href="/program-host">내 프로그램</a><a href="/program-host/review">제출 검토</a><a href="${COMMUNITY_ORIGIN}/spaces">커뮤니티</a><a href="${SITE_ORIGIN}/">홈</a></nav></div>${body}</main></body></html>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY"
    }
  });
}

function redirect(location) {
  return new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function currentMember(request, env) {
  const session = await getCustomerSession(request, env);
  return String(session?.record?.member_id || "").trim() || null;
}

function loginRedirect(request) {
  const url = new URL(request.url);
  return redirect(`${CLASSROOM_ORIGIN}/oauth/cafe24/customer/start?return_to=${encodeURIComponent(`${url.pathname}${url.search}`)}`);
}

async function reviewCandidates(env, reviewerId, runFilter = "") {
  const result = await env.COURSE_DB.prepare(`SELECT s.mission_id,s.member_id,s.submission_text,s.evidence_url,s.status AS submission_status,
    s.submitted_at,s.review_note,s.reviewed_at,
    m.run_id,m.title AS mission_title,m.mission_type,m.verification_mode,m.sequence_no,
    r.program_id,r.title AS run_title,p.title AS program_title
    FROM program_mission_submissions s
    JOIN program_run_missions m ON m.id=s.mission_id
    JOIN program_runs r ON r.id=m.run_id
    JOIN programs p ON p.id=r.program_id
    WHERE m.verification_mode='host_review'
      AND s.status IN ('submitted','revision_requested','rejected')
      AND (?='' OR m.run_id=?)
    ORDER BY CASE s.status WHEN 'submitted' THEN 0 WHEN 'revision_requested' THEN 1 ELSE 2 END,s.updated_at ASC
    LIMIT 150`).bind(runFilter, runFilter).all();
  const rows = result.results || [];
  const allowed = [];
  for (const row of rows) {
    if (await canManageProgram(env, reviewerId, row.program_id, row.run_id)) allowed.push(row);
  }
  return allowed;
}

function submissionCard(row) {
  const evidence = row.evidence_url ? `<p class="evidence"><a href="${esc(row.evidence_url)}" target="_blank" rel="noopener">첨부 링크 열기 →</a></p>` : "";
  const previous = row.review_note ? `<div class="notice"><strong>이전 검토 메모</strong><br>${esc(row.review_note)}</div>` : "";
  return `<section class="card"><div class="eyebrow">${esc(row.program_title)}</div><h2>${esc(row.mission_title)}</h2><div class="meta"><span class="pill">${esc(row.run_title)}</span><span class="pill">${esc(row.submission_status)}</span><span>회원 ${esc(row.member_id)}</span><span>${esc(String(row.submitted_at || "").slice(0,16))}</span></div><div class="submission">${esc(row.submission_text)}</div>${evidence}${previous}<form method="post" action="/program-host/review/action"><input type="hidden" name="mission_id" value="${esc(row.mission_id)}"><input type="hidden" name="member_id" value="${esc(row.member_id)}"><input type="hidden" name="run_id" value="${esc(row.run_id)}"><div class="actions"><div><label class="eyebrow" for="note-${esc(row.mission_id)}-${esc(row.member_id)}">검토 메모</label><textarea id="note-${esc(row.mission_id)}-${esc(row.member_id)}" name="review_note" maxlength="1200" placeholder="승인이라면 비워도 됩니다. 수정 요청은 무엇을 보완할지 구체적으로 남깁니다."></textarea></div><div class="buttons"><button name="decision" value="accepted" type="submit">승인</button><button class="warn" name="decision" value="revision_requested" type="submit">수정 요청</button><button class="danger" name="decision" value="rejected" type="submit">반려</button></div></div></form></section>`;
}

async function reviewPage(env, reviewerId, url) {
  const runFilter = clean(url.searchParams.get("run"), 180);
  const rows = await reviewCandidates(env, reviewerId, runFilter);
  const message = clean(url.searchParams.get("message"), 500);
  return html("제출 검토", `${message ? `<div class="notice ok">${esc(message)}</div>` : ""}<section class="card"><div class="eyebrow">HOST REVIEW</div><h1>제출 검토</h1><p class="muted">Host 검토가 필요한 활동만 모았습니다. 승인된 활동만 참가자의 완료율에 반영됩니다.</p></section>${rows.length ? rows.map(submissionCard).join("") : `<div class="empty">현재 검토할 제출물이 없습니다.</div>`}`);
}

async function reviewAction(request, env, reviewerId) {
  if (!sameOrigin(request)) return html("요청 오류", `<div class="notice">요청 출처를 확인할 수 없습니다.</div>`, 403);
  const form = await request.formData();
  const missionId = clean(form.get("mission_id"), 180);
  const memberId = clean(form.get("member_id"), 160);
  const runId = clean(form.get("run_id"), 180);
  const decision = clean(form.get("decision"), 40);
  const note = clean(form.get("review_note"), 1200);
  if (!missionId || !memberId || !runId || !["accepted","revision_requested","rejected"].includes(decision)) {
    return html("입력 오류", `<div class="notice">검토 요청이 올바르지 않습니다.</div>`, 400);
  }
  if (decision === "revision_requested" && !note) {
    return html("메모 필요", `<div class="notice">수정 요청에는 무엇을 보완할지 메모를 남겨 주세요.</div>`, 400);
  }

  const row = await env.COURSE_DB.prepare(`SELECT m.id,m.run_id,m.verification_mode,r.program_id
    FROM program_run_missions m JOIN program_runs r ON r.id=m.run_id
    JOIN program_mission_submissions s ON s.mission_id=m.id AND s.member_id=?
    WHERE m.id=? AND m.run_id=? LIMIT 1`).bind(memberId, missionId, runId).first();
  if (!row || row.verification_mode !== "host_review") return html("대상 없음", `<div class="notice">검토할 제출물을 찾을 수 없습니다.</div>`, 404);
  if (!(await canManageProgram(env, reviewerId, row.program_id, row.run_id))) return html("권한 없음", `<div class="notice">이 제출물을 검토할 권한이 없습니다.</div>`, 403);

  await env.COURSE_DB.prepare(`UPDATE program_mission_submissions SET status=?,reviewed_by=?,review_note=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE mission_id=? AND member_id=?`).bind(decision, reviewerId, note, missionId, memberId).run();

  if (decision === "accepted") {
    await recordValueEvent(env, {
      memberId,
      eventType: "program_milestone_complete",
      objectType: "program_mission",
      objectId: missionId,
      source: "program_host",
      eventKey: `program-mission-complete:${missionId}:${memberId}`,
      metadata: { run_id: runId, reviewed_by: reviewerId }
    });
  }
  const completion = await recomputeProgramCompletion(env, runId, memberId, reviewerId);
  const message = decision === "accepted"
    ? (completion.completed ? "승인했습니다. 참가자가 프로그램 완료 조건도 충족했습니다." : "승인했습니다. 참가자의 완료율에 반영했습니다.")
    : decision === "revision_requested" ? "수정 요청을 남겼습니다." : "반려 처리했습니다.";
  return redirect(`/program-host/review?run=${encodeURIComponent(runId)}&message=${encodeURIComponent(message)}`);
}

export async function injectProgramReviewLink(response, request) {
  if (request.method !== "GET") return response;
  const url = new URL(request.url);
  if (url.pathname !== "/program-host") return response;
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes('href="/program-host/review"')) return new Response(body, { status: response.status, headers: response.headers });
  const marker = '<a href="/program-host">내 프로그램</a>';
  if (!body.includes(marker)) return new Response(body, { status: response.status, headers: response.headers });
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, `${marker}<a href="/program-host/review">제출 검토</a>`), { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    if (!env.COURSE_DB) return html("제출 검토", `<div class="notice">프로그램 DB가 연결되지 않았습니다.</div>`, 503);
    try { await ensureProgramSchema(env); } catch (error) {
      console.error("program review schema failed", error);
      return html("제출 검토", `<div class="notice">프로그램 데이터를 준비하지 못했습니다.</div>`, 503);
    }
    const reviewerId = await currentMember(request, env);
    if (!reviewerId) return loginRedirect(request);
    const url = new URL(request.url);
    if (url.pathname === "/program-host/review" && request.method === "GET") return reviewPage(env, reviewerId, url);
    if (url.pathname === "/program-host/review/action" && request.method === "POST") return reviewAction(request, env, reviewerId);
    return html("페이지 없음", `<div class="notice">페이지를 찾을 수 없습니다.</div>`, 404);
  }
};

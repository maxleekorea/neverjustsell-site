import { getCustomerSession } from "./session-orders.js";
import { ensureProgramSchema } from "./program-schema.js";
import { reconcilePurchasedProgramEnrollments } from "./program-access.js";
import { recordValueEvent } from "./value-events.js";
import { CLASSROOM_ORIGIN, SITE_ORIGIN, COMMUNITY_ORIGIN } from "./config.js";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

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

function todayKst() {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function html(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)} | NEVER JUST SELL</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f2ed;color:#171512;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(920px,calc(100% - 28px));margin:auto}.top{min-height:64px;display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:1px solid #ded6cc}.brand{font-size:13px;font-weight:900;letter-spacing:.08em;text-decoration:none}.nav{display:flex;gap:13px;flex-wrap:wrap;font-size:12px}.page{padding:42px 0 70px}.eyebrow{font-size:11px;letter-spacing:.12em;font-weight:850;color:#765333}.hero h1{font-size:clamp(32px,6vw,50px);line-height:1.08;letter-spacing:-.04em;margin:8px 0 10px}.muted{color:#716960}.notice{background:#fff;border:1px solid #ddd5cb;padding:14px 16px;margin:18px 0}.notice.ok{border-left:4px solid #687f62}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-top:18px}.card{background:#fff;border:1px solid #ddd5cb;padding:21px;text-decoration:none}.card h2,.card h3{margin:7px 0}.card p{margin:0;color:#716960;font-size:13px}.meta{display:flex;gap:7px;flex-wrap:wrap;color:#786f66;font-size:12px}.badge{display:inline-block;padding:3px 8px;border:1px solid #d8cfc4;border-radius:999px;background:#faf8f4}.next{margin-top:28px;background:#171512;color:#fff;padding:25px}.next .eyebrow{color:#c5a98e}.next h2{font-size:27px;line-height:1.25;margin:8px 0}.next p{color:#d0cbc5}.action{display:inline-flex;min-height:42px;align-items:center;justify-content:center;border:0;background:#171512;color:#fff;padding:10px 15px;text-decoration:none;font:inherit;font-weight:800;cursor:pointer}.next .action{background:#fff;color:#171512}.secondary{background:#fff;color:#171512;border:1px solid #cbc1b6}.section{margin-top:30px}.section h2{font-size:22px;margin:0 0 10px}.mission{background:#fff;border:1px solid #ddd5cb;padding:19px;margin-top:8px}.mission h3{font-size:18px;margin:7px 0}.mission p{margin:0;color:#716960;font-size:13px}.mission form{margin-top:14px}.mission textarea{width:100%;min-height:125px;border:1px solid #cbc1b6;padding:11px 12px;font:inherit;resize:vertical}.mission input{width:100%;border:1px solid #cbc1b6;padding:10px 12px;font:inherit;margin-top:7px}.mission button{margin-top:9px}.progress{height:8px;background:#e4ded7;margin-top:13px;overflow:hidden}.progress>span{display:block;height:100%;background:#171512}.event{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;background:#fff;border:1px solid #ddd5cb;padding:17px;margin-top:8px}.event strong{display:block}.empty{background:#fff;border:1px dashed #cfc4b8;padding:28px;color:#716960}.foot{padding:28px 0 46px;border-top:1px solid #ddd6cc;color:#81786f;font-size:12px}@media(max-width:680px){.shell{width:calc(100% - 20px)}.top{align-items:flex-start;padding:13px 0}.nav{justify-content:flex-end}.page{padding:30px 0 55px}.grid{grid-template-columns:1fr}.next{padding:20px}.event{display:block}.event .action{margin-top:10px;width:100%}.mission .action{width:100%}}
</style></head><body><header class="shell top"><a class="brand" href="/my-space">NEVER JUST SELL · MY PROGRAM</a><nav class="nav"><a href="/programs">프로그램</a><a href="/my-space">내 공간</a><a href="${COMMUNITY_ORIGIN}/spaces">내 모임</a><a href="${SITE_ORIGIN}/">홈</a></nav></header><main class="shell page">${body}</main><footer class="shell foot">프로그램의 기록은 다음 방문에서 이어집니다.</footer></body></html>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}

function redirect(location) {
  return new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
}

async function currentMember(request, env) {
  const session = await getCustomerSession(request, env);
  return String(session?.record?.member_id || "").trim() || null;
}

function loginRedirect(request) {
  const url = new URL(request.url);
  const returnTo = `${url.pathname}${url.search}`;
  return redirect(`${CLASSROOM_ORIGIN}/oauth/cafe24/customer/start?return_to=${encodeURIComponent(returnTo)}`);
}

export function completionThreshold(snapshot) {
  try {
    const parsed = typeof snapshot === "string" ? JSON.parse(snapshot || "{}") : (snapshot || {});
    const value = Number(parsed?.threshold);
    return Number.isFinite(value) && value > 0 && value <= 1 ? value : 1;
  } catch {
    return 1;
  }
}

export function missionState(mission, today = todayKst()) {
  const submission = String(mission?.submission_status || "");
  if (submission === "accepted") return "complete";
  if (submission === "submitted") return "review";
  if (submission === "revision_requested") return "revise";
  if (submission === "rejected") return "revise";
  if (String(mission?.status || "") === "cancelled") return "cancelled";
  if (mission?.opens_at && String(mission.opens_at).slice(0, 10) > today) return "upcoming";
  if (String(mission?.status || "") === "closed") return "closed";
  if (mission?.due_at && String(mission.due_at).slice(0, 10) < today) return "overdue";
  return "open";
}

function stateLabel(state) {
  return ({
    complete: "완료",
    review: "검토 중",
    revise: "수정 필요",
    upcoming: "예정",
    overdue: "마감 지남",
    closed: "마감",
    cancelled: "취소",
    open: "진행 가능"
  })[state] || state;
}

function missionTypeLabel(type) {
  return ({
    reading: "읽기",
    watching: "시청",
    reflection: "생각 기록",
    discussion: "대화",
    assignment: "과제",
    action: "실행",
    attendance: "참석",
    proof: "인증"
  })[type] || "활동";
}

async function listEnrollments(env, memberId) {
  const result = await env.COURSE_DB.prepare(`SELECT e.run_id,e.status,e.completion_ratio,e.completed_at,
    r.program_id,r.title AS run_title,r.starts_at,r.ends_at,r.lifecycle_phase,
    p.title AS program_title,p.program_type
    FROM program_enrollments e
    JOIN program_runs r ON r.id=e.run_id
    JOIN programs p ON p.id=r.program_id
    WHERE e.member_id=? AND e.status IN ('active','completed')
      AND r.status!='cancelled' AND p.status!='archived'
    ORDER BY CASE e.status WHEN 'active' THEN 0 ELSE 1 END,COALESCE(r.starts_at,r.created_at) DESC`).bind(memberId).all();
  return result.results || [];
}

async function runForMember(env, runId, memberId) {
  return env.COURSE_DB.prepare(`SELECT e.run_id,e.status AS enrollment_status,e.completion_ratio,e.completed_at,
    r.program_id,r.title AS run_title,r.starts_at,r.ends_at,r.lifecycle_phase,r.completion_policy_snapshot,
    p.title AS program_title,p.program_type,p.description
    FROM program_enrollments e
    JOIN program_runs r ON r.id=e.run_id
    JOIN programs p ON p.id=r.program_id
    WHERE e.run_id=? AND e.member_id=? AND e.status IN ('active','completed')
      AND r.status!='cancelled' AND p.status!='archived' LIMIT 1`).bind(runId, memberId).first();
}

async function missionsForMember(env, runId, memberId) {
  const result = await env.COURSE_DB.prepare(`SELECT m.id,m.sequence_no,m.title,m.mission_type,m.prompt,m.opens_at,m.due_at,m.required,
    m.completion_weight,m.verification_mode,m.status,
    s.submission_text,s.evidence_url,s.status AS submission_status,s.review_note,s.reviewed_at,s.updated_at AS submission_updated_at
    FROM program_run_missions m
    LEFT JOIN program_mission_submissions s ON s.mission_id=m.id AND s.member_id=?
    WHERE m.run_id=? ORDER BY m.sequence_no,m.id`).bind(memberId, runId).all();
  return result.results || [];
}

async function eventsForRun(env, runId, memberId) {
  const result = await env.COURSE_DB.prepare(`SELECT e.id,e.event_type,e.title,e.description,e.starts_at,e.ends_at,e.location_type,e.location_text,e.join_url,e.status,
    r.response AS rsvp_response
    FROM program_events e LEFT JOIN program_event_rsvps r ON r.event_id=e.id AND r.member_id=?
    WHERE e.run_id=? AND e.status!='cancelled'
    ORDER BY COALESCE(e.starts_at,'9999-12-31'),e.id`).bind(memberId, runId).all();
  return result.results || [];
}

function nextMission(missions, today) {
  return missions.find((mission) => ["revise","open","overdue"].includes(missionState(mission, today))) ||
    missions.find((mission) => missionState(mission, today) === "review") ||
    missions.find((mission) => missionState(mission, today) === "upcoming") || null;
}

function nextActionCopy(mission, today) {
  if (!mission) return { eyebrow: "PROGRAM", title: "현재 필요한 활동을 모두 마쳤습니다.", body: "다음 일정이나 Host의 답변이 생기면 이곳에서 이어집니다." };
  const state = missionState(mission, today);
  if (state === "review") return { eyebrow: "HOST REVIEW", title: `${mission.title} · 검토 중`, body: "제출은 완료되었습니다. Host의 검토 결과가 반영되면 다음 행동으로 이어집니다." };
  if (state === "upcoming") return { eyebrow: "NEXT", title: mission.title, body: `${String(mission.opens_at || "").slice(0,10)}부터 진행할 수 있습니다.` };
  if (state === "revise") return { eyebrow: "REVISION", title: mission.title, body: mission.review_note || "Host의 검토 내용을 반영해 다시 제출해 주세요." };
  return { eyebrow: state === "overdue" ? "LATE ACTION" : "NOW", title: mission.title, body: mission.prompt || "이번 활동을 기록하고 다음 단계로 이어갑니다." };
}

function submissionForm(mission, runId, state) {
  if (!["open","overdue","revise"].includes(state)) return "";
  const button = state === "revise" ? "수정해서 다시 제출" : "기록 제출";
  return `<form method="post" action="/programs/${encodeURIComponent(runId)}/missions/${encodeURIComponent(mission.id)}/submit">
    <textarea name="submission_text" maxlength="5000" required placeholder="이번 활동에서 남길 내용을 적어 주세요.">${esc(mission.submission_text || "")}</textarea>
    <input name="evidence_url" maxlength="500" value="${esc(mission.evidence_url || "")}" placeholder="관련 링크가 있다면 입력 (선택)">
    <button class="action" type="submit">${button}</button>
  </form>`;
}

function missionList(missions, runId, today) {
  if (!missions.length) return `<div class="empty">아직 등록된 활동이 없습니다.</div>`;
  return missions.map((mission) => {
    const state = missionState(mission, today);
    const review = mission.review_note ? `<div class="notice"><strong>Host 메모</strong><br>${esc(mission.review_note)}</div>` : "";
    return `<article class="mission"><div class="meta"><span class="badge">${esc(missionTypeLabel(mission.mission_type))}</span><span class="badge">${esc(stateLabel(state))}</span>${mission.required ? `<span>필수</span>` : `<span>선택</span>`}${mission.due_at ? `<span>마감 ${esc(String(mission.due_at).slice(0,10))}</span>` : ""}</div><h3>${esc(mission.title)}</h3><p>${esc(mission.prompt || "")}</p>${review}${submissionForm(mission, runId, state)}</article>`;
  }).join("");
}

function eventList(events, today) {
  const visible = events.filter((event) => !event.starts_at || String(event.starts_at).slice(0,10) >= today).slice(0, 4);
  if (!visible.length) return `<div class="empty">예정된 일정이 없습니다.</div>`;
  return visible.map((event) => `<div class="event"><div><div class="meta"><span class="badge">${esc(event.event_type)}</span><span>${esc(String(event.starts_at || "일정 미정").slice(0,16))}</span></div><strong>${esc(event.title)}</strong>${event.description ? `<p class="muted">${esc(event.description)}</p>` : ""}</div>${event.join_url ? `<a class="action secondary" href="${esc(event.join_url)}" rel="noopener">참여 링크</a>` : ""}</div>`).join("");
}

async function homePage(env, memberId) {
  try { await reconcilePurchasedProgramEnrollments(env, memberId); } catch (error) { console.error("program purchase sync failed", error); }
  const rows = await listEnrollments(env, memberId);
  if (!rows.length) {
    return html("내 프로그램", `<section class="hero"><div class="eyebrow">MY PROGRAM</div><h1>참여 중인 프로그램이 없습니다.</h1><p class="muted">프로그램에 참여하면 다음 활동, 제출 기록, 수료 상태가 여기에 이어집니다.</p></section><div class="grid"><a class="card" href="${SITE_ORIGIN}/"><h2>NEVER JUST SELL 둘러보기</h2><p>공개 지식과 강의를 먼저 살펴볼 수 있습니다.</p></a><a class="card" href="${COMMUNITY_ORIGIN}/"><h2>커뮤니티 보기</h2><p>공개 질문과 사례를 읽어볼 수 있습니다.</p></a></div>`);
  }

  const cards = [];
  for (const row of rows) {
    const missions = row.status === "active" ? await missionsForMember(env, row.run_id, memberId) : [];
    const next = nextMission(missions, todayKst());
    const label = row.status === "completed" ? "수료" : next ? stateLabel(missionState(next, todayKst())) : "진행 중";
    const line = row.status === "completed" ? "완료한 기록과 수료자 모임을 이어볼 수 있습니다." : next ? `다음: ${next.title}` : "현재 필요한 활동을 모두 마쳤습니다.";
    cards.push(`<a class="card" href="/programs/${encodeURIComponent(row.run_id)}"><div class="meta"><span class="badge">${esc(label)}</span><span>${esc(row.run_title)}</span></div><h2>${esc(row.program_title)}</h2><p>${esc(line)}</p><div class="progress"><span style="width:${Math.round(Math.max(0,Math.min(1,Number(row.completion_ratio || 0)))*100)}%"></span></div></a>`);
  }

  return html("내 프로그램", `<section class="hero"><div class="eyebrow">MY PROGRAM</div><h1>지금 이어갈 프로그램.</h1><p class="muted">일정 전체보다 지금 해야 할 활동을 먼저 확인하고, 기록을 남긴 뒤 다음 단계로 이어갑니다.</p></section><div class="grid">${cards.join("")}</div>`);
}

async function detailPage(env, memberId, runId, message = "") {
  const run = await runForMember(env, runId, memberId);
  if (!run) return html("접근할 수 없음", `<div class="notice">참여 중인 프로그램을 찾을 수 없습니다. <a href="/programs">내 프로그램으로 돌아가기</a></div>`, 404);
  const [missions, events] = await Promise.all([
    missionsForMember(env, runId, memberId),
    eventsForRun(env, runId, memberId)
  ]);
  const today = todayKst();
  const next = run.enrollment_status === "completed" ? null : nextMission(missions, today);
  const nextCopy = run.enrollment_status === "completed"
    ? { eyebrow: "COMPLETED", title: "이 프로그램을 완료했습니다.", body: "남긴 기록은 그대로 보존됩니다. 완독자·수료자 모임에서 이후 대화를 이어갈 수 있습니다." }
    : nextActionCopy(next, today);
  const progress = Math.round(Math.max(0, Math.min(1, Number(run.completion_ratio || 0))) * 100);
  return html(run.program_title, `${message ? `<div class="notice ok">${esc(message)}</div>` : ""}<section class="hero"><div class="eyebrow">${esc(run.program_type)}</div><h1>${esc(run.program_title)}</h1><p class="muted">${esc(run.run_title)}${run.starts_at ? ` · ${esc(String(run.starts_at).slice(0,10))}` : ""}${run.ends_at ? ` ~ ${esc(String(run.ends_at).slice(0,10))}` : ""}</p><div class="progress"><span style="width:${progress}%"></span></div><p class="muted">승인된 필수 활동 기준 ${progress}%</p></section><section class="next"><div class="eyebrow">${esc(nextCopy.eyebrow)}</div><h2>${esc(nextCopy.title)}</h2><p>${esc(nextCopy.body)}</p>${next && ["open","overdue","revise"].includes(missionState(next,today)) ? `<a class="action" href="#mission-${encodeURIComponent(next.id)}">지금 기록하기</a>` : run.enrollment_status === "completed" ? `<a class="action" href="${COMMUNITY_ORIGIN}/spaces">수료자 모임 보기</a>` : ""}</section><section class="section"><h2>활동 기록</h2>${missions.map((m) => `<div id="mission-${esc(m.id)}">${missionList([m], runId, today)}</div>`).join("") || `<div class="empty">아직 등록된 활동이 없습니다.</div>`}</section><section class="section"><h2>다음 일정</h2>${eventList(events, today)}</section><section class="section"><div class="grid"><a class="card" href="${COMMUNITY_ORIGIN}/spaces"><div class="eyebrow">COMMUNITY</div><h3>함께 이야기하기</h3><p>질문과 실행 경험을 프로그램 모임에서 이어갑니다.</p></a><a class="card" href="/my-space"><div class="eyebrow">MY SPACE</div><h3>내 공간으로</h3><p>학습·저장·프로그램 기록을 한곳에서 확인합니다.</p></a></div></section>`);
}

function safeEvidenceUrl(value) {
  const text = clean(value, 500);
  if (!text) return null;
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

export async function recomputeProgramCompletion(env, runId, memberId, actor = "system") {
  const run = await env.COURSE_DB.prepare(
    "SELECT completion_policy_snapshot FROM program_runs WHERE id=? LIMIT 1"
  ).bind(runId).first();
  const totals = await env.COURSE_DB.prepare(`SELECT
    COALESCE(SUM(CASE WHEN m.required=1 AND m.status!='cancelled' THEN m.completion_weight ELSE 0 END),0) AS total_weight,
    COALESCE(SUM(CASE WHEN m.required=1 AND m.status!='cancelled' AND s.status='accepted' THEN m.completion_weight ELSE 0 END),0) AS accepted_weight
    FROM program_run_missions m
    LEFT JOIN program_mission_submissions s ON s.mission_id=m.id AND s.member_id=?
    WHERE m.run_id=?`).bind(memberId, runId).first();
  const totalWeight = Number(totals?.total_weight || 0);
  const acceptedWeight = Number(totals?.accepted_weight || 0);
  const ratio = totalWeight > 0 ? Math.max(0, Math.min(1, acceptedWeight / totalWeight)) : 0;
  const threshold = completionThreshold(run?.completion_policy_snapshot);

  await env.COURSE_DB.prepare(
    "UPDATE program_enrollments SET completion_ratio=?,updated_at=CURRENT_TIMESTAMP WHERE run_id=? AND member_id=?"
  ).bind(ratio, runId, memberId).run();

  const completed = totalWeight > 0 && ratio >= threshold;
  if (completed) {
    await env.COURSE_DB.prepare(`INSERT INTO program_completion_reviews(
      run_id,member_id,mission_ratio,final_ratio,result,policy_snapshot,reviewed_by,reviewed_at,updated_at
    ) VALUES(?,?,?,?,'completed',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(run_id,member_id) DO UPDATE SET
      mission_ratio=excluded.mission_ratio,final_ratio=excluded.final_ratio,result='completed',
      policy_snapshot=excluded.policy_snapshot,reviewed_by=excluded.reviewed_by,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(
        runId, memberId, ratio, ratio, String(run?.completion_policy_snapshot || "{}"), clean(actor, 128) || "system"
      ).run();
    await env.COURSE_DB.prepare(
      "UPDATE program_enrollments SET status='completed',completion_ratio=?,completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE run_id=? AND member_id=? AND status='active'"
    ).bind(ratio, runId, memberId).run();
    await recordValueEvent(env, {
      memberId,
      eventType: "program_milestone_complete",
      objectType: "program_run",
      objectId: runId,
      source: "program",
      eventKey: `program-complete:${runId}:${memberId}`,
      metadata: { completion_ratio: ratio, threshold }
    });
  }

  return { ratio, threshold, completed };
}

async function submitMission(request, env, memberId, runId, missionId) {
  if (!sameOrigin(request)) return html("요청 오류", `<div class="notice">요청 출처를 확인할 수 없습니다.</div>`, 403);
  const row = await env.COURSE_DB.prepare(`SELECT m.id,m.run_id,m.mission_type,m.verification_mode,m.opens_at,m.status,
    e.status AS enrollment_status
    FROM program_run_missions m JOIN program_enrollments e ON e.run_id=m.run_id AND e.member_id=?
    WHERE m.id=? AND m.run_id=? LIMIT 1`).bind(memberId, missionId, runId).first();
  if (!row || row.enrollment_status !== "active") return html("접근할 수 없음", `<div class="notice">현재 참여 중인 활동이 아닙니다.</div>`, 403);
  if (row.status === "cancelled" || row.status === "closed") return html("제출 마감", `<div class="notice">이 활동은 더 이상 제출할 수 없습니다.</div>`, 409);
  if (row.opens_at && String(row.opens_at).slice(0,10) > todayKst()) return html("아직 시작 전", `<div class="notice">아직 시작되지 않은 활동입니다.</div>`, 409);

  const form = await request.formData();
  const submissionText = clean(form.get("submission_text"), 5000);
  if (!submissionText) return html("내용 필요", `<div class="notice">기록할 내용을 입력해 주세요.</div>`, 400);
  const rawEvidence = clean(form.get("evidence_url"), 500);
  const evidenceUrl = rawEvidence ? safeEvidenceUrl(rawEvidence) : null;
  if (rawEvidence && !evidenceUrl) return html("링크 확인", `<div class="notice">관련 링크는 http 또는 https 주소만 사용할 수 있습니다.</div>`, 400);

  const status = row.verification_mode === "self" ? "accepted" : "submitted";
  await env.COURSE_DB.prepare(`INSERT INTO program_mission_submissions(
    mission_id,member_id,submission_text,evidence_url,status,submitted_at,reviewed_by,review_note,reviewed_at,updated_at
  ) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP,NULL,'',NULL,CURRENT_TIMESTAMP)
  ON CONFLICT(mission_id,member_id) DO UPDATE SET
    submission_text=excluded.submission_text,evidence_url=excluded.evidence_url,status=excluded.status,
    submitted_at=CURRENT_TIMESTAMP,reviewed_by=NULL,review_note='',reviewed_at=NULL,updated_at=CURRENT_TIMESTAMP`).bind(
      missionId, memberId, submissionText, evidenceUrl, status
    ).run();

  const eventType = row.mission_type === "reflection" ? "program_reflection" : "program_checkin";
  await recordValueEvent(env, {
    memberId,
    eventType,
    objectType: "program_mission",
    objectId: missionId,
    source: "program",
    eventKey: `program-submit:${missionId}:${memberId}`,
    metadata: { run_id: runId, verification_mode: row.verification_mode }
  });
  if (status === "accepted") {
    await recordValueEvent(env, {
      memberId,
      eventType: "program_milestone_complete",
      objectType: "program_mission",
      objectId: missionId,
      source: "program",
      eventKey: `program-mission-complete:${missionId}:${memberId}`,
      metadata: { run_id: runId }
    });
  }
  const completion = await recomputeProgramCompletion(env, runId, memberId, status === "accepted" ? "self_verification" : "system");
  const message = completion.completed ? "기록을 제출했고 프로그램 완료 조건을 충족했습니다." : status === "accepted" ? "기록을 저장하고 완료에 반영했습니다." : "기록을 제출했습니다. Host 검토 후 완료에 반영됩니다.";
  return redirect(`/programs/${encodeURIComponent(runId)}?message=${encodeURIComponent(message)}`);
}

export default {
  async fetch(request, env) {
    if (!env.COURSE_DB) return html("내 프로그램", `<div class="notice">프로그램 DB가 연결되지 않았습니다.</div>`, 503);
    try { await ensureProgramSchema(env); } catch (error) {
      console.error("program participant schema failed", error);
      return html("내 프로그램", `<div class="notice">프로그램 데이터를 준비하지 못했습니다.</div>`, 503);
    }

    const memberId = await currentMember(request, env);
    if (!memberId) return loginRedirect(request);
    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/programs" || url.pathname === "/programs/")) {
      return homePage(env, memberId);
    }

    const submitMatch = url.pathname.match(/^\/programs\/([^/]+)\/missions\/([^/]+)\/submit$/);
    if (request.method === "POST" && submitMatch) {
      return submitMission(request, env, memberId, decodeURIComponent(submitMatch[1]), decodeURIComponent(submitMatch[2]));
    }

    const detailMatch = url.pathname.match(/^\/programs\/([^/]+)\/?$/);
    if (request.method === "GET" && detailMatch) {
      return detailPage(env, memberId, decodeURIComponent(detailMatch[1]), url.searchParams.get("message") || "");
    }

    return html("페이지 없음", `<div class="notice">페이지를 찾을 수 없습니다. <a href="/programs">내 프로그램으로</a></div>`, 404);
  }
};

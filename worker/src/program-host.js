import { getCustomerSession } from "./session-orders.js";
import {
  PLATFORM_ROLES,
  SCOPED_ROLES,
  getActivePlatformRoles,
  hasActiveScopedRole
} from "./roles.js";
import { CLASSROOM_ORIGIN, SITE_ORIGIN, COMMUNITY_ORIGIN } from "./config.js";
import { ensureProgramSchema } from "./program-schema.js";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function html(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return new Response(body, { ...init, headers });
}

function redirect(location) {
  return new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store" }
  });
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function shell(title, body) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | NEVER JUST SELL</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f6f7f9;color:#18181b;font-family:Arial,"Noto Sans KR",sans-serif}a{color:inherit}
.wrap{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:28px 0 64px}.top{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:24px}
.brand{font-size:13px;font-weight:900;letter-spacing:.12em;text-decoration:none}.nav{display:flex;gap:14px;flex-wrap:wrap}.nav a{font-size:13px;color:#52525b;text-decoration:none}
.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:20px;margin-bottom:14px}.eyebrow{font-size:11px;color:#71717a;letter-spacing:.1em;font-weight:800}
h1{font-size:30px;margin:6px 0 8px}h2{font-size:20px;margin:0 0 12px}h3{font-size:16px;margin:0 0 8px}.muted{color:#71717a;line-height:1.6}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.program{display:block;text-decoration:none}.pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#f4f4f5;color:#52525b;font-size:11px;margin-right:5px}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}.metric{padding:12px;border:1px solid #e4e4e7;border-radius:9px}.metric strong{display:block;font-size:20px;margin-top:3px}
table{width:100%;border-collapse:collapse}th,td{padding:11px 10px;border-bottom:1px solid #eee;text-align:left;font-size:13px}th{font-size:12px;color:#71717a}
form{margin:0}label{display:block;font-size:12px;font-weight:700;color:#52525b;margin:10px 0 5px}input,button{font:inherit;border-radius:9px}input{width:100%;padding:10px 11px;border:1px solid #d4d4d8}
button,.action{display:inline-block;padding:10px 13px;border:0;border-radius:9px;background:#18181b;color:#fff;font-weight:800;text-decoration:none;cursor:pointer}.formgrid{display:grid;grid-template-columns:1fr 180px 150px;gap:9px;align-items:end}
.notice{padding:13px 14px;border-radius:9px;background:#f4f4f5;color:#52525b;margin-bottom:14px}.error{background:#fef2f2;color:#991b1b}.ok{background:#f0fdf4;color:#166534}
@media(max-width:760px){.grid,.metrics,.formgrid{grid-template-columns:1fr}.top{display:block}.nav{margin-top:12px}}
</style></head><body><main class="wrap"><div class="top"><a class="brand" href="${SITE_ORIGIN}/">NEVER JUST SELL · PROGRAM HOST</a><nav class="nav"><a href="/program-host">내 프로그램</a><a href="${CLASSROOM_ORIGIN}/classroom">내 강의실</a><a href="${COMMUNITY_ORIGIN}/">커뮤니티</a><a href="${SITE_ORIGIN}/">홈</a></nav></div>${body}</main></body></html>`;
}

async function currentMember(request, env) {
  const session = await getCustomerSession(request, env);
  return session?.record?.member_id ? String(session.record.member_id) : null;
}

function loginRedirect(request) {
  const returnTo = new URL(request.url);
  return redirect(
    `${CLASSROOM_ORIGIN}/oauth/cafe24/customer/start?return_to=${encodeURIComponent(returnTo.toString())}`
  );
}

async function listManagedPrograms(env, memberId) {
  const platformRoles = await getActivePlatformRoles(env, memberId);
  const global = platformRoles.has(PLATFORM_ROLES.PLATFORM_OWNER) ||
    platformRoles.has(PLATFORM_ROLES.STAFF_OPERATOR);

  if (global) {
    const result = await env.COURSE_DB.prepare(
      "SELECT id,slug,title,program_type,owner_member_id,description,default_duration_days,participation_mode,status FROM programs WHERE status!='archived' ORDER BY updated_at DESC,title"
    ).all();
    return Array.isArray(result.results) ? result.results : [];
  }

  const result = await env.COURSE_DB.prepare(
    "SELECT DISTINCT p.id,p.slug,p.title,p.program_type,p.owner_member_id,p.description,p.default_duration_days,p.participation_mode,p.status " +
    "FROM programs p LEFT JOIN scoped_role_grants r ON r.member_id=? AND r.status='active' AND (" +
    "(r.scope_type='program' AND r.scope_id=p.id) OR " +
    "(r.scope_type='program_run' AND r.scope_id IN (SELECT pr.id FROM program_runs pr WHERE pr.program_id=p.id))" +
    ") WHERE p.status!='archived' AND (p.owner_member_id=? OR r.role IN ('program_host','program_moderator')) " +
    "ORDER BY p.updated_at DESC,p.title"
  ).bind(memberId, memberId).all();
  return Array.isArray(result.results) ? result.results : [];
}

async function canHost(env, memberId, program) {
  if (!program || !memberId) return false;
  if (String(program.owner_member_id || "") === memberId) return true;
  const roles = await getActivePlatformRoles(env, memberId);
  if (roles.has(PLATFORM_ROLES.PLATFORM_OWNER) || roles.has(PLATFORM_ROLES.STAFF_OPERATOR)) return true;
  return hasActiveScopedRole(env, memberId, SCOPED_ROLES.PROGRAM_HOST, "program", program.id);
}

async function getProgram(env, programId) {
  return env.COURSE_DB.prepare(
    "SELECT id,slug,title,program_type,owner_member_id,description,default_duration_days,participation_mode,status FROM programs WHERE id=? LIMIT 1"
  ).bind(programId).first();
}

async function programDetail(env, programId) {
  const [program, runsResult, missionsResult, eventsResult] = await Promise.all([
    getProgram(env, programId),
    env.COURSE_DB.prepare(
      "SELECT r.id,r.title,r.starts_at,r.ends_at,r.capacity,r.price_krw,r.status,r.lifecycle_phase," +
      "(SELECT COUNT(*) FROM program_enrollments e WHERE e.run_id=r.id AND e.status IN ('active','completed')) AS participant_count," +
      "(SELECT COUNT(*) FROM program_run_missions m WHERE m.run_id=r.id) AS mission_count," +
      "(SELECT COUNT(*) FROM program_events pe WHERE pe.run_id=r.id AND pe.status!='cancelled') AS event_count " +
      "FROM program_runs r WHERE r.program_id=? ORDER BY COALESCE(r.starts_at,r.created_at) DESC"
    ).bind(programId).all(),
    env.COURSE_DB.prepare(
      "SELECT id,sequence_no,title,mission_type,relative_open_day,relative_due_day,required,verification_mode FROM program_mission_templates WHERE program_id=? AND status='active' ORDER BY sequence_no"
    ).bind(programId).all(),
    env.COURSE_DB.prepare(
      "SELECT id,sequence_no,event_type,title,relative_day,duration_minutes,attendance_required FROM program_event_templates WHERE program_id=? AND status='active' ORDER BY sequence_no"
    ).bind(programId).all()
  ]);
  return {
    program,
    runs: Array.isArray(runsResult.results) ? runsResult.results : [],
    missions: Array.isArray(missionsResult.results) ? missionsResult.results : [],
    events: Array.isArray(eventsResult.results) ? eventsResult.results : []
  };
}

function addDays(dateText, days) {
  const [y,m,d] = String(dateText).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function runIdFor(programId, startsOn) {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  return `${programId}-${startsOn.replaceAll("-", "")}-${suffix}`;
}

async function createRun(request, env, memberId) {
  if (!sameOrigin(request)) return html(shell("요청 오류", '<div class="notice error">요청 출처를 확인할 수 없습니다.</div>'), { status: 403 });
  const form = await request.formData();
  const programId = String(form.get("program_id") || "").trim();
  const title = String(form.get("title") || "").trim().slice(0, 120);
  const startsOn = String(form.get("starts_on") || "").trim();
  const durationInput = Number(form.get("duration_days") || 0);
  const program = await getProgram(env, programId);
  if (!program) return html(shell("프로그램 없음", '<div class="notice error">프로그램을 찾을 수 없습니다.</div>'), { status: 404 });
  if (!(await canHost(env, memberId, program))) return html(shell("권한 없음", '<div class="notice error">이 프로그램의 회차를 만들 권한이 없습니다.</div>'), { status: 403 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) return html(shell("입력 오류", '<div class="notice error">시작일을 확인해 주세요.</div>'), { status: 400 });

  const durationDays = Number.isInteger(durationInput) && durationInput > 0
    ? Math.min(durationInput, 365)
    : Math.max(1, Number(program.default_duration_days || 28));
  const runId = runIdFor(programId, startsOn);
  const runTitle = title || `${startsOn} 시작 회차`;
  const endsOn = addDays(startsOn, durationDays - 1);

  const missionTemplates = await env.COURSE_DB.prepare(
    "SELECT * FROM program_mission_templates WHERE program_id=? AND status='active' ORDER BY sequence_no"
  ).bind(programId).all();
  const eventTemplates = await env.COURSE_DB.prepare(
    "SELECT * FROM program_event_templates WHERE program_id=? AND status='active' ORDER BY sequence_no"
  ).bind(programId).all();

  const statements = [
    env.COURSE_DB.prepare(
      "INSERT INTO program_runs (id,program_id,title,starts_at,ends_at,status,lifecycle_phase,completion_policy_snapshot,reward_policy_snapshot) " +
      "VALUES (?,?,?,?,?,'draft','draft','{}','{}')"
    ).bind(runId, programId, runTitle, startsOn, endsOn),
    env.COURSE_DB.prepare(
      "INSERT OR IGNORE INTO scoped_role_grants (member_id,role,scope_type,scope_id,status,granted_by) VALUES (?,'program_host','program_run',?,'active',?)"
    ).bind(memberId, runId, memberId)
  ];

  for (const template of (Array.isArray(missionTemplates.results) ? missionTemplates.results : [])) {
    statements.push(
      env.COURSE_DB.prepare(
        "INSERT INTO program_run_missions (id,run_id,template_id,sequence_no,title,mission_type,prompt,opens_at,due_at,required,completion_weight,verification_mode,status) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'scheduled')"
      ).bind(
        `${runId}-mission-${template.sequence_no}`,
        runId,
        template.id,
        template.sequence_no,
        template.title,
        template.mission_type,
        template.prompt || "",
        addDays(startsOn, template.relative_open_day || 0),
        template.relative_due_day == null ? null : addDays(startsOn, template.relative_due_day),
        Number(template.required || 0),
        Number(template.completion_weight || 0),
        template.verification_mode
      )
    );
  }

  for (const template of (Array.isArray(eventTemplates.results) ? eventTemplates.results : [])) {
    const eventDate = addDays(startsOn, template.relative_day || 0);
    statements.push(
      env.COURSE_DB.prepare(
        "INSERT INTO program_events (id,run_id,template_id,event_type,title,description,starts_at,location_type,attendance_required,status,created_by) " +
        "VALUES (?,?,?,?,?,?,?,'online',?,'scheduled',?)"
      ).bind(
        `${runId}-event-${template.sequence_no}`,
        runId,
        template.id,
        template.event_type,
        template.title,
        template.description || "",
        eventDate,
        Number(template.attendance_required || 0),
        memberId
      )
    );
  }

  await env.COURSE_DB.batch(statements);
  return redirect(`/program-host?program=${encodeURIComponent(programId)}&created=1`);
}

function programCards(programs) {
  if (!programs.length) {
    return '<div class="card"><p class="muted">관리할 수 있는 프로그램이 없습니다.</p></div>';
  }
  return '<div class="grid">' + programs.map((p) =>
    '<a class="card program" href="/program-host?program=' + encodeURIComponent(p.id) + '">' +
    '<div class="eyebrow">' + esc(p.program_type) + '</div><h2>' + esc(p.title) + '</h2>' +
    '<p class="muted">' + esc(p.description || "") + '</p>' +
    '<span class="pill">' + esc(p.participation_mode) + '</span><span class="pill">' + esc(p.status) + '</span></a>'
  ).join("") + '</div>';
}

function detailHtml(detail, hostAllowed, created) {
  const p = detail.program;
  const runs = detail.runs;
  const activeParticipants = runs.reduce((sum, r) => sum + Number(r.participant_count || 0), 0);
  const notice = created ? '<div class="notice ok">새 회차와 미션·이벤트 일정을 만들었습니다.</div>' : '';
  const runRows = runs.length
    ? runs.map((r) => '<tr><td><strong>' + esc(r.title) + '</strong><br><span class="muted">' + esc(r.id) + '</span></td><td>' +
      esc(r.lifecycle_phase || r.status) + '</td><td>' + esc(r.starts_at || "미정") + ' ~ ' + esc(r.ends_at || "미정") +
      '</td><td>' + Number(r.participant_count || 0) + '</td><td>' + Number(r.mission_count || 0) + '</td><td>' + Number(r.event_count || 0) + '</td></tr>').join("")
    : '<tr><td colspan="6">아직 생성된 회차가 없습니다.</td></tr>';

  const missionList = detail.missions.length
    ? '<ul>' + detail.missions.map((m) => '<li><strong>' + esc(m.title) + '</strong> · ' + esc(m.mission_type) +
      ' · 시작+' + Number(m.relative_open_day || 0) + '일 / 마감+' + (m.relative_due_day == null ? '-' : Number(m.relative_due_day)) +
      '일 · ' + esc(m.verification_mode) + '</li>').join("") + '</ul>'
    : '<p class="muted">미션 템플릿이 없습니다.</p>';

  const eventList = detail.events.length
    ? '<ul>' + detail.events.map((e) => '<li><strong>' + esc(e.title) + '</strong> · ' + esc(e.event_type) +
      ' · 시작+' + Number(e.relative_day || 0) + '일</li>').join("") + '</ul>'
    : '<p class="muted">이벤트 템플릿이 없습니다.</p>';

  const createForm = hostAllowed
    ? '<section class="card"><h2>새 회차 만들기</h2><p class="muted">시작일을 기준으로 미션과 저자 이벤트 날짜를 자동 복제합니다.</p>' +
      '<form method="post" action="/program-host/run-create"><input type="hidden" name="program_id" value="' + esc(p.id) + '">' +
      '<div class="formgrid"><div><label>회차명</label><input name="title" placeholder="예: 2026년 10월 1기"></div>' +
      '<div><label>시작일</label><input type="date" name="starts_on" required></div>' +
      '<div><label>기간(일)</label><input type="number" name="duration_days" min="1" max="365" value="' + Number(p.default_duration_days || 28) + '"></div></div>' +
      '<button type="submit" style="margin-top:12px">회차 생성</button></form></section>'
    : '<div class="notice">이 프로그램에서는 모더레이션 권한만 있습니다. 회차 생성은 Host 또는 운영자가 할 수 있습니다.</div>';

  return notice +
    '<section class="card"><div class="eyebrow">' + esc(p.program_type) + '</div><h1>' + esc(p.title) + '</h1><p class="muted">' + esc(p.description || "") + '</p>' +
    '<span class="pill">Creator ' + esc(p.owner_member_id) + '</span><span class="pill">' + esc(p.participation_mode) + '</span></section>' +
    '<div class="metrics"><div class="metric"><span class="muted">회차</span><strong>' + runs.length + '</strong></div>' +
    '<div class="metric"><span class="muted">참가자</span><strong>' + activeParticipants + '</strong></div>' +
    '<div class="metric"><span class="muted">미션 템플릿</span><strong>' + detail.missions.length + '</strong></div>' +
    '<div class="metric"><span class="muted">이벤트 템플릿</span><strong>' + detail.events.length + '</strong></div></div>' +
    createForm +
    '<section class="card"><h2>운영 회차</h2><table><thead><tr><th>회차</th><th>단계</th><th>기간</th><th>참가자</th><th>미션</th><th>이벤트</th></tr></thead><tbody>' + runRows + '</tbody></table></section>' +
    '<div class="grid"><section class="card"><h2>미션 템플릿</h2>' + missionList + '</section><section class="card"><h2>저자 이벤트 템플릿</h2>' + eventList + '</section></div>';
}

export default {
  async fetch(request, env) {
    if (!env.COURSE_DB) return html(shell("Program Host", '<div class="notice error">프로그램 DB가 연결되지 않았습니다.</div>'), { status: 503 });
    try {
      await ensureProgramSchema(env);
    } catch (error) {
      return html(shell("Program Host", '<div class="notice error">프로그램 데이터 구조를 준비하지 못했습니다. 운영자에게 알려 주세요.</div>'), { status: 503 });
    }

    const memberId = await currentMember(request, env);
    if (!memberId) return loginRedirect(request);

    const url = new URL(request.url);
    if (url.pathname === "/program-host/run-create" && request.method === "POST") {
      return createRun(request, env, memberId);
    }

    if (url.pathname !== "/program-host" || request.method !== "GET") {
      return html(shell("404", '<div class="notice error">페이지를 찾을 수 없습니다.</div>'), { status: 404 });
    }

    const programs = await listManagedPrograms(env, memberId);
    const selectedId = String(url.searchParams.get("program") || "").trim();
    if (!selectedId) {
      return html(shell("내 프로그램", '<section class="card"><div class="eyebrow">CREATOR / HOST</div><h1>내 프로그램</h1><p class="muted">저자·강사가 직접 운영하는 완독, 챌린지, 코호트 프로그램을 관리합니다.</p></section>' + programCards(programs)));
    }

    const allowed = programs.some((p) => p.id === selectedId);
    if (!allowed) return html(shell("권한 없음", '<div class="notice error">이 프로그램을 관리할 권한이 없습니다.</div>'), { status: 403 });

    const detail = await programDetail(env, selectedId);
    const hostAllowed = await canHost(env, memberId, detail.program);
    return html(shell(detail.program.title, detailHtml(detail, hostAllowed, url.searchParams.get("created") === "1")));
  }
};

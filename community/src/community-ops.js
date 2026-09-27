import { getMemberSession } from "./spaces.js";
import { ensureCommunityProgramSchema } from "./program-schema.js";
import { ensureNotificationSchema, notifyMember, unreadNotificationCount } from "./notifications.js";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function redirect(location, status = 303) {
  return new Response(null, { status, headers: { Location: location, "Cache-Control": "no-store" } });
}

function safeReturn(value, fallback = "/") {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function html(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)} | NEVER JUST SELL Community</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f1ec;color:#171512;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(960px,calc(100% - 32px));margin:0 auto}.top{min-height:66px;border-bottom:1px solid #ddd6cc;display:flex;align-items:center;justify-content:space-between;gap:14px}.brand{font-size:14px;font-weight:900;letter-spacing:.06em;text-decoration:none}.nav{display:flex;gap:14px;flex-wrap:wrap;font-size:13px}.page{padding:42px 0 64px}.eyebrow{font-size:11px;font-weight:850;letter-spacing:.12em;color:#77502e}.page-title{font-size:clamp(34px,6vw,54px);line-height:1.08;letter-spacing:-.045em;margin:8px 0 10px}.lead{color:#716960;max-width:720px}.section{margin-top:32px}.section h2{font-size:23px}.list{display:grid;gap:9px}.item{background:#fff;border:1px solid #ddd5cb;padding:18px}.item h3{font-size:17px;margin:5px 0}.meta{display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:#786f66}.badge{display:inline-block;padding:3px 7px;border:1px solid #d8cfc4;border-radius:999px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.btn{border:0;background:#171512;color:#fff;padding:9px 13px;font:inherit;font-size:12px;font-weight:800;cursor:pointer;text-decoration:none}.btn.secondary{background:#fff;color:#171512;border:1px solid #cbc1b6}.btn.danger{background:#7a2020}.notice{background:#eee6dc;border-left:4px solid #9d7652;padding:13px 15px;color:#61574d}.empty{background:#fff;border:1px solid #ddd5cb;padding:26px;color:#716960}.notification{display:block;text-decoration:none}.notification.unread{border-left:4px solid #77502e}.notification p{margin:4px 0 0;color:#716960;font-size:12px}@media(max-width:650px){.shell{width:calc(100% - 22px)}.top{align-items:flex-start;padding:14px 0}.page{padding-top:30px}}
</style></head><body><header class="shell top"><a class="brand" href="/">NEVER JUST SELL COMMUNITY</a><nav class="nav"><a href="/">커뮤니티</a><a href="/course-questions">강의 질문</a><a href="/spaces">내 모임</a><a href="/notifications">알림</a><a href="/moderation">운영</a></nav></header><main class="shell page">${body}</main></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

async function canModerateSpace(env, memberId, spaceId) {
  if (!spaceId) return false;
  const row = await env.DB.prepare("SELECT moderation_role FROM space_members WHERE space_id=? AND member_id=? AND access_status='active' LIMIT 1")
    .bind(spaceId, memberId).first();
  return ["host","moderator"].includes(String(row?.moderation_role || ""));
}

function globalModerator(session) {
  return ["moderator","admin"].includes(String(session?.role || ""));
}

async function targetPost(env, targetType, targetId) {
  if (targetType === "post") {
    return env.DB.prepare("SELECT id,author_member_id,title,space_id,visibility,status FROM posts WHERE id=? LIMIT 1").bind(targetId).first();
  }
  const row = await env.DB.prepare(`SELECT c.id,c.author_member_id,c.post_id,c.status,p.title,p.space_id,p.visibility
    FROM comments c JOIN posts p ON p.id=c.post_id WHERE c.id=? LIMIT 1`).bind(targetId).first();
  return row ? { ...row, id: row.id, target_comment_id: row.id } : null;
}

async function moderationAllowed(env, session, targetType, targetId) {
  const target = await targetPost(env, targetType, targetId);
  if (!target) return { ok: false, target: null };
  if (globalModerator(session)) return { ok: true, target };
  if (target.space_id && await canModerateSpace(env, session.member_id, target.space_id)) return { ok: true, target };
  return { ok: false, target };
}

export async function handlePublicCommentWithNotification(request, env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/p\/(\d+)\/comment$/);
  if (request.method !== "POST" || !match) return null;
  const session = await getMemberSession(request, env);
  if (!session) return redirect(`/login?return_to=${encodeURIComponent(url.pathname.replace(/\/comment$/, ""))}`, 302);
  const postId = Number(match[1]);
  const form = await request.formData().catch(() => null);
  if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  const body = String(form.get("body") || "").trim().slice(0, 5000);
  if (body.length < 2) return new Response("댓글 내용을 입력해 주세요.", { status: 400 });
  const post = await env.DB.prepare("SELECT id,slug,title,author_member_id,status,visibility,space_id FROM posts WHERE id=? LIMIT 1").bind(postId).first();
  if (!post?.id || post.status !== "published" || post.visibility !== "public" || post.space_id) return new Response("글을 찾을 수 없습니다.", { status: 404 });
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM comments WHERE author_member_id=? AND created_at>datetime('now','-10 minutes')").bind(session.member_id).first();
  if (Number(recent?.n || 0) >= 10) return new Response("짧은 시간에 너무 많은 댓글이 등록되었습니다. 잠시 후 다시 시도해 주세요.", { status: 429 });
  await ensureNotificationSchema(env);
  const statements = [
    env.DB.prepare("INSERT INTO comments(post_id,author_member_id,body,status) VALUES(?,?,?,'published')").bind(postId,session.member_id,body),
    env.DB.prepare("UPDATE posts SET comment_count=comment_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(postId)
  ];
  await env.DB.batch(statements);
  await notifyMember(env, { memberId: post.author_member_id, actorMemberId: session.member_id, type: "comment", title: `‘${String(post.title).slice(0,80)}’에 새 댓글이 달렸습니다.`, targetUrl: `/p/${postId}/${encodeURIComponent(post.slug)}#comments` });
  return redirect(`/p/${postId}/${encodeURIComponent(post.slug)}#comments`);
}

export async function handleReportRequest(request, env) {
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/report") return null;
  const session = await getMemberSession(request, env);
  if (!session) return redirect(`/login?return_to=${encodeURIComponent(safeReturn(url.searchParams.get("return_to"), "/"))}`, 302);
  const form = await request.formData().catch(() => null);
  if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  const targetType = String(form.get("target_type") || "");
  const targetId = Number(form.get("target_id"));
  const reason = String(form.get("reason") || "").trim().slice(0, 500);
  const returnTo = safeReturn(form.get("return_to"), "/");
  if (!["post","comment"].includes(targetType) || !Number.isInteger(targetId) || targetId <= 0 || reason.length < 2) return new Response("신고 내용을 확인해 주세요.", { status: 400 });
  const target = await targetPost(env, targetType, targetId);
  if (!target) return new Response("신고 대상을 찾을 수 없습니다.", { status: 404 });
  const duplicate = await env.DB.prepare("SELECT id FROM reports WHERE reporter_member_id=? AND target_type=? AND target_id=? AND status='open' LIMIT 1")
    .bind(session.member_id,targetType,targetId).first();
  if (!duplicate?.id) {
    await env.DB.prepare("INSERT INTO reports(reporter_member_id,target_type,target_id,reason,status) VALUES(?,?,?,?,'open')")
      .bind(session.member_id,targetType,targetId,reason).run();
  }
  return redirect(returnTo);
}

async function renderNotifications(request, env, session) {
  await ensureNotificationSchema(env);
  const rows = await env.DB.prepare("SELECT id,type,title,target_url,read_at,created_at FROM notifications WHERE member_id=? ORDER BY created_at DESC,id DESC LIMIT 100").bind(session.member_id).all();
  const items = (rows.results || []).map((n) => `<a class="item notification${n.read_at ? "" : " unread"}" href="/notifications/${Number(n.id)}/open"><div class="meta"><span class="badge">${esc(n.type)}</span><span>${esc(n.created_at)}</span></div><h3>${esc(n.title)}</h3><p>${n.read_at ? "확인함" : "새 알림"}</p></a>`).join("");
  return html("알림", `<div class="eyebrow">NOTIFICATIONS</div><h1 class="page-title">알림</h1><p class="lead">내 글의 새 댓글과 답변을 확인합니다.</p><section class="section">${items ? `<div class="list">${items}</div>` : `<div class="empty">새 알림이 없습니다.</div>`}</section>`);
}

async function openNotification(env, session, id) {
  await ensureNotificationSchema(env);
  const row = await env.DB.prepare("SELECT id,target_url FROM notifications WHERE id=? AND member_id=? LIMIT 1").bind(id,session.member_id).first();
  if (!row?.id) return new Response("알림을 찾을 수 없습니다.", { status: 404 });
  await env.DB.prepare("UPDATE notifications SET read_at=COALESCE(read_at,CURRENT_TIMESTAMP) WHERE id=? AND member_id=?").bind(id,session.member_id).run();
  return redirect(safeReturn(row.target_url,"/"));
}

async function moderationRows(env, session) {
  if (globalModerator(session)) {
    const result = await env.DB.prepare(`SELECT r.id,r.target_type,r.target_id,r.reason,r.status,r.created_at,m.display_name,
      CASE WHEN r.target_type='post' THEN p.title ELSE cp.title END AS target_title,
      CASE WHEN r.target_type='post' THEN p.space_id ELSE cp.space_id END AS space_id
      FROM reports r JOIN members m ON m.member_id=r.reporter_member_id
      LEFT JOIN posts p ON r.target_type='post' AND p.id=r.target_id
      LEFT JOIN comments c ON r.target_type='comment' AND c.id=r.target_id
      LEFT JOIN posts cp ON c.post_id=cp.id
      WHERE r.status='open' ORDER BY r.created_at ASC`).all();
    return result.results || [];
  }
  const result = await env.DB.prepare(`SELECT r.id,r.target_type,r.target_id,r.reason,r.status,r.created_at,m.display_name,
    CASE WHEN r.target_type='post' THEN p.title ELSE cp.title END AS target_title,
    CASE WHEN r.target_type='post' THEN p.space_id ELSE cp.space_id END AS space_id
    FROM reports r JOIN members m ON m.member_id=r.reporter_member_id
    LEFT JOIN posts p ON r.target_type='post' AND p.id=r.target_id
    LEFT JOIN comments c ON r.target_type='comment' AND c.id=r.target_id
    LEFT JOIN posts cp ON c.post_id=cp.id
    JOIN space_members sm ON sm.space_id=CASE WHEN r.target_type='post' THEN p.space_id ELSE cp.space_id END
      AND sm.member_id=? AND sm.access_status='active' AND sm.moderation_role IN ('host','moderator')
    WHERE r.status='open' ORDER BY r.created_at ASC`).bind(session.member_id).all();
  return result.results || [];
}

async function knowledgeRows(env, session) {
  await ensureCommunityProgramSchema(env);
  if (globalModerator(session)) {
    const result = await env.DB.prepare(`SELECT kp.id,kp.source_post_id,kp.status,kp.anonymized,kp.note,kp.created_at,p.title,p.space_id
      FROM knowledge_promotions kp JOIN posts p ON p.id=kp.source_post_id
      WHERE kp.status='candidate' ORDER BY kp.created_at ASC`).all();
    return result.results || [];
  }
  const result = await env.DB.prepare(`SELECT kp.id,kp.source_post_id,kp.status,kp.anonymized,kp.note,kp.created_at,p.title,p.space_id
    FROM knowledge_promotions kp JOIN posts p ON p.id=kp.source_post_id
    JOIN space_members sm ON sm.space_id=p.space_id AND sm.member_id=? AND sm.access_status='active' AND sm.moderation_role IN ('host','moderator')
    WHERE kp.status='candidate' ORDER BY kp.created_at ASC`).bind(session.member_id).all();
  return result.results || [];
}

async function renderModeration(env, session) {
  const [reports, candidates] = await Promise.all([moderationRows(env,session),knowledgeRows(env,session)]);
  const reportItems = reports.map((r) => `<div class="item"><div class="meta"><span class="badge">${esc(r.target_type)}</span><span>${esc(r.display_name)}</span><span>${esc(r.created_at)}</span></div><h3>${esc(r.target_title || "대상")}</h3><div>${esc(r.reason)}</div><div class="actions"><form method="post" action="/moderation/report/${Number(r.id)}/hide"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><button class="btn danger">숨김 처리</button></form><form method="post" action="/moderation/report/${Number(r.id)}/dismiss"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><button class="btn secondary">문제 없음</button></form></div></div>`).join("");
  const knowledgeItems = candidates.map((r) => `<div class="item"><div class="meta"><span class="badge">지식 후보</span><span>${esc(r.created_at)}</span></div><h3>${esc(r.title)}</h3><div class="actions">${globalModerator(session) ? `<form method="post" action="/moderation/knowledge/${Number(r.id)}/publish"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><button class="btn">공개 지식으로 발행</button></form>` : ""}<form method="post" action="/moderation/knowledge/${Number(r.id)}/reject"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><button class="btn secondary">후보 해제</button></form></div></div>`).join("");
  return html("운영", `<div class="eyebrow">MODERATION</div><h1 class="page-title">커뮤니티 운영</h1><p class="lead">신고를 처리하고, 가치 있는 프로그램 대화를 공개 지식으로 승격합니다.</p><section class="section"><h2>신고 ${reports.length}</h2>${reportItems ? `<div class="list">${reportItems}</div>` : `<div class="empty">처리할 신고가 없습니다.</div>`}</section><section class="section"><h2>지식 후보 ${candidates.length}</h2>${knowledgeItems ? `<div class="list">${knowledgeItems}</div>` : `<div class="empty">검토할 지식 후보가 없습니다.</div>`}</section>`);
}

async function handleModerationAction(request, env, session, url) {
  const form = await request.formData().catch(() => null);
  if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  let match = url.pathname.match(/^\/moderation\/report\/(\d+)\/(hide|dismiss)$/);
  if (match) {
    const reportId = Number(match[1]);
    const action = match[2];
    const report = await env.DB.prepare("SELECT id,target_type,target_id,status FROM reports WHERE id=? AND status='open' LIMIT 1").bind(reportId).first();
    if (!report?.id) return new Response("신고를 찾을 수 없습니다.", { status: 404 });
    const allowed = await moderationAllowed(env,session,report.target_type,Number(report.target_id));
    if (!allowed.ok) return new Response("처리 권한이 없습니다.", { status: 403 });
    if (action === "hide") {
      const table = report.target_type === "post" ? "posts" : "comments";
      await env.DB.batch([
        env.DB.prepare(`UPDATE ${table} SET status='hidden',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(Number(report.target_id)),
        env.DB.prepare("UPDATE reports SET status='reviewed' WHERE id=?").bind(reportId)
      ]);
    } else {
      await env.DB.prepare("UPDATE reports SET status='dismissed' WHERE id=?").bind(reportId).run();
    }
    return redirect("/moderation");
  }

  match = url.pathname.match(/^\/moderation\/knowledge\/(\d+)\/(publish|reject)$/);
  if (match) {
    await ensureCommunityProgramSchema(env);
    const id = Number(match[1]);
    const action = match[2];
    const row = await env.DB.prepare(`SELECT kp.id,kp.source_post_id,kp.status,p.space_id,p.category_id,p.author_member_id,p.title,p.body
      FROM knowledge_promotions kp JOIN posts p ON p.id=kp.source_post_id WHERE kp.id=? AND kp.status='candidate' LIMIT 1`).bind(id).first();
    if (!row?.id) return new Response("지식 후보를 찾을 수 없습니다.", { status: 404 });
    if (!globalModerator(session) && !(await canModerateSpace(env,session.member_id,row.space_id))) return new Response("처리 권한이 없습니다.", { status: 403 });
    if (action === "reject") {
      await env.DB.prepare("UPDATE knowledge_promotions SET status='rejected',approved_by_member_id=?,approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(session.member_id,id).run();
      return redirect("/moderation");
    }
    if (!globalModerator(session)) return new Response("공개 발행 권한이 없습니다.", { status: 403 });
    const slug = `knowledge-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,6)}`;
    const insert = await env.DB.prepare(`INSERT INTO posts(category_id,author_member_id,slug,title,body,status,is_indexable,post_type,visibility,knowledge_state)
      VALUES(?,?,?,?,?,'published',1,'case','public','published')`).bind(row.category_id,row.author_member_id,slug,row.title,row.body).run();
    const canonicalId = Number(insert?.meta?.last_row_id || 0);
    await env.DB.prepare("UPDATE knowledge_promotions SET status='published',canonical_post_id=?,approved_by_member_id=?,approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(canonicalId,session.member_id,id).run();
    return redirect(`/p/${canonicalId}/${encodeURIComponent(slug)}`);
  }
  return null;
}

export async function markKnowledgeCandidate(request, env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/spaces\/([^/]+)\/p\/(\d+)\/knowledge-candidate$/);
  if (request.method !== "POST" || !match) return null;
  const session = await getMemberSession(request, env);
  if (!session) return redirect(`/login?return_to=${encodeURIComponent(url.pathname)}`,302);
  const form = await request.formData().catch(() => null);
  if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  let spaceId;
  try { spaceId = decodeURIComponent(match[1]); } catch { return new Response("잘못된 주소입니다.", { status: 400 }); }
  if (!(await canModerateSpace(env,session.member_id,spaceId)) && !globalModerator(session)) return new Response("권한이 없습니다.", { status: 403 });
  const postId = Number(match[2]);
  const post = await env.DB.prepare("SELECT id FROM posts WHERE id=? AND space_id=? AND status='published' LIMIT 1").bind(postId,spaceId).first();
  if (!post?.id) return new Response("글을 찾을 수 없습니다.", { status: 404 });
  await ensureCommunityProgramSchema(env);
  await env.DB.prepare(`INSERT INTO knowledge_promotions(source_post_id,status,approved_by_member_id,note)
    VALUES(?,'candidate',NULL,'') ON CONFLICT(source_post_id) DO UPDATE SET status='candidate',updated_at=CURRENT_TIMESTAMP`).bind(postId).run();
  return redirect(`/spaces/${encodeURIComponent(spaceId)}/p/${postId}`);
}

export async function handleCommunityOpsRequest(request, env) {
  const url = new URL(request.url);
  const comment = await handlePublicCommentWithNotification(request,env);
  if (comment) return comment;
  const report = await handleReportRequest(request,env);
  if (report) return report;
  const candidate = await markKnowledgeCandidate(request,env);
  if (candidate) return candidate;

  if (url.pathname === "/notifications" && request.method === "GET") {
    const session = await getMemberSession(request,env);
    if (!session) return redirect(`/login?return_to=${encodeURIComponent("/notifications")}`,302);
    return renderNotifications(request,env,session);
  }
  let match = url.pathname.match(/^\/notifications\/(\d+)\/open$/);
  if (match && request.method === "GET") {
    const session = await getMemberSession(request,env);
    if (!session) return redirect(`/login?return_to=${encodeURIComponent("/notifications")}`,302);
    return openNotification(env,session,Number(match[1]));
  }
  if (url.pathname === "/moderation" && request.method === "GET") {
    const session = await getMemberSession(request,env);
    if (!session) return redirect(`/login?return_to=${encodeURIComponent("/moderation")}`,302);
    const spaceMod = await env.DB.prepare("SELECT 1 AS ok FROM space_members WHERE member_id=? AND access_status='active' AND moderation_role IN ('host','moderator') LIMIT 1").bind(session.member_id).first();
    if (!globalModerator(session) && !spaceMod?.ok) return html("접근할 수 없습니다", `<div class="notice">운영 권한이 없습니다.</div>`,403);
    return renderModeration(env,session);
  }
  if (url.pathname.startsWith("/moderation/") && request.method === "POST") {
    const session = await getMemberSession(request,env);
    if (!session) return redirect(`/login?return_to=${encodeURIComponent("/moderation")}`,302);
    const result = await handleModerationAction(request,env,session,url);
    if (result) return result;
  }
  return null;
}

export async function notificationNavMarkup(env, session) {
  if (!session?.member_id) return "";
  const count = await unreadNotificationCount(env,session.member_id).catch(() => 0);
  return `<a href="/notifications">알림${count > 0 ? ` ${count}` : ""}</a>`;
}

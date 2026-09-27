import { getMemberSession } from "./spaces.js";
import { ensureCommunityProgramSchema } from "./program-schema.js";
import { notifyMember } from "./notifications.js";

function redirect(location, status = 303) {
  return new Response(null, { status, headers: { Location: location, "Cache-Control": "no-store" } });
}

function globalModerator(session) {
  return ["moderator","admin"].includes(String(session?.role || ""));
}

async function canModerateSpace(env, memberId, spaceId) {
  if (!spaceId) return false;
  const row = await env.DB.prepare("SELECT moderation_role FROM space_members WHERE space_id=? AND member_id=? AND access_status='active' LIMIT 1")
    .bind(spaceId,memberId).first();
  return ["host","moderator"].includes(String(row?.moderation_role || ""));
}

async function csrfSession(request, env) {
  const session = await getMemberSession(request,env);
  if (!session) return { response: redirect(`/login?return_to=${encodeURIComponent("/moderation")}`,302) };
  const form = await request.formData().catch(() => null);
  if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) {
    return { response: new Response("요청을 확인할 수 없습니다.", { status: 403 }) };
  }
  return { session, form };
}

export async function handleSafeModeration(request, env) {
  if (request.method !== "POST") return null;
  const url = new URL(request.url);

  let match = url.pathname.match(/^\/moderation\/report\/(\d+)\/hide$/);
  if (match) {
    const auth = await csrfSession(request,env);
    if (auth.response) return auth.response;
    const { session } = auth;
    const reportId = Number(match[1]);
    const report = await env.DB.prepare("SELECT id,target_type,target_id FROM reports WHERE id=? AND status='open' LIMIT 1").bind(reportId).first();
    if (!report?.id) return new Response("신고를 찾을 수 없습니다.", { status: 404 });

    let target;
    if (report.target_type === "post") {
      target = await env.DB.prepare("SELECT id,author_member_id,space_id FROM posts WHERE id=? LIMIT 1").bind(Number(report.target_id)).first();
    } else {
      target = await env.DB.prepare(`SELECT c.id,c.author_member_id,c.post_id,p.space_id FROM comments c JOIN posts p ON p.id=c.post_id WHERE c.id=? LIMIT 1`).bind(Number(report.target_id)).first();
    }
    if (!target?.id) return new Response("신고 대상을 찾을 수 없습니다.", { status: 404 });
    if (!globalModerator(session) && !(await canModerateSpace(env,session.member_id,target.space_id))) {
      return new Response("처리 권한이 없습니다.", { status: 403 });
    }

    if (report.target_type === "post") {
      await env.DB.batch([
        env.DB.prepare("UPDATE posts SET status='hidden',is_indexable=0,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(Number(report.target_id)),
        env.DB.prepare("UPDATE reports SET status='reviewed' WHERE id=?").bind(reportId)
      ]);
      await notifyMember(env,{ memberId: target.author_member_id, actorMemberId: session.member_id, type: "moderation", title: "작성한 글이 운영 검토 후 숨김 처리되었습니다.", targetUrl: "/notifications" });
    } else {
      await env.DB.batch([
        env.DB.prepare("UPDATE comments SET status='hidden',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(Number(report.target_id)),
        env.DB.prepare("UPDATE posts SET comment_count=(SELECT COUNT(*) FROM comments WHERE post_id=? AND status='published'),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(Number(target.post_id),Number(target.post_id)),
        env.DB.prepare("UPDATE reports SET status='reviewed' WHERE id=?").bind(reportId)
      ]);
      await notifyMember(env,{ memberId: target.author_member_id, actorMemberId: session.member_id, type: "moderation", title: "작성한 댓글이 운영 검토 후 숨김 처리되었습니다.", targetUrl: "/notifications" });
    }
    return redirect("/moderation");
  }

  match = url.pathname.match(/^\/moderation\/knowledge\/(\d+)\/publish$/);
  if (match) {
    const auth = await csrfSession(request,env);
    if (auth.response) return auth.response;
    const { session } = auth;
    if (!globalModerator(session)) return new Response("공개 발행 권한이 없습니다.", { status: 403 });
    await ensureCommunityProgramSchema(env);
    const id = Number(match[1]);
    const row = await env.DB.prepare(`SELECT kp.id,kp.source_post_id,p.category_id,p.title,p.body
      FROM knowledge_promotions kp JOIN posts p ON p.id=kp.source_post_id
      WHERE kp.id=? AND kp.status='candidate' AND p.status='published' LIMIT 1`).bind(id).first();
    if (!row?.id) return new Response("지식 후보를 찾을 수 없습니다.", { status: 404 });
    const slug = `knowledge-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,6)}`;
    const insert = await env.DB.prepare(`INSERT INTO posts(category_id,author_member_id,slug,title,body,status,is_indexable,post_type,visibility,knowledge_state)
      VALUES(?,?,?,?,?,'published',1,'case','public','published')`).bind(row.category_id,session.member_id,slug,row.title,row.body).run();
    const canonicalId = Number(insert?.meta?.last_row_id || 0);
    await env.DB.prepare("UPDATE knowledge_promotions SET status='published',canonical_post_id=?,anonymized=1,approved_by_member_id=?,approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(canonicalId,session.member_id,id).run();
    return redirect(`/p/${canonicalId}/${encodeURIComponent(slug)}`);
  }

  return null;
}

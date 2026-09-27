import { ensureLessonDiscussionData } from "./lesson-discussions.js";

function clean(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

export async function listCommunityCourseDiscussions(env, limit = 50) {
  await ensureLessonDiscussionData(env);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
  const result = await env.COURSE_DB.prepare(`SELECT d.id,d.course_id,d.lesson_id,d.author_member_id,d.author_label,d.source_type,d.question,d.visibility,d.status,d.is_featured,d.sort_order,d.created_at,
    c.slug AS course_slug,c.title AS course_title,l.title AS lesson_title
    FROM course_discussions d
    JOIN courses c ON c.id=d.course_id
    JOIN lessons l ON l.id=d.lesson_id AND l.course_id=d.course_id
    WHERE d.visibility='public' AND d.status!='hidden'
    ORDER BY d.is_featured DESC,d.course_id,d.sort_order ASC,d.created_at DESC LIMIT ?`).bind(safeLimit).all();
  const discussions = result.results || [];
  if (!discussions.length) return [];

  const placeholders = discussions.map(() => "?").join(",");
  const replies = await env.COURSE_DB.prepare(`SELECT id,discussion_id,author_member_id,author_label,source_type,body,status,created_at
    FROM course_discussion_replies WHERE discussion_id IN (${placeholders}) AND status='published'
    ORDER BY created_at ASC`).bind(...discussions.map((item) => item.id)).all();
  const byDiscussion = new Map();
  for (const reply of replies.results || []) {
    if (!byDiscussion.has(reply.discussion_id)) byDiscussion.set(reply.discussion_id, []);
    byDiscussion.get(reply.discussion_id).push(reply);
  }
  return discussions.map((item) => ({
    ...item,
    replies: byDiscussion.get(item.id) || []
  }));
}

export async function replyToCommunityCourseDiscussion(env, input = {}) {
  await ensureLessonDiscussionData(env);
  const discussionId = clean(input.discussion_id, 180);
  const memberId = clean(input.member_id, 128);
  const body = clean(input.body, 5000);
  if (!discussionId || !memberId || body.length < 1) {
    return { ok: false, error: "invalid_reply" };
  }

  const discussion = await env.COURSE_DB.prepare(`SELECT id,author_member_id,question,status,visibility FROM course_discussions
    WHERE id=? AND visibility='public' AND status!='hidden' LIMIT 1`).bind(discussionId).first();
  if (!discussion?.id) return { ok: false, error: "discussion_not_found" };

  const recent = await env.COURSE_DB.prepare(`SELECT COUNT(*) AS count FROM course_discussion_replies
    WHERE author_member_id=? AND source_type='community' AND created_at>=datetime('now','-10 minutes')`).bind(memberId).first();
  if (Number(recent?.count || 0) >= 10) return { ok: false, error: "rate_limited" };

  const id = `community-reply-${crypto.randomUUID()}`;
  await env.COURSE_DB.prepare(`INSERT INTO course_discussion_replies
    (id,discussion_id,author_member_id,author_label,source_type,body,status)
    VALUES(?,?,?,'커뮤니티 회원','community',?,'published')`).bind(id,discussionId,memberId,body).run();
  await env.COURSE_DB.prepare("UPDATE course_discussions SET status='answered',updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(discussionId).run();

  return {
    ok: true,
    reply_id: id,
    discussion_id: discussionId,
    discussion_author_member_id: discussion.author_member_id || null,
    question: String(discussion.question || "").slice(0, 180)
  };
}

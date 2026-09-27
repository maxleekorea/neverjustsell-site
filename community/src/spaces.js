import { ensureCommunityProgramSchema } from "./program-schema.js";
import { notifyMember } from "./notifications.js";

const SESSION_COOKIE = "njs_community_session";
const COMMUNITY_ORIGIN = "https://community.neverjustsell.com";

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

function parseCookies(request) {
  const header = String(request.headers.get("Cookie") || "");
  const values = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    const key = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    try { values[key] = decodeURIComponent(raw); } catch { values[key] = raw; }
  }
  return values;
}

function redirect(location, status = 303) {
  return new Response(null, {
    status,
    headers: { Location: location, "Cache-Control": "no-store" }
  });
}

function loginRedirect(request) {
  const url = new URL(request.url);
  const returnTo = `${url.pathname}${url.search}`;
  return redirect(`/login?return_to=${encodeURIComponent(returnTo)}`, 302);
}

function html(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)} | NEVER JUST SELL Community</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f1ec;color:#171512;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(960px,calc(100% - 32px));margin:0 auto}.top{min-height:66px;display:flex;gap:16px;align-items:center;justify-content:space-between;border-bottom:1px solid #ddd6cc}.brand{font-size:14px;font-weight:900;letter-spacing:.06em;text-decoration:none}.nav{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px}.page{padding:42px 0 64px}.eyebrow{font-size:11px;font-weight:850;letter-spacing:.12em;color:#77502e}.page-title{font-size:clamp(34px,6vw,54px);line-height:1.08;letter-spacing:-.045em;margin:8px 0 10px}.lead{color:#716960;max-width:720px;margin:0}.section{margin-top:34px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:12px}.section-head h2{font-size:23px;margin:0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.card{display:block;background:#fff;border:1px solid #ddd5cb;padding:22px;text-decoration:none}.card:hover{border-color:#b8a997}.card h3{font-size:20px;margin:7px 0}.card p{font-size:13px;color:#716960;margin:0}.meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;color:#786f66}.badge{display:inline-block;padding:3px 8px;border:1px solid #d8cfc4;border-radius:999px;background:#faf8f4}.badge.role{border-color:#b9946e;color:#684725}.empty{background:#fff;border:1px solid #ddd5cb;padding:28px;color:#716960}.post-list{display:grid;gap:8px}.post-row{display:block;background:#fff;border:1px solid #ddd5cb;padding:18px;text-decoration:none}.post-row h3{font-size:18px;margin:4px 0 6px}.post-row p{font-size:13px;color:#716960;margin:0}.action{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:9px 15px;background:#171512;color:#fff;text-decoration:none;border:0;font:inherit;font-weight:800;cursor:pointer}.secondary{background:#fff;color:#171512;border:1px solid #cbc1b6}.post{background:#fff;border:1px solid #ddd5cb;padding:28px}.post h1{font-size:clamp(28px,5vw,44px);line-height:1.18;margin:8px 0 15px}.post-body{margin-top:24px;font-size:16px}.comments{margin-top:30px}.comment{background:#fff;border:1px solid #ddd5cb;padding:17px;margin-top:8px}.comment .who{font-size:12px;font-weight:800;color:#765333;margin-bottom:5px}.item-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.inline-form{display:inline}.link-button{border:0;background:transparent;padding:0;color:#75685d;text-decoration:underline;font:inherit;font-size:12px;cursor:pointer}.form{background:#fff;border:1px solid #ddd5cb;padding:22px}.form label{display:block;font-size:13px;font-weight:800;margin:14px 0 6px}.form input,.form textarea{width:100%;border:1px solid #cfc6bb;background:#fff;padding:11px 12px;font:inherit}.form textarea{min-height:180px;resize:vertical}.notice{background:#ede6dc;border-left:4px solid #9c7651;padding:14px 16px;margin:18px 0;color:#5e554c;font-size:13px}.foot{padding:28px 0 48px;border-top:1px solid #ddd6cc;color:#81786f;font-size:12px}@media(max-width:700px){.shell{width:calc(100% - 22px)}.top{align-items:flex-start;padding:14px 0}.nav{justify-content:flex-end}.page{padding-top:30px}.grid{grid-template-columns:1fr}.card,.post,.form{padding:18px}}
</style></head><body><header class="shell top"><a class="brand" href="/">NEVER JUST SELL COMMUNITY</a><nav class="nav"><a href="/">공개 커뮤니티</a><a href="/course-questions">강의 질문</a><a href="/spaces">내 모임</a><a href="/notifications">알림</a><a href="https://classroom.neverjustsell.com/my-space">내 공간</a></nav></header><main class="shell page">${body}</main><footer class="shell foot">프로그램과 강의의 대화는 참여 자격과 맥락에 맞는 공간에서 이어집니다.</footer></body></html>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

async function sessionFor(request, env) {
  if (!env.DB) return null;
  const id = parseCookies(request)[SESSION_COOKIE];
  if (!id) return null;
  return env.DB.prepare(`SELECT s.session_id,s.member_id,s.csrf_token,s.expires_at,m.display_name,m.role
    FROM sessions s JOIN members m ON m.member_id=s.member_id
    WHERE s.session_id=? AND s.expires_at>CURRENT_TIMESTAMP AND m.status='active' LIMIT 1`)
    .bind(id).first();
}

async function accessibleSpaces(env, memberId) {
  await ensureCommunityProgramSchema(env);
  const result = await env.DB.prepare(`SELECT s.id,s.scope_type,s.scope_id,s.space_type,s.name,s.slug,s.visibility,s.access_rule,s.status,
    sm.access_status,sm.moderation_role,pr.title AS run_title,pr.lifecycle_phase
    FROM space_members sm
    JOIN spaces s ON s.id=sm.space_id
    LEFT JOIN program_run_projections pr ON s.scope_type='program_run' AND pr.run_id=s.scope_id
    WHERE sm.member_id=? AND sm.access_status IN ('active','read_only') AND s.status!='archived'
    ORDER BY COALESCE(pr.starts_at,''),COALESCE(pr.title,s.scope_id),
      CASE s.space_type WHEN 'announcements' THEN 1 WHEN 'author_qna' THEN 2 WHEN 'weekly_discussion' THEN 3 WHEN 'live_events' THEN 4 WHEN 'alumni' THEN 5 ELSE 9 END,s.name`)
    .bind(memberId).all();
  return result.results || [];
}

async function getSpaceAccess(env, memberId, spaceId) {
  await ensureCommunityProgramSchema(env);
  return env.DB.prepare(`SELECT s.id,s.scope_type,s.scope_id,s.space_type,s.name,s.slug,s.visibility,s.access_rule,s.status,
    sm.access_status,sm.moderation_role,pr.title AS run_title,pr.lifecycle_phase
    FROM spaces s JOIN space_members sm ON sm.space_id=s.id
    LEFT JOIN program_run_projections pr ON s.scope_type='program_run' AND pr.run_id=s.scope_id
    WHERE s.id=? AND sm.member_id=? AND sm.access_status IN ('active','read_only') AND s.status!='archived' LIMIT 1`)
    .bind(spaceId, memberId).first();
}

function roleLabel(row) {
  if (row?.moderation_role === "host") return "호스트";
  if (row?.moderation_role === "moderator") return "운영진";
  if (row?.access_status === "read_only") return "읽기 전용";
  return "참여자";
}

function isSpaceModerator(space) {
  return ["host","moderator"].includes(String(space?.moderation_role || ""));
}

function typeLabel(type) {
  return ({
    announcements: "공지",
    author_qna: "저자 Q&A",
    weekly_discussion: "함께 이야기하기",
    mission_feed: "실행 기록",
    lounge: "라운지",
    live_events: "라이브·일정",
    alumni: "완독자·수료자",
    creator_room: "크리에이터"
  })[type] || "모임";
}

function canWrite(space) {
  if (!space || space.status !== "active" || space.access_status !== "active") return false;
  if (["announcements","live_events"].includes(space.space_type)) return isSpaceModerator(space);
  return true;
}

function postTypeFor(spaceType) {
  return ({
    announcements: "announcement",
    author_qna: "question",
    weekly_discussion: "discussion",
    mission_feed: "reflection",
    lounge: "discussion",
    live_events: "announcement",
    alumni: "discussion",
    creator_room: "discussion"
  })[spaceType] || "discussion";
}

function categorySlugFor(spaceType) {
  return ({
    author_qna: "online-selling",
    mission_feed: "reading-action",
    alumni: "reading-action",
    weekly_discussion: "branding-marketing"
  })[spaceType] || "free-talk";
}

async function renderSpacesHome(session, env) {
  const rows = await accessibleSpaces(env, session.member_id);
  const cards = rows.map((row) => {
    const href = `/spaces/${encodeURIComponent(row.id)}`;
    const context = row.run_title || (row.space_type === "alumni" ? "프로그램 수료자" : row.scope_id);
    return `<a class="card" href="${href}"><div class="meta"><span class="badge">${esc(typeLabel(row.space_type))}</span><span class="badge role">${esc(roleLabel(row))}</span></div><h3>${esc(row.name)}</h3><p>${esc(context)}</p></a>`;
  }).join("");
  return html("내 모임", `<div class="eyebrow">MEMBER SPACES</div><h1 class="page-title">내 모임</h1><p class="lead">참여 중인 프로그램과 수료자 모임을 한곳에서 이어갑니다. 프로그램마다 필요한 대화만 보입니다.</p><section class="section"><div class="section-head"><h2>참여 가능한 공간</h2><span class="meta">${rows.length}개</span></div>${cards ? `<div class="grid">${cards}</div>` : `<div class="empty">현재 참여 중인 프로그램 모임이 없습니다. 공개 커뮤니티와 강의 질문은 로그인 여부와 관계없이 둘러볼 수 있습니다.</div>`}</section>`);
}

async function renderSpace(session, env, space) {
  const result = await env.DB.prepare(`SELECT p.id,p.slug,p.title,p.body,p.post_type,p.comment_count,p.like_count,p.published_at,m.display_name
    FROM posts p JOIN members m ON m.member_id=p.author_member_id
    WHERE p.space_id=? AND p.status='published'
    ORDER BY CASE p.post_type WHEN 'announcement' THEN 0 ELSE 1 END,p.published_at DESC,p.id DESC LIMIT 100`)
    .bind(space.id).all();
  const posts = result.results || [];
  const list = posts.map((post) => `<a class="post-row" href="/spaces/${encodeURIComponent(space.id)}/p/${Number(post.id)}"><div class="meta"><span class="badge">${esc(post.post_type === "question" ? "질문" : post.post_type === "announcement" ? "공지" : post.post_type === "reflection" ? "기록" : "대화")}</span><span>${esc(post.display_name || "회원")}</span><span>답변 ${Number(post.comment_count || 0)}</span></div><h3>${esc(post.title)}</h3><p>${esc(String(post.body || "").replace(/\s+/g," ").slice(0,140))}</p></a>`).join("");
  const action = canWrite(space) ? `<a class="action" href="/spaces/${encodeURIComponent(space.id)}/write">${space.space_type === "author_qna" ? "저자에게 질문하기" : space.space_type === "announcements" ? "공지 작성" : "글쓰기"}</a>` : "";
  const moderation = isSpaceModerator(space) ? `<a class="action secondary" href="/moderation">운영</a>` : "";
  return html(space.name, `<div class="eyebrow">${esc(typeLabel(space.space_type))}</div><h1 class="page-title">${esc(space.name)}</h1><p class="lead">${esc(space.run_title || space.scope_id)} · ${esc(roleLabel(space))}</p><div class="item-actions">${action}${moderation}</div><section class="section"><div class="section-head"><h2>최근 대화</h2><span class="meta">${posts.length}개</span></div>${list ? `<div class="post-list">${list}</div>` : `<div class="empty">아직 대화가 없습니다. 시스템이 완성된 뒤 초기 콘텐츠를 채울 예정입니다.</div>`}</section>`);
}

async function renderWrite(session, space) {
  const label = space.space_type === "author_qna" ? "저자에게 질문하기" : space.space_type === "announcements" ? "공지 작성" : "글쓰기";
  const helper = space.space_type === "author_qna"
    ? "책·강의·실행 과정에서 생긴 질문을 구체적으로 적어 주세요. 저자와 운영진이 맥락을 보고 답할 수 있습니다."
    : "이 공간의 목적에 맞는 경험과 생각을 남겨 주세요.";
  return html(label, `<div class="eyebrow">${esc(typeLabel(space.space_type))}</div><h1 class="page-title">${label}</h1><div class="notice">${helper}</div><form class="form" method="post"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><label for="title">제목</label><input id="title" name="title" maxlength="140" required><label for="body">내용</label><textarea id="body" name="body" maxlength="12000" required></textarea><div style="margin-top:16px"><button class="action" type="submit">등록</button> <a class="action secondary" href="/spaces/${encodeURIComponent(space.id)}">취소</a></div></form>`);
}

async function createSpacePost(request, session, env, space) {
  if (!canWrite(space)) return html("작성할 수 없습니다", `<h1 class="page-title">현재 이 공간에 글을 쓸 수 없습니다.</h1>`, 403);
  const form = await request.formData().catch(() => null);
  if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  const title = String(form.get("title") || "").trim().slice(0, 140);
  const body = String(form.get("body") || "").trim().slice(0, 12000);
  if (title.length < 4 || body.length < 20) return new Response("제목과 내용을 조금 더 구체적으로 적어 주세요.", { status: 400 });
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM posts WHERE author_member_id=? AND created_at>datetime('now','-10 minutes')").bind(session.member_id).first();
  if (Number(recent?.n || 0) >= 3) return new Response("짧은 시간에 너무 많은 글이 등록되었습니다. 잠시 후 다시 시도해 주세요.", { status: 429 });
  const categorySlug = categorySlugFor(space.space_type);
  const category = await env.DB.prepare("SELECT id FROM categories WHERE slug=? AND is_active=1 LIMIT 1").bind(categorySlug).first();
  if (!category?.id) return new Response("게시판 설정을 확인할 수 없습니다.", { status: 503 });
  const slug = `${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
  const insert = await env.DB.prepare(`INSERT INTO posts
    (category_id,author_member_id,slug,title,body,status,is_indexable,space_id,program_run_id,post_type,visibility,knowledge_state)
    VALUES(?,?,?,?,?,'published',0,?,?,?,?,'private')`)
    .bind(Number(category.id),session.member_id,slug,title,body,space.id,space.scope_type === "program_run" ? space.scope_id : null,postTypeFor(space.space_type),"space").run();
  const id = Number(insert?.meta?.last_row_id || 0);
  return redirect(`/spaces/${encodeURIComponent(space.id)}/p/${id}`);
}

async function renderSpacePost(session, env, space, postId) {
  const post = await env.DB.prepare(`SELECT p.*,m.display_name FROM posts p JOIN members m ON m.member_id=p.author_member_id
    WHERE p.id=? AND p.space_id=? AND p.status='published' LIMIT 1`).bind(postId,space.id).first();
  if (!post?.id) return html("글을 찾을 수 없습니다", `<h1 class="page-title">글을 찾을 수 없습니다.</h1>`, 404);
  const commentsResult = await env.DB.prepare(`SELECT c.id,c.author_member_id,c.body,c.created_at,m.display_name FROM comments c JOIN members m ON m.member_id=c.author_member_id
    WHERE c.post_id=? AND c.status='published' ORDER BY c.created_at ASC,c.id ASC`).bind(postId).all();
  const comments = commentsResult.results || [];
  const returnTo = `/spaces/${encodeURIComponent(space.id)}/p/${postId}`;
  const commentHtml = comments.map((item) => `<div class="comment"><div class="who">${esc(item.display_name || "회원")}</div><div>${paragraphs(item.body)}</div><div class="item-actions"><form class="inline-form" method="post" action="/report"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><input type="hidden" name="target_type" value="comment"><input type="hidden" name="target_id" value="${Number(item.id)}"><input type="hidden" name="reason" value="운영자 검토 요청"><input type="hidden" name="return_to" value="${esc(returnTo)}"><button class="link-button" type="submit">신고</button></form></div></div>`).join("");
  const reply = canWrite(space) ? `<form class="form" method="post" action="/spaces/${encodeURIComponent(space.id)}/p/${postId}/comment"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><label for="body">답변·댓글</label><textarea id="body" name="body" maxlength="5000" required style="min-height:110px"></textarea><div style="margin-top:12px"><button class="action" type="submit">등록</button></div></form>` : `<div class="notice">현재 이 공간은 읽기 전용입니다.</div>`;
  const reportPost = `<form class="inline-form" method="post" action="/report"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><input type="hidden" name="target_type" value="post"><input type="hidden" name="target_id" value="${Number(post.id)}"><input type="hidden" name="reason" value="운영자 검토 요청"><input type="hidden" name="return_to" value="${esc(returnTo)}"><button class="link-button" type="submit">신고</button></form>`;
  const candidate = isSpaceModerator(space) ? `<form class="inline-form" method="post" action="/spaces/${encodeURIComponent(space.id)}/p/${postId}/knowledge-candidate"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><button class="link-button" type="submit">지식 후보로 올리기</button></form>` : "";
  return html(post.title, `<a href="/spaces/${encodeURIComponent(space.id)}">← ${esc(space.name)}</a><article class="post" style="margin-top:18px"><div class="meta"><span class="badge">${esc(post.post_type)}</span><span>${esc(post.display_name || "회원")}</span></div><h1>${esc(post.title)}</h1><div class="post-body">${paragraphs(post.body)}</div><div class="item-actions">${reportPost}${candidate}</div></article><section class="comments"><div class="section-head"><h2>답변과 댓글</h2><span class="meta">${comments.length}개</span></div>${commentHtml || `<div class="empty">아직 답변이 없습니다.</div>`}<div style="margin-top:14px">${reply}</div></section>`);
}

async function createComment(request, session, env, space, postId) {
  if (!canWrite(space)) return new Response("현재 이 공간에 답변할 수 없습니다.", { status: 403 });
  const post = await env.DB.prepare("SELECT id,title,author_member_id FROM posts WHERE id=? AND space_id=? AND status='published' LIMIT 1").bind(postId,space.id).first();
  if (!post?.id) return new Response("글을 찾을 수 없습니다.", { status: 404 });
  const form = await request.formData().catch(() => null);
  if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  const body = String(form.get("body") || "").trim().slice(0, 5000);
  if (body.length < 2) return new Response("내용을 입력해 주세요.", { status: 400 });
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM comments WHERE author_member_id=? AND created_at>datetime('now','-10 minutes')").bind(session.member_id).first();
  if (Number(recent?.n || 0) >= 10) return new Response("짧은 시간에 너무 많은 댓글이 등록되었습니다. 잠시 후 다시 시도해 주세요.", { status: 429 });
  await env.DB.batch([
    env.DB.prepare("INSERT INTO comments(post_id,author_member_id,body,status) VALUES(?,?,?,'published')").bind(postId,session.member_id,body),
    env.DB.prepare("UPDATE posts SET comment_count=(SELECT COUNT(*) FROM comments WHERE post_id=? AND status='published'),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(postId,postId)
  ]);
  await notifyMember(env, { memberId: post.author_member_id, actorMemberId: session.member_id, type: "comment", title: `‘${String(post.title).slice(0,80)}’에 새 답변이 달렸습니다.`, targetUrl: `/spaces/${encodeURIComponent(space.id)}/p/${postId}` });
  return redirect(`/spaces/${encodeURIComponent(space.id)}/p/${postId}`);
}

export async function handleSpaceRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/spaces" && !url.pathname.startsWith("/spaces/")) return null;
  const session = await sessionFor(request, env);
  if (!session) return loginRedirect(request);
  await ensureCommunityProgramSchema(env);

  if (request.method === "GET" && url.pathname === "/spaces") return renderSpacesHome(session, env);

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "spaces" || !parts[1]) return null;
  let spaceId;
  try { spaceId = decodeURIComponent(parts[1]); } catch { return new Response("잘못된 주소입니다.", { status: 400 }); }
  const space = await getSpaceAccess(env, session.member_id, spaceId);
  if (!space?.id) return html("접근할 수 없습니다", `<h1 class="page-title">이 모임에 접근할 수 없습니다.</h1><p class="lead">참여 자격이 없거나 프로그램 이용 권한이 종료되었습니다.</p>`, 403);

  if (parts.length === 2 && request.method === "GET") return renderSpace(session, env, space);
  if (parts.length === 3 && parts[2] === "write") {
    if (request.method === "GET") {
      if (!canWrite(space)) return html("작성할 수 없습니다", `<h1 class="page-title">현재 이 공간에 글을 쓸 수 없습니다.</h1>`, 403);
      return renderWrite(session, space);
    }
    if (request.method === "POST") return createSpacePost(request, session, env, space);
  }
  if (parts.length >= 4 && parts[2] === "p") {
    const postId = Number(parts[3]);
    if (!Number.isInteger(postId) || postId <= 0) return new Response("잘못된 글 번호입니다.", { status: 400 });
    if (parts.length === 4 && request.method === "GET") return renderSpacePost(session, env, space, postId);
    if (parts.length === 5 && parts[4] === "comment" && request.method === "POST") return createComment(request, session, env, space, postId);
  }
  return html("찾을 수 없습니다", `<h1 class="page-title">페이지를 찾을 수 없습니다.</h1>`, 404);
}

export async function getMemberSession(request, env) {
  return sessionFor(request, env);
}

export { COMMUNITY_ORIGIN };

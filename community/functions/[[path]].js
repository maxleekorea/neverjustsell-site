const DEFAULT_SITE_ORIGIN = "https://community.neverjustsell.com";
const DEFAULT_AUTH_BRIDGE_ORIGIN = "https://neverjustsell-course-access.max-lee-korea.workers.dev";
const SESSION_COOKIE = "njs_community_session";
const SESSION_TTL_SECONDS = 2 * 60 * 60;
const POSTS_PER_PAGE = 24;

function siteOrigin(env) {
  return String(env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN).replace(/\/$/, "");
}

function authBridgeOrigin(env) {
  return String(env.AUTH_BRIDGE_ORIGIN || DEFAULT_AUTH_BRIDGE_ORIGIN).replace(/\/$/, "");
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function xmlEsc(value) {
  return esc(value).replaceAll("&#039;", "&apos;");
}

function jsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function cleanText(value, max = 100000) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

function excerpt(value, max = 160) {
  const text = cleanText(value).replace(/\s+/g, " ");
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function slugify(value) {
  const slug = cleanText(value, 160)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
  return slug || "post";
}

function bodyHtml(value) {
  return cleanText(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${esc(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function sqliteTime(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T") + (String(value).includes("T") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const result = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

function sessionCookie(id) {
  return `${SESSION_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function baseHeaders({ indexable = true, contentType = "text/html; charset=utf-8" } = {}) {
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; img-src 'self' data: https:; script-src 'unsafe-inline'; base-uri 'self'; form-action 'self' https://neverjustsell-course-access.max-lee-korea.workers.dev; frame-ancestors 'none'"
  });
  if (!indexable) headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return headers;
}

function response(body, status = 200, options = {}) {
  return new Response(body, { status, headers: baseHeaders(options) });
}

function redirect(location, status = 303, cookie = null) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(null, { status, headers });
}

function absolute(env, path = "/") {
  return new URL(path, `${siteOrigin(env)}/`).toString();
}

function nav(session) {
  const auth = session
    ? `<span class="member-name">${esc(session.display_name)}</span><a href="/write">글쓰기</a><a href="/settings/profile">프로필</a><a href="/logout">로그아웃</a>`
    : `<a href="/login">로그인</a>`;
  return `<header class="site-header"><div class="shell header-inner"><a class="brand" href="/">NEVER JUST SELL <span>COMMUNITY</span></a><nav><a href="/">전체 글</a><a href="/c/online-selling">온라인 판매</a><a href="/c/case-study">경험·사례</a><a href="/c/reading-action">읽고 실행</a>${auth}</nav></div></header>`;
}

function styles() {
  return `<style>
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:#f4f1ec;color:#171512;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(1080px,calc(100% - 32px));margin:0 auto}.site-header{position:sticky;top:0;z-index:5;background:rgba(244,241,236,.96);backdrop-filter:blur(12px);border-bottom:1px solid #ddd6cc}.header-inner{min-height:66px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{font-size:14px;font-weight:900;letter-spacing:.08em;text-decoration:none}.brand span{font-weight:600;color:#7c746b}.site-header nav{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.site-header nav a,.member-name{font-size:13px;text-decoration:none}.member-name{color:#7a7168}.hero{padding:62px 0 36px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:.14em;color:#77502e}.hero h1,.page-title{font-size:clamp(34px,6vw,64px);letter-spacing:-.055em;line-height:1.05;margin:8px 0 18px}.hero p{max-width:680px;color:#6f675f;font-size:17px}.category-grid{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid #d9d1c6;background:#d9d1c6;gap:1px;margin:18px 0 42px}.category-card{background:#fff;padding:18px;text-decoration:none;min-height:138px}.category-card strong{display:block;font-size:16px;margin-bottom:7px}.category-card span{font-size:13px;color:#81776e}.section-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin:34px 0 16px}.section-head h2{font-size:26px;letter-spacing:-.03em;margin:0}.post-list{background:#fff;border:1px solid #ddd5cb}.post-row{display:grid;grid-template-columns:130px 1fr 120px;gap:18px;padding:20px;border-bottom:1px solid #eee8e1;text-decoration:none}.post-row:last-child{border-bottom:0}.post-row:hover{background:#fbfaf8}.category-label{font-size:12px;color:#765333;font-weight:700}.post-title{font-size:18px;font-weight:750;letter-spacing:-.02em}.post-excerpt{display:block;margin-top:5px;color:#7b736b;font-size:14px}.post-meta{text-align:right;font-size:12px;color:#8a8179}.empty{padding:50px 24px;text-align:center;color:#82786f;background:#fff;border:1px solid #ddd5cb}.pagination{display:flex;justify-content:center;gap:8px;margin:28px 0 54px}.pagination a,.pagination span{min-width:40px;padding:9px 11px;text-align:center;border:1px solid #d8d0c6;text-decoration:none;background:#fff}.pagination .current{background:#171512;color:#fff;border-color:#171512}.article-wrap{width:min(820px,calc(100% - 32px));margin:0 auto;padding:52px 0 80px}.breadcrumbs{font-size:12px;color:#7f756c;margin-bottom:30px}.article h1{font-size:clamp(32px,6vw,54px);line-height:1.15;letter-spacing:-.045em;margin:8px 0 20px}.article-meta{display:flex;gap:10px;align-items:center;flex-wrap:wrap;color:#81776e;font-size:13px;padding-bottom:22px;border-bottom:1px solid #dcd4ca}.article-body{font-size:17px;line-height:1.92;padding:24px 0 12px}.article-body p{margin:0 0 1.35em}.stats{display:flex;gap:16px;font-size:13px;color:#746c64;margin:22px 0}.comments{margin-top:44px}.comments h2{font-size:23px}.comment{background:#fff;border-top:1px solid #e0d8cf;padding:20px}.comment:first-of-type{border-top:1px solid #d4cbc0}.comment-head{font-size:12px;color:#817970;margin-bottom:8px}.comment-body{font-size:15px}.form-card{background:#fff;border:1px solid #d9d1c7;padding:24px;margin-top:22px}.form-card label{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}.form-card input,.form-card textarea,.form-card select{width:100%;padding:12px 13px;border:1px solid #cfc6bb;background:#fff;font:inherit}.form-card textarea{min-height:220px;resize:vertical}.btn{display:inline-block;border:0;background:#171512;color:#fff;padding:12px 18px;font-weight:750;text-decoration:none;cursor:pointer;margin-top:14px}.btn-line{background:transparent;color:#171512;border:1px solid #171512}.notice{padding:14px 16px;background:#ede5da;color:#5f5145;margin:14px 0;font-size:14px}.profile{background:#fff;border:1px solid #ddd5cb;padding:28px;margin:22px 0}.profile h1{margin:0 0 8px}.profile p{color:#746b63}.footer{border-top:1px solid #d9d1c7;padding:34px 0 55px;color:#81786f;font-size:12px;margin-top:60px}.footer a{margin-right:14px}.error{width:min(720px,calc(100% - 32px));margin:80px auto;padding:34px;background:#fff;border:1px solid #ddd5cb}.error h1{font-size:34px;margin-top:0}
@media(max-width:800px){.category-grid{grid-template-columns:1fr 1fr}.post-row{grid-template-columns:1fr}.post-meta{text-align:left}.site-header{position:static}.header-inner{padding:14px 0;align-items:flex-start}.site-header nav{justify-content:flex-end}.hero{padding-top:42px}}
@media(max-width:520px){.shell,.article-wrap{width:calc(100% - 22px)}.category-grid{grid-template-columns:1fr}.header-inner{display:block}.site-header nav{margin-top:10px;justify-content:flex-start;gap:12px}.hero h1,.page-title{font-size:38px}.post-row{padding:17px}.article-wrap{padding-top:34px}.article h1{font-size:36px}.article-body{font-size:16px}}
</style>`;
}

function layout(env, { title, description, canonicalPath, body, session = null, indexable = true, jsonLdData = [] }) {
  const canonical = absolute(env, canonicalPath);
  const fullTitle = title ? `${title} | NEVER JUST SELL Community` : "NEVER JUST SELL Community";
  const robots = indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow,noarchive";
  const ld = jsonLdData.map((item) => `<script type="application/ld+json">${jsonLd(item)}</script>`).join("");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(fullTitle)}</title><meta name="description" content="${esc(description || "온라인 판매, 유통, 브랜드와 마케팅을 경험과 질문으로 나누는 NEVER JUST SELL 커뮤니티")}"><meta name="robots" content="${robots}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:site_name" content="NEVER JUST SELL Community"><meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(description || "온라인 판매와 사업을 경험과 질문으로 나누는 커뮤니티")}"><meta property="og:url" content="${esc(canonical)}">${styles()}${ld}</head><body>${nav(session)}${body}<footer class="footer"><div class="shell"><a href="https://www.neverjustsell.com/">NEVER JUST SELL 홈</a><a href="/feed.xml">RSS</a><a href="/sitemap.xml">Sitemap</a><span>회원의 경험과 질문이 검색 가능한 지식으로 축적되는 커뮤니티입니다.</span></div></footer></body></html>`;
}

async function dbReady(env) {
  return Boolean(env.DB && typeof env.DB.prepare === "function");
}

async function getSession(request, env) {
  if (!(await dbReady(env))) return null;
  const id = parseCookies(request)[SESSION_COOKIE];
  if (!id) return null;
  const row = await env.DB.prepare(`SELECT s.session_id,s.csrf_token,s.expires_at,m.member_id,m.public_id,m.display_name,m.bio,m.role,m.status FROM sessions s JOIN members m ON m.member_id=s.member_id WHERE s.session_id=? AND s.expires_at > CURRENT_TIMESTAMP AND m.status='active'`).bind(id).first();
  return row || null;
}

async function requireSession(request, env) {
  const session = await getSession(request, env);
  if (!session) return { session: null, response: redirect(`/login?return_to=${encodeURIComponent(new URL(request.url).pathname)}`, 302) };
  return { session, response: null };
}

function validReturnPath(value) {
  const path = String(value || "/");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function csrfOk(form, session) {
  return Boolean(session?.csrf_token && String(form.get("csrf") || "") === session.csrf_token);
}

async function categories(env) {
  const { results = [] } = await env.DB.prepare(`SELECT id,slug,name,description,sort_order FROM categories WHERE is_active=1 ORDER BY sort_order ASC,id ASC`).all();
  return results;
}

async function postRows(env, { categorySlug = null, page = 1, authorMemberId = null } = {}) {
  const offset = Math.max(0, (page - 1) * POSTS_PER_PAGE);
  const clauses = ["p.status='published'"];
  const values = [];
  if (categorySlug) {
    clauses.push("c.slug=?");
    values.push(categorySlug);
  }
  if (authorMemberId) {
    clauses.push("p.author_member_id=?");
    values.push(authorMemberId);
  }
  const where = clauses.join(" AND ");
  const query = `SELECT p.id,p.slug,p.title,p.body,p.published_at,p.updated_at,p.comment_count,p.like_count,p.view_count,p.is_indexable,c.slug AS category_slug,c.name AS category_name,m.public_id,m.display_name FROM posts p JOIN categories c ON c.id=p.category_id JOIN members m ON m.member_id=p.author_member_id WHERE ${where} ORDER BY p.published_at DESC,p.id DESC LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) AS total FROM posts p JOIN categories c ON c.id=p.category_id WHERE ${where}`;
  const stmt = env.DB.prepare(query).bind(...values, POSTS_PER_PAGE, offset);
  const countStmt = env.DB.prepare(countQuery).bind(...values);
  const [list, count] = await env.DB.batch([stmt, countStmt]);
  return { rows: list.results || [], total: Number(count.results?.[0]?.total || 0) };
}

function postPath(row) {
  return `/p/${row.id}/${encodeURIComponent(row.slug)}`;
}

function postListHtml(rows) {
  if (!rows.length) return `<div class="empty">아직 등록된 글이 없습니다.</div>`;
  return `<div class="post-list">${rows.map((row) => `<a class="post-row" href="${postPath(row)}"><span class="category-label">${esc(row.category_name)}</span><span><span class="post-title">${esc(row.title)}</span><span class="post-excerpt">${esc(excerpt(row.body, 110))}</span></span><span class="post-meta">${esc(row.display_name)}<br>${esc(formatDate(row.published_at))}<br>댓글 ${Number(row.comment_count || 0)}</span></a>`).join("")}</div>`;
}

function paginationHtml(page, total, basePath) {
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  if (pages <= 1) return "";
  const start = Math.max(1, page - 3);
  const end = Math.min(pages, page + 3);
  const items = [];
  for (let i = start; i <= end; i++) {
    const href = i === 1 ? basePath : `${basePath}?page=${i}`;
    items.push(i === page ? `<span class="current">${i}</span>` : `<a href="${href}">${i}</a>`);
  }
  return `<nav class="pagination" aria-label="페이지">${items.join("")}</nav>`;
}

async function renderHome(request, env) {
  const session = await getSession(request, env);
  const cats = await categories(env);
  const page = Math.max(1, Number(new URL(request.url).searchParams.get("page") || 1) || 1);
  const { rows, total } = await postRows(env, { page });
  const categoryCards = `<div class="category-grid">${cats.map((c) => `<a class="category-card" href="/c/${encodeURIComponent(c.slug)}"><strong>${esc(c.name)}</strong><span>${esc(c.description)}</span></a>`).join("")}</div>`;
  const body = `<main class="shell"><section class="hero"><div class="eyebrow">EXPERIENCE · QUESTION · DISCUSSION</div><h1>경험이 쌓이면<br>검색할 수 있는 지식이 됩니다.</h1><p>온라인 판매, 유통, 브랜드와 마케팅에 관한 실제 질문과 경험을 기록합니다. 광고성 글보다 직접 실행한 과정과 구체적인 사례를 우선합니다.</p></section>${categoryCards}<div class="section-head"><h2>최근 글</h2>${session ? `<a class="btn btn-line" href="/write">글쓰기</a>` : `<a href="/login">로그인 후 글쓰기</a>`}</div>${postListHtml(rows)}${paginationHtml(page,total,"/")}</main>`;
  const itemList = rows.slice(0, 10).map((row, index) => ({ "@type": "ListItem", position: index + 1, url: absolute(env, postPath(row)), name: row.title }));
  return response(layout(env, {
    title: "커뮤니티",
    description: "온라인 판매, 유통, 브랜드와 마케팅을 직접 실행한 경험과 질문으로 축적하는 NEVER JUST SELL 커뮤니티",
    canonicalPath: page === 1 ? "/" : `/?page=${page}`,
    session,
    body,
    jsonLdData: [
      { "@context": "https://schema.org", "@type": "WebSite", name: "NEVER JUST SELL Community", url: siteOrigin(env) },
      { "@context": "https://schema.org", "@type": "CollectionPage", name: "NEVER JUST SELL Community", url: absolute(env, "/"), mainEntity: { "@type": "ItemList", itemListElement: itemList } }
    ]
  }));
}

async function renderCategory(request, env, slug) {
  const session = await getSession(request, env);
  const category = await env.DB.prepare(`SELECT id,slug,name,description FROM categories WHERE slug=? AND is_active=1`).bind(slug).first();
  if (!category) return renderError(env, session, 404, "게시판을 찾을 수 없습니다.");
  const page = Math.max(1, Number(new URL(request.url).searchParams.get("page") || 1) || 1);
  const { rows, total } = await postRows(env, { categorySlug: slug, page });
  const body = `<main class="shell"><section class="hero"><div class="eyebrow">COMMUNITY</div><h1 class="page-title">${esc(category.name)}</h1><p>${esc(category.description)}</p></section>${postListHtml(rows)}${paginationHtml(page,total,`/c/${encodeURIComponent(slug)}`)}</main>`;
  return response(layout(env, {
    title: category.name,
    description: category.description,
    canonicalPath: page === 1 ? `/c/${slug}` : `/c/${slug}?page=${page}`,
    session,
    body,
    jsonLdData: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: category.name, description: category.description, url: absolute(env, `/c/${slug}`) }]
  }));
}

async function getPost(env, id) {
  return env.DB.prepare(`SELECT p.id,p.slug,p.title,p.body,p.status,p.is_indexable,p.published_at,p.updated_at,p.view_count,p.comment_count,p.like_count,p.author_member_id,c.slug AS category_slug,c.name AS category_name,m.public_id,m.display_name,m.bio FROM posts p JOIN categories c ON c.id=p.category_id JOIN members m ON m.member_id=p.author_member_id WHERE p.id=? AND p.status='published'`).bind(id).first();
}

async function renderPost(context, id, requestedSlug) {
  const { request, env } = context;
  const session = await getSession(request, env);
  const post = await getPost(env, id);
  if (!post) return renderError(env, session, 404, "글을 찾을 수 없습니다.");
  if (requestedSlug !== post.slug) return redirect(postPath(post), 301);
  const { results: comments = [] } = await env.DB.prepare(`SELECT c.id,c.body,c.created_at,m.public_id,m.display_name FROM comments c JOIN members m ON m.member_id=c.author_member_id WHERE c.post_id=? AND c.status='published' ORDER BY c.created_at ASC,c.id ASC LIMIT 200`).bind(id).all();
  if (context.waitUntil) context.waitUntil(env.DB.prepare(`UPDATE posts SET view_count=view_count+1 WHERE id=?`).bind(id).run());
  const commentHtml = comments.length ? comments.map((c) => `<article class="comment"><div class="comment-head"><a href="/member/${encodeURIComponent(c.public_id)}">${esc(c.display_name)}</a> · ${esc(formatDate(c.created_at))}</div><div class="comment-body">${bodyHtml(c.body)}</div></article>`).join("") : `<div class="empty">첫 댓글을 남겨보세요.</div>`;
  const commentForm = session ? `<form class="form-card" method="post" action="/p/${post.id}/comment"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><label for="comment-body">댓글</label><textarea id="comment-body" name="body" maxlength="5000" required></textarea><button class="btn" type="submit">댓글 등록</button></form>` : `<div class="notice"><a href="/login?return_to=${encodeURIComponent(postPath(post))}">로그인</a>하면 댓글을 남길 수 있습니다.</div>`;
  const likeForm = session ? `<form method="post" action="/p/${post.id}/like" style="display:inline"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><button class="btn btn-line" type="submit">좋아요 ${Number(post.like_count || 0)}</button></form>` : `좋아요 ${Number(post.like_count || 0)}`;
  const body = `<main class="article-wrap"><div class="breadcrumbs"><a href="/">커뮤니티</a> / <a href="/c/${encodeURIComponent(post.category_slug)}">${esc(post.category_name)}</a></div><article class="article"><div class="eyebrow">${esc(post.category_name)}</div><h1>${esc(post.title)}</h1><div class="article-meta"><a href="/member/${encodeURIComponent(post.public_id)}">${esc(post.display_name)}</a><span>${esc(formatDate(post.published_at))}</span><span>조회 ${Number(post.view_count || 0)}</span></div><div class="article-body">${bodyHtml(post.body)}</div><div class="stats">${likeForm}<span>댓글 ${comments.length}</span></div></article><section class="comments"><h2>댓글 ${comments.length}</h2>${commentHtml}${commentForm}</section></main>`;
  const commentLd = comments.slice(0, 50).map((c) => ({ "@type": "Comment", text: c.body, dateCreated: String(c.created_at).replace(" ", "T") + "Z", author: { "@type": "Person", name: c.display_name, url: absolute(env, `/member/${c.public_id}`) } }));
  const discussion = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: post.title,
    text: post.body,
    datePublished: String(post.published_at).replace(" ", "T") + "Z",
    dateModified: String(post.updated_at).replace(" ", "T") + "Z",
    url: absolute(env, postPath(post)),
    author: { "@type": "Person", name: post.display_name, url: absolute(env, `/member/${post.public_id}`) },
    commentCount: comments.length,
    comment: commentLd,
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: Number(post.like_count || 0) },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: comments.length }
    ]
  };
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "커뮤니티", item: absolute(env, "/") },
    { "@type": "ListItem", position: 2, name: post.category_name, item: absolute(env, `/c/${post.category_slug}`) },
    { "@type": "ListItem", position: 3, name: post.title, item: absolute(env, postPath(post)) }
  ] };
  return response(layout(env, {
    title: post.title,
    description: excerpt(post.body),
    canonicalPath: postPath(post),
    session,
    body,
    indexable: Boolean(post.is_indexable),
    jsonLdData: [discussion, breadcrumb]
  }), 200, { indexable: Boolean(post.is_indexable) });
}

async function renderMember(request, env, publicId) {
  const session = await getSession(request, env);
  const member = await env.DB.prepare(`SELECT member_id,public_id,display_name,bio,created_at FROM members WHERE public_id=? AND status='active'`).bind(publicId).first();
  if (!member) return renderError(env, session, 404, "회원 프로필을 찾을 수 없습니다.");
  const { rows } = await postRows(env, { authorMemberId: member.member_id, page: 1 });
  const body = `<main class="shell"><section class="profile"><div class="eyebrow">MEMBER</div><h1>${esc(member.display_name)}</h1><p>${member.bio ? esc(member.bio) : "아직 소개가 없습니다."}</p></section><div class="section-head"><h2>작성한 글</h2></div>${postListHtml(rows)}</main>`;
  const profileLd = { "@context": "https://schema.org", "@type": "ProfilePage", dateCreated: String(member.created_at).replace(" ", "T") + "Z", mainEntity: { "@type": "Person", name: member.display_name, description: member.bio || undefined, url: absolute(env, `/member/${member.public_id}`) } };
  return response(layout(env, { title: member.display_name, description: member.bio || `${member.display_name}님의 NEVER JUST SELL 커뮤니티 프로필`, canonicalPath: `/member/${publicId}`, session, body, jsonLdData: [profileLd] }));
}

async function renderWrite(request, env) {
  const required = await requireSession(request, env);
  if (required.response) return required.response;
  const session = required.session;
  const cats = await categories(env);
  if (request.method === "POST") {
    const form = await request.formData();
    if (!csrfOk(form, session)) return renderError(env, session, 403, "요청을 확인할 수 없습니다.");
    const title = cleanText(form.get("title"), 160);
    const body = cleanText(form.get("body"), 50000);
    const categorySlug = cleanText(form.get("category"), 80);
    if (title.length < 4 || body.length < 20) return renderError(env, session, 400, "제목과 본문을 조금 더 구체적으로 작성해 주세요.");
    const category = await env.DB.prepare(`SELECT id,slug FROM categories WHERE slug=? AND is_active=1`).bind(categorySlug).first();
    if (!category) return renderError(env, session, 400, "게시판을 선택해 주세요.");
    const recent = await env.DB.prepare(`SELECT COUNT(*) AS n FROM posts WHERE author_member_id=? AND created_at > datetime('now','-10 minutes')`).bind(session.member_id).first();
    if (Number(recent?.n || 0) >= 3) return renderError(env, session, 429, "짧은 시간에 너무 많은 글이 등록되었습니다. 잠시 후 다시 시도해 주세요.");
    const isIndexable = category.slug !== "free-talk" && body.length >= 120 ? 1 : 0;
    const slug = slugify(title);
    const result = await env.DB.prepare(`INSERT INTO posts(category_id,author_member_id,slug,title,body,is_indexable) VALUES(?,?,?,?,?,?)`).bind(category.id, session.member_id, slug, title, body, isIndexable).run();
    const id = Number(result.meta?.last_row_id);
    return redirect(`/p/${id}/${encodeURIComponent(slug)}`);
  }
  const options = cats.map((c) => `<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join("");
  const body = `<main class="article-wrap"><h1 class="page-title">글쓰기</h1><div class="notice">직접 겪은 상황, 구체적인 수치와 조건, 무엇을 시도했는지를 적을수록 다른 회원과 검색 이용자에게 도움이 됩니다. 자유게시판과 지나치게 짧은 글은 검색 색인 대상에서 제외합니다.</div><form class="form-card" method="post"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><label for="category">게시판</label><select id="category" name="category" required>${options}</select><label for="title">제목</label><input id="title" name="title" maxlength="160" required><label for="body">본문</label><textarea id="body" name="body" maxlength="50000" required></textarea><button class="btn" type="submit">등록</button></form></main>`;
  return response(layout(env, { title: "글쓰기", description: "커뮤니티 글쓰기", canonicalPath: "/write", session, body, indexable: false }), 200, { indexable: false });
}

async function handleComment(request, env, postId) {
  const required = await requireSession(request, env);
  if (required.response) return required.response;
  const session = required.session;
  const form = await request.formData();
  if (!csrfOk(form, session)) return renderError(env, session, 403, "요청을 확인할 수 없습니다.");
  const body = cleanText(form.get("body"), 5000);
  if (body.length < 2) return renderError(env, session, 400, "댓글 내용을 입력해 주세요.");
  const post = await getPost(env, postId);
  if (!post) return renderError(env, session, 404, "글을 찾을 수 없습니다.");
  const recent = await env.DB.prepare(`SELECT COUNT(*) AS n FROM comments WHERE author_member_id=? AND created_at > datetime('now','-10 minutes')`).bind(session.member_id).first();
  if (Number(recent?.n || 0) >= 10) return renderError(env, session, 429, "짧은 시간에 너무 많은 댓글이 등록되었습니다. 잠시 후 다시 시도해 주세요.");
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO comments(post_id,author_member_id,body) VALUES(?,?,?)`).bind(postId, session.member_id, body),
    env.DB.prepare(`UPDATE posts SET comment_count=comment_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(postId)
  ]);
  return redirect(`${postPath(post)}#comments`);
}

async function handleLike(request, env, postId) {
  const required = await requireSession(request, env);
  if (required.response) return required.response;
  const session = required.session;
  const form = await request.formData();
  if (!csrfOk(form, session)) return renderError(env, session, 403, "요청을 확인할 수 없습니다.");
  const post = await getPost(env, postId);
  if (!post) return renderError(env, session, 404, "글을 찾을 수 없습니다.");
  const existing = await env.DB.prepare(`SELECT 1 AS found FROM post_likes WHERE post_id=? AND member_id=?`).bind(postId, session.member_id).first();
  if (existing) {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM post_likes WHERE post_id=? AND member_id=?`).bind(postId, session.member_id),
      env.DB.prepare(`UPDATE posts SET like_count=MAX(0,like_count-1) WHERE id=?`).bind(postId)
    ]);
  } else {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO post_likes(post_id,member_id) VALUES(?,?)`).bind(postId, session.member_id),
      env.DB.prepare(`UPDATE posts SET like_count=like_count+1 WHERE id=?`).bind(postId)
    ]);
  }
  return redirect(postPath(post));
}

async function renderProfileSettings(request, env) {
  const required = await requireSession(request, env);
  if (required.response) return required.response;
  const session = required.session;
  let message = "";
  if (request.method === "POST") {
    const form = await request.formData();
    if (!csrfOk(form, session)) return renderError(env, session, 403, "요청을 확인할 수 없습니다.");
    const displayName = cleanText(form.get("display_name"), 40);
    const bio = cleanText(form.get("bio"), 400);
    if (displayName.length < 2) return renderError(env, session, 400, "표시 이름은 두 글자 이상 입력해 주세요.");
    await env.DB.prepare(`UPDATE members SET display_name=?,bio=?,updated_at=CURRENT_TIMESTAMP WHERE member_id=?`).bind(displayName, bio, session.member_id).run();
    session.display_name = displayName;
    session.bio = bio;
    message = `<div class="notice">프로필을 저장했습니다.</div>`;
  }
  const body = `<main class="article-wrap"><h1 class="page-title">프로필</h1>${message}<form class="form-card" method="post"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><label for="display_name">표시 이름</label><input id="display_name" name="display_name" maxlength="40" value="${esc(session.display_name)}" required><label for="bio">소개</label><textarea id="bio" name="bio" maxlength="400" style="min-height:130px">${esc(session.bio || "")}</textarea><button class="btn" type="submit">저장</button></form><p><a href="/member/${encodeURIComponent(session.public_id)}">공개 프로필 보기</a></p></main>`;
  return response(layout(env, { title: "프로필 설정", description: "회원 프로필 설정", canonicalPath: "/settings/profile", session, body, indexable: false }), 200, { indexable: false });
}

async function login(request, env) {
  const returnTo = validReturnPath(new URL(request.url).searchParams.get("return_to"));
  const callback = `${absolute(env, "/auth/callback")}?return_to=${encodeURIComponent(returnTo)}`;
  const target = `${authBridgeOrigin(env)}/oauth/cafe24/customer/start?return_to=${encodeURIComponent(callback)}`;
  return redirect(target, 302);
}

async function authCallback(request, env) {
  const url = new URL(request.url);
  const ticket = cleanText(url.searchParams.get("ticket"), 200);
  const returnTo = validReturnPath(url.searchParams.get("return_to"));
  if (!ticket) return renderError(env, null, 400, "회원 인증 정보가 없습니다.");
  const redeem = await fetch(`${authBridgeOrigin(env)}/community-auth/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket })
  });
  const identity = await redeem.json().catch(() => null);
  if (!redeem.ok || !identity?.member_id) return renderError(env, null, 401, "회원 인증이 만료되었거나 사용할 수 없습니다.");
  const publicId = crypto.randomUUID().replaceAll("-", "").slice(0, 18);
  await env.DB.prepare(`INSERT INTO members(member_id,public_id,display_name) VALUES(?,?,?) ON CONFLICT(member_id) DO UPDATE SET updated_at=CURRENT_TIMESTAMP`).bind(identity.member_id, publicId, identity.member_id).run();
  const member = await env.DB.prepare(`SELECT member_id,public_id,display_name FROM members WHERE member_id=?`).bind(identity.member_id).first();
  const sessionId = crypto.randomUUID();
  const csrf = crypto.randomUUID();
  const expires = sqliteTime(new Date(Date.now() + SESSION_TTL_SECONDS * 1000));
  await env.DB.prepare(`INSERT INTO sessions(session_id,member_id,csrf_token,expires_at) VALUES(?,?,?,?)`).bind(sessionId, member.member_id, csrf, expires).run();
  return redirect(returnTo, 303, sessionCookie(sessionId));
}

async function logout(request, env) {
  const id = parseCookies(request)[SESSION_COOKIE];
  if (id && env.DB) await env.DB.prepare(`DELETE FROM sessions WHERE session_id=?`).bind(id).run();
  return redirect("/", 303, expiredSessionCookie());
}

async function renderSitemap(env) {
  const [{ results: posts = [] }, { results: cats = [] }, { results: members = [] }] = await Promise.all([
    env.DB.prepare(`SELECT id,slug,updated_at FROM posts WHERE status='published' AND is_indexable=1 ORDER BY updated_at DESC LIMIT 20000`).all(),
    env.DB.prepare(`SELECT slug FROM categories WHERE is_active=1 AND slug<>'free-talk' ORDER BY sort_order`).all(),
    env.DB.prepare(`SELECT public_id,updated_at FROM members WHERE status='active' AND member_id IN (SELECT DISTINCT author_member_id FROM posts WHERE status='published' AND is_indexable=1) LIMIT 10000`).all()
  ]);
  const urls = [
    `<url><loc>${xmlEsc(absolute(env,"/"))}</loc></url>`,
    ...cats.map((c) => `<url><loc>${xmlEsc(absolute(env,`/c/${c.slug}`))}</loc></url>`),
    ...posts.map((p) => `<url><loc>${xmlEsc(absolute(env,`/p/${p.id}/${p.slug}`))}</loc><lastmod>${xmlEsc(String(p.updated_at).replace(" ","T")+"Z")}</lastmod></url>`),
    ...members.map((m) => `<url><loc>${xmlEsc(absolute(env,`/member/${m.public_id}`))}</loc><lastmod>${xmlEsc(String(m.updated_at).replace(" ","T")+"Z")}</lastmod></url>`)
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}

async function renderFeed(env) {
  const { results: posts = [] } = await env.DB.prepare(`SELECT p.id,p.slug,p.title,p.body,p.published_at,m.display_name FROM posts p JOIN members m ON m.member_id=p.author_member_id WHERE p.status='published' AND p.is_indexable=1 ORDER BY p.published_at DESC LIMIT 30`).all();
  const items = posts.map((p) => `<item><title>${xmlEsc(p.title)}</title><link>${xmlEsc(absolute(env,`/p/${p.id}/${p.slug}`))}</link><guid>${xmlEsc(absolute(env,`/p/${p.id}/${p.slug}`))}</guid><description>${xmlEsc(excerpt(p.body,500))}</description><author>${xmlEsc(p.display_name)}</author><pubDate>${new Date(String(p.published_at).replace(" ","T")+"Z").toUTCString()}</pubDate></item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>NEVER JUST SELL Community</title><link>${xmlEsc(siteOrigin(env))}</link><description>온라인 판매, 유통, 브랜드와 마케팅 경험 커뮤니티</description>${items}</channel></rss>`, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}

async function renderLlms(env) {
  const { results: posts = [] } = await env.DB.prepare(`SELECT id,slug,title FROM posts WHERE status='published' AND is_indexable=1 ORDER BY published_at DESC LIMIT 50`).all();
  const lines = [
    "# NEVER JUST SELL Community",
    "",
    "> 온라인 판매, 유통, 브랜드와 마케팅에 관한 실제 질문, 경험, 토론을 축적하는 공개 커뮤니티입니다.",
    "",
    "## 주요 영역",
    `- ${absolute(env,"/c/online-selling")} : 온라인 판매 질문`,
    `- ${absolute(env,"/c/case-study")} : 판매 경험·사례`,
    `- ${absolute(env,"/c/reading-action")} : 읽고 실행한 기록`,
    `- ${absolute(env,"/c/branding-marketing")} : 브랜드·마케팅 토론`,
    "",
    "## 최근 공개 글",
    ...posts.map((p) => `- ${p.title}: ${absolute(env,`/p/${p.id}/${p.slug}`)}`)
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}

function renderError(env, session, status, message) {
  const body = `<main class="error"><div class="eyebrow">${status}</div><h1>${esc(message)}</h1><p><a href="/">커뮤니티로 돌아가기</a></p></main>`;
  return response(layout(env, { title: String(status), description: message, canonicalPath: "/", session, body, indexable: false }), status, { indexable: false });
}

async function route(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (!(await dbReady(env))) {
    return response(`<main class="error"><h1>Community database is not connected.</h1><p>D1 binding name: <strong>DB</strong></p></main>`, 503, { indexable: false });
  }

  if (path === "/robots.txt") {
    const text = `User-agent: *\nAllow: /\nDisallow: /write\nDisallow: /settings/\nDisallow: /auth/\nDisallow: /login\nDisallow: /logout\nSitemap: ${absolute(env,"/sitemap.xml")}\n`;
    return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  }
  if (path === "/sitemap.xml") return renderSitemap(env);
  if (path === "/feed.xml") return renderFeed(env);
  if (path === "/llms.txt") return renderLlms(env);
  if (path === "/login") return login(request, env);
  if (path === "/auth/callback") return authCallback(request, env);
  if (path === "/logout") return logout(request, env);
  if (path === "/write") return renderWrite(request, env);
  if (path === "/settings/profile") return renderProfileSettings(request, env);
  if (path === "/") return renderHome(request, env);

  let match = path.match(/^\/c\/([^/]+)$/);
  if (match && request.method === "GET") return renderCategory(request, env, decodeURIComponent(match[1]));

  match = path.match(/^\/member\/([^/]+)$/);
  if (match && request.method === "GET") return renderMember(request, env, decodeURIComponent(match[1]));

  match = path.match(/^\/p\/(\d+)\/([^/]+)$/);
  if (match && request.method === "GET") return renderPost(context, Number(match[1]), decodeURIComponent(match[2]));

  match = path.match(/^\/p\/(\d+)\/comment$/);
  if (match && request.method === "POST") return handleComment(request, env, Number(match[1]));

  match = path.match(/^\/p\/(\d+)\/like$/);
  if (match && request.method === "POST") return handleLike(request, env, Number(match[1]));

  return renderError(env, await getSession(request, env), 404, "페이지를 찾을 수 없습니다.");
}

export async function onRequest(context) {
  try {
    return await route(context);
  } catch (error) {
    console.error(error);
    return response(`<main class="error"><h1>커뮤니티를 불러오지 못했습니다.</h1><p>잠시 후 다시 시도해 주세요.</p></main>`, 500, { indexable: false });
  }
}

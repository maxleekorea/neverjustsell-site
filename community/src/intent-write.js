const SESSION_COOKIE = "njs_community_session";

function parseCookies(request) {
  const header = String(request.headers.get("Cookie") || "");
  const result = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    const key = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    try { result[key] = decodeURIComponent(raw); } catch { result[key] = raw; }
  }
  return result;
}

function redirect(location, status = 303) {
  return new Response(null, { status, headers: { Location: location, "Cache-Control": "no-store" } });
}

async function memberSession(request, env) {
  if (!env.DB) return null;
  const id = parseCookies(request)[SESSION_COOKIE];
  if (!id) return null;
  return env.DB.prepare(`SELECT s.session_id,s.member_id,s.csrf_token,m.display_name
    FROM sessions s JOIN members m ON m.member_id=s.member_id
    WHERE s.session_id=? AND s.expires_at>CURRENT_TIMESTAMP AND m.status='active' LIMIT 1`).bind(id).first();
}

function intentOf(url) {
  const value = String(url.searchParams.get("intent") || "").toLowerCase();
  if (value === "question") return "question";
  if (value === "case") return "case";
  return "";
}

function slugify(title) {
  const base = String(title || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "post"}-${Date.now().toString(36)}`;
}

export async function handleIntentWritePost(request, env) {
  const url = new URL(request.url);
  const intent = intentOf(url);
  if (request.method !== "POST" || url.pathname !== "/write" || !intent) return null;

  const session = await memberSession(request, env);
  if (!session) return redirect(`/login?return_to=${encodeURIComponent(`${url.pathname}${url.search}`)}`, 302);

  const form = await request.formData().catch(() => null);
  if (!form || String(form.get("csrf") || "") !== String(session.csrf_token || "")) {
    return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  }
  const title = String(form.get("title") || "").trim().slice(0, 160);
  const body = String(form.get("body") || "").trim().slice(0, 50000);
  const categorySlug = String(form.get("category") || "").trim().slice(0, 80);
  if (title.length < 4 || body.length < 20) return new Response("제목과 본문을 조금 더 구체적으로 작성해 주세요.", { status: 400 });

  const category = await env.DB.prepare("SELECT id,slug FROM categories WHERE slug=? AND is_active=1 LIMIT 1").bind(categorySlug).first();
  if (!category?.id) return new Response("주제를 확인해 주세요.", { status: 400 });
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM posts WHERE author_member_id=? AND created_at>datetime('now','-10 minutes')")
    .bind(session.member_id).first();
  if (Number(recent?.n || 0) >= 3) return new Response("짧은 시간에 너무 많은 글이 등록되었습니다. 잠시 후 다시 시도해 주세요.", { status: 429 });

  const isIndexable = category.slug !== "free-talk" && body.length >= 120 ? 1 : 0;
  const slug = slugify(title);
  const insert = await env.DB.prepare(`INSERT INTO posts
    (category_id,author_member_id,slug,title,body,status,is_indexable,post_type,visibility,knowledge_state)
    VALUES(?,?,?,?,?,'published',?,?,'public','private')`)
    .bind(Number(category.id),session.member_id,slug,title,body,isIndexable,intent).run();
  const id = Number(insert?.meta?.last_row_id || 0);
  return redirect(`/p/${id}/${encodeURIComponent(slug)}`);
}

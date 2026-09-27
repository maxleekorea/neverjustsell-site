import { ensureKnowledgeOpsSchema, upsertKnowledgeEntry } from "./knowledge-ops.js";

const ADMIN_COOKIE = "njs_course_admin";
const ADMIN_TTL_SECONDS = 60 * 60 * 12;
const SITE_CATALOG_URL = "https://www.neverjustsell.com/knowledge/catalog.json";

function parseCookies(request) {
  const result = {};
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    try { result[key] = decodeURIComponent(raw); } catch { result[key] = raw; }
  }
  return result;
}

function b64urlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function b64urlDecode(text) {
  const normalized = String(text || "").replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function makeAdminToken(secret) {
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify({
    v: 1,
    exp: Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS
  })));
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(payload))
  );
  return `${payload}.${b64urlEncode(signature)}`;
}

async function verifyAdminToken(token, secret) {
  if (!token || !secret) return false;
  const parts = String(token).split(".");
  if (parts.length !== 2) return false;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      b64urlDecode(parts[1]),
      new TextEncoder().encode(parts[0])
    );
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
    return payload?.v === 1 && Number(payload?.exp || 0) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

async function passwordMatches(provided, expected) {
  if (!expected) return false;
  const encoder = new TextEncoder();
  const [aDigest, bDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(String(provided || ""))),
    crypto.subtle.digest("SHA-256", encoder.encode(String(expected)))
  ]);
  const a = new Uint8Array(aDigest);
  const b = new Uint8Array(bDigest);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function adminCookie(value) {
  return `${ADMIN_COOKIE}=${encodeURIComponent(value)}; Path=/course-admin; Max-Age=${ADMIN_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

async function isAdmin(request, env) {
  return verifyAdminToken(parseCookies(request)[ADMIN_COOKIE], env.COURSE_ADMIN_PASSWORD);
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function redirect(location, cookie = null) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    }
  });
}

function shell(title, content) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Knowledge Admin</title><style>
*{box-sizing:border-box}body{margin:0;background:#0b0b0b;color:#f3f3f3;font-family:Arial,"Noto Sans KR",sans-serif;line-height:1.55}a{color:inherit}.wrap{width:min(1180px,calc(100% - 28px));margin:auto;padding:30px 0 70px}.top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:28px}.brand{font-size:12px;font-weight:900;letter-spacing:.14em;text-decoration:none}.nav{display:flex;gap:12px;flex-wrap:wrap;font-size:13px;color:#aaa}.card{background:#151515;border:1px solid #2b2b2b;border-radius:15px;padding:20px;margin-bottom:14px}.head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:18px}.head h1{margin:0;font-size:clamp(28px,5vw,42px)}.muted{color:#929292}.stats{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.pill{border:1px solid #343434;border-radius:999px;padding:6px 9px;font-size:12px;color:#aaa}.action,button{display:inline-block;border:0;border-radius:999px;background:#f3f3f3;color:#111;padding:10px 14px;font:inherit;font-weight:800;text-decoration:none;cursor:pointer}.secondary{background:transparent;color:#ddd;border:1px solid #444}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:12px 9px;border-top:1px solid #292929;text-align:left;vertical-align:top;font-size:13px}.table th{color:#888;font-size:11px}.status{font-size:11px;border:1px solid #3a3a3a;border-radius:999px;padding:3px 7px;display:inline-block}.formgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{display:grid;gap:6px}.field.full{grid-column:1/-1}.field label{font-size:12px;color:#aaa;font-weight:800}.field input,.field select,.field textarea{width:100%;background:#0e0e0e;color:#f4f4f4;border:1px solid #383838;border-radius:9px;padding:11px;font:inherit}.field textarea{min-height:120px;resize:vertical}.field textarea.body{min-height:300px}.notice{padding:12px 14px;border-left:3px solid #777;background:#111;color:#aaa;margin-bottom:14px}.ok{border-left-color:#73a47f}.warn{border-left-color:#b8945f}.row{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.login{max-width:430px;margin:10vh auto}.login input{width:100%;margin:10px 0;padding:12px;background:#0f0f0f;border:1px solid #333;color:#fff}@media(max-width:720px){.formgrid{grid-template-columns:1fr}.field.full{grid-column:auto}.table th:nth-child(3),.table td:nth-child(3),.table th:nth-child(5),.table td:nth-child(5){display:none}.head{align-items:flex-start;flex-direction:column}}
</style></head><body><main class="wrap"><div class="top"><a class="brand" href="/course-admin/knowledge">NEVER JUST SELL · KNOWLEDGE ADMIN</a><nav class="nav"><a href="/course-admin">강의 관리자</a><a href="https://www.neverjustsell.com/knowledge">공개 지식</a></nav></div>${content}</main></body></html>`;
}

function loginPage(error = "") {
  return shell("로그인", `<section class="card login"><h1>Knowledge Admin</h1><p class="muted">기존 Course Admin 비밀번호와 같은 관리자 세션을 사용합니다.</p>${error ? `<div class="notice warn">${esc(error)}</div>` : ""}<form method="post" action="/course-admin/knowledge/login"><input type="password" name="password" autocomplete="current-password" required autofocus><button type="submit">관리자 로그인</button></form></section>`);
}

async function stats(env) {
  const row = await env.COURSE_DB.prepare(`SELECT COUNT(*) AS total,
    SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS draft,
    SUM(CASE WHEN status='review' THEN 1 ELSE 0 END) AS review,
    SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published,
    SUM(CASE WHEN status='archived' THEN 1 ELSE 0 END) AS archived
    FROM knowledge_entries`).first();
  return Object.fromEntries(["total","draft","review","published","archived"].map((key) => [key, Number(row?.[key] || 0)]));
}

async function listEntries(env, statusFilter = "") {
  const status = ["draft","review","published","archived"].includes(statusFilter) ? statusFilter : "";
  const query = status
    ? "SELECT slug,title,type,category,status,version,review_due_at,updated_at FROM knowledge_entries WHERE status=? ORDER BY updated_at DESC,slug"
    : "SELECT slug,title,type,category,status,version,review_due_at,updated_at FROM knowledge_entries ORDER BY updated_at DESC,slug";
  const result = status
    ? await env.COURSE_DB.prepare(query).bind(status).all()
    : await env.COURSE_DB.prepare(query).all();
  return result.results || [];
}

async function getEntry(env, slug) {
  if (!slug) return null;
  return env.COURSE_DB.prepare(
    "SELECT * FROM knowledge_entries WHERE slug=? LIMIT 1"
  ).bind(slug).first();
}

async function recentRevisions(env, slug) {
  if (!slug) return [];
  const result = await env.COURSE_DB.prepare(
    "SELECT version,changed_by,change_note,created_at FROM knowledge_entry_revisions WHERE slug=? ORDER BY version DESC LIMIT 8"
  ).bind(slug).all();
  return result.results || [];
}

function filterLink(label, status, current) {
  const href = status ? `/course-admin/knowledge?status=${encodeURIComponent(status)}` : "/course-admin/knowledge";
  return `<a class="${status === current ? "action" : "action secondary"}" href="${href}">${esc(label)}</a>`;
}

async function dashboard(env, url) {
  await ensureKnowledgeOpsSchema(env);
  const current = String(url.searchParams.get("status") || "");
  const [counts, rows] = await Promise.all([stats(env), listEntries(env, current)]);
  const message = String(url.searchParams.get("message") || "");
  const rowHtml = rows.map((row) => `<tr><td><a href="/course-admin/knowledge/edit?slug=${encodeURIComponent(row.slug)}"><strong>${esc(row.title)}</strong></a><br><span class="muted">${esc(row.slug)}</span></td><td><span class="status">${esc(row.status)}</span></td><td>${esc(row.type)} · ${esc(row.category)}</td><td>v${Number(row.version || 1)}</td><td>${esc(row.review_due_at || "-")}</td><td>${esc(String(row.updated_at || "").slice(0,16))}</td></tr>`).join("");
  return shell("지식 운영", `${message ? `<div class="notice ok">${esc(message)}</div>` : ""}<div class="head"><div><div class="muted">KNOWLEDGE OPERATING SYSTEM</div><h1>지식 운영</h1><p class="muted">공개 페이지가 아니라 운영 원본을 관리합니다. published 상태만 공개 브리지에 전달됩니다.</p></div><a class="action" href="/course-admin/knowledge/edit">새 지식 작성</a></div><div class="stats"><span class="pill">전체 ${counts.total}</span><span class="pill">초안 ${counts.draft}</span><span class="pill">검수 ${counts.review}</span><span class="pill">공개 ${counts.published}</span><span class="pill">보관 ${counts.archived}</span></div><section class="card"><div class="row">${filterLink("전체", "", current)}${filterLink("초안", "draft", current)}${filterLink("검수", "review", current)}${filterLink("공개", "published", current)}${filterLink("보관", "archived", current)}</div></section>${counts.total === 0 ? `<section class="card"><h2>현재 DB가 비어 있습니다.</h2><p class="muted">기존 공개 Knowledge catalog를 한 번 가져온 뒤부터 이 화면이 canonical 운영 원본이 됩니다.</p><form method="post" action="/course-admin/knowledge/bootstrap"><button type="submit">현재 공개 지식 가져오기</button></form></section>` : ""}<section class="card"><table class="table"><thead><tr><th>지식</th><th>상태</th><th>분류</th><th>버전</th><th>재검수</th><th>수정</th></tr></thead><tbody>${rowHtml || `<tr><td colspan="6" class="muted">조건에 맞는 지식이 없습니다.</td></tr>`}</tbody></table></section>`);
}

async function editPage(env, url) {
  await ensureKnowledgeOpsSchema(env);
  const slug = String(url.searchParams.get("slug") || "").trim();
  const row = await getEntry(env, slug);
  const revisions = row ? await recentRevisions(env, row.slug) : [];
  let keywords = "";
  try { keywords = JSON.parse(String(row?.keywords_json || "[]")).join(", "); } catch { keywords = ""; }
  const history = revisions.map((r) => `<li>v${Number(r.version)} · ${esc(String(r.created_at || "").slice(0,16))}${r.change_note ? ` · ${esc(r.change_note)}` : ""}</li>`).join("");
  return shell(row ? `수정 · ${row.title}` : "새 지식", `<div class="head"><div><div class="muted">EDITORIAL WORKFLOW</div><h1>${row ? "지식 수정" : "새 지식"}</h1></div><a class="action secondary" href="/course-admin/knowledge">목록으로</a></div><form class="card formgrid" method="post" action="/course-admin/knowledge/save"><div class="field"><label>Slug</label><input name="slug" value="${esc(row?.slug || "")}" pattern="[a-z0-9][a-z0-9-]*" required ${row ? "readonly" : ""}></div><div class="field"><label>제목</label><input name="title" value="${esc(row?.title || "")}" required></div><div class="field"><label>유형</label><select name="type">${["term","case","brief","guide","article"].map((v) => `<option value="${v}"${row?.type === v ? " selected" : ""}>${v}</option>`).join("")}</select></div><div class="field"><label>카테고리</label><input name="category" value="${esc(row?.category || "marketing")}" required></div><div class="field full"><label>요약</label><textarea name="summary">${esc(row?.summary || "")}</textarea></div><div class="field full"><label>본문</label><textarea class="body" name="body">${esc(row?.body || "")}</textarea></div><div class="field full"><label>키워드 · 쉼표 구분</label><input name="keywords" value="${esc(keywords)}"></div><div class="field"><label>상태</label><select name="status">${["draft","review","published","archived"].map((v) => `<option value="${v}"${(row?.status || "draft") === v ? " selected" : ""}>${v}</option>`).join("")}</select></div><div class="field"><label>재검수 예정일</label><input type="date" name="review_due_at" value="${esc(String(row?.review_due_at || "").slice(0,10))}"></div><div class="field full"><label>변경 메모</label><input name="change_note" placeholder="예: 정의 보완, 2026 정책 반영"></div><div class="field full"><div class="row"><button type="submit">저장</button>${row?.status === "published" ? `<a class="action secondary" href="https://www.neverjustsell.com/knowledge/${encodeURIComponent(row.slug)}">공개 페이지 보기</a>` : ""}</div></div></form>${history ? `<section class="card"><h2>최근 변경 이력</h2><ul class="muted">${history}</ul></section>` : ""}`);
}

async function saveEntry(request, env) {
  if (!sameOrigin(request)) return html(shell("오류", `<div class="notice warn">요청 출처를 확인할 수 없습니다.</div>`), 403);
  const form = await request.formData();
  const entry = await upsertKnowledgeEntry(env, {
    slug: form.get("slug"),
    title: form.get("title"),
    type: form.get("type"),
    category: form.get("category"),
    summary: form.get("summary"),
    body: form.get("body"),
    keywords: String(form.get("keywords") || "").split(",").map((x) => x.trim()).filter(Boolean),
    status: form.get("status"),
    review_due_at: form.get("review_due_at") || null,
    source_type: "editorial"
  }, "course-admin", String(form.get("change_note") || ""));
  return redirect(`/course-admin/knowledge/edit?slug=${encodeURIComponent(entry.slug)}&saved=1`);
}

async function bootstrapCurrentCatalog(env) {
  await ensureKnowledgeOpsSchema(env);
  const response = await fetch(SITE_CATALOG_URL, { headers: { Accept: "application/json", "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error(`catalog_fetch_failed_${response.status}`);
  const payload = await response.json();
  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length) throw new Error("catalog_empty");

  const existingRows = await env.COURSE_DB.prepare("SELECT slug FROM knowledge_entries").all();
  const existing = new Set((existingRows.results || []).map((row) => String(row.slug)));
  let imported = 0;
  for (const item of items) {
    const slug = String(item?.slug || "").trim();
    if (!slug || existing.has(slug)) continue;
    await upsertKnowledgeEntry(env, {
      ...item,
      status: "published",
      source_type: "legacy_catalog",
      source_ref: SITE_CATALOG_URL,
      review_due_at: null
    }, "course-admin", "기존 공개 Knowledge catalog bootstrap");
    imported += 1;
  }

  const counts = await stats(env);
  return { imported, source_count: items.length, db_count: counts.total, published_count: counts.published };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.COURSE_ADMIN_PASSWORD) return html(shell("오류", `<div class="notice warn">COURSE_ADMIN_PASSWORD 설정이 필요합니다.</div>`), 503);

    if (url.pathname === "/course-admin/knowledge/login" && request.method === "POST") {
      if (!sameOrigin(request)) return html(loginPage("요청 출처를 확인할 수 없습니다."), 403);
      const form = await request.formData().catch(() => null);
      if (!await passwordMatches(form?.get("password"), env.COURSE_ADMIN_PASSWORD)) return html(loginPage("비밀번호가 올바르지 않습니다."), 401);
      return redirect("/course-admin/knowledge", adminCookie(await makeAdminToken(env.COURSE_ADMIN_PASSWORD)));
    }

    const authenticated = await isAdmin(request, env);
    if (!authenticated) {
      if (request.method === "GET") return html(loginPage());
      return html(loginPage("관리자 로그인이 필요합니다."), 401);
    }
    if (!env.COURSE_DB) return html(shell("오류", `<div class="notice warn">COURSE_DB 연결이 없습니다.</div>`), 503);

    if (url.pathname === "/course-admin/knowledge" && request.method === "GET") return html(await dashboard(env, url));
    if (url.pathname === "/course-admin/knowledge/edit" && request.method === "GET") return html(await editPage(env, url));
    if (url.pathname === "/course-admin/knowledge/save" && request.method === "POST") {
      try { return await saveEntry(request, env); }
      catch (error) { return html(shell("저장 실패", `<div class="notice warn">${esc(error?.message || error)}</div><a class="action secondary" href="/course-admin/knowledge">목록으로</a>`), 400); }
    }
    if (url.pathname === "/course-admin/knowledge/bootstrap" && request.method === "POST") {
      if (!sameOrigin(request)) return html(shell("오류", `<div class="notice warn">요청 출처를 확인할 수 없습니다.</div>`), 403);
      try {
        const result = await bootstrapCurrentCatalog(env);
        const message = `기존 공개 지식 ${result.imported}개를 가져왔습니다. 현재 DB ${result.db_count}개 · 공개 ${result.published_count}개입니다.`;
        return redirect(`/course-admin/knowledge?message=${encodeURIComponent(message)}`);
      } catch (error) {
        return html(shell("가져오기 실패", `<div class="notice warn">${esc(error?.message || error)}</div><a class="action secondary" href="/course-admin/knowledge">목록으로</a>`), 502);
      }
    }

    return html(shell("찾을 수 없음", `<div class="notice">관리자 경로를 찾을 수 없습니다.</div>`), 404);
  }
};

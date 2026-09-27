const KNOWLEDGE_OPS_VERSION = "2026-09-27-knowledge-ops-v1";
const VALID_TYPES = new Set(["term", "case", "brief", "guide", "article"]);
const VALID_STATUSES = new Set(["draft", "review", "published", "archived"]);
let schemaPromise = null;

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function clean(value, max = 10000) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeSlug(value) {
  const slug = clean(value, 120).toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,119}$/.test(slug) ? slug : null;
}

function normalizeKeywords(value) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map((item) => clean(item, 60)).filter(Boolean))].slice(0, 20);
}

function parseKeywords(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return normalizeKeywords(parsed);
  } catch {
    return [];
  }
}

function rowToKnowledge(row) {
  if (!row) return null;
  return {
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    type: String(row.type || "article"),
    category: String(row.category || "general"),
    summary: String(row.summary || ""),
    body: String(row.body || ""),
    keywords: parseKeywords(row.keywords_json),
    updated: String(row.updated_at || row.published_at || "").slice(0, 10),
    version: Number(row.version || 1),
    review_due_at: row.review_due_at || null
  };
}

export async function ensureKnowledgeOpsSchema(env) {
  if (!env?.COURSE_DB) {
    return { ok: false, skipped: true, reason: "course_db_binding_missing", version: KNOWLEDGE_OPS_VERSION };
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await env.COURSE_DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge_entries (
        slug TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'article',
        category TEXT NOT NULL DEFAULT 'general',
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        keywords_json TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'draft',
        owner_member_id TEXT,
        source_type TEXT NOT NULL DEFAULT 'editorial',
        source_ref TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        review_due_at TEXT,
        published_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`).run();
      await env.COURSE_DB.prepare(
        "CREATE INDEX IF NOT EXISTS idx_knowledge_entries_status_updated ON knowledge_entries(status,updated_at DESC)"
      ).run();
      await env.COURSE_DB.prepare(
        "CREATE INDEX IF NOT EXISTS idx_knowledge_entries_category_status ON knowledge_entries(category,status,updated_at DESC)"
      ).run();
      await env.COURSE_DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge_entry_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        version INTEGER NOT NULL,
        snapshot_json TEXT NOT NULL,
        changed_by TEXT,
        change_note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (slug) REFERENCES knowledge_entries(slug) ON DELETE CASCADE
      )`).run();
      await env.COURSE_DB.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_revision_slug_version ON knowledge_entry_revisions(slug,version)"
      ).run();
      return true;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
  const stats = await env.COURSE_DB.prepare(
    "SELECT COUNT(*) AS total,SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published,SUM(CASE WHEN status='review' THEN 1 ELSE 0 END) AS review FROM knowledge_entries"
  ).first();
  return {
    ok: true,
    version: KNOWLEDGE_OPS_VERSION,
    total: Number(stats?.total || 0),
    published: Number(stats?.published || 0),
    review: Number(stats?.review || 0)
  };
}

export async function listPublishedKnowledge(env, options = {}) {
  await ensureKnowledgeOpsSchema(env);
  const limit = Math.max(1, Math.min(500, Number(options.limit) || 200));
  const result = await env.COURSE_DB.prepare(
    "SELECT slug,type,category,title,summary,body,keywords_json,version,review_due_at,published_at,updated_at FROM knowledge_entries WHERE status='published' ORDER BY updated_at DESC,slug LIMIT ?"
  ).bind(limit).all();
  return (result.results || []).map(rowToKnowledge);
}

export async function getPublishedKnowledge(env, slug) {
  const safeSlug = normalizeSlug(slug);
  if (!safeSlug) return null;
  await ensureKnowledgeOpsSchema(env);
  const row = await env.COURSE_DB.prepare(
    "SELECT slug,type,category,title,summary,body,keywords_json,version,review_due_at,published_at,updated_at FROM knowledge_entries WHERE slug=? AND status='published' LIMIT 1"
  ).bind(safeSlug).first();
  return rowToKnowledge(row);
}

export async function upsertKnowledgeEntry(env, input, actor = null, note = "") {
  await ensureKnowledgeOpsSchema(env);
  const slug = normalizeSlug(input?.slug);
  const type = clean(input?.type || "article", 32).toLowerCase();
  const status = clean(input?.status || "draft", 32).toLowerCase();
  const title = clean(input?.title, 240);
  if (!slug || !title || !VALID_TYPES.has(type) || !VALID_STATUSES.has(status)) {
    throw new Error("invalid_knowledge_entry");
  }

  const category = clean(input?.category || "general", 80) || "general";
  const summary = clean(input?.summary, 1200);
  const body = clean(input?.body, 50000);
  const keywords = normalizeKeywords(input?.keywords);
  const owner = clean(input?.owner_member_id || actor, 128) || null;
  const sourceType = clean(input?.source_type || "editorial", 40) || "editorial";
  const sourceRef = clean(input?.source_ref, 300) || null;
  const reviewDueAt = clean(input?.review_due_at, 32) || null;
  const current = await env.COURSE_DB.prepare(
    "SELECT version FROM knowledge_entries WHERE slug=? LIMIT 1"
  ).bind(slug).first();
  const version = Math.max(1, Number(current?.version || 0) + 1);
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  await env.COURSE_DB.prepare(`INSERT INTO knowledge_entries (
    slug,type,category,title,summary,body,keywords_json,status,owner_member_id,source_type,source_ref,version,review_due_at,published_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
  ON CONFLICT(slug) DO UPDATE SET
    type=excluded.type,category=excluded.category,title=excluded.title,summary=excluded.summary,body=excluded.body,
    keywords_json=excluded.keywords_json,status=excluded.status,owner_member_id=excluded.owner_member_id,
    source_type=excluded.source_type,source_ref=excluded.source_ref,version=excluded.version,
    review_due_at=excluded.review_due_at,published_at=CASE WHEN excluded.status='published' THEN COALESCE(knowledge_entries.published_at,excluded.published_at) ELSE knowledge_entries.published_at END,
    updated_at=CURRENT_TIMESTAMP`).bind(
      slug, type, category, title, summary, body, JSON.stringify(keywords), status, owner,
      sourceType, sourceRef, version, reviewDueAt, publishedAt
    ).run();

  const snapshot = {
    slug, type, category, title, summary, body, keywords, status,
    owner_member_id: owner, source_type: sourceType, source_ref: sourceRef,
    version, review_due_at: reviewDueAt
  };
  await env.COURSE_DB.prepare(
    "INSERT OR REPLACE INTO knowledge_entry_revisions(slug,version,snapshot_json,changed_by,change_note) VALUES(?,?,?,?,?)"
  ).bind(slug, version, JSON.stringify(snapshot), clean(actor, 128) || null, clean(note, 500)).run();

  return snapshot;
}

export async function handleKnowledgePublic(request, env) {
  if (request.method !== "GET") {
    return json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: { Allow: "GET" } });
  }
  if (!env?.COURSE_DB) {
    return json({ ok: false, error: "course_db_binding_missing" }, { status: 503 });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  try {
    if (slug) {
      const item = await getPublishedKnowledge(env, slug);
      return json({ ok: true, version: KNOWLEDGE_OPS_VERSION, item }, {
        status: item ? 200 : 404,
        headers: { "Cache-Control": "public, max-age=60, s-maxage=300" }
      });
    }
    const items = await listPublishedKnowledge(env, { limit: url.searchParams.get("limit") });
    return json({ ok: true, version: KNOWLEDGE_OPS_VERSION, count: items.length, items }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" }
    });
  } catch (error) {
    console.error("knowledge public bridge failed", error);
    return json({ ok: false, error: "knowledge_public_failed" }, { status: 500 });
  }
}

export { KNOWLEDGE_OPS_VERSION, VALID_TYPES, VALID_STATUSES };

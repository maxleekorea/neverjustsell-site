import { getCustomerSession } from "./session-orders.js";
import { SITE_ORIGIN, APEX_ORIGIN } from "./config.js";

const KNOWLEDGE_SAVE_VERSION = "2026-09-27-member-knowledge-library-v1";
let schemaPromise = null;

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function corsHeaders(request) {
  const origin = String(request.headers.get("Origin") || "");
  if (origin !== SITE_ORIGIN && origin !== APEX_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function validOrigin(request) {
  const origin = String(request.headers.get("Origin") || "");
  return !origin || origin === SITE_ORIGIN || origin === APEX_ORIGIN;
}

function normalizeSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,119}$/.test(slug) ? slug : null;
}

export async function ensureKnowledgeSaveSchema(env) {
  if (!env?.COURSE_DB) {
    return { ok: false, skipped: true, reason: "course_db_binding_missing", version: KNOWLEDGE_SAVE_VERSION };
  }
  if (!schemaPromise) {
    schemaPromise = env.COURSE_DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge_saves (
      member_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (member_id, slug)
    )`).run().then(async () => {
      await env.COURSE_DB.prepare(
        "CREATE INDEX IF NOT EXISTS idx_knowledge_saves_member_created ON knowledge_saves(member_id, created_at DESC)"
      ).run();
      return true;
    }).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
  return { ok: true, version: KNOWLEDGE_SAVE_VERSION };
}

async function savedRows(env, memberId) {
  const result = await env.COURSE_DB.prepare(
    "SELECT slug,created_at FROM knowledge_saves WHERE member_id=? ORDER BY created_at DESC"
  ).bind(memberId).all();
  return (result.results || []).map((row) => ({
    slug: String(row.slug || ""),
    created_at: row.created_at || null
  }));
}

async function authenticatedMember(request, env) {
  const session = await getCustomerSession(request, env);
  const memberId = String(session?.record?.member_id || "").trim();
  return memberId || null;
}

export async function handleKnowledgeSaves(request, env) {
  const cors = corsHeaders(request);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (!validOrigin(request)) {
    return json({ ok: false, error: "origin_rejected" }, { status: 403, headers: cors });
  }
  if (!env?.COURSE_DB) {
    return json({ ok: false, error: "course_db_binding_missing" }, { status: 503, headers: cors });
  }

  const memberId = await authenticatedMember(request, env);
  if (!memberId) {
    return json({ ok: false, authenticated: false, saved: [] }, { status: 401, headers: cors });
  }

  await ensureKnowledgeSaveSchema(env);

  if (request.method === "GET") {
    const saved = await savedRows(env, memberId);
    return json({
      ok: true,
      authenticated: true,
      saved,
      saved_slugs: saved.map((row) => row.slug),
      count: saved.length
    }, { headers: cors });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: cors });
  }

  const payload = await request.json().catch(() => null);
  const slug = normalizeSlug(payload?.slug);
  const requestedAction = String(payload?.action || "toggle").trim().toLowerCase();
  if (!slug || !["toggle", "save", "remove"].includes(requestedAction)) {
    return json({ ok: false, error: "invalid_save_request" }, { status: 400, headers: cors });
  }

  const current = await env.COURSE_DB.prepare(
    "SELECT 1 AS present FROM knowledge_saves WHERE member_id=? AND slug=? LIMIT 1"
  ).bind(memberId, slug).first();
  const action = requestedAction === "toggle"
    ? (current?.present ? "remove" : "save")
    : requestedAction;

  if (action === "save") {
    await env.COURSE_DB.prepare(
      "INSERT OR IGNORE INTO knowledge_saves(member_id,slug) VALUES(?,?)"
    ).bind(memberId, slug).run();
  } else {
    await env.COURSE_DB.prepare(
      "DELETE FROM knowledge_saves WHERE member_id=? AND slug=?"
    ).bind(memberId, slug).run();
  }

  const saved = await savedRows(env, memberId);
  return json({
    ok: true,
    authenticated: true,
    slug,
    saved_now: action === "save",
    saved,
    saved_slugs: saved.map((row) => row.slug),
    count: saved.length
  }, { headers: cors });
}

export { KNOWLEDGE_SAVE_VERSION };

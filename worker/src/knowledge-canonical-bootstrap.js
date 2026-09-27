import {
  ensureKnowledgeOpsSchema,
  getKnowledgeSourceMode,
  setKnowledgeSourceMode,
  upsertKnowledgeEntry
} from "./knowledge-ops.js";

const SITE_CATALOG_URL = "https://www.neverjustsell.com/knowledge/catalog.json";
let bootstrapPromise = null;

function uniqueSortedSlugs(items) {
  return [...new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => String(item?.slug || "").trim())
      .filter(Boolean)
  )].sort();
}

async function fetchLegacyCatalog() {
  const response = await fetch(SITE_CATALOG_URL, {
    headers: { Accept: "application/json", "Cache-Control": "no-cache" }
  });
  if (!response.ok) throw new Error(`knowledge_catalog_fetch_failed_${response.status}`);
  const payload = await response.json().catch(() => null);
  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length) throw new Error("knowledge_catalog_empty");
  return items;
}

async function publishedSlugs(env) {
  const result = await env.COURSE_DB.prepare(
    "SELECT slug FROM knowledge_entries WHERE status='published' ORDER BY slug"
  ).all();
  return uniqueSortedSlugs(result.results || []);
}

export async function verifyKnowledgeCatalogParity(env, sourceItems) {
  const source = uniqueSortedSlugs(sourceItems);
  const database = await publishedSlugs(env);
  const sourceSet = new Set(source);
  const databaseSet = new Set(database);
  const missing = source.filter((slug) => !databaseSet.has(slug));
  const extra = database.filter((slug) => !sourceSet.has(slug));
  return {
    ok: source.length > 0 && source.length === database.length && missing.length === 0 && extra.length === 0,
    source_count: source.length,
    db_count: database.length,
    missing,
    extra
  };
}

async function knowledgeCounts(env) {
  const row = await env.COURSE_DB.prepare(
    "SELECT COUNT(*) AS total,SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published FROM knowledge_entries"
  ).first();
  return {
    total: Number(row?.total || 0),
    published: Number(row?.published || 0)
  };
}

async function bootstrapInternal(env) {
  if (!env?.COURSE_DB) {
    return { ok: false, skipped: true, reason: "course_db_binding_missing" };
  }

  await ensureKnowledgeOpsSchema(env);
  const beforeMode = await getKnowledgeSourceMode(env);
  if (beforeMode === "canonical") {
    const counts = await knowledgeCounts(env);
    if (counts.published < 1) throw new Error("knowledge_canonical_source_is_empty");
    return {
      ok: true,
      activated: false,
      already_canonical: true,
      source_mode: "canonical",
      imported: 0,
      ...counts
    };
  }

  const items = await fetchLegacyCatalog();
  const existingRows = await env.COURSE_DB.prepare("SELECT slug FROM knowledge_entries").all();
  const existing = new Set((existingRows.results || []).map((row) => String(row.slug || "")));
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
    }, "system-bootstrap", "기존 공개 Knowledge catalog canonical bootstrap");
    existing.add(slug);
    imported += 1;
  }

  const parity = await verifyKnowledgeCatalogParity(env, items);
  if (!parity.ok) {
    const detail = JSON.stringify({
      source_count: parity.source_count,
      db_count: parity.db_count,
      missing: parity.missing.slice(0, 20),
      extra: parity.extra.slice(0, 20)
    });
    throw new Error(`knowledge_catalog_parity_failed:${detail}`);
  }

  await setKnowledgeSourceMode(env, "canonical");
  const counts = await knowledgeCounts(env);
  return {
    ok: true,
    activated: true,
    already_canonical: false,
    source_mode: "canonical",
    imported,
    parity,
    ...counts
  };
}

export async function ensureKnowledgeCanonicalBootstrap(env) {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapInternal(env).catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  return bootstrapPromise;
}

export { SITE_CATALOG_URL };

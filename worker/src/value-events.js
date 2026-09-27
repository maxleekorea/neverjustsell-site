const VALUE_EVENT_VERSION = "2026-09-27-value-activity-v1";

const ALLOWED_EVENT_TYPES = new Set([
  "knowledge_save",
  "knowledge_revisit",
  "course_enroll",
  "lesson_progress",
  "lesson_complete",
  "program_checkin",
  "program_reflection",
  "program_milestone_complete",
  "community_contribution",
  "knowledge_promotion"
]);

let schemaPromise = null;

function cleanText(value, max = 160) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

function safeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const cleaned = {};
  for (const [key, raw] of Object.entries(value)) {
    const safeKey = cleanText(key, 64);
    if (!safeKey) continue;
    if (["string", "number", "boolean"].includes(typeof raw) || raw === null) {
      cleaned[safeKey] = typeof raw === "string" ? raw.slice(0, 240) : raw;
    }
  }
  const encoded = JSON.stringify(cleaned);
  return encoded.length <= 4000 ? encoded : null;
}

export async function ensureValueEventSchema(env) {
  if (!env?.COURSE_DB) {
    return { ok: false, skipped: true, reason: "course_db_binding_missing", version: VALUE_EVENT_VERSION };
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await env.COURSE_DB.prepare(`CREATE TABLE IF NOT EXISTS value_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        object_type TEXT,
        object_id TEXT,
        source TEXT NOT NULL DEFAULT 'classroom',
        event_key TEXT UNIQUE,
        metadata_json TEXT,
        occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`).run();
      await env.COURSE_DB.prepare(
        "CREATE INDEX IF NOT EXISTS idx_value_events_member_time ON value_events(member_id, occurred_at DESC)"
      ).run();
      await env.COURSE_DB.prepare(
        "CREATE INDEX IF NOT EXISTS idx_value_events_type_time ON value_events(event_type, occurred_at DESC)"
      ).run();
      return true;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
  return { ok: true, version: VALUE_EVENT_VERSION };
}

export async function recordValueEvent(env, input = {}) {
  const memberId = cleanText(input.memberId, 160);
  const eventType = cleanText(input.eventType, 80);
  if (!memberId || !eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
    return { ok: false, recorded: false, reason: "invalid_value_event" };
  }

  await ensureValueEventSchema(env);

  const objectType = cleanText(input.objectType, 80);
  const objectId = cleanText(input.objectId, 200);
  const source = cleanText(input.source, 80) || "classroom";
  const eventKey = cleanText(input.eventKey, 240);
  const metadataJson = safeMetadata(input.metadata);

  const result = await env.COURSE_DB.prepare(`
    INSERT OR IGNORE INTO value_events(
      member_id,event_type,object_type,object_id,source,event_key,metadata_json
    ) VALUES(?,?,?,?,?,?,?)
  `).bind(
    memberId,
    eventType,
    objectType,
    objectId,
    source,
    eventKey,
    metadataJson
  ).run();

  return {
    ok: true,
    recorded: Number(result?.meta?.changes || 0) > 0,
    event_type: eventType
  };
}

export async function getValueActivitySummary(env, now = new Date()) {
  await ensureValueEventSchema(env);

  const nowMs = now instanceof Date ? now.getTime() : Date.now();
  const iso7d = new Date(nowMs - 7 * 86400000).toISOString();
  const iso30d = new Date(nowMs - 30 * 86400000).toISOString();

  const [active7d, active30d, eventBreakdown] = await Promise.all([
    env.COURSE_DB.prepare(
      "SELECT COUNT(DISTINCT member_id) AS count FROM value_events WHERE occurred_at>=?"
    ).bind(iso7d).first(),
    env.COURSE_DB.prepare(
      "SELECT COUNT(DISTINCT member_id) AS count FROM value_events WHERE occurred_at>=?"
    ).bind(iso30d).first(),
    env.COURSE_DB.prepare(`
      SELECT event_type,COUNT(*) AS event_count,COUNT(DISTINCT member_id) AS member_count
      FROM value_events
      WHERE occurred_at>=?
      GROUP BY event_type
      ORDER BY event_count DESC,event_type ASC
    `).bind(iso30d).all()
  ]);

  return {
    ok: true,
    version: VALUE_EVENT_VERSION,
    weekly_value_active_members: Number(active7d?.count || 0),
    monthly_value_active_members: Number(active30d?.count || 0),
    event_breakdown_30d: (eventBreakdown.results || []).map((row) => ({
      event_type: String(row.event_type || ""),
      event_count: Number(row.event_count || 0),
      member_count: Number(row.member_count || 0)
    })),
    retention_note: "30-day cohort retention is intentionally not inferred until enough event history exists."
  };
}

export { VALUE_EVENT_VERSION, ALLOWED_EVENT_TYPES };

let schemaPromise = null;

export async function ensureNotificationSchema(env) {
  if (!env?.DB) throw new Error("DB binding missing");
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT NOT NULL,
        actor_member_id TEXT,
        type TEXT NOT NULL CHECK (type IN ('comment','course_reply','moderation','system')),
        title TEXT NOT NULL,
        target_url TEXT NOT NULL,
        read_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
      )`).run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_notifications_member ON notifications(member_id,read_at,created_at DESC)").run();
      return true;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
  return { ok: true };
}

export async function notifyMember(env, {
  memberId,
  actorMemberId = null,
  type = "system",
  title,
  targetUrl
} = {}) {
  const targetMember = String(memberId || "").trim();
  const actor = String(actorMemberId || "").trim() || null;
  if (!targetMember || !title || !targetUrl || targetMember === actor) return { ok: true, skipped: true };
  await ensureNotificationSchema(env);
  const member = await env.DB.prepare("SELECT member_id FROM members WHERE member_id=? AND status='active' LIMIT 1").bind(targetMember).first();
  if (!member?.member_id) return { ok: true, skipped: true };
  await env.DB.prepare("INSERT INTO notifications(member_id,actor_member_id,type,title,target_url) VALUES(?,?,?,?,?)")
    .bind(targetMember,actor,type,String(title).slice(0,180),String(targetUrl).slice(0,500)).run();
  return { ok: true };
}

export async function unreadNotificationCount(env, memberId) {
  await ensureNotificationSchema(env);
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM notifications WHERE member_id=? AND read_at IS NULL").bind(String(memberId)).first();
  return Number(row?.n || 0);
}

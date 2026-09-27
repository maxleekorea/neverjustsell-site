CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT NOT NULL,
  actor_member_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('comment','course_reply','moderation','system')),
  title TEXT NOT NULL,
  target_url TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_member
  ON notifications(member_id, read_at, created_at DESC);

ALTER TABLE course_entitlements ADD COLUMN access_expires_at TEXT;

CREATE TABLE IF NOT EXISTS course_access_admin_log (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  previous_expires_at TEXT,
  new_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_access_admin_log_member_course
  ON course_access_admin_log(member_id, course_id, created_at DESC);

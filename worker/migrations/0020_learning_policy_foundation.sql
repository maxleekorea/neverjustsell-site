ALTER TABLE courses ADD COLUMN access_duration_days INTEGER;
ALTER TABLE courses ADD COLUMN refund_policy_version TEXT NOT NULL DEFAULT 'fair-trust-v0.3';

ALTER TABLE course_entitlements ADD COLUMN purchase_price_krw INTEGER;
ALTER TABLE course_entitlements ADD COLUMN purchased_at TEXT;
ALTER TABLE course_entitlements ADD COLUMN policy_version TEXT;
ALTER TABLE course_entitlements ADD COLUMN refund_policy_snapshot TEXT;
ALTER TABLE course_entitlements ADD COLUMN access_starts_at TEXT;

ALTER TABLE lesson_progress ADD COLUMN watched_seconds INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_course_entitlements_policy
  ON course_entitlements(course_id, policy_version);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_watch
  ON lesson_progress(member_id, course_id, watched_seconds);

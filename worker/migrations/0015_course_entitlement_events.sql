CREATE TABLE IF NOT EXISTS course_entitlement_events (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('granted','restored','revoked','manual_grant','manual_revoke','expired')),
  source_order_id TEXT,
  source_order_item_code TEXT,
  reason TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system' CHECK (actor_type IN ('system','admin')),
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_entitlement_events_member_course
  ON course_entitlement_events(member_id, course_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_entitlement_events_order
  ON course_entitlement_events(source_order_id, occurred_at DESC);

INSERT OR IGNORE INTO course_entitlement_events (
  id, member_id, course_id, event_type, source_order_id, source_order_item_code,
  reason, actor_type, occurred_at
)
SELECT
  'backfill-granted:' || member_id || ':' || course_id,
  member_id,
  course_id,
  'granted',
  source_order_id,
  source_order_item_code,
  CASE WHEN grant_reason='manual' THEN '기존 수동 수강권' ELSE '기존 구매 수강권' END,
  CASE WHEN grant_reason='manual' THEN 'admin' ELSE 'system' END,
  COALESCE(granted_at, updated_at, CURRENT_TIMESTAMP)
FROM course_entitlements;

INSERT OR IGNORE INTO course_entitlement_events (
  id, member_id, course_id, event_type, source_order_id, source_order_item_code,
  reason, actor_type, occurred_at
)
SELECT
  'backfill-revoked:' || member_id || ':' || course_id,
  member_id,
  course_id,
  'revoked',
  source_order_id,
  source_order_item_code,
  '기존 취소·환불 수강권 회수',
  'system',
  COALESCE(revoked_at, updated_at, CURRENT_TIMESTAMP)
FROM course_entitlements
WHERE status='revoked';

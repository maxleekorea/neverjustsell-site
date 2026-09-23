CREATE TABLE IF NOT EXISTS course_entitlements (
  member_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  product_no INTEGER NOT NULL,
  source_order_id TEXT,
  source_order_item_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  grant_reason TEXT NOT NULL DEFAULT 'purchase' CHECK (grant_reason IN ('purchase','manual')),
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  last_verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, course_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_entitlements_member_status
  ON course_entitlements(member_id, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_course_entitlements_product
  ON course_entitlements(product_no, status, updated_at);

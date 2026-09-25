PRAGMA foreign_keys = ON;

-- One-time operational queue executed by the authenticated Worker runtime.
-- This avoids exposing Cafe24 admin credentials to GitHub Actions.
CREATE TABLE IF NOT EXISTS system_operations (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  payload_json TEXT NOT NULL DEFAULT '{}',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_operations_status
  ON system_operations(status,requested_at);

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-open-payment-e2e-product-13',
  'open_payment_e2e_product_13',
  'pending',
  '{"product_no":13,"price":1000,"member_only":true}'
);

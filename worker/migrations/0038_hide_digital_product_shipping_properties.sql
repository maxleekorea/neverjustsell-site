PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cafe24_setting_snapshots (
  snapshot_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-hide-digital-product-shipping-properties',
  'hide_digital_product_shipping_properties',
  'pending',
  '{}'
);

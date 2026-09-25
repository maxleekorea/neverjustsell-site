PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-bootstrap-cafe24-catalog-after-reauth',
  'bootstrap_cafe24_catalog',
  'pending',
  '{}'
);

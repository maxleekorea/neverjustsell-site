PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-cleanup-cafe24-catalog-duplicates',
  'cleanup_cafe24_catalog_duplicates',
  'pending',
  '{}'
);

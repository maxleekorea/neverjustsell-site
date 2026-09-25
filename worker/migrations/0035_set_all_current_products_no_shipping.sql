PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-set-all-current-products-no-shipping',
  'set_all_current_products_no_shipping',
  'pending',
  '{}'
);

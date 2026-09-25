PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-reconcile-all-course-product-fulfillment',
  'reconcile_all_course_product_fulfillment',
  'pending',
  '{}'
);

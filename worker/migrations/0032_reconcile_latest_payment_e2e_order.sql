PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-reconcile-latest-payment-e2e-order',
  'reconcile_latest_payment_e2e_order',
  'pending',
  '{"product_no":13,"date":"2026-09-25"}'
);

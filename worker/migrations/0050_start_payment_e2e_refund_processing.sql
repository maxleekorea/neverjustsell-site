PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-start-payment-e2e-refund-processing',
  'start_payment_e2e_refund_processing',
  'pending',
  '{"product_no":13,"date":"2026-09-25","order_id":"20260925-0000013"}'
);

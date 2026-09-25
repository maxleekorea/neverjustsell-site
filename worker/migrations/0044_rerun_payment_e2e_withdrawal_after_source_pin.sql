PRAGMA foreign_keys = ON;

-- Re-run the dedicated cancellation access reconciliation after the payment
-- E2E Program source-order pin was deployed. The previous operation completed
-- before Community source-order isolation existed and must not be reused.
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-rerun-payment-e2e-withdrawal-after-source-pin',
  'reconcile_customer_cancelled_payment_e2e_access',
  'pending',
  '{"product_no":13,"date":"2026-09-25","order_id":"20260925-0000013"}'
);

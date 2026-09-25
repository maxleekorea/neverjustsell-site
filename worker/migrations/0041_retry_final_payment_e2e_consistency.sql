PRAGMA foreign_keys = ON;

-- Re-run the guarded final payment E2E reconciliation with a fresh operation id.
-- The operation itself is idempotent: if the target order is already canceled,
-- it skips a second Cafe24 cancellation and only repairs entitlement projections.
-- If the order is still active, it cancels only the known product #13 test order.

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-retry-final-payment-e2e-consistency',
  'cancel_payment_e2e_order',
  'pending',
  '{"product_no":13,"date":"2026-09-25"}'
);

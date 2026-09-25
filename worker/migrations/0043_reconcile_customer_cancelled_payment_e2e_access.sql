PRAGMA foreign_keys = ON;

-- Reconcile access after the customer has submitted the dedicated payment
-- E2E cancellation request. This operation must never create a cancellation
-- or fabricate refund data; it only mirrors Cafe24's existing C/R/E state
-- into NEVER JUST SELL access records.
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-reconcile-customer-cancelled-payment-e2e-access',
  'reconcile_customer_cancelled_payment_e2e_access',
  'pending',
  '{"product_no":13,"date":"2026-09-25","order_id":"20260925-0000013"}'
);

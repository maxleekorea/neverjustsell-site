PRAGMA foreign_keys = ON;

-- Cafe24 only accepts a customer cancellation request as C10 when
-- cancellation acceptance and refund processing are configured separately.
-- Re-run the existing claim settings operation after adding that invariant.
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-separate-cancellation-acceptance-refund',
  'configure_customer_claim_settings',
  'pending',
  '{"period_days":7}'
);

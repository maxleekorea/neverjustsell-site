PRAGMA foreign_keys = ON;

-- Persist the approved customer-claim policy after the dedicated cancellation
-- was accepted: claim acceptance and cash refund settlement stay separate.
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-persist-separated-refund-processing',
  'configure_customer_claim_settings',
  'pending',
  '{"period_days":7}'
);

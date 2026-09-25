PRAGMA foreign_keys = ON;

-- Re-assert Cafe24's separated refund-processing policy after the dedicated
-- customer cancellation request has been accepted. This only updates shop
-- policy; it does not modify the order or mark any cash refund complete.
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-reassert-separated-refund-processing',
  'configure_customer_claim_settings',
  'pending',
  '{"period_days":7}'
);

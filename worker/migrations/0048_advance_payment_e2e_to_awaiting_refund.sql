PRAGMA foreign_keys = ON;

-- Move only the dedicated accepted cancellation to the refund-pending stage.
-- This does not transfer money and must not mark the refund complete.
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-advance-payment-e2e-to-awaiting-refund',
  'advance_payment_e2e_to_awaiting_refund',
  'pending',
  '{"product_no":13,"date":"2026-09-25","order_id":"20260925-0000013"}'
);

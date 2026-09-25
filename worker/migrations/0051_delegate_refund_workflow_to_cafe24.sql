PRAGMA foreign_keys = ON;

-- Cafe24 owns customer cancellation, refund account handling, approval and
-- refund processing. Never Just Sell only reacts to Cafe24 order state.
UPDATE system_operations
SET
  status='completed',
  completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP),
  last_error='superseded_cafe24_native_refund_owner',
  updated_at=CURRENT_TIMESTAMP
WHERE id IN (
  '2026-09-26-accept-payment-e2e-customer-cancellation',
  '2026-09-26-advance-payment-e2e-to-awaiting-refund',
  '2026-09-26-begin-payment-e2e-customer-refund'
)
AND status IN ('pending','failed','running');

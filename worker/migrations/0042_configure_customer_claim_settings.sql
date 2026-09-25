PRAGMA foreign_keys = ON;

-- Customer-initiated cancellation/refund flow supersedes the earlier
-- admin-driven cash refund test. The old operations are intentionally
-- closed so production reconciliation does not keep retrying a flow that
-- requires customer-provided refund-account data.
UPDATE system_operations
SET
  status='completed',
  completed_at=COALESCE(completed_at, CURRENT_TIMESTAMP),
  last_error='superseded_by_customer_initiated_refund_flow',
  updated_at=CURRENT_TIMESTAMP
WHERE id IN (
  '2026-09-25-cancel-payment-e2e-order',
  '2026-09-25-retry-final-payment-e2e-consistency'
)
AND status IN ('pending','failed','running');

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-configure-customer-claim-settings',
  'configure_customer_claim_settings',
  'pending',
  '{"period_days":7}'
);

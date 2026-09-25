PRAGMA foreign_keys = ON;

-- The attempted C10 -> canceling transition used Cafe24's cancellation-change
-- endpoint, whose undone parameter is for cancellation withdrawal. That is not
-- the correct refund workflow for this accepted customer cancellation.
-- Stop retrying it; refund state is observed from the Refunds resource instead.
UPDATE system_operations
SET
  status='completed',
  completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP),
  last_error='superseded_by_refund_record_workflow',
  updated_at=CURRENT_TIMESTAMP
WHERE id='2026-09-26-advance-payment-e2e-to-awaiting-refund'
  AND status IN ('pending','failed','running');

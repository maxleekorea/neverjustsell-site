PRAGMA foreign_keys = ON;

-- Final destructive step of the paid-order E2E.
-- Targets only the dedicated 1,000 KRW product #13 order created on 2026-09-25.
-- Runtime guards verify the exact order is the source of both course and Program access
-- before Cafe24 cancellation is allowed.

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-cancel-payment-e2e-order',
  'cancel_payment_e2e_order',
  'pending',
  '{"product_no":13,"date":"2026-09-25"}'
);

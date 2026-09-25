PRAGMA foreign_keys = ON;

-- Accept only the dedicated customer's cancellation request. This operation
-- must not complete a cash refund or invent refund-account data.
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-26-accept-payment-e2e-customer-cancellation',
  'accept_payment_e2e_customer_cancellation',
  'pending',
  '{"product_no":13,"date":"2026-09-25","order_id":"20260925-0000013"}'
);

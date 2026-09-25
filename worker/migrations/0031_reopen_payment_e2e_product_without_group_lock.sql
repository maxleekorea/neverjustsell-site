PRAGMA foreign_keys = ON;

-- Re-run the existing E2E product opening operation without forcing Cafe24
-- customer-tier restrictions. The operator must purchase while logged in.
UPDATE system_operations
SET status='pending',
    payload_json='{"product_no":13,"price":1000,"member_only":false}',
    last_error=NULL,
    started_at=NULL,
    completed_at=NULL,
    updated_at=CURRENT_TIMESTAMP
WHERE id='2026-09-25-open-payment-e2e-product-13';

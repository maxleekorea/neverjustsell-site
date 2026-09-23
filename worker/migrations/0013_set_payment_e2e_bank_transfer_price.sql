UPDATE courses
SET price_krw=1000,
    updated_at=CURRENT_TIMESTAMP
WHERE id='system-check-paid-course'
  AND status='system_check'
  AND cafe24_product_no=13;

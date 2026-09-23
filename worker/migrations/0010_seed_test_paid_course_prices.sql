UPDATE courses
SET price_krw = 49000,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  'paid-naver-search-algorithm',
  'paid-naver-keyword-strategy'
)
  AND access_type = 'paid'
  AND price_krw = 0
  AND cafe24_product_no IS NULL;

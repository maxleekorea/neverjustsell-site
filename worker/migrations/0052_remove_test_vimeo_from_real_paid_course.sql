PRAGMA foreign_keys = ON;

-- The first real paid course temporarily reused the dedicated payment-E2E
-- Vimeo fixtures. Remove only those known fixture IDs before launch so a
-- real course can never be published with test content by mistake.
UPDATE lessons
SET
  vimeo_id=NULL,
  duration_seconds=NULL,
  status='draft',
  updated_at=CURRENT_TIMESTAMP
WHERE course_id='paid-naver-search-algorithm'
  AND vimeo_id IN ('1227604364','1227604365');

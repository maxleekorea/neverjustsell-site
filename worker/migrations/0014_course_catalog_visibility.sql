ALTER TABLE courses ADD COLUMN catalog_visible INTEGER NOT NULL DEFAULT 0 CHECK (catalog_visible IN (0,1));

UPDATE courses
SET catalog_visible=1
WHERE slug IN (
  'online-commerce-basics',
  'naver-search-algorithm',
  'naver-keyword-strategy'
);

UPDATE courses
SET catalog_visible=0
WHERE status='system_check';

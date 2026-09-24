-- Temporary fast-path for end-to-end paid-course testing.
-- Reuse the existing Vimeo E2E videos on the first real paid course.
-- Real production videos can replace these links later from Course Admin.

UPDATE lessons
SET vimeo_id='1227604364',
    status='ready',
    updated_at=CURRENT_TIMESTAMP
WHERE id='naver-search-algorithm-01';

UPDATE lessons
SET vimeo_id='1227604365',
    status='ready',
    updated_at=CURRENT_TIMESTAMP
WHERE id='naver-search-algorithm-02';

UPDATE lessons
SET vimeo_id='1227604364',
    status='ready',
    updated_at=CURRENT_TIMESTAMP
WHERE id='naver-search-algorithm-03';

UPDATE lessons
SET vimeo_id='1227604365',
    status='ready',
    updated_at=CURRENT_TIMESTAMP
WHERE id='naver-search-algorithm-04';

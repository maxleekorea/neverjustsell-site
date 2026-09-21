ALTER TABLE courses ADD COLUMN price_krw INTEGER;
ALTER TABLE courses ADD COLUMN cafe24_sync_status TEXT NOT NULL DEFAULT 'not_linked';

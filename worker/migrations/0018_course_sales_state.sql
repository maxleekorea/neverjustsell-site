ALTER TABLE courses ADD COLUMN sales_state TEXT NOT NULL DEFAULT 'preparing'
  CHECK (sales_state IN ('preparing','presale','selling','paused'));

UPDATE courses
SET sales_state = CASE
  WHEN sales_enabled=1 THEN 'selling'
  WHEN cafe24_sync_status IN ('paused_hidden','e2e_hidden') THEN 'paused'
  ELSE 'preparing'
END;

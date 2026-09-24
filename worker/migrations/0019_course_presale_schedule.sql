ALTER TABLE courses ADD COLUMN presale_opens_at TEXT;

CREATE INDEX IF NOT EXISTS idx_courses_presale_open
  ON courses(sales_state,status,presale_opens_at);

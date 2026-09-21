-- NEVER JUST SELL course administration schema
-- D1 / SQLite

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  access_type TEXT NOT NULL CHECK (access_type IN ('public','paid')),
  cafe24_product_no INTEGER UNIQUE,
  sales_url TEXT,
  sales_enabled INTEGER NOT NULL DEFAULT 0 CHECK (sales_enabled IN (0,1)),
  visible INTEGER NOT NULL DEFAULT 0 CHECK (visible IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','published','archived','system_check')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  vimeo_id TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','uploading','processing','ready','published','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE (course_id, sort_order)
);

CREATE TABLE IF NOT EXISTS video_uploads (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  lesson_id TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  vimeo_id TEXT,
  vimeo_uri TEXT,
  upload_status TEXT NOT NULL DEFAULT 'created' CHECK (upload_status IN ('created','uploading','uploaded','processing','ready','failed')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_visibility_sort
  ON courses(visible, sort_order);

CREATE INDEX IF NOT EXISTS idx_lessons_course_sort
  ON lessons(course_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_video_uploads_status
  ON video_uploads(upload_status, created_at);

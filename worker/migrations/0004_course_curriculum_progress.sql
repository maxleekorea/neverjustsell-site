CREATE TABLE IF NOT EXISTS course_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

ALTER TABLE lessons ADD COLUMN module_id TEXT;
ALTER TABLE lessons ADD COLUMN is_preview INTEGER NOT NULL DEFAULT 0 CHECK (is_preview IN (0,1));

CREATE INDEX IF NOT EXISTS idx_course_modules_course_sort
  ON course_modules(course_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_lessons_module_sort
  ON lessons(module_id, sort_order);

CREATE TABLE IF NOT EXISTS lesson_progress (
  member_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  first_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_member_course
  ON lesson_progress(member_id, course_id, updated_at);

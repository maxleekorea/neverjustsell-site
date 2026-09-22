CREATE TABLE IF NOT EXISTS course_enrollments (
  member_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  enrollment_type TEXT NOT NULL DEFAULT 'free' CHECK (enrollment_type IN ('free','purchase','manual')),
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled','cancelled')),
  enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, course_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_member_status
  ON course_enrollments(member_id, status, updated_at);

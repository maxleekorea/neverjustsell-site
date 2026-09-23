CREATE TABLE IF NOT EXISTS user_roles (
  member_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner','creator','reviewer','platform_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended','revoked')),
  granted_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_status
  ON user_roles(role, status, member_id);

ALTER TABLE courses ADD COLUMN owner_member_id TEXT;

CREATE INDEX IF NOT EXISTS idx_courses_owner_member
  ON courses(owner_member_id, status, updated_at);

INSERT OR IGNORE INTO user_roles (member_id, role, status, granted_by)
VALUES ('ccsmall', 'learner', 'active', 'system_seed');

INSERT OR IGNORE INTO user_roles (member_id, role, status, granted_by)
VALUES ('maxjagga', 'learner', 'active', 'system_seed');

INSERT OR IGNORE INTO user_roles (member_id, role, status, granted_by)
VALUES ('maxjagga', 'creator', 'active', 'system_seed');

UPDATE courses
SET owner_member_id='maxjagga', updated_at=CURRENT_TIMESTAMP
WHERE slug='online-commerce-basics' AND owner_member_id IS NULL;

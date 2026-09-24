PRAGMA foreign_keys = ON;

-- Program/community foundation.
-- Roles are separated from access: a member can be a creator, participant,
-- and scoped moderator at the same time without changing identity.

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('book','ebook','course','video','article','worksheet','audio','external_resource')),
  title TEXT NOT NULL,
  owner_member_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  external_ref_type TEXT,
  external_ref_id TEXT,
  canonical_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_items_owner_status
  ON content_items(owner_member_id, status, updated_at);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('readalong','challenge','cohort','book_club','clinic','project_lab')),
  owner_member_id TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  default_duration_days INTEGER,
  visibility TEXT NOT NULL DEFAULT 'member' CHECK (visibility IN ('public','member','private')),
  participation_mode TEXT NOT NULL DEFAULT 'free' CHECK (participation_mode IN ('free','paid','invite')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_programs_owner_status
  ON programs(owner_member_id, status, updated_at);

CREATE TABLE IF NOT EXISTS program_content_links (
  program_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'primary' CHECK (relation IN ('primary','required','recommended','bonus')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (program_id, content_id),
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS program_runs (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  title TEXT NOT NULL,
  enrollment_open_at TEXT,
  enrollment_close_at TEXT,
  portal_open_at TEXT,
  starts_at TEXT,
  ends_at TEXT,
  capacity INTEGER,
  price_krw INTEGER NOT NULL DEFAULT 0,
  cafe24_product_no INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','enrolling','active','completed','cancelled')),
  completion_policy_snapshot TEXT NOT NULL DEFAULT '{}',
  reward_policy_snapshot TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_runs_program_status
  ON program_runs(program_id, status, starts_at);

CREATE INDEX IF NOT EXISTS idx_program_runs_product
  ON program_runs(cafe24_product_no, status);

CREATE TABLE IF NOT EXISTS program_enrollments (
  run_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','withdrawn','removed')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('free','purchase','invite','manual','promotion')),
  source_order_id TEXT,
  source_order_item_code TEXT,
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  completion_ratio REAL NOT NULL DEFAULT 0 CHECK (completion_ratio >= 0 AND completion_ratio <= 1),
  reward_status TEXT NOT NULL DEFAULT 'none' CHECK (reward_status IN ('none','eligible','approved','paid','rejected')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (run_id, member_id),
  FOREIGN KEY (run_id) REFERENCES program_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_enrollments_member_status
  ON program_enrollments(member_id, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_program_enrollments_order
  ON program_enrollments(source_order_id, status);

CREATE TABLE IF NOT EXISTS scoped_role_grants (
  member_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('program_host','program_moderator','space_moderator')),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('program','program_run','space')),
  scope_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  granted_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, role, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_scoped_role_grants_scope
  ON scoped_role_grants(scope_type, scope_id, role, status);

CREATE INDEX IF NOT EXISTS idx_scoped_role_grants_member
  ON scoped_role_grants(member_id, role, status);

-- First draft pilot. Dates, price, and commerce linkage are intentionally
-- unset until the operating rule is confirmed. Test data can be replaced.

INSERT OR IGNORE INTO content_items (
  id,type,title,owner_member_id,status
) VALUES (
  'book-never-just-sell-smartstore',
  'book',
  '그냥 팔지 말라 스마트스토어',
  'maxjagga',
  'published'
);

INSERT OR IGNORE INTO programs (
  id,slug,title,program_type,owner_member_id,description,default_duration_days,visibility,participation_mode,status
) VALUES (
  'program-never-just-sell-readalong',
  'never-just-sell-readalong',
  '저자와 함께 읽는 그냥 팔지 말라 스마트스토어',
  'readalong',
  'maxjagga',
  '저자가 정기적으로 질문과 해설에 참여하고 독자가 읽기·생각 기록·대화를 통해 완독하는 프로그램입니다.',
  28,
  'member',
  'paid',
  'draft'
);

INSERT OR IGNORE INTO program_content_links (
  program_id,content_id,relation,sort_order
) VALUES (
  'program-never-just-sell-readalong',
  'book-never-just-sell-smartstore',
  'primary',
  0
);

INSERT OR IGNORE INTO program_runs (
  id,program_id,title,status,completion_policy_snapshot,reward_policy_snapshot
) VALUES (
  'program-never-just-sell-readalong-pilot-01',
  'program-never-just-sell-readalong',
  '파일럿 1기',
  'draft',
  '{"version":"draft-v1","type":"weighted_completion","threshold":0.85}',
  '{"version":"draft-v1","type":"completion_reward","amount_krw":null}'
);

INSERT OR IGNORE INTO scoped_role_grants (
  member_id,role,scope_type,scope_id,status,granted_by
) VALUES (
  'maxjagga',
  'program_host',
  'program',
  'program-never-just-sell-readalong',
  'active',
  'system_seed'
);

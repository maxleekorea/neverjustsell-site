PRAGMA foreign_keys = ON;

-- Program-space projection for the dedicated community database.
-- Canonical program/role/payment state remains in neverjustsell-courses.
-- This DB stores only the community-facing projection and content.

CREATE TABLE IF NOT EXISTS program_run_projections (
  run_id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  title TEXT NOT NULL,
  lifecycle_phase TEXT NOT NULL DEFAULT 'draft',
  starts_at TEXT,
  ends_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global','program','program_run','creator')),
  scope_id TEXT NOT NULL,
  space_type TEXT NOT NULL CHECK (space_type IN (
    'public_knowledge','announcements','author_qna','weekly_discussion',
    'mission_feed','lounge','live_events','alumni','creator_room'
  )),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'member' CHECK (visibility IN (
    'public','member','restricted','private'
  )),
  access_rule TEXT NOT NULL DEFAULT 'member' CHECK (access_rule IN (
    'public','member','program_participant','program_completed','content_purchaser','explicit'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','read_only','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (scope_type,scope_id,slug)
);

CREATE INDEX IF NOT EXISTS idx_spaces_scope
  ON spaces(scope_type,scope_id,status);

CREATE TABLE IF NOT EXISTS space_members (
  space_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  access_status TEXT NOT NULL DEFAULT 'active' CHECK (access_status IN ('active','read_only','revoked')),
  access_source TEXT NOT NULL DEFAULT 'projection' CHECK (access_source IN (
    'projection','manual','host_grant','staff_grant','alumni'
  )),
  moderation_role TEXT CHECK (moderation_role IS NULL OR moderation_role IN ('host','moderator')),
  source_version TEXT,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (space_id,member_id),
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_space_members_member
  ON space_members(member_id,access_status,updated_at);

CREATE INDEX IF NOT EXISTS idx_space_members_moderation
  ON space_members(space_id,moderation_role,access_status);

-- Existing public posts remain public by default.
-- Program-only posts must explicitly use restricted/private visibility.
ALTER TABLE posts
  ADD COLUMN space_id TEXT;

ALTER TABLE posts
  ADD COLUMN program_run_id TEXT;

ALTER TABLE posts
  ADD COLUMN post_type TEXT NOT NULL DEFAULT 'discussion'
  CHECK (post_type IN ('discussion','question','answer','reflection','case','announcement'));

ALTER TABLE posts
  ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public','member','space'));

ALTER TABLE posts
  ADD COLUMN knowledge_state TEXT NOT NULL DEFAULT 'private'
  CHECK (knowledge_state IN ('private','candidate','published'));

CREATE INDEX IF NOT EXISTS idx_posts_space_status
  ON posts(space_id,status,published_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_program_run
  ON posts(program_run_id,status,published_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_visibility_index
  ON posts(visibility,is_indexable,status,published_at DESC);

-- Records the deliberate promotion of a useful program discussion into public knowledge.
CREATE TABLE IF NOT EXISTS knowledge_promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_post_id INTEGER NOT NULL,
  canonical_post_id INTEGER,
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN (
    'candidate','approved','published','rejected'
  )),
  anonymized INTEGER NOT NULL DEFAULT 0 CHECK (anonymized IN (0,1)),
  approved_by_member_id TEXT,
  approved_at TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (canonical_post_id) REFERENCES posts(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_promotions_source
  ON knowledge_promotions(source_post_id);

-- Stable IDs shared with the course/program database.
-- Exact run dates are intentionally not seeded yet.
INSERT OR IGNORE INTO spaces (
  id,scope_type,scope_id,space_type,name,slug,visibility,access_rule,status
) VALUES
  (
    'space-njs-readalong-announcements',
    'program',
    'program-never-just-sell-readalong',
    'announcements',
    '저자 공지',
    'announcements',
    'restricted',
    'program_participant',
    'active'
  ),
  (
    'space-njs-readalong-qna',
    'program',
    'program-never-just-sell-readalong',
    'author_qna',
    '저자에게 묻기',
    'author-qna',
    'restricted',
    'program_participant',
    'active'
  ),
  (
    'space-njs-readalong-discussion',
    'program',
    'program-never-just-sell-readalong',
    'weekly_discussion',
    '함께 읽고 이야기하기',
    'discussion',
    'restricted',
    'program_participant',
    'active'
  ),
  (
    'space-njs-readalong-alumni',
    'program',
    'program-never-just-sell-readalong',
    'alumni',
    '완독자 모임',
    'alumni',
    'restricted',
    'program_completed',
    'active'
  );

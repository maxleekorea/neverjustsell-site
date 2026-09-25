let schemaPromise = null;

const PRE_ALTER_SQL = String.raw`
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
`;

const POST_ALTER_SQL = String.raw`
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
`;

function splitSqlStatements(sql) {
  const noLineComments = String(sql || "")
    .split("\n")
    .map((line) => line.trimStart().startsWith("--") ? "" : line)
    .join("\n");

  const statements = [];
  let current = "";
  let single = false;
  let double = false;

  for (let i = 0; i < noLineComments.length; i += 1) {
    const ch = noLineComments[i];
    const next = noLineComments[i + 1];

    if (ch === "'" && !double) {
      if (single && next === "'") {
        current += "''";
        i += 1;
        continue;
      }
      single = !single;
      current += ch;
      continue;
    }

    if (ch === '"' && !single) {
      if (double && next === '"') {
        current += '""';
        i += 1;
        continue;
      }
      double = !double;
      current += ch;
      continue;
    }

    if (ch === ";" && !single && !double) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function executeStatements(db, sql) {
  const statements = splitSqlStatements(sql);
  if (!statements.length) return;
  await db.batch(statements.map((statement) => db.prepare(statement)));
}

async function columnNames(db, table) {
  const result = await db.prepare(`PRAGMA table_info("${table.replaceAll('"','""')}")`).all();
  return new Set((result.results || []).map((row) => String(row.name || "")));
}

async function markMigration(db, name) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)"
  ).run();
  await db.prepare("INSERT OR IGNORE INTO d1_migrations(name) VALUES (?)").bind(name).run();
}

async function migrationApplied(db, name) {
  try {
    const row = await db.prepare("SELECT 1 AS ok FROM d1_migrations WHERE name=? LIMIT 1").bind(name).first();
    return Boolean(row?.ok);
  } catch {
    return false;
  }
}

async function ensureInternal(db) {
  const migrationName = "0002_program_spaces.sql";
  const applied = [];
  if (!(await migrationApplied(db, migrationName))) {
    await executeStatements(db, PRE_ALTER_SQL);
    const cols = await columnNames(db, "posts");
    if (!cols.has("space_id")) await db.prepare("ALTER TABLE posts ADD COLUMN space_id TEXT").run();
    if (!cols.has("program_run_id")) await db.prepare("ALTER TABLE posts ADD COLUMN program_run_id TEXT").run();
    if (!cols.has("post_type")) {
      await db.prepare("ALTER TABLE posts ADD COLUMN post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion','question','answer','reflection','case','announcement'))").run();
    }
    if (!cols.has("visibility")) {
      await db.prepare("ALTER TABLE posts ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','member','space'))").run();
    }
    if (!cols.has("knowledge_state")) {
      await db.prepare("ALTER TABLE posts ADD COLUMN knowledge_state TEXT NOT NULL DEFAULT 'private' CHECK (knowledge_state IN ('private','candidate','published'))").run();
    }
    await executeStatements(db, POST_ALTER_SQL);
    await markMigration(db, migrationName);
    applied.push(migrationName);
  }

  const accessRefreshMigration = "0003_session_access_refresh.sql";
  if (!(await migrationApplied(db, accessRefreshMigration))) {
    const sessionCols = await columnNames(db, "sessions");
    if (!sessionCols.has("access_checked_at")) {
      await db.prepare("ALTER TABLE sessions ADD COLUMN access_checked_at TEXT").run();
    }
    await markMigration(db, accessRefreshMigration);
    applied.push(accessRefreshMigration);
  }

  const check = await db.prepare(
    "SELECT " +
    "(SELECT COUNT(*) FROM spaces) AS space_count," +
    "(SELECT COUNT(*) FROM spaces WHERE scope_id='program-never-just-sell-readalong') AS pilot_space_count," +
    "(SELECT COUNT(*) FROM knowledge_promotions) AS knowledge_promotion_count"
  ).first();

  return {
    ok: true,
    applied,
    space_count: Number(check?.space_count || 0),
    pilot_space_count: Number(check?.pilot_space_count || 0),
    knowledge_promotion_count: Number(check?.knowledge_promotion_count || 0)
  };
}

export async function ensureCommunityProgramSchema(env) {
  if (!env.DB) throw new Error("DB binding missing");
  if (!schemaPromise) {
    schemaPromise = ensureInternal(env.DB).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

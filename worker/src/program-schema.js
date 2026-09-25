let schemaPromise = null;

const MIGRATION_0027 = String.raw`
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

CREATE TABLE IF NOT EXISTS platform_role_grants (
  member_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_owner','staff_operator','creator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  granted_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, role)
);

CREATE INDEX IF NOT EXISTS idx_platform_role_grants_role
  ON platform_role_grants(role, status, member_id);

INSERT OR IGNORE INTO platform_role_grants (
  member_id,role,status,granted_by
) VALUES (
  'maxjagga','platform_owner','active','system_seed'
);

INSERT OR IGNORE INTO platform_role_grants (
  member_id,role,status,granted_by
) VALUES (
  'maxjagga','creator','active','system_seed'
);

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
`;

const MIGRATION_0028_REST = String.raw`
CREATE INDEX IF NOT EXISTS idx_program_runs_phase
  ON program_runs(program_id,lifecycle_phase,starts_at);

CREATE TABLE IF NOT EXISTS program_mission_templates (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  sequence_no INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN (
    'reading','watching','reflection','discussion','assignment','action','attendance','proof'
  )),
  prompt TEXT NOT NULL DEFAULT '',
  relative_open_day INTEGER NOT NULL DEFAULT 0,
  relative_due_day INTEGER,
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0,1)),
  completion_weight REAL NOT NULL DEFAULT 1 CHECK (completion_weight >= 0),
  verification_mode TEXT NOT NULL DEFAULT 'self' CHECK (verification_mode IN (
    'self','host_review','attendance','progress','automatic'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_program_mission_templates_order
  ON program_mission_templates(program_id,sequence_no);

CREATE TABLE IF NOT EXISTS program_run_missions (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  template_id TEXT,
  sequence_no INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN (
    'reading','watching','reflection','discussion','assignment','action','attendance','proof'
  )),
  prompt TEXT NOT NULL DEFAULT '',
  opens_at TEXT,
  due_at TEXT,
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0,1)),
  completion_weight REAL NOT NULL DEFAULT 1 CHECK (completion_weight >= 0),
  verification_mode TEXT NOT NULL DEFAULT 'self' CHECK (verification_mode IN (
    'self','host_review','attendance','progress','automatic'
  )),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','open','closed','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES program_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES program_mission_templates(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_program_run_missions_order
  ON program_run_missions(run_id,sequence_no);

CREATE INDEX IF NOT EXISTS idx_program_run_missions_due
  ON program_run_missions(run_id,status,due_at);

CREATE TABLE IF NOT EXISTS program_mission_submissions (
  mission_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  submission_text TEXT NOT NULL DEFAULT '',
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted','accepted','rejected','revision_requested'
  )),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT,
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (mission_id,member_id),
  FOREIGN KEY (mission_id) REFERENCES program_run_missions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_mission_submissions_review
  ON program_mission_submissions(mission_id,status,submitted_at);

CREATE INDEX IF NOT EXISTS idx_program_mission_submissions_member
  ON program_mission_submissions(member_id,status,updated_at);

-- Content progress is independent from mission completion.
-- A reader can be 70% through the book while having completed 100% of this week's mission.
CREATE TABLE IF NOT EXISTS program_content_progress (
  run_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  progress_ratio REAL NOT NULL DEFAULT 0 CHECK (progress_ratio >= 0 AND progress_ratio <= 1),
  checkpoint TEXT NOT NULL DEFAULT '',
  last_activity_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (run_id,member_id,content_id),
  FOREIGN KEY (run_id) REFERENCES program_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_content_progress_member
  ON program_content_progress(member_id,updated_at);

CREATE TABLE IF NOT EXISTS program_event_templates (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  sequence_no INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'kickoff','author_talk','live_qna','workshop','office_hour','offline_meetup','closing'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  relative_day INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  attendance_required INTEGER NOT NULL DEFAULT 0 CHECK (attendance_required IN (0,1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_program_event_templates_order
  ON program_event_templates(program_id,sequence_no);

CREATE TABLE IF NOT EXISTS program_events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  template_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'kickoff','author_talk','live_qna','workshop','office_hour','offline_meetup','closing'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TEXT,
  ends_at TEXT,
  location_type TEXT NOT NULL DEFAULT 'online' CHECK (location_type IN ('online','offline','hybrid')),
  location_text TEXT NOT NULL DEFAULT '',
  join_url TEXT,
  attendance_required INTEGER NOT NULL DEFAULT 0 CHECK (attendance_required IN (0,1)),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES program_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES program_event_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_program_events_run
  ON program_events(run_id,status,starts_at);

CREATE TABLE IF NOT EXISTS program_event_rsvps (
  event_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  response TEXT NOT NULL DEFAULT 'yes' CHECK (response IN ('yes','maybe','no')),
  responded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id,member_id),
  FOREIGN KEY (event_id) REFERENCES program_events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS program_event_attendance (
  event_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'attended' CHECK (status IN ('attended','late','absent','excused')),
  checked_by TEXT,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (event_id,member_id),
  FOREIGN KEY (event_id) REFERENCES program_events(id) ON DELETE CASCADE
);

-- Completion evaluation is frozen separately from mutable progress data.
CREATE TABLE IF NOT EXISTS program_completion_reviews (
  run_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  mission_ratio REAL NOT NULL DEFAULT 0 CHECK (mission_ratio >= 0 AND mission_ratio <= 1),
  content_ratio REAL CHECK (content_ratio IS NULL OR (content_ratio >= 0 AND content_ratio <= 1)),
  attendance_ratio REAL CHECK (attendance_ratio IS NULL OR (attendance_ratio >= 0 AND attendance_ratio <= 1)),
  final_ratio REAL NOT NULL DEFAULT 0 CHECK (final_ratio >= 0 AND final_ratio <= 1),
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending','completed','not_completed','exception')),
  policy_snapshot TEXT NOT NULL DEFAULT '{}',
  reviewed_by TEXT,
  reviewed_at TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (run_id,member_id),
  FOREIGN KEY (run_id) REFERENCES program_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_completion_reviews_result
  ON program_completion_reviews(run_id,result,updated_at);

-- Completion reward is NOT a refund.
-- Cash payout remains staff/system controlled; creator can only recommend eligibility.
CREATE TABLE IF NOT EXISTS program_reward_claims (
  run_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'none' CHECK (reward_type IN (
    'none','fixed_cashback','fixed_credit','coupon','badge','access_unlock'
  )),
  amount_krw INTEGER CHECK (amount_krw IS NULL OR amount_krw >= 0),
  status TEXT NOT NULL DEFAULT 'not_eligible' CHECK (status IN (
    'not_eligible','eligible','requested','approved','paid','rejected','cancelled'
  )),
  eligibility_snapshot TEXT NOT NULL DEFAULT '{}',
  recommended_by TEXT,
  approved_by TEXT,
  payout_reference TEXT,
  eligible_at TEXT,
  requested_at TEXT,
  approved_at TEXT,
  paid_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (run_id,member_id),
  FOREIGN KEY (run_id) REFERENCES program_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_reward_claims_status
  ON program_reward_claims(run_id,status,updated_at);

-- Draft pilot templates. Exact page ranges and prompts are intentionally replaceable.
INSERT OR IGNORE INTO program_mission_templates (
  id,program_id,sequence_no,title,mission_type,prompt,relative_open_day,relative_due_day,required,completion_weight,verification_mode
) VALUES
  (
    'njs-readalong-w1-reflection',
    'program-never-just-sell-readalong',
    10,
    '1주차 읽기와 생각 기록',
    'reflection',
    '이번 주 분량에서 가장 생각이 바뀐 지점을 하나 기록합니다.',
    0,6,1,1,'self'
  ),
  (
    'njs-readalong-w2-author-question',
    'program-never-just-sell-readalong',
    20,
    '2주차 저자 질문에 답하기',
    'discussion',
    '저자가 제시한 질문에 자신의 경험을 연결해 답합니다.',
    7,13,1,1,'self'
  ),
  (
    'njs-readalong-w3-action',
    'program-never-just-sell-readalong',
    30,
    '3주차 내 사업에 적용하기',
    'action',
    '책에서 한 가지를 골라 실제 사업 또는 업무에 적용하고 결과를 기록합니다.',
    14,20,1,1,'host_review'
  ),
  (
    'njs-readalong-w4-completion',
    'program-never-just-sell-readalong',
    40,
    '4주차 완독 기록',
    'reflection',
    '완독 후 가장 오래 남길 한 가지 생각과 다음 행동을 기록합니다.',
    21,27,1,1,'host_review'
  );

INSERT OR IGNORE INTO program_event_templates (
  id,program_id,sequence_no,event_type,title,description,relative_day,duration_minutes,attendance_required
) VALUES
  (
    'njs-readalong-kickoff',
    'program-never-just-sell-readalong',
    10,
    'kickoff',
    '저자와 시작하는 오리엔테이션',
    '프로그램의 읽기 방식과 질문하는 방법을 안내합니다.',
    0,60,0
  ),
  (
    'njs-readalong-closing',
    'program-never-just-sell-readalong',
    20,
    'closing',
    '저자와 함께하는 완독 대화',
    '4주 동안 남은 질문과 실행 사례를 함께 정리합니다.',
    27,75,0
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

const MIGRATION_0029 = String.raw`
-- Payment/program access E2E fixture.
-- Reuses the existing hidden Cafe24 product #13 (1,000 KRW) so one test order
-- can verify course entitlement + program enrollment + community projection.
-- This fixture is never exposed in the public program catalog.

INSERT OR IGNORE INTO programs (
  id,slug,title,program_type,owner_member_id,description,default_duration_days,
  visibility,participation_mode,status
) VALUES (
  'system-check-payment-program',
  'system-check-payment-program',
  '시스템 결제·프로그램 접근 점검',
  'challenge',
  'maxjagga',
  '결제 → 프로그램 참가권 → 커뮤니티 접근권한 전체 흐름을 점검하는 내부 테스트 프로그램입니다.',
  7,
  'private',
  'paid',
  'active'
);

INSERT OR IGNORE INTO program_runs (
  id,program_id,title,starts_at,ends_at,price_krw,cafe24_product_no,status,
  completion_policy_snapshot,reward_policy_snapshot,lifecycle_phase
) VALUES (
  'system-check-payment-program-run',
  'system-check-payment-program',
  '시스템 점검 회차',
  '2026-09-24',
  '2099-12-31',
  1000,
  13,
  'active',
  '{"version":"system-check","type":"none"}',
  '{"version":"system-check","type":"none"}',
  'active'
);

UPDATE program_runs
SET price_krw=1000,
    cafe24_product_no=13,
    status='active',
    lifecycle_phase='active',
    starts_at=COALESCE(starts_at,'2026-09-24'),
    ends_at=COALESCE(ends_at,'2099-12-31'),
    updated_at=CURRENT_TIMESTAMP
WHERE id='system-check-payment-program-run';

INSERT OR IGNORE INTO scoped_role_grants (
  member_id,role,scope_type,scope_id,status,granted_by
) VALUES (
  'maxjagga',
  'program_host',
  'program',
  'system-check-payment-program',
  'active',
  'system_seed'
);
`;

const MIGRATION_0030 = String.raw`
-- One-time operational queue executed by the authenticated Worker runtime.
-- This avoids exposing Cafe24 admin credentials to GitHub Actions.
CREATE TABLE IF NOT EXISTS system_operations (
  id TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  payload_json TEXT NOT NULL DEFAULT '{}',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_operations_status
  ON system_operations(status,requested_at);

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-open-payment-e2e-product-13',
  'open_payment_e2e_product_13',
  'pending',
  '{"product_no":13,"price":1000,"member_only":true}'
);
`;

const MIGRATION_0031 = String.raw`
-- Re-run the existing E2E product opening operation without forcing Cafe24
-- customer-tier restrictions. The operator must purchase while logged in.
UPDATE system_operations
SET status='pending',
    payload_json='{"product_no":13,"price":1000,"member_only":false}',
    last_error=NULL,
    started_at=NULL,
    completed_at=NULL,
    updated_at=CURRENT_TIMESTAMP
WHERE id='2026-09-25-open-payment-e2e-product-13';
`;

const MIGRATION_0032 = String.raw`
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-reconcile-latest-payment-e2e-order',
  'reconcile_latest_payment_e2e_order',
  'pending',
  '{"product_no":13,"date":"2026-09-25"}'
);
`;

const MIGRATION_0033 = String.raw`
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-bootstrap-cafe24-catalog-after-reauth',
  'bootstrap_cafe24_catalog',
  'pending',
  '{}'
);
`;

const MIGRATION_0034 = String.raw`
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-cleanup-cafe24-catalog-duplicates',
  'cleanup_cafe24_catalog_duplicates',
  'pending',
  '{}'
);
`;

const MIGRATION_0035 = String.raw`
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-set-all-current-products-no-shipping',
  'set_all_current_products_no_shipping',
  'pending',
  '{}'
);
`;

const MIGRATION_0036 = String.raw`
CREATE TABLE IF NOT EXISTS commerce_category_profiles (
  category_no INTEGER PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL UNIQUE CHECK (product_type IN ('course','ebook','program','physical')),
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('entitlement','shipment')),
  requires_shipping INTEGER NOT NULL CHECK (requires_shipping IN (0,1)),
  post_purchase_path TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO commerce_category_profiles (
  category_no,category_name,product_type,fulfillment_type,requires_shipping,post_purchase_path,status
) VALUES
  (42,'강의','course','entitlement',0,'/my-space','active'),
  (43,'전자책','ebook','entitlement',0,'/my-space','active'),
  (48,'프로그램','program','entitlement',0,'/my-space','active'),
  (53,'일반상품','physical','shipment',1,NULL,'active')
ON CONFLICT(category_no) DO UPDATE SET
  category_name=excluded.category_name,
  product_type=excluded.product_type,
  fulfillment_type=excluded.fulfillment_type,
  requires_shipping=excluded.requires_shipping,
  post_purchase_path=excluded.post_purchase_path,
  status='active',
  updated_at=CURRENT_TIMESTAMP;
`;

const MIGRATION_0037 = String.raw`
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-reconcile-all-course-product-fulfillment',
  'reconcile_all_course_product_fulfillment',
  'pending',
  '{}'
);
`;

const MIGRATION_0038 = String.raw`
CREATE TABLE IF NOT EXISTS cafe24_setting_snapshots (
  snapshot_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-hide-digital-product-shipping-properties',
  'hide_digital_product_shipping_properties',
  'pending',
  '{}'
);
`;

const MIGRATION_0039 = String.raw`
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-apply-digital-product-detail-ux',
  'apply_digital_product_detail_ux',
  'pending',
  '{}'
);
`;

const MIGRATION_0040 = String.raw`
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-cancel-payment-e2e-order',
  'cancel_payment_e2e_order',
  'pending',
  '{"product_no":13,"date":"2026-09-25"}'
);
`;

const MIGRATION_0041 = String.raw`
INSERT OR IGNORE INTO system_operations (
  id,operation_type,status,payload_json
) VALUES (
  '2026-09-25-retry-final-payment-e2e-consistency',
  'cancel_payment_e2e_order',
  'pending',
  '{"product_no":13,"date":"2026-09-25"}'
);
`;

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
  const applied = [];

  if (!(await migrationApplied(db, "0027_program_community_foundation.sql"))) {
    await executeStatements(db, MIGRATION_0027);
    await markMigration(db, "0027_program_community_foundation.sql");
    applied.push("0027_program_community_foundation.sql");
  }

  if (!(await migrationApplied(db, "0028_program_operations.sql"))) {
    const cols = await columnNames(db, "program_runs");
    if (!cols.has("lifecycle_phase")) {
      await db.prepare(
        "ALTER TABLE program_runs ADD COLUMN lifecycle_phase TEXT NOT NULL DEFAULT 'draft' CHECK (lifecycle_phase IN ('draft','enrollment','ready','active','completion_review','reward_processing','alumni','archived','cancelled'))"
      ).run();
    }
    if (!cols.has("cloned_from_run_id")) {
      await db.prepare("ALTER TABLE program_runs ADD COLUMN cloned_from_run_id TEXT").run();
    }
    await executeStatements(db, MIGRATION_0028_REST);
    await markMigration(db, "0028_program_operations.sql");
    applied.push("0028_program_operations.sql");
  }

  if (!(await migrationApplied(db, "0029_program_payment_e2e_fixture.sql"))) {
    await executeStatements(db, MIGRATION_0029);
    await markMigration(db, "0029_program_payment_e2e_fixture.sql");
    applied.push("0029_program_payment_e2e_fixture.sql");
  }

  if (!(await migrationApplied(db, "0030_open_payment_e2e_product.sql"))) {
    await executeStatements(db, MIGRATION_0030);
    await markMigration(db, "0030_open_payment_e2e_product.sql");
    applied.push("0030_open_payment_e2e_product.sql");
  }

  if (!(await migrationApplied(db, "0031_reopen_payment_e2e_product_without_group_lock.sql"))) {
    await executeStatements(db, MIGRATION_0031);
    await markMigration(db, "0031_reopen_payment_e2e_product_without_group_lock.sql");
    applied.push("0031_reopen_payment_e2e_product_without_group_lock.sql");
  }

  if (!(await migrationApplied(db, "0032_reconcile_latest_payment_e2e_order.sql"))) {
    await executeStatements(db, MIGRATION_0032);
    await markMigration(db, "0032_reconcile_latest_payment_e2e_order.sql");
    applied.push("0032_reconcile_latest_payment_e2e_order.sql");
  }

  if (!(await migrationApplied(db, "0033_bootstrap_cafe24_catalog.sql"))) {
    await executeStatements(db, MIGRATION_0033);
    await markMigration(db, "0033_bootstrap_cafe24_catalog.sql");
    applied.push("0033_bootstrap_cafe24_catalog.sql");
  }

  if (!(await migrationApplied(db, "0034_cleanup_cafe24_catalog_duplicates.sql"))) {
    await executeStatements(db, MIGRATION_0034);
    await markMigration(db, "0034_cleanup_cafe24_catalog_duplicates.sql");
    applied.push("0034_cleanup_cafe24_catalog_duplicates.sql");
  }

  if (!(await migrationApplied(db, "0035_set_all_current_products_no_shipping.sql"))) {
    await executeStatements(db, MIGRATION_0035);
    await markMigration(db, "0035_set_all_current_products_no_shipping.sql");
    applied.push("0035_set_all_current_products_no_shipping.sql");
  }

  if (!(await migrationApplied(db, "0036_commerce_fulfillment_profiles.sql"))) {
    await executeStatements(db, MIGRATION_0036);
    await markMigration(db, "0036_commerce_fulfillment_profiles.sql");
    applied.push("0036_commerce_fulfillment_profiles.sql");
  }

  if (!(await migrationApplied(db, "0037_reconcile_all_course_product_fulfillment.sql"))) {
    await executeStatements(db, MIGRATION_0037);
    await markMigration(db, "0037_reconcile_all_course_product_fulfillment.sql");
    applied.push("0037_reconcile_all_course_product_fulfillment.sql");
  }

  if (!(await migrationApplied(db, "0038_hide_digital_product_shipping_properties.sql"))) {
    await executeStatements(db, MIGRATION_0038);
    await markMigration(db, "0038_hide_digital_product_shipping_properties.sql");
    applied.push("0038_hide_digital_product_shipping_properties.sql");
  }

  if (!(await migrationApplied(db, "0039_apply_digital_product_detail_ux.sql"))) {
    await executeStatements(db, MIGRATION_0039);
    await markMigration(db, "0039_apply_digital_product_detail_ux.sql");
    applied.push("0039_apply_digital_product_detail_ux.sql");
  }

  if (!(await migrationApplied(db, "0040_cancel_payment_e2e_order.sql"))) {
    await executeStatements(db, MIGRATION_0040);
    await markMigration(db, "0040_cancel_payment_e2e_order.sql");
    applied.push("0040_cancel_payment_e2e_order.sql");
  }

  if (!(await migrationApplied(db, "0041_retry_final_payment_e2e_consistency.sql"))) {
    await executeStatements(db, MIGRATION_0041);
    await markMigration(db, "0041_retry_final_payment_e2e_consistency.sql");
    applied.push("0041_retry_final_payment_e2e_consistency.sql");
  }

  const check = await db.prepare(
    "SELECT " +
    "(SELECT COUNT(*) FROM programs) AS program_count," +
    "(SELECT COUNT(*) FROM program_runs) AS run_count," +
    "(SELECT COUNT(*) FROM program_mission_templates) AS mission_template_count," +
    "(SELECT COUNT(*) FROM program_event_templates) AS event_template_count"
  ).first();

  return {
    ok: true,
    applied,
    program_count: Number(check?.program_count || 0),
    run_count: Number(check?.run_count || 0),
    mission_template_count: Number(check?.mission_template_count || 0),
    event_template_count: Number(check?.event_template_count || 0)
  };
}

export async function ensureProgramSchema(env) {
  if (!env.COURSE_DB) throw new Error("COURSE_DB binding missing");
  if (!schemaPromise) {
    schemaPromise = ensureInternal(env.COURSE_DB).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

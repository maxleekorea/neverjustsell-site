PRAGMA foreign_keys = ON;

-- Program operations foundation.
-- 0027 owns program identity/run/enrollment/role grants.
-- This migration adds repeatable missions, progress, events, completion review,
-- and completion rewards while keeping refunds in the existing commerce domain.

ALTER TABLE program_runs
  ADD COLUMN lifecycle_phase TEXT NOT NULL DEFAULT 'draft'
  CHECK (lifecycle_phase IN (
    'draft','enrollment','ready','active',
    'completion_review','reward_processing','alumni','archived','cancelled'
  ));

ALTER TABLE program_runs
  ADD COLUMN cloned_from_run_id TEXT;

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

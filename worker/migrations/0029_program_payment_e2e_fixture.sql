PRAGMA foreign_keys = ON;

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

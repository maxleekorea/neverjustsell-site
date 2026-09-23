-- Dedicated payment E2E fixture.
-- Reuses the existing Cafe24 product_no=13 and Vimeo test videos.
-- Kept out of the public D1 course catalog with status='system_check' and visible=0.

INSERT OR IGNORE INTO courses (
  id, slug, title, summary, access_type,
  cafe24_product_no, sales_url, sales_enabled, visible, sort_order,
  status, price_krw, cafe24_sync_status, login_required, owner_member_id
) VALUES (
  'system-check-paid-course',
  'system-check-paid-course',
  '결제 E2E 테스트 강의',
  'Cafe24 결제, D1 수강권 부여, 취소·환불 회수를 검증하는 시스템 전용 테스트 강의입니다.',
  'paid',
  13,
  'https://www.neverjustsell.com/product/detail.html?product_no=13',
  0,
  0,
  999,
  'system_check',
  1000,
  'e2e_hidden',
  1,
  'maxjagga'
);

INSERT OR IGNORE INTO lessons (
  id, course_id, title, vimeo_id, duration_seconds, sort_order, status, is_preview
) VALUES (
  'system-check-paid-lesson-1',
  'system-check-paid-course',
  '테스트 영상 1',
  '1227604364',
  NULL,
  0,
  'ready',
  0
);

INSERT OR IGNORE INTO lessons (
  id, course_id, title, vimeo_id, duration_seconds, sort_order, status, is_preview
) VALUES (
  'system-check-paid-lesson-2',
  'system-check-paid-course',
  '테스트 영상 2',
  '1227604365',
  NULL,
  1,
  'ready',
  0
);

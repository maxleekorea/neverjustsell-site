UPDATE courses
SET access_duration_days=180,
    refund_policy_version='fair-trust-v1.0',
    refund_policy_text=CASE
      WHEN refund_policy_text IS NULL OR TRIM(refund_policy_text)='' THEN '첫 번째 본강의 차시는 구매 전 무료로 공개합니다. 결제 후 7일 이내 유료 차시를 이용하지 않았다면 전액 환불합니다. 유료 차시를 이용한 경우와 7일 경과 후의 중도해지는 실제 유료 콘텐츠 이용분과 적용 법령을 기준으로 환불합니다. 무료 미리보기 시청분은 유료 이용량에 포함하지 않습니다.'
      ELSE refund_policy_text
    END,
    updated_at=CURRENT_TIMESTAMP
WHERE id IN ('paid-naver-search-algorithm','paid-naver-keyword-strategy');

CREATE INDEX IF NOT EXISTS idx_courses_refund_policy_version
  ON courses(refund_policy_version);

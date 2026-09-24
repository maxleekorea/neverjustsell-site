UPDATE courses
SET access_info=CASE
      WHEN access_info IS NULL OR TRIM(access_info)='' THEN '수강기간은 결제일 기준 180일입니다.'
      ELSE access_info
    END,
    updated_at=CURRENT_TIMESTAMP
WHERE id IN ('paid-naver-search-algorithm','paid-naver-keyword-strategy');

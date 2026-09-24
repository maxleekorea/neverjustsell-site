-- Seed curriculum shells for the two real paid VOD courses.
-- This migration never overwrites an existing curriculum. It only runs when
-- the course currently has no non-archived lessons.

WITH proposed(id, course_id, title, description, sort_order, status, is_preview) AS (
  VALUES
    (
      'naver-search-algorithm-01',
      'paid-naver-search-algorithm',
      '방법보다 방향이 먼저인 이유',
      '검색 노출 기법보다 먼저 온라인 유통과 플랫폼의 흐름을 이해해야 하는 이유를 설명하고 이후 강의를 받아들일 기준을 세웁니다.',
      0,
      'draft',
      0
    ),
    (
      'naver-search-algorithm-02',
      'paid-naver-search-algorithm',
      '유통의 시작점은 어떻게 검색창으로 이동했나',
      '오프라인의 입지 경쟁이 온라인의 검색 입구 경쟁으로 이동한 과정을 이해하고 네이버가 유통의 시작점을 장악한 이유를 살펴봅니다.',
      1,
      'draft',
      0
    ),
    (
      'naver-search-algorithm-03',
      'paid-naver-search-algorithm',
      '네이버 알고리즘과 슬롯 신화의 붕괴',
      '네이버 쇼핑 검색 구조와 상위노출 신호를 이해하고 단기 트래픽 꼼수가 왜 지속 가능한 전략이 아닌지 판단합니다.',
      2,
      'draft',
      0
    ),
    (
      'naver-search-algorithm-04',
      'paid-naver-search-algorithm',
      '스마트스토어의 선순환 데이터와 온라인 커머스의 미래',
      '검색 유입과 브랜드·콘텐츠가 선순환하는 구조를 이해하고 발견형 쇼핑과 AI 커머스 환경에서의 대응 방향을 정리합니다.',
      3,
      'draft',
      0
    )
)
INSERT INTO lessons (id, course_id, title, description, sort_order, status, is_preview)
SELECT id, course_id, title, description, sort_order, status, is_preview
FROM proposed
WHERE EXISTS (
  SELECT 1 FROM courses WHERE id='paid-naver-search-algorithm'
)
AND NOT EXISTS (
  SELECT 1 FROM lessons
  WHERE course_id='paid-naver-search-algorithm' AND status!='archived'
);

WITH proposed(id, course_id, title, description, sort_order, status, is_preview) AS (
  VALUES
    (
      'naver-keyword-strategy-01',
      'paid-naver-keyword-strategy',
      '키워드를 보는 관점과 황금 키워드의 함정',
      '검색량 숫자와 유행 공식을 그대로 좇는 방식의 한계를 이해하고 고객의 검색 맥락을 보는 관점을 세웁니다.',
      0,
      'draft',
      0
    ),
    (
      'naver-keyword-strategy-02',
      'paid-naver-keyword-strategy',
      '검색엔진이 읽는 언어: 검색의도·형태소·카테고리',
      '검색어가 검색엔진에서 어떤 구조로 해석되는지 이해하고 상품 카테고리와 키워드 구조를 연결합니다.',
      1,
      'draft',
      0
    ),
    (
      'naver-keyword-strategy-03',
      'paid-naver-keyword-strategy',
      '네이버 쇼핑 실무: 상품명·태그·키워드 사전·노출 검증',
      '네이버 쇼핑 입력 항목과 키워드 사전을 활용하고 실제 검색 결과를 역으로 검증하는 실무 흐름을 익힙니다.',
      2,
      'draft',
      0
    ),
    (
      'naver-keyword-strategy-04',
      'paid-naver-keyword-strategy',
      '검색량을 만드는 전략: 상품 정의와 조어',
      '기존 검색량을 추종하는 데서 벗어나 고객이 기억하고 반복해서 말할 수 있는 새로운 키워드와 이름을 설계합니다.',
      3,
      'draft',
      0
    ),
    (
      'naver-keyword-strategy-05',
      'paid-naver-keyword-strategy',
      '검색·소셜·AI로 확장되는 브랜드 키워드',
      '키워드를 검색 최적화에서 끝내지 않고 소셜 확산과 AI 추천에 활용되는 브랜드 언어 자산으로 확장합니다.',
      4,
      'draft',
      0
    )
)
INSERT INTO lessons (id, course_id, title, description, sort_order, status, is_preview)
SELECT id, course_id, title, description, sort_order, status, is_preview
FROM proposed
WHERE EXISTS (
  SELECT 1 FROM courses WHERE id='paid-naver-keyword-strategy'
)
AND NOT EXISTS (
  SELECT 1 FROM lessons
  WHERE course_id='paid-naver-keyword-strategy' AND status!='archived'
);

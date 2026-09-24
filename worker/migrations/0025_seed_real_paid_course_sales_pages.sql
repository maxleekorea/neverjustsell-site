-- Seed the sales-page copy for the two real paid VOD courses.
-- Preserve any text already edited by the operator.

UPDATE courses
SET instructor_name=COALESCE(NULLIF(TRIM(instructor_name),''),'맥작가'),
    instructor_bio=COALESCE(
      NULLIF(TRIM(instructor_bio),''),
      '오프라인 유통과 글로벌 제조·유통, 온라인 커머스 사업을 경험했고 스마트스토어를 직접 운영해 왔습니다. 『그냥 팔지 말라 스마트스토어』를 쓴 작가이자 사업가로서 단기 판매 요령보다 오래 작동하는 유통 구조와 판단 기준을 설명합니다.'
    ),
    target_audience=COALESCE(
      NULLIF(TRIM(target_audience),''),
      '네이버 쇼핑 검색 알고리즘을 단편적인 노출 공식이 아니라 유통 구조와 함께 이해하고 싶은 판매자\n트래픽·슬롯 같은 단기 상위노출 기법에 의존하지 않고 오래 작동하는 운영 기준이 필요한 판매자\n검색·콘텐츠·브랜드가 어떻게 연결되는지 이해하고 싶은 온라인 판매자'
    ),
    learning_outcomes=COALESCE(
      NULLIF(TRIM(learning_outcomes),''),
      '온라인 유통의 변화가 네이버 검색 중심 구조로 이어진 맥락을 설명할 수 있습니다.\n네이버 쇼핑 알고리즘과 상위노출 신호를 플랫폼의 사업 구조와 연결해 해석할 수 있습니다.\n단기 트래픽 기법과 지속 가능한 검색·브랜드 전략을 구분할 수 있습니다.\n검색·콘텐츠·브랜드가 선순환하는 장기 운영 방향을 설계할 수 있습니다.'
    ),
    updated_at=CURRENT_TIMESTAMP
WHERE id='paid-naver-search-algorithm';

UPDATE courses
SET instructor_name=COALESCE(NULLIF(TRIM(instructor_name),''),'맥작가'),
    instructor_bio=COALESCE(
      NULLIF(TRIM(instructor_bio),''),
      '오프라인 유통과 글로벌 제조·유통, 온라인 커머스 사업을 경험했고 스마트스토어를 직접 운영해 왔습니다. 『그냥 팔지 말라 스마트스토어』를 쓴 작가이자 사업가로서 단기 판매 요령보다 오래 작동하는 유통 구조와 판단 기준을 설명합니다.'
    ),
    target_audience=COALESCE(
      NULLIF(TRIM(target_audience),''),
      '검색량과 경쟁강도만 보고 키워드를 고르는 방식에서 벗어나고 싶은 판매자\n상품명·태그·카테고리를 고객의 검색 의도에 맞게 설계하고 싶은 판매자\n검색·소셜·AI에서 반복해서 작동하는 브랜드 언어를 만들고 싶은 온라인 판매자'
    ),
    learning_outcomes=COALESCE(
      NULLIF(TRIM(learning_outcomes),''),
      '검색 의도·형태소·카테고리가 검색 결과와 연결되는 구조를 이해할 수 있습니다.\n네이버 쇼핑의 상품명·태그·키워드 사전을 실제 노출 검증 흐름과 함께 활용할 수 있습니다.\n기존 검색량을 따라가는 전략과 새로운 검색량을 만드는 전략의 차이를 설명할 수 있습니다.\n키워드를 검색 최적화에서 끝내지 않고 소셜 확산과 AI 추천에 쓰이는 브랜드 자산으로 확장할 수 있습니다.'
    ),
    updated_at=CURRENT_TIMESTAMP
WHERE id='paid-naver-keyword-strategy';

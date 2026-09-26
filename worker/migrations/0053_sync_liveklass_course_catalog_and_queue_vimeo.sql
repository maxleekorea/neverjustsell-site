PRAGMA foreign_keys = ON;

-- Align the two real paid courses with the actual LiveKlass catalog and the
-- uploaded Vimeo lesson structure. Keep both courses in draft/preparing until
-- media readiness and the final launch decision are complete.

UPDATE courses
SET
  title='온라인 커머스 역사와 네이버 쇼핑 검색 알고리즘',
  summary='온라인 커머스의 역사를 따라가며 네이버 쇼핑 검색 구조가 왜 지금의 모습이 되었는지 이해하는 강의입니다. 오프라인 입지 경쟁, 1세대 쇼핑몰, 모바일 전환, 플랫폼 경쟁, 스마트스토어 성장, 검색 알고리즘 변화, 가짜 트래픽·슬롯 신화의 붕괴를 하나의 흐름으로 연결합니다. 단순한 상위노출 공식 대신 플랫폼의 이해관계와 적합도·인기도 신호를 읽고, 검색과 콘텐츠·브랜드가 선순환하는 인포먼스 마케팅 구조와 AI 커머스 시대의 방향까지 살펴봅니다.',
  instructor_name=COALESCE(NULLIF(TRIM(instructor_name),''),'맥작가'),
  instructor_bio=COALESCE(NULLIF(TRIM(instructor_bio),''),'패션 유통·글로벌 OEM/ODM·온라인 커머스 현장을 거쳐 직접 사업을 운영해 온 저자이자 사업가입니다. 플랫폼의 표면적인 기능보다 시장 구조, 판매자와 플랫폼의 이해관계, 고객 행동을 연결해 설명합니다.'),
  target_audience='스마트스토어를 운영하고 있지만 왜 검색 순위가 오르고 떨어지는지 감이 잘 잡히지 않는 분
열심히 상품을 등록해도 왜 매출이 기대만큼 나오지 않는지 구조적인 이유를 알고 싶은 분
네이버 쇼핑 검색 알고리즘이 실제 셀러에게 어떤 영향을 주는지 쉽게 이해하고 싶은 분
지금 팔리는 방식이 왜 예전과 달라졌는지, 앞으로 어떤 방식으로 준비해야 하는지 방향을 잡고 싶은 분
단순한 팁보다 시장의 흐름, 플랫폼의 변화, 검색 구조를 함께 이해하고 싶은 분',
  learning_outcomes='오프라인 입지 경쟁에서 포털 검색과 스마트스토어로 유통의 출발점이 이동한 과정을 설명할 수 있습니다.
네이버·오픈마켓·쿠팡 등 플랫폼 경쟁과 각 주체의 이해관계가 검색 구조에 미친 영향을 읽을 수 있습니다.
검색의 적합도·인기도 신호와 슬롯·가짜 트래픽 같은 단기 꼼수가 오래 지속되기 어려운 이유를 이해합니다.
검색·콘텐츠·브랜드를 연결해 고객 유입이 반복되는 인포먼스 마케팅의 선순환 구조를 설계할 수 있습니다.
발견형 쇼핑과 AI 커머스로 이동하는 시장에서 검색과 브랜드가 어떤 역할을 해야 하는지 방향을 세울 수 있습니다.',
  status='draft',
  visible=0,
  sales_enabled=0,
  sales_state='preparing',
  updated_at=CURRENT_TIMESTAMP
WHERE id='paid-naver-search-algorithm';

UPDATE courses
SET
  title='네이버 쇼핑 키워드 전략',
  summary='검색량이 높고 경쟁이 낮은 이른바 황금 키워드를 찾는 공식에서 벗어나, 고객의 검색 의도와 언어 구조를 기준으로 키워드를 설계하는 강의입니다. 네이버 쇼핑의 상품명·카테고리·태그·브랜드·상품 주요 정보가 어떻게 검색에 연결되는지 이해하고 실제 검색 결과를 역으로 검증하는 방법을 다룹니다. 나아가 기존 검색량을 뒤쫓는 데서 끝나지 않고 상품을 정의하고 새로운 이름과 브랜드 키워드를 만들어 검색·소셜·AI 환경에서 오래 남는 언어 자산으로 확장하는 전략을 배웁니다.',
  instructor_name=COALESCE(NULLIF(TRIM(instructor_name),''),'맥작가'),
  instructor_bio=COALESCE(NULLIF(TRIM(instructor_bio),''),'패션 유통·글로벌 OEM/ODM·온라인 커머스 현장을 거쳐 직접 사업을 운영해 온 저자이자 사업가입니다. 검색량 숫자나 단기 노출 공식을 넘어 고객 언어, 검색 구조, 브랜드 자산을 함께 설계하는 관점으로 설명합니다.'),
  target_audience='스마트스토어 상품명을 어떻게 지어야 할지 매번 고민되는 분
키워드를 열심히 찾고 적용했는데도 기대한 성과가 나오지 않는 분
롱테일 키워드·카테고리·태그·키워드 사전을 제대로 이해하고 싶은 분
네이버 쇼핑이 상품 정보를 어떤 기준으로 읽고 검색에 반영하는지 알고 싶은 분
단순히 키워드를 나열하는 방식에서 벗어나 검색 의도에 맞는 키워드를 설계하고 싶은 분
상품명과 태그를 실제 검색 결과로 검증하는 실무 흐름을 익히고 싶은 분
내 상품만의 차별화된 이름과 브랜드 키워드를 만들고 싶은 분
검색·콘텐츠·브랜드·AI까지 연결되는 장기적인 키워드 전략을 배우고 싶은 분',
  learning_outcomes='검색량과 경쟁강도만 보는 키워드 공식의 한계를 설명하고 고객의 검색 의도와 맥락을 기준으로 키워드를 판단할 수 있습니다.
네이버 쇼핑의 등록·인덱싱·랭킹 구조와 상품명·카테고리·태그·브랜드 등 주요 검색 입력 항목을 이해합니다.
롱테일·헤드 키워드, 키워드 사전, 형태소, 복합어와 카테고리의 관계를 상품 등록 실무에 적용할 수 있습니다.
상품명과 태그가 실제 검색에 반영되는지 직접 검증하고 경쟁 상품의 검색 노출 구조를 역으로 분석할 수 있습니다.
상품의 문제·기능·상황·대상·감각을 정의한 뒤 쉬운 말, 압축, 비유, 줄임말을 활용해 기억되는 이름을 설계할 수 있습니다.
브랜드 키워드를 검색 최적화에만 머물지 않고 소셜 확산과 AI 추천에 활용되는 언어 자산으로 확장할 수 있습니다.',
  status='draft',
  visible=0,
  sales_enabled=0,
  sales_state='preparing',
  updated_at=CURRENT_TIMESTAMP
WHERE id='paid-naver-keyword-strategy';

INSERT OR IGNORE INTO course_modules (id,course_id,title,sort_order,status)
VALUES
  ('paid-naver-search-main','paid-naver-search-algorithm','1강. 온라인 유통산업의 역사와 네이버 쇼핑 검색 알고리즘',0,'published'),
  ('paid-naver-search-supplement','paid-naver-search-algorithm','1강 보충 강의 (기술)',1,'published'),
  ('paid-naver-keyword-main','paid-naver-keyword-strategy','2강. 네이버 쇼핑 키워드 전략',0,'published');

UPDATE course_modules SET title='1강. 온라인 유통산업의 역사와 네이버 쇼핑 검색 알고리즘',sort_order=0,status='published',updated_at=CURRENT_TIMESTAMP WHERE id='paid-naver-search-main';
UPDATE course_modules SET title='1강 보충 강의 (기술)',sort_order=1,status='published',updated_at=CURRENT_TIMESTAMP WHERE id='paid-naver-search-supplement';
UPDATE course_modules SET title='2강. 네이버 쇼핑 키워드 전략',sort_order=0,status='published',updated_at=CURRENT_TIMESTAMP WHERE id='paid-naver-keyword-main';

-- First paid course: 8 main videos + 2 technical supplements.
UPDATE lessons SET title='대형마트 시대: 유통의 출발점은 입지였다',description='오프라인 유통에서 입지가 왜 핵심 경쟁력이었는지 살펴보고, 온라인 시대에도 유통의 기본 원리가 어떻게 이어지는지 이해합니다.',module_id='paid-naver-search-main',sort_order=0,is_preview=1,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-01';
UPDATE lessons SET title='1세대 쇼핑몰: 쇼핑의 시작점이 온라인으로 이동하다',description='초기 인터넷 쇼핑몰과 포털 검색의 성장 과정을 통해 고객이 상품을 찾는 출발점이 오프라인에서 온라인으로 이동한 흐름을 정리합니다.',module_id='paid-naver-search-main',sort_order=1,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-02';
UPDATE lessons SET title='모바일 쇼핑 시대: 플랫폼 전쟁과 네이버의 입구 장악',description='모바일 전환과 오픈마켓·네이버·쿠팡의 경쟁을 살펴보며 네이버가 쇼핑의 입구를 확보한 과정과 플랫폼 간 이해관계를 읽습니다.',module_id='paid-naver-search-main',sort_order=2,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-03';
UPDATE lessons SET title='검색 알고리즘: 적합도·인기도와 네이버 쇼핑 구조',description='검색 순위가 단순 키워드 일치만으로 정해지지 않는 이유를 적합도·인기도·고객 반응의 관점에서 이해합니다.',module_id='paid-naver-search-main',sort_order=3,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-04';

INSERT OR IGNORE INTO lessons (id,course_id,title,description,module_id,sort_order,status,is_preview) VALUES
  ('naver-search-algorithm-05','paid-naver-search-algorithm','성공 신화의 몰락: 슬롯·가짜 트래픽과 시장 과열','단기 상위노출 성공담이 왜 시장 구조와 알고리즘 변화 앞에서 무너졌는지 살펴보고 가짜 트래픽과 편법의 한계를 이해합니다.','paid-naver-search-main',4,'draft',0),
  ('naver-search-algorithm-06','paid-naver-search-algorithm','인포먼스 마케팅: 검색과 콘텐츠를 연결하는 선순환','퍼포먼스 마케팅과 인바운드·콘텐츠 마케팅을 결합해 검색 유입과 브랜드 검색이 반복되는 선순환 구조를 설명합니다.','paid-naver-search-main',5,'draft',0),
  ('naver-search-algorithm-07','paid-naver-search-algorithm','황금 키워드 찾기: 검색 구조를 읽는 법','검색량 숫자보다 고객 의도와 경쟁 구조를 읽고 실제로 기회가 생기는 키워드를 판단하는 관점을 정리합니다.','paid-naver-search-main',6,'draft',0),
  ('naver-search-algorithm-08','paid-naver-search-algorithm','브랜드 만들기: 검색되는 이름을 만드는 전략','기억하기 쉬운 이름과 브랜드 키워드가 검색·콘텐츠·재구매의 선순환을 만드는 과정을 이해합니다.','paid-naver-search-main',7,'draft',0),
  ('naver-search-algorithm-09','paid-naver-search-algorithm','보충: 검색 알고리즘 모델 분석','검색 알고리즘을 정보검색 모델과 고객 반응 신호의 관점에서 조금 더 기술적으로 보충합니다.','paid-naver-search-supplement',8,'draft',0),
  ('naver-search-algorithm-10','paid-naver-search-algorithm','보충: 키워드 발굴 방법','실제 셀러가 검색 결과와 시장 데이터를 관찰하며 키워드 후보를 발굴하고 검증하는 방법을 보충합니다.','paid-naver-search-supplement',9,'draft',0);

UPDATE lessons SET title='성공 신화의 몰락: 슬롯·가짜 트래픽과 시장 과열',description='단기 상위노출 성공담이 왜 시장 구조와 알고리즘 변화 앞에서 무너졌는지 살펴보고 가짜 트래픽과 편법의 한계를 이해합니다.',module_id='paid-naver-search-main',sort_order=4,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-05';
UPDATE lessons SET title='인포먼스 마케팅: 검색과 콘텐츠를 연결하는 선순환',description='퍼포먼스 마케팅과 인바운드·콘텐츠 마케팅을 결합해 검색 유입과 브랜드 검색이 반복되는 선순환 구조를 설명합니다.',module_id='paid-naver-search-main',sort_order=5,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-06';
UPDATE lessons SET title='황금 키워드 찾기: 검색 구조를 읽는 법',description='검색량 숫자보다 고객 의도와 경쟁 구조를 읽고 실제로 기회가 생기는 키워드를 판단하는 관점을 정리합니다.',module_id='paid-naver-search-main',sort_order=6,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-07';
UPDATE lessons SET title='브랜드 만들기: 검색되는 이름을 만드는 전략',description='기억하기 쉬운 이름과 브랜드 키워드가 검색·콘텐츠·재구매의 선순환을 만드는 과정을 이해합니다.',module_id='paid-naver-search-main',sort_order=7,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-08';
UPDATE lessons SET title='보충: 검색 알고리즘 모델 분석',description='검색 알고리즘을 정보검색 모델과 고객 반응 신호의 관점에서 조금 더 기술적으로 보충합니다.',module_id='paid-naver-search-supplement',sort_order=8,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-09';
UPDATE lessons SET title='보충: 키워드 발굴 방법',description='실제 셀러가 검색 결과와 시장 데이터를 관찰하며 키워드 후보를 발굴하고 검증하는 방법을 보충합니다.',module_id='paid-naver-search-supplement',sort_order=9,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-search-algorithm-10';

-- Second paid course: 13 sequential videos matching the LiveKlass/Vimeo edit.
UPDATE lessons SET title='키워드를 보는 관점과 황금 키워드의 함정',description='검색량과 경쟁강도만 좇는 정석의 한계를 짚고 고객의 검색 맥락을 보는 관점을 세웁니다.',module_id='paid-naver-keyword-main',sort_order=0,is_preview=1,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-01';
UPDATE lessons SET title='검색 의도와 검색엔진의 작동 원리',description='검색어 뒤의 목적과 욕구, 등록·인덱싱·랭킹으로 이어지는 검색엔진의 기본 작동 구조를 이해합니다.',module_id='paid-naver-keyword-main',sort_order=1,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-02';
UPDATE lessons SET title='네이버 쇼핑 구조와 공식 검색 입력 항목',description='네이버 쇼핑을 쇼핑 어그리게이터로 이해하고 상품명·카테고리·태그 등 공식 입력 항목이 검색에 연결되는 구조를 살펴봅니다.',module_id='paid-naver-keyword-main',sort_order=2,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-03';
UPDATE lessons SET title='롱테일·키워드 사전·카테고리 전략',description='헤드와 롱테일의 관계, 키워드 사전과 형태소, 카테고리 선택이 검색 적합도에 미치는 영향을 연결해 이해합니다.',module_id='paid-naver-keyword-main',sort_order=3,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-04';
UPDATE lessons SET title='복합어와 황금 키워드의 실체',description='붙여 쓰는 복합어와 분리되는 키워드의 차이를 이해하고 카테고리 오매칭에서 생기는 예외적 기회를 판단합니다.',module_id='paid-naver-keyword-main',sort_order=4,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-05';

INSERT OR IGNORE INTO lessons (id,course_id,title,description,module_id,sort_order,status,is_preview) VALUES
  ('naver-keyword-strategy-06','paid-naver-keyword-strategy','상품명·태그·브랜드·EP 실무','상품명과 태그의 서로 다른 키워드 사전, 브랜드 정보와 상품 주요 정보를 활용해 검색 노출 조건을 설계합니다.','paid-naver-keyword-main',5,'draft',0),
  ('naver-keyword-strategy-07','paid-naver-keyword-strategy','검색 노출 검증과 경쟁 상품 역분석','내 상품의 검색 반영 여부를 직접 확인하고 경쟁 상품이 어떤 입력 항목을 활용했는지 역으로 조사하는 실무 흐름을 익힙니다.','paid-naver-keyword-main',6,'draft',0),
  ('naver-keyword-strategy-08','paid-naver-keyword-strategy','키워드보다 이름: 상품 정의와 조어의 출발점','상품의 문제·기능·상황·대상·감각·인상을 먼저 정의하고 이름과 콘텐츠·광고의 기준을 일치시키는 방법을 배웁니다.','paid-naver-keyword-main',7,'draft',0),
  ('naver-keyword-strategy-09','paid-naver-keyword-strategy','판매자 언어를 고객 언어로 바꾸는 법','전문적이고 긴 표현을 고객이 듣는 순간 이해하고 기억할 수 있는 생활 언어로 바꾸는 조어 전략을 다룹니다.','paid-naver-keyword-main',8,'draft',0),
  ('naver-keyword-strategy-10','paid-naver-keyword-strategy','압축형 조어: 여러 가치를 한 이름에 담기','두 가지 이상의 기능·상황·결과를 짧은 이름으로 압축하면서 의미와 발음의 자연스러움을 유지하는 방법을 익힙니다.','paid-naver-keyword-main',9,'draft',0),
  ('naver-keyword-strategy-11','paid-naver-keyword-strategy','비유와 은유: 장면과 감각으로 기억시키기','이중 부호화와 신체화된 인지 관점에서 기능을 강철·구름·이슬 같은 이미지와 감각으로 바꾸어 기억시키는 방법을 살펴봅니다.','paid-naver-keyword-main',10,'draft',0),
  ('naver-keyword-strategy-12','paid-naver-keyword-strategy','줄임말·혼성어와 좋은 이름의 조건','짧지만 뜻을 짐작할 수 있고 발음하기 쉽고 기억·전파되기 쉬운 이름을 만드는 원리를 정리합니다.','paid-naver-keyword-main',11,'draft',0),
  ('naver-keyword-strategy-13','paid-naver-keyword-strategy','검색·소셜·AI로 확장되는 브랜드 키워드','조어와 브랜드 키워드를 검색 최적화에서 소셜 확산, 팬덤, AI 추천과 AEO·GEO로 확장하는 장기 전략을 정리합니다.','paid-naver-keyword-main',12,'draft',0);

UPDATE lessons SET title='상품명·태그·브랜드·EP 실무',description='상품명과 태그의 서로 다른 키워드 사전, 브랜드 정보와 상품 주요 정보를 활용해 검색 노출 조건을 설계합니다.',module_id='paid-naver-keyword-main',sort_order=5,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-06';
UPDATE lessons SET title='검색 노출 검증과 경쟁 상품 역분석',description='내 상품의 검색 반영 여부를 직접 확인하고 경쟁 상품이 어떤 입력 항목을 활용했는지 역으로 조사하는 실무 흐름을 익힙니다.',module_id='paid-naver-keyword-main',sort_order=6,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-07';
UPDATE lessons SET title='키워드보다 이름: 상품 정의와 조어의 출발점',description='상품의 문제·기능·상황·대상·감각·인상을 먼저 정의하고 이름과 콘텐츠·광고의 기준을 일치시키는 방법을 배웁니다.',module_id='paid-naver-keyword-main',sort_order=7,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-08';
UPDATE lessons SET title='판매자 언어를 고객 언어로 바꾸는 법',description='전문적이고 긴 표현을 고객이 듣는 순간 이해하고 기억할 수 있는 생활 언어로 바꾸는 조어 전략을 다룹니다.',module_id='paid-naver-keyword-main',sort_order=8,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-09';
UPDATE lessons SET title='압축형 조어: 여러 가치를 한 이름에 담기',description='두 가지 이상의 기능·상황·결과를 짧은 이름으로 압축하면서 의미와 발음의 자연스러움을 유지하는 방법을 익힙니다.',module_id='paid-naver-keyword-main',sort_order=9,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-10';
UPDATE lessons SET title='비유와 은유: 장면과 감각으로 기억시키기',description='이중 부호화와 신체화된 인지 관점에서 기능을 강철·구름·이슬 같은 이미지와 감각으로 바꾸어 기억시키는 방법을 살펴봅니다.',module_id='paid-naver-keyword-main',sort_order=10,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-11';
UPDATE lessons SET title='줄임말·혼성어와 좋은 이름의 조건',description='짧지만 뜻을 짐작할 수 있고 발음하기 쉽고 기억·전파되기 쉬운 이름을 만드는 원리를 정리합니다.',module_id='paid-naver-keyword-main',sort_order=11,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-12';
UPDATE lessons SET title='검색·소셜·AI로 확장되는 브랜드 키워드',description='조어와 브랜드 키워드를 검색 최적화에서 소셜 확산, 팬덤, AI 추천과 AEO·GEO로 확장하는 장기 전략을 정리합니다.',module_id='paid-naver-keyword-main',sort_order=12,is_preview=0,status='draft',updated_at=CURRENT_TIMESTAMP WHERE id='naver-keyword-strategy-13';

INSERT OR IGNORE INTO system_operations (id,operation_type,status,payload_json)
VALUES (
  '2026-09-26-sync-real-paid-course-vimeo-and-catalog',
  'sync_real_paid_course_vimeo_and_catalog',
  'pending',
  '{"course_ids":["paid-naver-search-algorithm","paid-naver-keyword-strategy"],"expected_lessons":{"paid-naver-search-algorithm":10,"paid-naver-keyword-strategy":13}}'
);

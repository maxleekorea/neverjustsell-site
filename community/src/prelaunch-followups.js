const FOLLOWUPS = [
  { slug: "what-to-check-first-when-sales-stop", author: "njs-research", body: "기간 비교도 중요합니다. 어제와 오늘만 비교하면 요일·시즌 효과에 흔들릴 수 있으니 최근 7일과 이전 7일, 전년 동기처럼 기준을 나눠 보면 병목을 더 정확히 찾을 수 있습니다." },
  { slug: "what-to-check-first-when-sales-stop", author: "njs-editorial", body: "매출 자체보다 ‘어디서부터 숫자가 꺾였는지’를 찾는 습관이 먼저입니다. 노출은 그대로인데 전환만 떨어졌다면 광고를 늘리는 대응은 오히려 문제를 가릴 수 있습니다." },

  { slug: "metric-before-ranking", author: "njs-research", body: "검색어별 전환을 볼 때 표본이 너무 작은 키워드는 단정하지 않는 것도 중요합니다. 클릭 수가 쌓인 검색어부터 우선 판단하고 작은 키워드는 묶음으로 보는 편이 안전합니다." },
  { slug: "metric-before-ranking", author: "njs-editorial", body: "순위가 내려갔는데 매출은 유지되는 경우도 있습니다. 이런 상품은 브랜드 검색이나 재구매가 늘었을 수 있으니 검색 순위 하나만 KPI로 두지 않는 게 좋습니다." },

  { slug: "too-many-keywords-in-product-name", author: "njs-research", body: "상품명이 길어질수록 모바일 검색 결과에서 중요한 단어가 잘릴 수 있습니다. 고객이 첫눈에 상품 정체성을 이해할 수 있는지도 함께 확인해야 합니다." },
  { slug: "too-many-keywords-in-product-name", author: "njs-editorial", body: "같은 뜻의 유사어를 반복해 넣기보다 카테고리·속성·태그에 역할을 나누는 편이 정보 구조가 더 선명합니다." },

  { slug: "avoid-competitive-keywords", author: "njs-research", body: "경쟁이 센 키워드도 상위 퍼널을 만드는 역할이 있습니다. 직접 전환뿐 아니라 어떤 검색어가 이후 브랜드 검색이나 재방문으로 이어지는지도 보면 판단이 달라질 수 있습니다." },
  { slug: "avoid-competitive-keywords", author: "njs-editorial", body: "핵심 키워드를 버리는 것과 롱테일을 확장하는 것은 다른 선택입니다. 큰 수요를 이해한 상태에서 세부 수요를 분해하는 것이 좋습니다." },

  { slug: "sales-stop-when-ads-stop", author: "njs-research", body: "광고 의존도를 볼 때 신규 고객 매출과 기존 고객 매출을 분리하면 구조가 더 잘 보입니다. 광고를 끊자 신규 유입만 줄었는지 재구매까지 같이 꺼지는지 확인해 보세요." },
  { slug: "sales-stop-when-ads-stop", author: "njs-editorial", body: "광고는 나쁜 것이 아니라 ‘광고만 남는 상태’가 위험한 것입니다. 광고로 들어온 고객이 검색·구독·재구매 같은 다른 접점으로 넘어가야 합니다." },

  { slug: "consignment-first-validation", author: "njs-research", body: "위탁은 품절과 가격 변경을 판매자가 통제하기 어려운 경우가 많습니다. 주문이 늘기 시작했을 때 공급처의 재고 갱신 주기와 대응 속도가 실제 운영 리스크가 됩니다." },
  { slug: "consignment-first-validation", author: "njs-editorial", body: "초기에는 위탁으로 시장성을 확인하고 반복 판매가 확인되면 사입이나 독점 조건으로 전환하는 식의 단계 전략도 생각할 수 있습니다." },

  { slug: "trust-for-new-product-with-few-reviews", author: "njs-research", body: "리뷰가 없을수록 비교표와 구체적인 사용 조건이 효과적입니다. ‘좋다’는 주장보다 어떤 상황에서 적합하고 어떤 경우에는 적합하지 않은지 설명하는 정보가 불안을 줄입니다." },
  { slug: "trust-for-new-product-with-few-reviews", author: "njs-editorial", body: "새 상품은 판매자 자체의 신뢰를 빌려오는 것도 중요합니다. 교환·반품 기준과 문의 응답 방식처럼 거래 리스크를 낮추는 정보도 구매 결정에 영향을 줍니다." },

  { slug: "naver-vs-coupang-operation", author: "njs-research", body: "같은 상품이라도 네이버에서는 검색어와 콘텐츠 접점이 중요하고 쿠팡에서는 가격·배송·후기 비교가 더 강하게 작동할 수 있습니다. 실제 유입 경로 데이터를 따로 보는 것이 좋습니다." },
  { slug: "naver-vs-coupang-operation", author: "njs-editorial", body: "플랫폼마다 고객이 기대하는 편의성이 다르기 때문에 가격만 통일한다고 일관된 고객 경험이 되는 것은 아닙니다." },

  { slug: "platform-rule-change-response", author: "njs-research", body: "정책 변경은 공지일만 기록하지 말고 실제 노출·전환 변화가 시작된 날짜도 함께 남겨두면 다음 변경 때 대응 속도가 빨라집니다." },
  { slug: "platform-rule-change-response", author: "njs-editorial", body: "특정 기술 하나가 막히면 매출이 멈추는 구조라면 그 기술의 효율보다 사업의 취약성이 더 큰 문제일 수 있습니다." },

  { slug: "why-no-repeat-purchase", author: "njs-research", body: "재구매 주기가 긴 상품은 같은 상품의 재구매 대신 연관 상품 구매나 추천 행동을 봐야 할 수도 있습니다. 카테고리 특성에 맞는 반복 지표를 정하는 것이 먼저입니다." },
  { slug: "why-no-repeat-purchase", author: "njs-editorial", body: "첫 구매 후 아무 접점도 없다면 만족한 고객도 다시 찾기 어렵습니다. 필요한 시점에 기억을 되살릴 장치가 있는지 확인해 보세요." },

  { slug: "price-cut-without-sales-growth", author: "njs-research", body: "가격을 내린 뒤 클릭률은 올랐지만 구매율이 그대로라면 가격이 핵심 장벽이 아니었다는 신호일 수 있습니다. 이때는 상세정보와 신뢰 요소를 다시 봐야 합니다." },
  { slug: "price-cut-without-sales-growth", author: "njs-editorial", body: "할인으로도 안 팔리는 상품을 더 할인하는 것은 문제를 해결하기보다 마진만 줄일 수 있습니다. 구매 거부 이유를 먼저 찾는 편이 낫습니다." },

  { slug: "more-impressions-no-purchases", author: "njs-research", body: "노출 증가가 어떤 검색어에서 발생했는지 분해하지 않으면 좋은 성장처럼 보일 수 있습니다. 관련성이 낮은 질의에서의 노출은 품질이 낮은 트래픽일 가능성이 큽니다." },
  { slug: "more-impressions-no-purchases", author: "njs-editorial", body: "검색 결과의 상품명·썸네일이 약속한 내용과 상세페이지 첫 화면이 다르면 클릭은 생겨도 구매가 끊깁니다." },

  { slug: "good-roas-no-profit", author: "njs-research", body: "반품률이 높은 상품은 광고 성과가 특히 왜곡되기 쉽습니다. 결제 기준 ROAS와 실제 정산 후 이익을 분리해서 보는 것이 좋습니다." },
  { slug: "good-roas-no-profit", author: "njs-editorial", body: "매출을 키우는 광고와 이익을 키우는 광고는 같지 않습니다. 손익분기 ROAS를 상품별로 따로 계산해 두면 판단이 빨라집니다." },

  { slug: "why-one-product-keeps-selling", author: "njs-research", body: "오래 팔리는 상품은 검색 수요의 변동폭이 작고 리뷰가 지속적으로 추가되는 경우가 많습니다. 신규 상품보다 ‘왜 이 상품은 안 죽는가’를 분석하는 것이 좋은 학습 자료가 됩니다." },
  { slug: "why-one-product-keeps-selling", author: "njs-editorial", body: "장기 판매 상품의 공통점을 찾으면 다음 소싱 기준도 바뀝니다. 순간 유행보다 반복되는 문제와 안정적인 공급 조건을 더 중요하게 보게 됩니다." },

  { slug: "change-product-definition-before-detail-page", author: "njs-research", body: "상품 정의를 바꾸면 키워드와 썸네일, 상세페이지 구조까지 함께 달라져야 합니다. 한 부분만 고치면 고객에게 전달되는 메시지가 다시 엇갈릴 수 있습니다." },
  { slug: "change-product-definition-before-detail-page", author: "njs-editorial", body: "‘누구나 쓰는 상품’이라는 정의는 실제로는 누구에게도 강한 이유를 주지 못할 가능성이 큽니다. 첫 타깃을 좁히는 것이 오히려 확장에 도움이 될 수 있습니다." },

  { slug: "long-tail-for-small-seller", author: "njs-research", body: "롱테일은 검색량이 작은 단어를 무작정 모으는 방식이 아닙니다. 비슷한 구매 의도를 가진 표현을 군집으로 보고 어떤 상품 정의와 연결되는지 확인해야 합니다." },
  { slug: "long-tail-for-small-seller", author: "njs-editorial", body: "작은 키워드에서 얻은 전환 데이터를 큰 키워드 전략에 다시 활용할 수 있습니다. 탐색과 활용을 연결하는 방식입니다." },

  { slug: "more-products-no-more-sales", author: "njs-research", body: "SKU가 늘면서 각 상품의 광고비와 리뷰가 분산되는지도 봐야 합니다. 비슷한 상품이 많아지면 데이터가 한 상품에 쌓이지 않는 문제가 생길 수 있습니다." },
  { slug: "more-products-no-more-sales", author: "njs-editorial", body: "상품 수를 늘릴 때는 ‘새로운 수요를 추가하는가’를 기준으로 보면 좋습니다. 단순 색상·옵션 차이라면 별도 상품으로 쪼갤 이유가 약할 수 있습니다." },

  { slug: "reward-traffic-before-use", author: "njs-research", body: "트래픽의 출처와 행동 패턴이 실제 고객과 얼마나 다른지 확인해야 합니다. 짧은 체류와 반복 패턴이 쌓이면 플랫폼 입장에서는 품질 신호로 보기 어렵습니다." },
  { slug: "reward-traffic-before-use", author: "njs-editorial", body: "중단했을 때 남는 것이 없다면 그것은 자산이라기보다 비용에 가깝습니다. 고객 데이터나 콘텐츠, 브랜드 검색이 남는지 비교해 보세요." },

  { slug: "three-checks-after-reading-never-just-sell", author: "njs-research", body: "세 문장을 적은 뒤 서로 연결되는지 확인하면 좋습니다. 고객 문제와 발견 경로가 다르거나 구매 후 재방문 이유가 없다면 그 지점이 다음 실험 과제가 됩니다." },
  { slug: "three-checks-after-reading-never-just-sell", author: "njs-editorial", body: "정답을 길게 쓰기보다 한 문장으로 못 줄이는 부분을 찾는 것이 목적입니다. 설명이 길어지는 곳이 아직 정리되지 않은 문제일 가능성이 큽니다." },

  { slug: "make-search-a-work-routine", author: "njs-research", body: "검색 기록에는 키워드뿐 아니라 날짜와 검색 결과 유형도 함께 남겨두세요. 같은 단어라도 시간이 지나며 쇼핑·블로그·영상 비중이 바뀔 수 있습니다." },
  { slug: "make-search-a-work-routine", author: "njs-editorial", body: "검색을 습관화하면 시장조사가 별도 프로젝트가 아니라 일상 운영 데이터가 됩니다. 작은 변화가 반복해서 보일 때 기회를 더 빨리 포착할 수 있습니다." },

  { slug: "exploration-exploitation-in-business", author: "njs-research", body: "탐색 실험은 성공률보다 학습 속도를 기준으로 관리하면 좋습니다. 한 번에 큰 비용을 쓰기보다 작은 실험 여러 개로 불확실성을 줄이는 방식이 효율적입니다." },
  { slug: "exploration-exploitation-in-business", author: "njs-editorial", body: "기존 매출이 좋을수록 탐색을 멈추기 쉽습니다. 반대로 성과가 없다고 계속 새것만 찾으면 활용이 쌓이지 않습니다. 두 활동을 일정에 따로 넣는 것이 도움이 됩니다." },

  { slug: "record-customer-behavior-before-ad-spend", author: "njs-research", body: "문의 내용은 특히 좋은 데이터입니다. 고객이 구매 전에 반복해서 묻는 질문은 상세페이지나 콘텐츠가 아직 답하지 못한 정보일 가능성이 큽니다." },
  { slug: "record-customer-behavior-before-ad-spend", author: "njs-editorial", body: "광고 예산을 늘리기 전에 전환이 막히는 지점을 기록하면 같은 돈으로 더 큰 개선을 만들 수 있습니다. 유입보다 전환 병목이 문제인 경우가 많습니다." },

  { slug: "what-authenticity-means-in-branding", author: "njs-research", body: "브랜드가 말하는 가치와 실제 CS·환불·배송 경험이 다르면 감성적인 메시지는 오히려 역효과가 날 수 있습니다. 진정성은 접점 간 일관성으로 검증됩니다." },
  { slug: "what-authenticity-means-in-branding", author: "njs-editorial", body: "고객은 브랜드의 의도를 직접 확인할 수 없기 때문에 반복되는 행동을 보고 판단합니다. 결국 약속을 지키는 운영이 가장 강한 신뢰 신호가 됩니다." },

  { slug: "brand-vs-search-optimization", author: "njs-research", body: "검색 유입이 브랜드 검색으로 전환되는지 보면 두 전략이 연결되는 정도를 확인할 수 있습니다. 같은 상품을 다시 찾을 때 일반 키워드 대신 이름을 검색하기 시작하면 자산이 쌓이는 신호입니다." },
  { slug: "brand-vs-search-optimization", author: "njs-editorial", body: "검색 최적화로 발견되고 브랜드로 기억되는 구조가 이상적입니다. 둘 중 하나를 포기할 필요는 없습니다." },

  { slug: "limits-of-performance-marketing-only", author: "njs-research", body: "CAC가 오르는 시점에 재구매율과 자연유입 비중이 함께 올라가고 있다면 광고비 상승을 일부 흡수할 수 있습니다. 그렇지 않다면 성장할수록 수익성이 악화될 수 있습니다." },
  { slug: "limits-of-performance-marketing-only", author: "njs-editorial", body: "광고는 고객을 처음 만나는 비용으로 보고, 두 번째 만남부터는 콘텐츠·CRM·브랜드가 역할을 이어받는 구조를 만드는 것이 좋습니다." },

  { slug: "product-information-in-ai-search-era", author: "njs-research", body: "AI가 읽기 쉬운 정보는 사람에게도 대체로 읽기 쉽습니다. 명확한 정의, 구체적인 속성, 질문형 FAQ, 근거 출처를 분리해 주는 것이 기본입니다." },
  { slug: "product-information-in-ai-search-era", author: "njs-editorial", body: "키워드를 반복하기보다 ‘이 상품은 무엇이고 누구에게 왜 필요한가’를 한 번에 설명할 수 있어야 합니다. 그 문장이 상품 정보 구조의 기준점이 됩니다." }
];

async function ensureFollowup(db, item) {
  const post = await db.prepare("SELECT id FROM posts WHERE slug=? LIMIT 1").bind(item.slug).first();
  if (!post?.id) return false;
  const existing = await db.prepare(
    "SELECT id FROM comments WHERE post_id=? AND author_member_id=? AND body=? LIMIT 1"
  ).bind(post.id, item.author, item.body).first();
  if (existing?.id) return false;

  await db.prepare(
    `INSERT INTO comments(post_id,author_member_id,parent_id,body,status)
     VALUES(?,?,NULL,?,'published')`
  ).bind(post.id, item.author, item.body).run();
  await db.prepare(
    "UPDATE posts SET comment_count=(SELECT COUNT(*) FROM comments WHERE post_id=? AND status='published'), updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(post.id, post.id).run();
  return true;
}

export async function ensurePrelaunchFollowups(env) {
  if (!env?.DB) return { ok: false, skipped: true, reason: "db_missing" };
  let created = 0;
  for (const item of FOLLOWUPS) {
    if (await ensureFollowup(env.DB, item)) created += 1;
  }

  const counts = await env.DB.prepare(
    `SELECT
       COUNT(*) AS meaningful_replies,
       SUM(CASE WHEN author_member_id IN ('njs-editorial','njs-research') THEN 1 ELSE 0 END) AS seeded_followups
     FROM comments
     WHERE status='published'
       AND author_member_id IN ('njs-guide','njs-editorial','njs-research')`
  ).first();

  return {
    ok: Number(counts?.meaningful_replies || 0) >= 80,
    version: "2026-09-26-prelaunch-discussion-depth-v2",
    created_followups: created,
    seeded_followups: Number(counts?.seeded_followups || 0),
    meaningful_replies: Number(counts?.meaningful_replies || 0),
    target: 80
  };
}

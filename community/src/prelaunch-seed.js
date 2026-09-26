const EDITORIAL_MEMBERS = [
  { member_id: "njs-editorial", public_id: "njs-editorial", display_name: "NEVER JUST SELL", role: "admin" },
  { member_id: "njs-guide", public_id: "njs-guide", display_name: "NJS 가이드", role: "moderator" },
  { member_id: "njs-research", public_id: "njs-research", display_name: "NJS 리서치", role: "moderator" }
];

const POSTS = [
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "what-to-check-first-when-sales-stop",
    title: "스마트스토어 매출이 안 나올 때 무엇부터 봐야 할까?",
    body: "매출이 떨어지면 광고비나 키워드부터 손대기 쉽습니다. 하지만 노출, 클릭, 상세페이지 체류, 구매전환, 재구매 가운데 어디가 무너졌는지 먼저 나눠서 봐야 합니다. 같은 매출 하락이라도 원인은 완전히 다를 수 있습니다. 지금 운영 중인 상품이라면 무엇을 가장 먼저 확인하는지 함께 정리해 봅니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "metric-before-ranking",
    title: "상위노출보다 먼저 확인해야 할 지표는 무엇일까?",
    body: "검색 순위가 올라가도 매출이 늘지 않는 상품이 있습니다. 노출 자체보다 검색어와 상품의 적합도, 클릭 후 이탈, 가격 비교, 리뷰 신뢰, 배송 조건 같은 구매 전 단계가 더 큰 병목일 수 있습니다. 순위만 보고 있는지, 실제 구매 여정을 보고 있는지 점검해 볼 질문입니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "too-many-keywords-in-product-name",
    title: "상품명에 키워드를 많이 넣으면 정말 유리할까?",
    body: "상품명에 검색어를 많이 넣는 것이 안전한 전략처럼 보이지만 검색 의도가 흐려지고 상품 정의도 모호해질 수 있습니다. 플랫폼 규칙, 카테고리 적합성, 실제 검색어 조합을 함께 봐야 합니다. 키워드 수보다 어떤 고객에게 어떤 상품으로 인식되는지가 먼저입니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "avoid-competitive-keywords",
    title: "경쟁이 센 키워드를 피하는 게 항상 맞을까?",
    body: "경쟁 강도가 높은 키워드라고 무조건 피하면 실제 수요가 큰 시장까지 포기할 수 있습니다. 반대로 검색량만 보고 뛰어들면 광고비와 가격 경쟁에 갇힐 수 있습니다. 큰 수요를 활용하면서도 구체적인 구매 의도를 잡는 롱테일 조합을 어떻게 설계할지 생각해 봅니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "sales-stop-when-ads-stop",
    title: "광고를 끄면 매출도 같이 꺼지는 구조는 왜 생길까?",
    body: "광고가 매출을 만드는 것은 자연스럽지만 광고를 멈추는 순간 모든 유입이 사라진다면 다른 접점이 쌓이지 않았다는 뜻일 수 있습니다. 검색 자연유입, 재구매, 콘텐츠, 브랜드 검색, 외부 추천이 어느 정도 만들어졌는지 확인해야 합니다. 광고 효율과 사업의 자생력은 같은 지표가 아닙니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "consignment-first-validation",
    title: "위탁판매에서 가장 먼저 검증해야 할 것은 무엇일까?",
    body: "재고 부담이 적다는 이유만으로 위탁판매를 선택하면 공급 안정성, 가격 통제, 반품 책임, 상세정보 품질 같은 문제가 뒤늦게 드러납니다. 판매량이 늘어날수록 거래조건을 개선할 여지가 있는지까지 봐야 합니다. 시작 장벽이 낮은 것과 생존 장벽이 낮은 것은 다른 문제입니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "trust-for-new-product-with-few-reviews",
    title: "리뷰가 적은 신규 상품은 무엇으로 신뢰를 만들까?",
    body: "리뷰가 적은 상품은 가격만 낮춰서는 불안을 없애기 어렵습니다. 상세한 상품 정보, 판매자 신뢰, 비교 가능한 근거, 실제 사용 맥락, 반품과 고객지원의 명확성처럼 다른 신뢰 장치를 함께 설계해야 합니다. 리뷰가 쌓이기 전 무엇으로 구매 불안을 줄일지 생각해 볼 문제입니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "naver-vs-coupang-operation",
    title: "쿠팡과 네이버의 운영 방식은 왜 다르게 봐야 할까?",
    body: "두 플랫폼은 고객이 상품을 찾고 비교하고 구매하는 맥락이 다릅니다. 같은 상품명, 같은 가격, 같은 광고 전략을 그대로 복제하면 성과 차이가 생길 수 있습니다. 플랫폼의 고객 경험과 판매자 도구가 어떤 행동을 유도하는지부터 이해해야 운영 전략을 따로 설계할 수 있습니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "platform-rule-change-response",
    title: "유통 플랫폼 규정 변화에 어떻게 대응해야 할까?",
    body: "플랫폼 정책은 계속 바뀌기 때문에 특정 편법이나 한 가지 노출 기술에 사업을 의존하면 변화가 곧 리스크가 됩니다. 규정을 모니터링하고 상품 정보와 운영 프로세스를 원칙에 맞춰 유지하면서, 유입 경로를 여러 개로 분산하는 방식이 필요합니다. 단기 성과와 장기 생존을 같이 보는 질문입니다."
  },
  {
    category: "online-selling",
    author: "njs-editorial",
    slug: "why-no-repeat-purchase",
    title: "재구매가 없는 상품의 문제는 어디서 찾아야 할까?",
    body: "첫 구매 전환이 잘 나와도 재구매가 없다면 상품 기대치, 실제 사용 경험, 소비 주기, CS, 패키지, 후속 커뮤니케이션을 따로 봐야 합니다. 모든 상품이 반복 구매형일 필요는 없지만 반복 가능성이 있는 상품이라면 첫 주문 이후 경험이 다음 주문을 결정합니다."
  },
  {
    category: "case-study",
    author: "njs-research",
    slug: "price-cut-without-sales-growth",
    title: "가격을 내렸는데도 판매가 늘지 않은 경우",
    body: "가격을 내리면 구매 장벽이 낮아질 것 같지만 고객이 상품의 차이를 이해하지 못하거나 신뢰가 부족한 상황에서는 할인만으로 전환이 개선되지 않습니다. 가격 조정 전에 경쟁 상품과의 차이, 검색 의도, 후기와 정보의 충분성, 배송과 반품 조건을 함께 봐야 했던 유형의 사례입니다."
  },
  {
    category: "case-study",
    author: "njs-research",
    slug: "more-impressions-no-purchases",
    title: "검색 노출은 늘었는데 구매가 안 나온 경우",
    body: "노출량이 늘어도 잘못된 검색어에서 들어온 방문자라면 클릭과 구매는 따라오지 않습니다. 노출 증가를 성과로 착각하지 않고 어떤 질의에서 노출됐는지, 클릭한 사람이 무엇을 기대했는지, 상세페이지 첫 화면이 그 기대와 맞는지를 다시 확인해야 하는 사례입니다."
  },
  {
    category: "case-study",
    author: "njs-research",
    slug: "good-roas-no-profit",
    title: "광고 효율은 좋아 보였지만 이익이 남지 않은 경우",
    body: "ROAS가 높아 보여도 원가, 플랫폼 수수료, 쿠폰, 배송비, 반품, 인건비를 반영하면 실제 이익이 거의 없을 수 있습니다. 광고 대시보드 하나의 숫자보다 주문 한 건의 공헌이익과 고객의 반복 구매 가능성을 함께 보지 않으면 잘 팔수록 손해가 커지는 구조가 생길 수 있습니다."
  },
  {
    category: "case-study",
    author: "njs-research",
    slug: "why-one-product-keeps-selling",
    title: "상품 하나가 오래 팔리는 이유를 다시 본 사례",
    body: "몇 년 전에 등록한 상품이 별다른 관리 없이 계속 팔린다면 단순히 운이 좋았다고 넘길 필요는 없습니다. 검색 수요가 안정적인지, 경쟁 상품이 줄었는지, 리뷰와 판매 이력이 신뢰 자산으로 누적됐는지, 가격과 공급이 유지됐는지를 보면 장기 판매의 조건을 역으로 찾을 수 있습니다."
  },
  {
    category: "case-study",
    author: "njs-research",
    slug: "change-product-definition-before-detail-page",
    title: "상세페이지를 고치기 전에 상품 정의를 바꿔야 했던 경우",
    body: "상세페이지 디자인을 반복해서 바꿔도 전환이 나아지지 않을 때는 표현보다 상품 정의가 문제일 수 있습니다. 누구에게 어떤 상황에서 필요한 상품인지가 अस्पष्ट하면 카피와 이미지도 계속 흔들립니다. 고객 문제와 사용 맥락을 먼저 좁힌 뒤 상세페이지가 따라가야 하는 사례입니다."
  },
  {
    category: "case-study",
    author: "njs-research",
    slug: "long-tail-for-small-seller",
    title: "롱테일 키워드가 작은 셀러에게 유리했던 이유",
    body: "대형 키워드에서 정면 경쟁하기 어려운 판매자는 검색량이 조금 작더라도 구매 의도가 더 구체적인 조합을 찾을 수 있습니다. 중요한 것은 무조건 긴 키워드가 아니라 상품 특징과 고객 상황이 정확히 만나는 표현입니다. 작은 수요를 여러 개 확보하면서 학습 데이터를 쌓는 접근입니다."
  },
  {
    category: "case-study",
    author: "njs-research",
    slug: "more-products-no-more-sales",
    title: "상품 수를 늘렸는데 매출이 늘지 않은 경우",
    body: "등록 상품 수를 늘리면 노출 기회도 늘어날 것 같지만 관리 품질이 떨어지고 비슷한 상품끼리 검색 신호를 나눠 가질 수 있습니다. 무엇을 더 등록할지가 아니라 어떤 수요를 추가로 커버하는지, 기존 상품과 역할이 겹치지 않는지부터 확인해야 합니다."
  },
  {
    category: "case-study",
    author: "njs-research",
    slug: "reward-traffic-before-use",
    title: "리워드 트래픽을 쓰기 전에 물어야 할 질문",
    body: "외부 보상 트래픽으로 단기 지표를 움직일 수 있어도 실제 구매 의도와 다른 행동이 섞이면 데이터 해석이 어려워지고 플랫폼 정책 리스크도 생깁니다. 유입 자체가 아니라 이후 구매와 재방문으로 이어지는지, 중단했을 때 남는 자산이 있는지를 먼저 확인해야 합니다."
  },
  {
    category: "reading-action",
    author: "njs-editorial",
    slug: "three-checks-after-reading-never-just-sell",
    title: "『그냥 팔지 말라』를 읽고 먼저 점검할 세 가지",
    body: "책을 읽고 바로 적용하려면 내 상품이 누구의 어떤 문제를 해결하는지, 고객이 어떤 경로로 상품을 발견하는지, 구매 후 다시 돌아올 이유가 있는지를 먼저 적어보는 것이 좋습니다. 기술을 하나 더 배우기 전에 현재 사업 구조의 빈칸을 찾는 데 목적을 둡니다."
  },
  {
    category: "reading-action",
    author: "njs-editorial",
    slug: "make-search-a-work-routine",
    title: "검색의 생활화를 실제 업무 루틴으로 바꾸는 방법",
    body: "검색은 키워드 도구를 한 번 보는 작업이 아니라 고객이 어떤 표현을 쓰는지 계속 관찰하는 습관에 가깝습니다. 자동완성, 연관검색, 경쟁 상품명, 리뷰 문장, 커뮤니티 질문을 정기적으로 기록하면 상품 기획과 콘텐츠 아이디어가 동시에 쌓입니다."
  },
  {
    category: "reading-action",
    author: "njs-editorial",
    slug: "exploration-exploitation-in-business",
    title: "탐색과 활용을 사업 운영에 적용해 보기",
    body: "잘 팔리는 방식만 반복하면 시장 변화에 늦고, 새로운 시도만 계속하면 수익이 안정되지 않습니다. 현재 성과가 나는 상품과 채널은 활용하면서 일정 비율의 시간과 예산을 새 상품, 새 콘텐츠, 새 유입경로 탐색에 배분하는 식으로 운영 규칙을 만들 수 있습니다."
  },
  {
    category: "reading-action",
    author: "njs-editorial",
    slug: "record-customer-behavior-before-ad-spend",
    title: "광고비보다 고객 행동을 먼저 기록해 보기",
    body: "광고비를 늘리기 전에 어떤 검색어로 들어왔고 어디에서 이탈했으며 어떤 질문을 남겼는지를 기록해 보면 돈을 써야 할 지점과 고쳐야 할 지점이 분리됩니다. 매출 숫자만 남기지 말고 구매 전후의 행동과 이유를 함께 기록하는 연습입니다."
  },
  {
    category: "branding-marketing",
    author: "njs-editorial",
    slug: "what-authenticity-means-in-branding",
    title: "브랜딩에서 진정성은 무엇을 뜻해야 할까?",
    body: "진정성을 단순히 솔직하게 말하는 태도로만 보면 브랜드 운영에서는 부족합니다. 고객이 약속한 품질과 경험을 반복해서 확인할 수 있어야 신뢰가 생깁니다. 말과 행동, 상품과 서비스, 가격과 고객 대응이 일관되는지가 더 중요한 기준이 될 수 있습니다."
  },
  {
    category: "branding-marketing",
    author: "njs-editorial",
    slug: "brand-vs-search-optimization",
    title: "브랜드와 검색 최적화는 반대 전략일까?",
    body: "검색 최적화는 당장의 발견 가능성을 높이고 브랜드는 선택 이유와 기억을 쌓습니다. 둘을 반대 전략으로 놓으면 단기 성과나 장기 자산 중 하나를 포기하게 됩니다. 검색에서 발견되고 콘텐츠로 이해시키고 경험으로 기억되게 만드는 흐름으로 연결해서 보는 편이 현실적입니다."
  },
  {
    category: "branding-marketing",
    author: "njs-editorial",
    slug: "limits-of-performance-marketing-only",
    title: "퍼포먼스 마케팅만으로 장기 성장이 어려운 이유",
    body: "성과 광고는 측정과 최적화가 쉽지만 경쟁자가 같은 경매에 들어오면 비용이 올라갑니다. 광고가 만들어낸 첫 구매를 검색, 콘텐츠, CRM, 재구매, 추천으로 연결하지 못하면 고객을 매번 다시 사와야 합니다. 장기적으로는 유료 유입 외의 접점이 얼마나 쌓이는지가 중요합니다."
  },
  {
    category: "branding-marketing",
    author: "njs-research",
    slug: "product-information-in-ai-search-era",
    title: "AI 검색 시대에 상품 정보는 어떻게 달라져야 할까?",
    body: "검색 결과가 링크 목록에서 답변형 화면으로 바뀌면 상품 정보도 단순 키워드 반복보다 구조화된 설명이 중요해집니다. 무엇인지, 누구에게 적합한지, 다른 선택지와 무엇이 다른지, 근거가 무엇인지가 명확해야 검색엔진과 AI 시스템 모두 정보를 해석하기 쉬워집니다."
  },
  {
    category: "branding-marketing",
    author: "njs-editorial",
    slug: "customer-experience-vs-price-competition",
    title: "고객 경험과 가격 경쟁 중 무엇을 먼저 봐야 할까?",
    body: "가격은 강력한 구매 요인이지만 모든 경쟁을 가격으로 해결하면 이익과 브랜드가 동시에 약해질 수 있습니다. 고객이 비교하는 기준이 가격밖에 없는지, 정보와 상담, 배송, 사용 경험, 사후지원 같은 다른 선택 이유를 만들 수 있는지 먼저 살펴볼 필요가 있습니다."
  },
  {
    category: "branding-marketing",
    author: "njs-editorial",
    slug: "why-sellers-need-content",
    title: "온라인 셀러에게 콘텐츠가 필요한 이유",
    body: "콘텐츠는 조회수를 만들기 위한 별도 업무가 아니라 고객이 검색하고 비교하고 신뢰를 형성하는 과정에 정보를 공급하는 수단입니다. 상품만 올려놓았을 때 설명하기 어려운 전문성, 사용 맥락, 비교 기준을 콘텐츠가 대신 축적해 주고 브랜드 검색과 재방문의 이유도 만듭니다."
  },
  {
    category: "branding-marketing",
    author: "njs-editorial",
    slug: "economies-of-scale-for-small-sellers",
    title: "규모의 경제가 작은 셀러에게도 필요한가?",
    body: "작은 사업자가 대기업처럼 물량을 키울 필요는 없지만 반복되는 일을 표준화하고 구매량이 늘수록 원가와 거래조건을 개선하는 구조는 필요합니다. 주문이 늘 때 사람과 비용이 똑같이 늘어나는지, 아니면 운영 효율이 좋아지는지를 보면 성장의 질을 판단할 수 있습니다."
  },
  {
    category: "branding-marketing",
    author: "njs-research",
    slug: "seo-aeo-geo-differences",
    title: "SEO와 AEO·GEO는 무엇이 달라지는가?",
    body: "SEO가 검색 결과에서 발견되는 구조를 다뤘다면 AEO와 GEO는 답변형 검색과 생성형 AI가 내용을 이해하고 인용하기 쉬운 형태까지 고려합니다. 핵심은 새로운 약어를 좇는 것이 아니라 정확한 정보, 명확한 구조, 출처와 경험 근거를 꾸준히 축적하는 데 있습니다."
  }
];

const ANSWERS = {
  "what-to-check-first-when-sales-stop": "가장 먼저 매출을 노출×클릭률×구매전환×객단가로 나눠 보세요. 어느 항목이 이전 기간과 달라졌는지 찾으면 광고, 상품, 가격, 상세페이지 중 무엇부터 손댈지 우선순위가 생깁니다.",
  "metric-before-ranking": "순위보다 검색어별 클릭과 구매전환을 먼저 봅니다. 상위에 있어도 맞지 않는 검색어에서 들어온 방문자는 구매하지 않습니다. 노출의 양보다 수요와 상품의 적합도가 먼저입니다.",
  "too-many-keywords-in-product-name": "키워드는 많이 넣는 것이 아니라 상품을 가장 정확하게 설명하는 핵심 표현부터 정리하는 편이 낫습니다. 카테고리와 속성 정보까지 함께 맞춰야 검색 시스템이 상품을 일관되게 이해할 수 있습니다.",
  "avoid-competitive-keywords": "경쟁 키워드를 완전히 포기하기보다 핵심 수요를 유지하면서 구체적인 상황·용도·대상어를 붙여 롱테일을 확장하는 방식이 현실적입니다.",
  "sales-stop-when-ads-stop": "광고 외 유입과 재구매가 없는 것이 핵심 문제일 가능성이 큽니다. 검색 자연유입, 브랜드 검색, CRM, 콘텐츠, 반복 구매 중 최소 한두 개가 광고와 함께 성장하고 있는지 봐야 합니다.",
  "consignment-first-validation": "공급 안정성, 마진, 가격 통제, 반품 책임, 상세정보 품질을 먼저 확인하세요. 판매가 늘수록 거래조건을 개선할 수 있는 공급처인지도 중요합니다.",
  "trust-for-new-product-with-few-reviews": "리뷰가 부족하면 다른 신뢰 신호를 더 명확하게 보여줘야 합니다. 상세 스펙, 비교 근거, 운영자 전문성, 고객지원과 반품 기준, 실제 사용 장면이 대표적인 대안입니다.",
  "naver-vs-coupang-operation": "같은 상품이라도 고객이 들어오는 맥락과 비교 방식이 다르므로 상품정보와 광고 운영을 그대로 복제하지 않는 편이 좋습니다. 플랫폼별 고객 여정을 먼저 그려보세요.",
  "platform-rule-change-response": "정책 위반 가능성이 있는 편법을 매출의 핵심으로 두지 않고, 공식 규칙 안에서 검색·콘텐츠·CRM·브랜드 같은 여러 유입 경로를 함께 키우는 것이 가장 강한 대응입니다.",
  "why-no-repeat-purchase": "재구매 가능한 품목인지부터 구분한 뒤, 가능하다면 첫 사용 만족도와 소비 주기, 재주문 시점의 리마인드가 연결되는지 확인하세요.",
  "price-cut-without-sales-growth": "가격은 구매 이유 중 하나일 뿐입니다. 고객이 상품의 차이를 이해하지 못하거나 믿지 못하면 할인폭이 커져도 구매를 미룹니다.",
  "more-impressions-no-purchases": "노출 검색어와 상세페이지 첫 화면이 같은 약속을 하고 있는지 확인해 보세요. 검색 기대와 실제 상품 설명이 어긋나면 노출이 늘수록 이탈만 늘 수 있습니다.",
  "good-roas-no-profit": "광고 플랫폼의 ROAS 대신 주문 단위 공헌이익을 계산해야 합니다. 원가·수수료·쿠폰·배송·반품을 모두 반영한 뒤 광고비를 판단해야 합니다.",
  "why-one-product-keeps-selling": "장기 판매 상품은 우연이 아니라 검색 수요, 누적 리뷰, 가격 안정성, 공급 지속성 같은 요소가 복합적으로 작동하는 경우가 많습니다. 오래 팔린 이유를 해체하면 다음 상품의 기준이 됩니다.",
  "change-product-definition-before-detail-page": "상세페이지보다 먼저 한 문장으로 ‘누가 언제 왜 사는 상품인지’를 정의해 보세요. 그 문장이 흐리면 디자인을 바꿔도 고객에게 전달되는 메시지가 선명해지기 어렵습니다.",
  "long-tail-for-small-seller": "검색량만 작은 단어가 아니라 구매 의도가 구체적인 표현을 찾아야 합니다. 고객 상황과 상품 속성이 동시에 들어간 검색어가 좋은 출발점입니다.",
  "more-products-no-more-sales": "등록 수보다 상품별 역할을 봐야 합니다. 같은 수요를 서로 나눠 먹는 상품이 많다면 SKU를 늘려도 매출이 커지지 않을 수 있습니다.",
  "reward-traffic-before-use": "그 유입이 실제 고객 행동과 비슷한지, 중단한 뒤에도 남는 자산이 있는지를 먼저 물어야 합니다. 단기 순위 변화만 남는 구조라면 지속 가능한 전략으로 보기 어렵습니다.",
  "three-checks-after-reading-never-just-sell": "상품 정의, 고객의 발견 경로, 구매 후 재방문 이유를 각각 한 문장씩 적어보는 것부터 시작하면 좋습니다. 세 문장이 연결되지 않으면 현재 사업 구조에서 가장 큰 빈칸을 찾기 쉽습니다.",
  "make-search-a-work-routine": "주 1회라도 자동완성·연관검색·리뷰·커뮤니티 질문을 같은 시트에 기록해 보세요. 몇 주가 지나면 반복되는 고객 표현과 새로운 수요가 눈에 들어오기 시작합니다.",
  "exploration-exploitation-in-business": "현재 성과를 유지하는 업무와 새로운 가능성을 실험하는 업무의 시간 비중을 미리 정하면 한쪽으로 쏠리는 문제를 줄일 수 있습니다.",
  "record-customer-behavior-before-ad-spend": "검색어, 유입 페이지, 이탈 지점, 문의 내용, 구매 이유를 주문 숫자와 함께 기록해 보세요. 광고비를 늘릴지 상품 경험을 고칠지 판단하기 쉬워집니다.",
  "what-authenticity-means-in-branding": "진정성은 감정 표현보다 약속과 실제 경험의 일치에 가깝습니다. 고객이 여러 접점에서 같은 기준을 반복해서 확인할 수 있어야 신뢰가 쌓입니다.",
  "brand-vs-search-optimization": "검색은 발견을 만들고 브랜드는 선택과 기억을 만듭니다. 둘을 연결하면 단기 유입이 장기 자산으로 넘어갈 가능성이 커집니다.",
  "limits-of-performance-marketing-only": "광고로 데려온 고객이 브랜드 검색, 재구매, 추천, 콘텐츠 구독으로 이동하는 경로를 만들어야 CAC 상승에 덜 취약해집니다.",
  "product-information-in-ai-search-era": "상품명 반복보다 정확한 정의, 구조화된 속성, 비교 가능한 근거, FAQ처럼 질문에 바로 답하는 정보가 더 중요해집니다.",
  "customer-experience-vs-price-competition": "가격 외 선택 이유가 있는지부터 봐야 합니다. 상담, 정보, 배송, 사용 경험, 사후지원 중 고객이 실제로 중요하게 보는 것을 찾아 강화하는 편이 낫습니다.",
  "why-sellers-need-content": "콘텐츠는 고객이 구매 전에 묻는 질문을 미리 답해 두는 자산입니다. 광고를 끈 뒤에도 검색과 공유를 통해 남는다는 점이 상품 페이지와 다릅니다.",
  "economies-of-scale-for-small-sellers": "규모의 경제는 거대한 물량만 뜻하지 않습니다. 반복 업무를 표준화하고 주문량이 늘수록 단위 비용이 낮아지는 구조를 만드는 것부터 시작할 수 있습니다.",
  "seo-aeo-geo-differences": "이름은 달라도 기본은 같습니다. 검색 시스템이 정확히 이해할 수 있는 정보 구조와 실제 경험에 기반한 근거를 꾸준히 축적하는 것이 먼저입니다."
};

async function ensureMember(db, member) {
  await db.prepare(
    `INSERT OR IGNORE INTO members(member_id,public_id,display_name,bio,role,status)
     VALUES(?,?,?,?,?,'active')`
  ).bind(
    member.member_id,
    member.public_id,
    member.display_name,
    "NEVER JUST SELL의 사전 구축 지식·질문·사례를 관리하는 운영 계정입니다.",
    member.role
  ).run();
}

async function ensurePost(db, post) {
  const category = await db.prepare(
    "SELECT id FROM categories WHERE slug=? AND is_active=1 LIMIT 1"
  ).bind(post.category).first();
  if (!category?.id) return null;

  const existing = await db.prepare(
    "SELECT id FROM posts WHERE slug=? LIMIT 1"
  ).bind(post.slug).first();
  if (existing?.id) return Number(existing.id);

  const result = await db.prepare(
    `INSERT INTO posts(category_id,author_member_id,slug,title,body,status,is_indexable)
     VALUES(?,?,?,?,?,'published',1)`
  ).bind(category.id, post.author, post.slug, post.title, post.body).run();
  return Number(result?.meta?.last_row_id || 0) || null;
}

async function ensureAnswer(db, slug, body) {
  const post = await db.prepare("SELECT id FROM posts WHERE slug=? LIMIT 1").bind(slug).first();
  if (!post?.id || !body) return false;
  const existing = await db.prepare(
    "SELECT id FROM comments WHERE post_id=? AND author_member_id='njs-guide' AND body=? LIMIT 1"
  ).bind(post.id, body).first();
  if (existing?.id) return false;
  await db.prepare(
    `INSERT INTO comments(post_id,author_member_id,parent_id,body,status)
     VALUES(?,'njs-guide',NULL,?,'published')`
  ).bind(post.id, body).run();
  await db.prepare(
    "UPDATE posts SET comment_count=(SELECT COUNT(*) FROM comments WHERE post_id=? AND status='published'), updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(post.id, post.id).run();
  return true;
}

export async function ensurePrelaunchSeed(env) {
  if (!env?.DB) return { ok: false, skipped: true, reason: "db_missing" };

  for (const member of EDITORIAL_MEMBERS) await ensureMember(env.DB, member);
  let createdPosts = 0;
  let createdAnswers = 0;
  for (const post of POSTS) {
    const before = await env.DB.prepare("SELECT id FROM posts WHERE slug=? LIMIT 1").bind(post.slug).first();
    await ensurePost(env.DB, post);
    if (!before?.id) createdPosts += 1;
    if (await ensureAnswer(env.DB, post.slug, ANSWERS[post.slug])) createdAnswers += 1;
  }

  const counts = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM posts WHERE author_member_id IN ('njs-editorial','njs-research') AND status='published') AS seeded_posts,
       (SELECT COUNT(*) FROM comments WHERE author_member_id='njs-guide' AND status='published') AS seeded_answers`
  ).first();

  return {
    ok: true,
    version: "2026-09-26-prelaunch-activity-v1",
    created_posts: createdPosts,
    created_answers: createdAnswers,
    seeded_posts: Number(counts?.seeded_posts || 0),
    seeded_answers: Number(counts?.seeded_answers || 0)
  };
}

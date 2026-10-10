/**
 * NJS author-owned Home, journey revision.
 * D-099 boundary: this is Macjagga's personal channel, NOT the cross-author platform.
 * User journeys:
 * - Search/new: problem -> real knowledge -> course -> community
 * - YouTube/book/referral: author and current media -> course/community
 * - Returning member: immediate My Space utility, not another registration funnel
 * - B2B: speaking/program overview only, no unverified inquiry CTA
 * No invented testimonials, enrolment counts, active book clubs, or unavailable paid course CTAs.
 */
export function renderNjsJourneyHome({briefs=[], videos=[], communityOrigin, authOrigin}, {esc, dateKo, HERO_IMAGE, BOOK_IMAGE, COURSE_MAIN_IMAGE, YOUTUBE_CHANNEL_ID}) {
  const course=authOrigin+"/courses/online-commerce-basics";
  const lectureCatalog=authOrigin+"/courses";
  const mySpace=authOrigin+"/my-space";
  const video=videos?.[0]||null;
  const brief=briefs?.[0]||null;
  const cases=[
    {tag:"광고와 수익",title:"광고 성과는 좋은데 이익이 남지 않는다면",description:"매출보다 실제 주문에서 남는 돈을 먼저 확인합니다.",slug:"case-roas-high-profit-low"},
    {tag:"고객의 선택",title:"가격을 내려도 구매로 이어지지 않는다면",description:"고객이 망설이는 이유가 가격 때문인지 다시 살펴봅니다.",slug:"case-discount-no-conversion"},
    {tag:"고객과 관계",title:"한 번 구매한 고객이 돌아오지 않는다면",description:"상품뿐 아니라 구매 이후의 경험을 점검합니다.",slug:"case-no-repeat-purchase"},
    {tag:"시장 변화",title:"플랫폼의 변화에 사업이 흔들린다면",description:"한 가지 노출 방식에 지나치게 기대고 있지는 않은지 봅니다.",slug:"case-platform-rule-change"}
  ];
  const casesHtml=cases.map(x=>`<a class="r37-case" href="/knowledge/${encodeURIComponent(x.slug)}">
    <span class="r37-tag">${esc(x.tag)}</span><span class="r37-case-text"><strong>${esc(x.title)}</strong><small>${esc(x.description)}</small></span><span class="r37-arrow" aria-hidden="true">↗</span>
  </a>`).join("");
  const mediaVideo=video
    ? `<a class="r37-video" href="${esc(video.url)}" rel="noopener noreferrer" target="_blank">
      <figure><img src="${esc(video.thumbnail)}" alt="" loading="lazy"></figure>
      <div class="r37-media-info"><span class="r37-tag">맥작가 유튜브 · ${esc(dateKo(video.published))}</span><strong>${esc(video.title)}</strong><span class="r37-link">영상 보기 ↗</span></div>
    </a>`
    : `<a class="r37-video" href="https://www.youtube.com/channel/${esc(YOUTUBE_CHANNEL_ID)}" rel="noopener noreferrer" target="_blank">
      <figure class="r37-video-empty" aria-hidden="true"><span>NEVER JUST SELL</span></figure><div class="r37-media-info"><span class="r37-tag">맥작가 유튜브</span><strong>지금 이야기하는 주제를 영상으로 만나보세요.</strong><span class="r37-link">유튜브 채널 보기 ↗</span></div>
    </a>`;
  const mediaBrief=brief
    ? `<a class="r37-brief" href="/knowledge/${encodeURIComponent(brief.slug)}">
      <span class="r37-tag">브리핑 · ${esc(brief.updated)}</span><strong>${esc(brief.title)}</strong><p>${esc(brief.summary)}</p><span class="r37-link">내용 읽기 →</span>
    </a>`
    : `<a class="r37-brief" href="/v33/content#briefing">
      <span class="r37-tag">브리핑</span><strong>최근에 다룬 이야기 살펴보기</strong><p>사업에 영향을 주는 변화를 맥작가의 관점에서 확인합니다.</p><span class="r37-link">콘텐츠 보기 →</span>
    </a>`;
  return `<main id="main-content" class="r37-home" data-home-design="journey-v2">
    <section class="r37-hero" aria-labelledby="r37-main-heading">
      <div class="r33-shell r37-hero-grid">
        <div class="r37-hero-body">
          <p class="r37-eyebrow">맥작가의 콘텐츠 · 강의 · 커뮤니티</p>
          <h1 id="r37-main-heading">고객이 선택하는 이유를 알면,<br>바꿔야 할 것도 보입니다.</h1>
          <p class="r37-intro">광고를 늘려야 할지, 가격을 바꿔야 할지, 무엇을 먼저 개선해야 할지. 상품·고객·유통·브랜드를 함께 살펴보며 내 사업에 필요한 판단의 기준을 찾아보세요.</p>
          <div class="r37-actions">
            <a class="r37-button" href="#journey-cases">지금 읽을 사례 보기 <span aria-hidden="true">→</span></a>
            <a class="r37-secondary-link" href="${esc(course)}">무료 강의 살펴보기 <span aria-hidden="true">↗</span></a>
          </div>
          <p class="r37-return">이미 배우고 계신가요? <a href="${esc(mySpace)}">내 강의·저장한 자료 이어보기 →</a></p>
        </div>
        <figure class="r37-hero-photo">
          <img src="${esc(HERO_IMAGE)}" alt="맥작가의 실제 인물 사진" loading="eager">
          <figcaption><strong>맥작가</strong><span>『그냥 팔지 말라 스마트스토어』 저자</span></figcaption>
        </figure>
      </div>
    </section>

    <section class="r37-section r37-cases" id="journey-cases" aria-labelledby="r37-cases-heading">
      <div class="r33-shell">
        <div class="r37-section-heading">
          <div><p class="r37-eyebrow">먼저 읽어볼 이야기</p><h2 id="r37-cases-heading">지금 겪고 있는 문제부터 살펴보세요.</h2></div>
          <a href="/v33/knowledge">지식·사례 전체 보기 <span aria-hidden="true">→</span></a>
        </div>
        <div class="r37-case-grid">${casesHtml}</div>
      </div>
    </section>

    <section class="r37-section r37-media" aria-labelledby="r37-media-heading">
      <div class="r33-shell">
        <div class="r37-section-heading">
          <div><p class="r37-eyebrow">유튜브 · 브리핑</p><h2 id="r37-media-heading">요즘, 어떤 이야기를 하고 있을까요?</h2></div>
          <a href="/v33/content">영상과 글 전체 보기 <span aria-hidden="true">→</span></a>
        </div>
        <div class="r37-media-grid">${mediaVideo}${mediaBrief}</div>
      </div>
    </section>

    <section class="r37-section r37-learning" id="journey-learning" aria-labelledby="r37-learning-heading">
      <div class="r33-shell r37-learning-grid">
        <div class="r37-learning-copy">
          <p class="r37-eyebrow">무료로 시작하는 강의</p>
          <h2 id="r37-learning-heading">단편적인 요령보다,<br>온라인 유통의 구조부터 이해하기.</h2>
          <p class="r37-description">검색·상품·고객·콘텐츠가 서로 어떻게 연결되는지, 하나의 흐름으로 배우는 기초 강의입니다.</p>
          <p class="r37-course-title">온라인 유통의 기본 <span>무료</span></p>
          <ul class="r37-course-points">
            <li>고객의 검색과 상품 선택이 연결되는 과정</li>
            <li>네이버 쇼핑과 온라인 유통이 작동하는 구조</li>
            <li>광고를 넘어 콘텐츠와 브랜드를 함께 보는 방법</li>
          </ul>
          <div class="r37-actions">
            <a class="r37-button" href="${esc(course)}">무료 강의 내용 확인하기 <span aria-hidden="true">→</span></a>
            <a class="r37-secondary-link" href="${esc(lectureCatalog)}">다른 강의 보기 <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <a class="r37-course-media" href="${esc(course)}" aria-label="온라인 유통의 기본 무료 강의 상세 보기">
          <img src="${esc(COURSE_MAIN_IMAGE)}" alt="온라인 유통의 기본 강의 대표 이미지" loading="lazy">
          <div><span>현재 수강 가능한 강의</span><strong>온라인 유통의 기본</strong></div>
        </a>
      </div>
    </section>

    <section class="r37-section r37-community" id="journey-community" aria-labelledby="r37-community-heading">
      <div class="r33-shell r37-community-grid">
        <div class="r37-community-copy">
          <p class="r37-eyebrow">혼자 고민하고 있었다면</p>
          <h2 id="r37-community-heading">비슷한 경험을 읽고,<br>내 질문도 남겨보세요.</h2>
          <p class="r37-description">같은 문제를 다른 사람은 어떻게 보고 있는지 살펴보세요. 질문을 나누고, 읽은 내용을 직접 적용한 기록도 이어갈 수 있습니다.</p>
          <div class="r37-actions">
            <a class="r37-button r37-button-outline" href="${esc(communityOrigin)}/">커뮤니티 살펴보기 <span aria-hidden="true">→</span></a>
            <a class="r37-secondary-link" href="${esc(communityOrigin)}/write?intent=question">질문 작성하기 <span aria-hidden="true">↗</span></a>
          </div>
          <p class="r37-help">글 작성에는 로그인이 필요할 수 있습니다.</p>
        </div>
        <div class="r37-community-links">
          <p>실제 커뮤니티에서 다루는 이야기</p>
          <a href="${esc(communityOrigin)}/p/29/customer-experience-vs-price-competition"><span>브랜드·마케팅 토론</span><strong>고객 경험과 가격 경쟁 중 무엇을 먼저 봐야 할까?</strong><b aria-hidden="true">↗</b></a>
          <a href="${esc(communityOrigin)}/p/27/product-information-in-ai-search-era"><span>브랜드·AI 검색</span><strong>AI 검색 시대에 상품 정보는 어떻게 달라져야 할까?</strong><b aria-hidden="true">↗</b></a>
          <a href="${esc(communityOrigin)}/c/reading-action"><span>읽고 실행한 기록</span><strong>읽은 내용을 내 사업에 적용한 기록 보기</strong><b aria-hidden="true">↗</b></a>
        </div>
      </div>
    </section>

    <section class="r37-section r37-author" aria-labelledby="r37-author-heading">
      <div class="r33-shell r37-author-grid">
        <figure><img src="${esc(BOOK_IMAGE)}" alt="『그냥 팔지 말라 스마트스토어』 책 표지" loading="lazy"></figure>
        <div>
          <p class="r37-eyebrow">맥작가와 『그냥 팔지 말라』</p>
          <h2 id="r37-author-heading">사업을 직접 해본 사람의<br>질문에서 시작합니다.</h2>
          <p class="r37-description">상품을 기획하고, 만들고, 유통하고, 직접 판매하며 얻은 경험에서 출발합니다. 책과 영상, 강의에 담긴 생각을 NJS에서 이어갑니다.</p>
          <div class="r37-author-links">
            <a href="/v33/book">책 살펴보기 <span aria-hidden="true">→</span></a>
            <a href="/v33/about">맥작가 소개 <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    </section>

    <aside class="r37-business" aria-label="강연과 교육">
      <div class="r33-shell r37-business-inner">
        <div><strong>조직의 마케팅·브랜드 고민을 함께 살펴보고 싶다면</strong><p>강연·기업 교육에서 다루는 주제를 확인하실 수 있습니다.</p></div>
        <a href="/v33/lecture">강연·컨설팅 소개 <span aria-hidden="true">→</span></a>
      </div>
    </aside>
  </main>`;
}

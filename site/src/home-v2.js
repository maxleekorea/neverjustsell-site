function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function externalLink(href, label, className = "") {
  return '<a href="' + esc(href) + '" class="' + esc(className) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
}

export function renderHomeV2Page({ siteOrigin, authOrigin, communityOrigin }) {
  const mySpace = authOrigin + "/my-space";
  const courses = authOrigin + "/courses";
  const community = communityOrigin + "/";
  const flagshipUrl = "https://www.youtube.com/watch?v=f7DDTrCNTPY";
  const flagshipThumb = "https://i.ytimg.com/vi/f7DDTrCNTPY/hqdefault.jpg";
  const cafeUrl = "https://www.youtube.com/watch?v=meLV6iG6qW0";
  const cafeThumb = "https://i.ytimg.com/vi/meLV6iG6qW0/hqdefault.jpg";
  const psychologyUrl = "https://www.youtube.com/watch?v=5K2ax61C2HE";
  const psychologyThumb = "https://i.ytimg.com/vi/5K2ax61C2HE/hqdefault.jpg";
  const bookImage = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/remove_background.png";
  const profileImage = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/68868a93-5045-4e7b-936d-a9a37c82b85b.png";

  const html = [
    "<!doctype html>",
    '<html lang="ko">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    "<title>NJS Home V2 Preview | NEVER JUST SELL</title>",
    '<meta name="description" content="맥작가의 미디어, 학습, 커뮤니티를 연결하는 NEVER JUST SELL Home V2 프리뷰.">',
    '<meta name="robots" content="noindex,nofollow">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="stylesheet" href="/home-v2.css">',
    "</head>",
    '<body class="homev2-body">',
      '<a class="homev2-skip" href="#main-content">본문 바로가기</a>',
      '<header class="homev2-header">',
        '<div class="homev2-shell homev2-header-inner">',
          '<a class="homev2-brand" href="/home-v2" aria-label="NEVER JUST SELL Home V2"><span class="homev2-brand-mark" aria-hidden="true">NJS</span><span>NEVER JUST SELL</span></a>',
          '<button class="homev2-menu-toggle" type="button" aria-controls="homev2-nav" aria-expanded="false">메뉴</button>',
          '<nav class="homev2-nav" id="homev2-nav" aria-label="주요 메뉴">',
            '<a href="/content">콘텐츠</a>',
            '<a href="/knowledge">지식</a>',
            '<a href="' + esc(courses) + '">배우기</a>',
            '<a href="' + esc(community) + '">커뮤니티</a>',
            '<a href="/about">맥작가</a>',
            '<span class="homev2-nav-mobile"><a href="/knowledge">검색</a><a href="' + esc(mySpace) + '">내 공간</a></span>',
          "</nav>",
          '<div class="homev2-utility"><a href="/knowledge">검색</a><a class="homev2-space" href="' + esc(mySpace) + '">내 공간</a></div>',
        "</div>",
      "</header>",

      '<main id="main-content">',
        '<section class="homev2-hero">',
          '<div class="homev2-shell homev2-hero-grid">',
            '<div class="homev2-hero-copy">',
              '<p class="homev2-overline">NEVER JUST SELL × 맥작가</p>',
              '<h1>브랜드와 마케팅을,<br><span>실제 사업의 문제로</span><br>다룹니다.</h1>',
              '<p class="homev2-lead">『그냥 팔지 말라』에서 시작한 질문을 영상과 지식, 학습과 커뮤니티로 이어갑니다. 정보를 더 쌓기보다 무엇을 왜 해야 하는지 판단하고 실제 사업에 써보는 데 초점을 둡니다.</p>',
              '<div class="homev2-actions">',
                externalLink(flagshipUrl, '대표 영상 보기 <span aria-hidden="true">↗</span>', "homev2-btn homev2-btn-dark"),
                '<a class="homev2-text-link" href="#njs-world">NJS 둘러보기 <span aria-hidden="true">↓</span></a>',
              "</div>",
            "</div>",
            '<article class="homev2-feature">',
              externalLink(flagshipUrl,
                '<span class="homev2-feature-media"><img src="' + esc(flagshipThumb) + '" alt="" loading="eager" fetchpriority="high"><span class="homev2-play" aria-hidden="true">▶</span></span>' +
                '<span class="homev2-feature-body"><span class="homev2-meta">YOUTUBE · 지금 이야기하는 것</span><strong>브랜드 차별화,<br>경쟁사가 쉽게 따라 하지 못하게 만드는 법</strong><span class="homev2-feature-copy">겉모습이 아니라 실제 선택과 비용, 누적된 경로에서 차별화가 생기는 이유를 이야기합니다.</span><span class="homev2-watch">영상 보기 ↗</span></span>',
                "homev2-feature-link"
              ),
            "</article>",
          "</div>",
        "</section>",

        '<section class="homev2-follow">',
          '<div class="homev2-shell">',
            '<div class="homev2-section-head"><div><p class="homev2-overline">이어보기</p><h2>온라인 판매를 넘어<br>사업과 브랜드를 봅니다.</h2></div><a class="homev2-text-link" href="/content">콘텐츠 전체 보기 ↗</a></div>',
            '<div class="homev2-follow-grid">',
              externalLink(cafeUrl,
                '<span class="homev2-thumb"><img src="' + esc(cafeThumb) + '" alt="" loading="lazy"></span><span class="homev2-follow-copy"><span class="homev2-meta">BRAND · LOCAL BUSINESS</span><strong>잘되는 카페는 왜 추천받을까?</strong><p>광고보다 오래 남는 추천과 평판이 어떻게 브랜드 자산이 되는지 봅니다.</p><span>영상 보기 ↗</span></span>',
                "homev2-follow-item"
              ),
              externalLink(psychologyUrl,
                '<span class="homev2-thumb"><img src="' + esc(psychologyThumb) + '" alt="" loading="lazy"></span><span class="homev2-follow-copy"><span class="homev2-meta">MARKETING · CONSUMER</span><strong>마케팅이 안 통할 때 놓치고 있는 것</strong><p>판매자가 하고 싶은 말보다 고객이 무엇에 주의를 기울이고 판단하는지부터 봅니다.</p><span>영상 보기 ↗</span></span>',
                "homev2-follow-item"
              ),
            "</div>",
          "</div>",
        "</section>",

        '<section class="homev2-world" id="njs-world">',
          '<div class="homev2-shell homev2-world-grid">',
            '<div class="homev2-world-intro"><p class="homev2-overline">NJS가 다루는 세계</p><h2>기술 하나가 아니라<br>사업의 연결을 봅니다.</h2><p>브랜드, 고객, 콘텐츠, 발견, 판매와 관계, 플랫폼과 AI가 서로 어떻게 영향을 주는지 해석합니다.</p></div>',
            '<div class="homev2-topic-list" aria-label="NJS 주요 주제">',
              '<a href="/knowledge"><span>01</span><strong>브랜드</strong><em>선택받을 이유와 실제 차별화</em></a>',
              '<a href="/knowledge"><span>02</span><strong>고객</strong><em>소비자 심리와 구매 상황</em></a>',
              '<a href="/content"><span>03</span><strong>콘텐츠</strong><em>발견되고 신뢰받는 이야기</em></a>',
              '<a href="/knowledge"><span>04</span><strong>발견</strong><em>검색·추천·AEO/GEO</em></a>',
              '<a href="/knowledge"><span>05</span><strong>판매와 관계</strong><em>전환 이후에도 남는 고객 자산</em></a>',
              '<a href="/content"><span>06</span><strong>플랫폼과 AI</strong><em>도구보다 구조와 통제권</em></a>',
            "</div>",
          "</div>",
        "</section>",

        '<section class="homev2-depth">',
          '<div class="homev2-shell">',
            '<div class="homev2-section-head"><div><p class="homev2-overline">더 깊게 필요할 때</p><h2>같은 주제도<br>필요한 깊이가 다릅니다.</h2></div></div>',
            '<div class="homev2-depth-grid">',
              '<a href="/knowledge"><span>KNOWLEDGE</span><strong>빠르게 이해하기</strong><p>개념과 사례를 짧게 확인하고, 필요할 때 다시 찾을 수 있습니다.</p><em>지식 둘러보기 ↗</em></a>',
              '<a href="' + esc(courses) + '"><span>COURSE</span><strong>순서대로 배우기</strong><p>하나의 주제를 기초부터 적용까지 구조화된 경로로 배웁니다.</p><em>강의 둘러보기 ↗</em></a>',
              '<a href="' + esc(community) + '"><span>COMMUNITY</span><strong>사람과 풀어보기</strong><p>실제 상황에서 막힌 질문과 경험을 나누며 다른 사람의 판단을 참고합니다.</p><em>커뮤니티 들어가기 ↗</em></a>',
            "</div>",
          "</div>",
        "</section>",

        '<section class="homev2-community">',
          '<div class="homev2-shell homev2-community-grid">',
            '<div><p class="homev2-overline homev2-overline-light">COMMUNITY OF PRACTICE</p><h2>누군가 해본 경험은<br>다른 사람의 다음 판단이 됩니다.</h2><p>맥작가가 일방적으로 말하는 곳에 머물지 않습니다. 질문과 실행 경험이 쌓이고, 좋은 사례는 다시 지식과 콘텐츠를 더 정확하게 만드는 재료가 됩니다.</p><a class="homev2-btn homev2-btn-light" href="' + esc(community) + '">커뮤니티 둘러보기</a></div>',
            '<div class="homev2-community-modes"><div><span>01</span><strong>질문</strong><p>지금 막힌 문제를 구체적으로 묻습니다.</p></div><div><span>02</span><strong>경험</strong><p>직접 해본 과정과 판단을 나눕니다.</p></div><div><span>03</span><strong>결과</strong><p>실행 뒤 무엇이 달라졌는지 남깁니다.</p></div><div><span>04</span><strong>사례</strong><p>다른 사람도 참고할 수 있는 경험을 축적합니다.</p></div></div>',
          "</div>",
        "</section>",

        '<section class="homev2-book">',
          '<div class="homev2-shell homev2-book-grid">',
            '<div class="homev2-book-art"><img src="' + esc(bookImage) + '" alt="그냥 팔지 말라 스마트스토어 책 표지" loading="lazy"></div>',
            '<div class="homev2-book-copy"><p class="homev2-overline">BOOK → NJS</p><h2>『그냥 팔지 말라』에서<br>시작한 질문을 계속 이어갑니다.</h2><p>책은 NJS와 무관한 과거 상품이 아닙니다. 판매 기술만 좇지 말고 사업의 구조와 고객을 보자는 문제의식은 영상, 지식, 강의와 커뮤니티에서 더 넓은 주제로 이어집니다.</p><div class="homev2-actions"><a class="homev2-btn homev2-btn-dark" href="/book">책 이야기 보기</a><a class="homev2-text-link" href="/content">관련 콘텐츠 보기 ↗</a></div></div>',
          "</div>",
        "</section>",

        '<section class="homev2-proof">',
          '<div class="homev2-shell homev2-proof-grid">',
            '<div class="homev2-profile"><img src="' + esc(profileImage) + '" alt="맥작가" loading="lazy"></div>',
            '<div class="homev2-proof-copy"><p class="homev2-overline">맥작가</p><h2>이론만 설명하지 않는 이유.</h2><p>브랜드·유통·제조·온라인 커머스 현장을 직접 경험하고, 그 과정에서 생긴 질문을 책과 강의, 콘텐츠로 정리해 왔습니다.</p><div class="homev2-proof-list"><span>『그냥 팔지 말라 스마트스토어』 저자</span><span>The North Face MD 경험</span><span>글로벌 브랜드 OEM·ODM 해외영업</span><span>제조업 창업 · 온라인 커머스 운영</span></div><a class="homev2-text-link" href="/about">맥작가와 NJS의 관점 보기 ↗</a></div>',
          "</div>",
        "</section>",

        '<section class="homev2-continuity">',
          '<div class="homev2-shell homev2-continuity-inner"><div><p class="homev2-overline">CONTINUE</p><h2>이미 이어서 보고 있나요?</h2><p>저장한 지식과 학습 중인 내용을 내 공간에서 계속할 수 있습니다.</p></div><a class="homev2-btn homev2-btn-dark" href="' + esc(mySpace) + '">내 공간으로</a></div>',
        "</section>",
      "</main>",

      '<footer class="homev2-footer"><div class="homev2-shell homev2-footer-grid"><div><a class="homev2-brand homev2-brand-footer" href="/home-v2"><span class="homev2-brand-mark" aria-hidden="true">NJS</span><span>NEVER JUST SELL</span></a><p>맥작가의 미디어, 학습, 커뮤니티를 연결합니다.</p></div><nav aria-label="하단 메뉴"><a href="/content">콘텐츠</a><a href="/knowledge">지식</a><a href="' + esc(courses) + '">배우기</a><a href="' + esc(community) + '">커뮤니티</a><a href="/book">책</a><a href="/lecture">강연</a><a href="/support">고객지원</a></nav><a class="homev2-footer-space" href="' + esc(mySpace) + '">내 공간 ↗</a></div></footer>',
      '<script src="/home-v2-app.js" defer></script>',
    "</body>",
    "</html>"
  ].join("\n");

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    }
  });
}

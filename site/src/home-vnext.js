function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function link(href, label, className = "") {
  return '<a href="' + esc(href) + '" class="' + esc(className) + '">' + esc(label) + '</a>';
}

export function renderHomeVNextPage({ siteOrigin, authOrigin, communityOrigin }) {
  const mySpace = authOrigin + "/my-space";
  const courses = authOrigin + "/courses";
  const community = communityOrigin + "/";
  const html = [
    "<!doctype html>",
    '<html lang="ko">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    "<title>NJS Home VNext Preview | NEVER JUST SELL</title>",
    '<meta name="description" content="작은 사업자를 위한 NEVER JUST SELL의 새로운 홈 UX 프리뷰.">',
    '<meta name="robots" content="noindex,nofollow">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="stylesheet" href="/home-vnext.css">',
    "</head>",
    '<body class="vnext-body">',
    '<a class="vnext-skip" href="#main-content">본문 바로가기</a>',
    '<header class="vnext-header">',
      '<div class="vnext-shell vnext-header-inner">',
        '<a class="vnext-brand" href="/home-vnext" aria-label="NEVER JUST SELL Home VNext"><span class="vnext-brand-dot" aria-hidden="true"></span><span>NEVER JUST SELL</span></a>',
        '<button class="vnext-menu-toggle" type="button" aria-controls="vnext-nav" aria-expanded="false">메뉴</button>',
        '<nav class="vnext-nav" id="vnext-nav" aria-label="주요 메뉴">',
          '<a href="/knowledge">지식</a>',
          '<a href="' + esc(courses) + '">배우기</a>',
          '<a href="#programs">프로그램</a>',
          '<a href="' + esc(community) + '">커뮤니티</a>',
          '<a href="/about">맥작가</a>',
        "</nav>",
        '<div class="vnext-utility"><a class="vnext-search-link" href="/knowledge" aria-label="지식 검색">검색</a><a class="vnext-my-space" href="' + esc(mySpace) + '">내 공간</a></div>',
      "</div>",
    "</header>",
    '<main id="main-content">',
      '<section class="vnext-hero">',
        '<div class="vnext-shell vnext-hero-grid">',
          '<div class="vnext-hero-copy">',
            '<p class="vnext-kicker">FOR SMALL BUSINESS</p>',
            '<h1>지식은 많습니다.<br><span>문제는 내 사업에<br>써먹는 것입니다.</span></h1>',
            '<p class="vnext-lead">브랜드를 만들고, 콘텐츠로 고객을 만나고, 배운 것을 실제 사업에 적용합니다. 작은 사업을 운영하는 사람이 판단하고 실행하도록 돕는 실전 마케팅 플랫폼입니다.</p>',
            '<div class="vnext-actions"><a class="vnext-btn vnext-btn-primary" href="#problems">지금 필요한 것 찾기</a><a class="vnext-text-link" href="/knowledge">지식부터 둘러보기 <span aria-hidden="true">↗</span></a></div>',
          "</div>",
          '<div class="vnext-hero-product" aria-label="NEVER JUST SELL의 지식 활용 흐름">',
            '<div class="vnext-product-top"><span>내 사업에 쓰는 지식</span><span class="vnext-live-dot">NJS</span></div>',
            '<div class="vnext-flow-row"><span class="vnext-flow-no">01</span><div><strong>찾는다</strong><p>필요한 지식과 실제 사례를 찾습니다.</p></div></div>',
            '<div class="vnext-flow-row"><span class="vnext-flow-no">02</span><div><strong>담는다</strong><p>내게 필요한 지식을 모아 다시 찾습니다.</p></div><span class="vnext-mini-sticker">포지셔닝</span></div>',
            '<div class="vnext-flow-row is-accent"><span class="vnext-flow-no">03</span><div><strong>써본다</strong><p>내 사업에 적용하고 결과를 남깁니다.</p></div><span class="vnext-status">진행 중</span></div>',
            '<div class="vnext-flow-row"><span class="vnext-flow-no">04</span><div><strong>나눈다</strong><p>실제 경험이 다른 사람의 지식이 됩니다.</p></div></div>',
          "</div>",
        "</div>",
      "</section>",

      '<section class="vnext-problems" id="problems">',
        '<div class="vnext-shell">',
          '<div class="vnext-section-heading"><p class="vnext-kicker">START WITH THE PROBLEM</p><h2>요즘 무엇이<br>가장 답답한가요?</h2><p>서비스 메뉴를 고르기 전에 지금 해결하려는 문제부터 시작합니다.</p></div>',
          '<div class="vnext-problem-grid">',
            '<a href="/knowledge?problem=brand"><span>01</span><strong>브랜드가 애매하다</strong><p>누구에게 왜 선택받아야 하는지 정리하고 싶을 때.</p><i aria-hidden="true">↗</i></a>',
            '<a href="/knowledge?problem=content"><span>02</span><strong>콘텐츠가 어렵다</strong><p>무엇을 말하고 어떻게 꾸준히 만들지 막힐 때.</p><i aria-hidden="true">↗</i></a>',
            '<a href="/knowledge?problem=discovery"><span>03</span><strong>고객에게 발견되지 않는다</strong><p>검색·콘텐츠·AI에서 발견될 이유를 만들고 싶을 때.</p><i aria-hidden="true">↗</i></a>',
            '<a href="/knowledge?problem=conversion"><span>04</span><strong>판매·전환이 막힌다</strong><p>유입은 있지만 구매가 이어지지 않을 때.</p><i aria-hidden="true">↗</i></a>',
            '<a href="/knowledge?problem=relationship"><span>05</span><strong>고객관계를 쌓고 싶다</strong><p>재구매와 직접 고객관계를 사업 자산으로 만들고 싶을 때.</p><i aria-hidden="true">↗</i></a>',
            '<a href="/knowledge?problem=platform"><span>06</span><strong>플랫폼 의존이 불안하다</strong><p>광고비와 정책 변화에 흔들리지 않는 구조가 필요할 때.</p><i aria-hidden="true">↗</i></a>',
          "</div>",
        "</div>",
      "</section>",

      '<section class="vnext-loop">',
        '<div class="vnext-shell vnext-loop-grid">',
          '<div class="vnext-loop-intro"><p class="vnext-kicker vnext-kicker-light">HOW NJS WORKS</p><h2>읽는 데서<br>끝내지 않습니다.</h2><p>좋은 지식을 발견한 뒤 실제 사업에 쓰고, 경험을 다시 나누는 과정까지 하나로 연결합니다.</p></div>',
          '<ol class="vnext-loop-list">',
            '<li><span>01</span><div><strong>발견</strong><p>지식·사례·변화를 찾습니다.</p></div></li>',
            '<li><span>02</span><div><strong>수집</strong><p>필요한 지식을 내 지식에 담습니다.</p></div></li>',
            '<li><span>03</span><div><strong>실행</strong><p>내 사업에 맞는 작은 행동으로 바꿉니다.</p></div></li>',
            '<li><span>04</span><div><strong>공유</strong><p>결과와 경험을 질문·답변과 연결합니다.</p></div></li>',
          "</ol>",
        "</div>",
      "</section>",

      '<section class="vnext-now">',
        '<div class="vnext-shell">',
          '<div class="vnext-section-row"><div><p class="vnext-kicker">SEE IT IN PRACTICE</p><h2>지금 바로 볼 수 있는 것</h2></div><a class="vnext-text-link" href="/knowledge">지식 전체 보기 <span aria-hidden="true">↗</span></a></div>',
          '<div class="vnext-content-grid">',
            '<a class="vnext-content-card is-knowledge" href="/knowledge/positioning"><div class="vnext-card-meta"><span>지식</span><span>브랜드</span></div><h3>포지셔닝</h3><p>고객의 머릿속에서 어떤 기준으로 기억되고 비교될지를 정하는 전략.</p><div class="vnext-card-foot"><span>내 사업의 선택 이유를 정리할 때</span><b aria-hidden="true">↗</b></div></a>',
            '<a class="vnext-content-card" href="/knowledge/case-platform-rule-change"><div class="vnext-card-meta"><span>사례</span><span>플랫폼</span></div><h3>플랫폼 규정 변경으로<br>성과가 흔들린 경우</h3><p>한 가지 노출 기술에 의존한 구조를 여러 고객 접점으로 분산합니다.</p><div class="vnext-card-foot"><span>실제 상황에서 판단하기</span><b aria-hidden="true">↗</b></div></a>',
            '<a class="vnext-content-card is-program" href="#programs"><div class="vnext-card-meta"><span>프로그램</span><span>기획 중</span></div><h3>책을 읽고 끝내지 않는<br>저자·독자 프로그램</h3><p>저자의 보충 콘텐츠, 독자의 생각, 진행 기록을 연결하는 프로그램을 준비하고 있습니다.</p><div class="vnext-card-foot"><span>프로그램 방향 보기</span><b aria-hidden="true">↗</b></div></a>',
          "</div>",
        "</div>",
      "</section>",

      '<section class="vnext-deeper" id="programs">',
        '<div class="vnext-shell">',
          '<div class="vnext-section-heading"><p class="vnext-kicker">GO DEEPER WHEN YOU NEED IT</p><h2>필요해질 때<br>더 깊게 들어갑니다.</h2><p>수익화는 먼저 가치를 경험한 뒤, 다음 단계가 필요한 순간에만 자연스럽게 연결합니다.</p></div>',
          '<div class="vnext-deeper-grid">',
            '<a href="' + esc(courses) + '"><span>LEARN</span><strong>체계적으로 배우기</strong><p>강의와 전자콘텐츠로 하나의 주제를 순서대로 배웁니다.</p><em>강의 보기 ↗</em></a>',
            '<a href="' + esc(community) + '"><span>COMMUNITY</span><strong>막힌 문제를 함께 풀기</strong><p>질문하고, 실제 경험을 나누고, 지식을 답변에 연결합니다.</p><em>커뮤니티 보기 ↗</em></a>',
            '<a href="#programs"><span>PROGRAM</span><strong>사람과 함께 실행하기</strong><p>일정·저자/전문가·동료가 필요한 순간에는 프로그램으로 더 깊게 갑니다.</p><em>프로그램 준비 중</em></a>',
          "</div>",
        "</div>",
      "</section>",

      '<section class="vnext-proof">',
        '<div class="vnext-shell vnext-proof-grid">',
          '<div><p class="vnext-kicker">WHY NJS</p><h2>이론만 설명하지<br>않는 이유.</h2></div>',
          '<div class="vnext-proof-copy"><p>브랜드와 글로벌 비즈니스 현장에서 일했고, 직접 사업을 만들고 온라인 판매를 운영했으며, 그 경험을 책과 교육으로 정리해 왔습니다.</p><div class="vnext-proof-facts"><span>『그냥 팔지 말라 스마트스토어』 저자</span><span>The North Face MD 경험</span><span>글로벌 브랜드 OEM·ODM 해외영업</span><span>제조업 창업 · 온라인 커머스 운영</span></div><a class="vnext-text-link" href="/about">맥작가와 NJS의 관점 보기 <span aria-hidden="true">↗</span></a></div>',
        "</div>",
      "</section>",
    "</main>",
    '<footer class="vnext-footer"><div class="vnext-shell vnext-footer-grid"><div><a class="vnext-brand" href="/home-vnext"><span class="vnext-brand-dot" aria-hidden="true"></span><span>NEVER JUST SELL</span></a><p>작은 사업의 브랜드·마케팅 지식을 실제 행동으로 연결합니다.</p></div><nav aria-label="하단 메뉴"><a href="/knowledge">지식</a><a href="' + esc(courses) + '">배우기</a><a href="' + esc(community) + '">커뮤니티</a><a href="/about">맥작가</a><a href="/support">고객지원</a></nav><a class="vnext-footer-space" href="' + esc(mySpace) + '">내 공간 ↗</a></div></footer>',
    '<script src="/home-vnext-app.js" defer></script>',
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

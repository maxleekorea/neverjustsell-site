(() => {
  const isHome = location.pathname === '/' || location.pathname === '/index.html';
  document.documentElement.classList.add('njs-ready');
  if (!isHome) return;

  const media = {
    profile: 'https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/68868a93-5045-4e7b-936d-a9a37c82b85b.png',
    lecture: 'https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/19678aa3-1daa-4ede-bca4-2bf24092c9b3.png',
    book: 'https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/remove_background.png'
  };

  const boot = () => {
    const mount = document.querySelector('#contents') || document.querySelector('main') || document.querySelector('.contents') || document.querySelector('#container');
    if (!mount) return;

    const params = new URLSearchParams(location.search);
    const isVimeoTest = params.get('vimeo-test') === '1';

    if (isVimeoTest) {
      [...mount.children].forEach((el) => el.classList.add('njs-original-home'));
      document.documentElement.classList.add('njs-home-active');

      const testRoot = document.createElement('div');
      testRoot.id = 'njs-vimeo-test';
      testRoot.innerHTML = `
        <div style="min-height:100vh;background:#f4f0ea;color:#151311;font-family:Pretendard,-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;padding:48px 24px 80px;box-sizing:border-box;">
          <div style="width:min(100%,1120px);margin:0 auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:28px;">
              <div>
                <div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#4c2600;margin-bottom:8px;">VIMEO EMBED TEST</div>
                <h1 style="margin:0;font-size:clamp(28px,4vw,48px);line-height:1.1;letter-spacing:-.04em;">강의 플레이어 테스트</h1>
              </div>
              <a href="/" style="color:#151311;text-decoration:none;border-bottom:1px solid #151311;padding-bottom:2px;font-size:14px;font-weight:700;">홈으로</a>
            </div>

            <div style="background:#111;padding:0;box-shadow:0 24px 60px rgba(0,0,0,.12);">
              <div style="position:relative;padding-top:56.25%;overflow:hidden;">
                <iframe src="https://player.vimeo.com/video/1227267267?badge=0&autopause=0&player_id=0&app_id=58479&dnt=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Vimeo 강의 테스트 영상"></iframe>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#d9d1c8;margin-top:28px;border:1px solid #d9d1c8;">
              <div style="background:#fff;padding:22px;"><strong style="display:block;font-size:13px;margin-bottom:7px;">확인 1</strong><span style="font-size:14px;line-height:1.6;color:#655f59;">영상이 정상 재생되는지 확인합니다.</span></div>
              <div style="background:#fff;padding:22px;"><strong style="display:block;font-size:13px;margin-bottom:7px;">확인 2</strong><span style="font-size:14px;line-height:1.6;color:#655f59;">Vimeo 로고와 불필요한 버튼이 숨겨졌는지 봅니다.</span></div>
              <div style="background:#fff;padding:22px;"><strong style="display:block;font-size:13px;margin-bottom:7px;">확인 3</strong><span style="font-size:14px;line-height:1.6;color:#655f59;">모바일에서도 비율과 전체화면이 정상인지 확인합니다.</span></div>
            </div>

            <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#7b746d;">이 주소는 테스트용이며 사이트 메뉴에는 노출되지 않습니다.</p>
          </div>
        </div>
      `;
      mount.prepend(testRoot);
      document.title = 'Vimeo 강의 플레이어 테스트 | NEVER JUST SELL';
      return;
    }

    if (document.querySelector('#njs-home')) return;
    [...mount.children].forEach((el) => el.classList.add('njs-original-home'));

    const root = document.createElement('div');
    root.id = 'njs-home';
    root.innerHTML = `
      <header class="njs-header">
        <div class="njs-shell njs-header-inner">
          <a class="njs-brand" href="/" aria-label="Never Just Sell 홈">
            <span class="njs-brand-mark" aria-hidden="true"></span>
            <span>NEVER JUST SELL</span>
          </a>
          <button class="njs-menu-toggle" type="button" aria-expanded="false" aria-controls="njs-nav">MENU</button>
          <nav class="njs-nav" id="njs-nav" aria-label="주요 메뉴">
            <a href="#about">맥작가</a>
            <a href="#book">책</a>
            <a href="#class">강의</a>
            <a href="#contents-njs">콘텐츠</a>
            <a href="#store">스토어</a>
            <a href="#lecture">강연</a>
            <a href="/board/index.html">커뮤니티</a>
          </nav>
          <div class="njs-utility">
            <a href="/member/login.html">로그인</a>
            <a href="/order/basket.html">장바구니</a>
          </div>
        </div>
      </header>

      <main>
        <section class="njs-hero">
          <div class="njs-shell njs-hero-grid">
            <div class="njs-hero-copy">
              <p class="njs-eyebrow">ONLINE COMMERCE · BUSINESS · BRAND</p>
              <h1>그냥 팔지 말라.</h1>
              <p class="njs-hero-lead">온라인 판매를<br>사업의 관점에서 설명합니다.</p>
              <p class="njs-hero-name">온라인 커머스 작가 · 사업가 <strong>맥작가</strong></p>
              <div class="njs-actions">
                <a class="njs-btn njs-btn-dark" href="#book">책 보기</a>
                <a class="njs-btn njs-btn-line" href="https://seller.liveklass.com" target="_blank" rel="noopener">온라인 강의</a>
              </div>
            </div>
            <div class="njs-hero-visual" aria-label="맥작가 프로필">
              <div style="width:100%;min-height:100%;overflow:hidden;background:#b8b8b8;">
                <img src="${media.profile}" alt="맥작가 프로필" style="display:block;width:100%;height:100%;min-height:618px;object-fit:cover;object-position:center center;">
              </div>
            </div>
          </div>
        </section>

        <section class="njs-credentials" id="about">
          <div class="njs-shell njs-credential-grid">
            <div><span>AUTHOR</span><strong>『그냥 팔지 말라 스마트스토어』 저자</strong></div>
            <div><span>MERCHANDISING</span><strong>The North Face MD</strong></div>
            <div><span>GLOBAL BUSINESS</span><strong>글로벌 브랜드 OEM·ODM 해외영업</strong></div>
            <div><span>ENTREPRENEUR</span><strong>제조업 창업 · 온라인 커머스 운영</strong></div>
          </div>
        </section>

        <section class="njs-book" id="book">
          <div class="njs-shell njs-book-grid">
            <div class="njs-book-art">
              <img src="${media.book}" alt="그냥 팔지 말라 스마트스토어 책" style="display:block;width:min(100%,520px);height:auto;filter:drop-shadow(28px 32px 22px rgba(0,0,0,.28));">
            </div>
            <div class="njs-book-copy">
              <p class="njs-eyebrow njs-eyebrow-light">BOOK</p>
              <h2>판매 기술이 아니라<br>사업 전체를 보는 책.</h2>
              <p>검색, 광고, 상세페이지처럼 눈앞의 기술만 좇지 않고 상품 기획부터 유통, 고객 경험, 브랜드와 AI까지 온라인 판매의 구조를 하나로 연결합니다.</p>
              <p class="njs-book-meta">『그냥 팔지 말라 스마트스토어』 · 애플씨드</p>
            </div>
          </div>
        </section>

        <section class="njs-point">
          <div class="njs-shell njs-point-grid">
            <p class="njs-section-no">01 / POINT OF VIEW</p>
            <div>
              <h2>좋은 상품을 많이 노출하는 것만으로<br>판매되던 시대는 지났습니다.</h2>
              <p>검색, 광고, 콘텐츠, 브랜드, 고객 경험은 따로 움직이지 않습니다. 시장과 고객을 이해하고, 선택받는 이유를 설계하고, 다시 구매할 구조까지 만드는 것이 온라인 사업입니다.</p>
            </div>
          </div>
        </section>

        <section class="njs-class" id="class">
          <div class="njs-shell">
            <div class="njs-section-head">
              <div><p class="njs-section-no">02 / CLASS</p><h2>온라인 강의</h2></div>
              <a class="njs-text-link" href="https://seller.liveklass.com" target="_blank" rel="noopener">강의 사이트 보기 →</a>
            </div>
            <div class="njs-class-grid">
              <article><span>01</span><h3>온라인 유통업의 본질</h3><p>상품을 파는 기술보다 먼저 유통과 시장이 작동하는 구조를 이해합니다.</p></article>
              <article><span>02</span><h3>검색 · 키워드 · 롱테일</h3><p>검색 노출을 세팅값이 아니라 고객의 탐색 행동과 수요의 관점에서 봅니다.</p></article>
              <article><span>03</span><h3>마케팅 · 브랜드 · AI</h3><p>단기 판매와 장기 경쟁력을 함께 만드는 방법을 실제 사업의 관점에서 다룹니다.</p></article>
            </div>
          </div>
        </section>

        <section class="njs-content" id="contents-njs">
          <div class="njs-shell">
            <div class="njs-section-head">
              <div><p class="njs-section-no">03 / CONTENT</p><h2>생각을 콘텐츠로 남깁니다.</h2></div>
            </div>
            <div class="njs-content-grid">
              <article class="njs-content-card"><span>YOUTUBE</span><h3>온라인 판매의 통념을 다시 봅니다.</h3><p>스마트스토어, 플랫폼, 마케팅과 브랜드를 사업자의 시선으로 해석합니다.</p></article>
              <article class="njs-content-card"><span>WRITING</span><h3>기술보다 오래 남는 원리를 다룹니다.</h3><p>유통, 소비자 행동, 검색, 브랜딩과 비즈니스 구조를 연결해서 설명합니다.</p></article>
              <article class="njs-content-card"><span>RESEARCH</span><h3>유행을 따라가기보다 구조를 봅니다.</h3><p>새로운 도구와 트렌드가 실제 사업에서 어떤 의미를 갖는지 검토합니다.</p></article>
            </div>
          </div>
        </section>

        <section class="njs-lecture" id="lecture">
          <div class="njs-shell njs-lecture-grid">
            <div style="min-height:520px;overflow:hidden;background:#ddd;">
              <img src="${media.lecture}" alt="맥작가 오프라인 강연" style="display:block;width:100%;height:100%;min-height:520px;object-fit:cover;object-position:center center;">
            </div>
            <div class="njs-lecture-copy">
              <p class="njs-section-no">04 / OFFLINE LECTURE</p>
              <h2>기업 · 기관 · 교육기관 강연</h2>
              <p>온라인 커머스, 판로, 유통, 마케팅, 브랜드와 AI를 실제 사업에서 작동하는 언어로 설명합니다.</p>
              <a class="njs-btn njs-btn-dark" href="mailto:max.lee.korea@gmail.com">강연 문의</a>
            </div>
          </div>
        </section>

        <section class="njs-store" id="store">
          <div class="njs-shell">
            <div class="njs-section-head">
              <div><p class="njs-section-no">05 / STORE</p><h2>필요한 것을 직접 만듭니다.</h2></div>
            </div>
            <div class="njs-store-grid">
              <article><span>01</span><h3>전자책</h3><p>실무에 바로 쓰는 지식과 자료.</p></article>
              <article><span>02</span><h3>커피 원두</h3><p>일과 생각이 이어지는 시간을 위한 커피.</p></article>
              <article><span>03</span><h3>굿즈</h3><p>NEVER JUST SELL의 관점을 담은 제품.</p></article>
            </div>
            <p class="njs-store-note">상품은 준비되는 순서대로 공개합니다.</p>
          </div>
        </section>

        <section class="njs-community">
          <div class="njs-shell njs-community-inner">
            <div><p class="njs-eyebrow njs-eyebrow-light">COMMUNITY</p><h2>읽고, 보고, 실행한 이야기가<br>이어지는 공간.</h2></div>
            <a class="njs-btn njs-btn-light" href="/board/index.html">커뮤니티 들어가기</a>
          </div>
        </section>
      </main>
    `;

    mount.prepend(root);
    document.documentElement.classList.add('njs-home-active');

    const toggle = root.querySelector('.njs-menu-toggle');
    const nav = root.querySelector('.njs-nav');
    toggle?.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav?.classList.toggle('is-open', !open);
    });
    nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      toggle?.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }));

    document.title = '맥작가 | 그냥 팔지 말라 · 온라인 커머스와 사업';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = '『그냥 팔지 말라 스마트스토어』 저자 맥작가의 공식 사이트. 온라인 커머스, 유통, 마케팅, 브랜드, 강의와 콘텐츠를 소개합니다.';
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

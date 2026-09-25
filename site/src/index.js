const DEFAULT_SITE_ORIGIN = "https://www.neverjustsell.com";
const DEFAULT_AUTH_ORIGIN = "https://classroom.neverjustsell.com";
const DEFAULT_COMMUNITY_ORIGIN = "https://community.neverjustsell.com";
const DEFAULT_SHOP_ORIGIN = "https://neverjustsell.cafe24.com";

const media = {
  profile: "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/68868a93-5045-4e7b-936d-a9a37c82b85b.png",
  lecture: "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/19678aa3-1daa-4ede-bca4-2bf24092c9b3.png",
  book: "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/remove_background.png"
};

function cleanOrigin(value, fallback) {
  try {
    const url = new URL(String(value || fallback));
    return url.origin;
  } catch {
    return fallback;
  }
}

function siteOrigin(env) {
  return cleanOrigin(env.SITE_ORIGIN, DEFAULT_SITE_ORIGIN);
}

function authOrigin(env) {
  return cleanOrigin(env.AUTH_ORIGIN, DEFAULT_AUTH_ORIGIN);
}

function communityOrigin(env) {
  return cleanOrigin(env.COMMUNITY_ORIGIN, DEFAULT_COMMUNITY_ORIGIN);
}

function shopOrigin(env) {
  return cleanOrigin(env.SHOP_ORIGIN, DEFAULT_SHOP_ORIGIN);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function redirect(location, status = 302) {
  return new Response(null, {
    status,
    headers: {
      Location: location,
      "Cache-Control": "no-store"
    }
  });
}

function text(body, contentType = "text/plain; charset=utf-8", init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", contentType);
  return new Response(body, { ...init, headers });
}

function json(data, init = {}) {
  return text(JSON.stringify(data), "application/json; charset=utf-8", {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init.headers || {})
    }
  });
}

function pageData(pathname) {
  const pages = {
    "/": {
      title: "그냥 팔지 말라 | NEVER JUST SELL",
      description: "온라인 판매를 사업의 관점에서 설명합니다. 맥작가의 책, 강의, 콘텐츠, 강연과 커뮤니티.",
      body: "home",
      image: media.profile
    },
    "/about": {
      title: "맥작가 | NEVER JUST SELL",
      description: "온라인 커머스 작가·사업가 맥작가의 경력과 관점을 소개합니다.",
      body: "about",
      image: media.profile
    },
    "/book": {
      title: "그냥 팔지 말라 스마트스토어 | 맥작가",
      description: "『그냥 팔지 말라 스마트스토어』. 검색, 광고, 상품, 유통, 고객 경험, 브랜드와 AI를 하나의 사업 구조로 연결합니다.",
      body: "book",
      image: media.book
    },
    "/class": {
      title: "온라인 강의 | NEVER JUST SELL",
      description: "유통, 검색, 키워드, 마케팅, 브랜드와 AI를 사업의 관점에서 연결하는 맥작가의 온라인 강의.",
      body: "class",
      image: media.profile
    },
    "/content": {
      title: "콘텐츠 | NEVER JUST SELL",
      description: "온라인 판매, 유통, 마케팅과 브랜드에 관한 맥작가의 콘텐츠를 정리합니다.",
      body: "content",
      image: media.profile
    },
    "/lecture": {
      title: "강연 | NEVER JUST SELL",
      description: "온라인 커머스, 판로, 마케팅, 브랜드와 AI를 주제로 한 맥작가의 강연 안내.",
      body: "lecture",
      image: media.lecture
    }
  };
  return pages[pathname] || null;
}

function nav(env) {
  const classroom = `${authOrigin(env)}/classroom`;
  const mySpace = `${authOrigin(env)}/my-space`;
  return `
    <header class="njs-header">
      <div class="njs-shell njs-header-inner">
        <a class="njs-brand" href="/" aria-label="Never Just Sell 홈">
          <span class="njs-brand-mark" aria-hidden="true"></span>
          <span>NEVER JUST SELL</span>
        </a>
        <button class="njs-menu-toggle" type="button" aria-expanded="false" aria-controls="njs-nav">MENU</button>
        <nav class="njs-nav" id="njs-nav" aria-label="주요 메뉴">
          <a href="/about">맥작가</a>
          <a href="/book">책</a>
          <a href="/class">강의</a>
          <a href="/content">콘텐츠</a>
          <a href="/store">스토어</a>
          <a href="/lecture">강연</a>
          <a href="/community">커뮤니티</a>
          <span class="njs-mobile-services" aria-label="회원 메뉴">
            <a data-njs-auth-link href="/login">로그인</a>
            <a href="${escapeHtml(mySpace)}">내 공간</a>
          </span>
        </nav>
        <div class="njs-utility">
          <a data-njs-auth-link href="/login">로그인</a>
          <a href="${escapeHtml(mySpace)}">내 공간</a>
        </div>
      </div>
    </header>`;
}

function footer(env) {
  return `
    <footer class="njs-footer">
      <div class="njs-shell njs-footer-grid">
        <div>
          <a class="njs-brand njs-brand-footer" href="/"><span class="njs-brand-mark" aria-hidden="true"></span><span>NEVER JUST SELL</span></a>
          <p>온라인 판매를 사업의 관점에서 설명합니다.</p>
        </div>
        <nav aria-label="하단 메뉴">
          <a href="/about">맥작가</a><a href="/book">책</a><a href="/class">강의</a><a href="/content">콘텐츠</a><a href="/lecture">강연</a><a href="/community">커뮤니티</a>
        </nav>
        <div class="njs-footer-links">
          <a href="${escapeHtml(shopOrigin(env))}/member/agreement.html">회원가입</a>
          <a href="${escapeHtml(shopOrigin(env))}/member/privacy.html">개인정보처리방침</a>
          <a href="/sitemap.xml">사이트맵</a>
        </div>
      </div>
    </footer>`;
}

function homeBody(env) {
  const classroom = `${authOrigin(env)}/classroom`;
  const mySpace = `${authOrigin(env)}/my-space`;
  const freeLesson = `${authOrigin(env)}/courses/online-commerce-basics`;
  return `
    <main id="main-content">
      <section class="njs-hero">
        <div class="njs-shell njs-hero-grid">
          <div class="njs-hero-copy">
            <p class="njs-eyebrow">ONLINE COMMERCE · BUSINESS · BRAND</p>
            <h1>그냥 팔지<br>말라.</h1>
            <p class="njs-hero-lead">온라인 판매를<br>사업의 관점에서 설명합니다.</p>
            <p class="njs-hero-name">온라인 커머스 작가 · 사업가 <strong>맥작가</strong></p>
            <div class="njs-actions">
              <a class="njs-btn njs-btn-dark" href="/book">책 보기</a>
              <a class="njs-btn njs-btn-line" href="/class">온라인 강의</a>
            </div>
          </div>
          <div class="njs-hero-visual" aria-label="맥작가 프로필">
            <img src="${media.profile}" alt="맥작가 프로필" loading="eager" fetchpriority="high">
          </div>
        </div>
      </section>

      <section class="njs-credentials">
        <div class="njs-shell njs-credential-grid">
          <div><span>AUTHOR</span><strong>『그냥 팔지 말라 스마트스토어』 저자</strong></div>
          <div><span>MERCHANDISING</span><strong>The North Face MD</strong></div>
          <div><span>GLOBAL BUSINESS</span><strong>글로벌 브랜드 OEM·ODM 해외영업</strong></div>
          <div><span>ENTREPRENEUR</span><strong>제조업 창업 · 온라인 커머스 운영</strong></div>
        </div>
      </section>

      <section class="njs-book njs-section-dark">
        <div class="njs-shell njs-book-grid">
          <div class="njs-book-art"><img src="${media.book}" alt="그냥 팔지 말라 스마트스토어 책 표지" loading="lazy"></div>
          <div class="njs-book-copy">
            <p class="njs-eyebrow njs-eyebrow-light">BOOK</p>
            <h2>판매 기술이 아니라<br>사업 전체를 보는 책.</h2>
            <p>검색, 광고, 상세페이지처럼 눈앞의 기술만 좇지 않고 상품 기획부터 유통, 고객 경험, 브랜드와 AI까지 온라인 판매의 구조를 하나로 연결합니다.</p>
            <a class="njs-text-link njs-text-link-light" href="/book">책 자세히 보기 →</a>
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

      <section class="njs-class">
        <div class="njs-shell">
          <div class="njs-section-head">
            <div><p class="njs-section-no">02 / CLASS</p><h2>온라인 강의</h2></div>
            <a class="njs-text-link" href="${escapeHtml(freeLesson)}">무료 강의 수강 신청 →</a>
          </div>
          <div class="njs-class-grid">
            <article><span>01</span><h3>온라인 유통업의 본질</h3><p>상품을 파는 기술보다 먼저 유통과 시장이 작동하는 구조를 이해합니다.</p></article>
            <article><span>02</span><h3>검색 · 키워드 · 롱테일</h3><p>검색 노출을 세팅값이 아니라 고객의 탐색 행동과 수요의 관점에서 봅니다.</p></article>
            <article><span>03</span><h3>마케팅 · 브랜드 · AI</h3><p>단기 판매와 장기 경쟁력을 함께 만드는 방법을 실제 사업의 관점에서 다룹니다.</p></article>
          </div>
          <div class="njs-section-actions"><a class="njs-btn njs-btn-dark" href="/class">강의 안내</a><a class="njs-btn njs-btn-line" href="${escapeHtml(mySpace)}">내 공간</a></div>
        </div>
      </section>

      <section class="njs-content">
        <div class="njs-shell">
          <div class="njs-section-head"><div><p class="njs-section-no">03 / CONTENT</p><h2>생각을 콘텐츠로 남깁니다.</h2></div><a class="njs-text-link" href="/content">콘텐츠 보기 →</a></div>
          <div class="njs-content-grid">
            <article class="njs-content-card"><span>YOUTUBE</span><h3>온라인 판매의 통념을 다시 봅니다.</h3><p>스마트스토어, 플랫폼, 마케팅과 브랜드를 사업자의 시선으로 해석합니다.</p></article>
            <article class="njs-content-card"><span>WRITING</span><h3>기술보다 구조를 설명합니다.</h3><p>유통과 고객, 상품과 채널이 어떻게 연결되는지를 글로 정리합니다.</p></article>
            <article class="njs-content-card"><span>COMMUNITY</span><h3>경험을 검색할 수 있는 지식으로.</h3><p>온라인 판매자의 질문과 실행 경험이 축적되는 커뮤니티를 운영합니다.</p></article>
          </div>
        </div>
      </section>

      <section class="njs-lecture">
        <div class="njs-shell njs-lecture-grid">
          <div class="njs-lecture-visual"><img src="${media.lecture}" alt="맥작가 강연" loading="lazy"></div>
          <div class="njs-lecture-copy"><p class="njs-section-no">04 / LECTURE</p><h2>현장에서 바로 연결되는 이야기.</h2><p>온라인 커머스, 판로, 유통, 마케팅, 브랜드와 AI를 실제 사업 운영의 관점에서 다룹니다.</p><a class="njs-btn njs-btn-dark" href="/lecture">강연 안내</a></div>
        </div>
      </section>

      <section class="njs-community njs-section-dark">
        <div class="njs-shell njs-community-inner">
          <div><p class="njs-eyebrow njs-eyebrow-light">COMMUNITY</p><h2>경험이 쌓이면<br>검색할 수 있는 지식이 됩니다.</h2></div>
          <a class="njs-btn njs-btn-light" href="/community">커뮤니티 들어가기</a>
        </div>
      </section>
    </main>`;
}

function detailBody(type, env) {
  const bookPurchaseUrl = `${shopOrigin(env)}/product/detail.html?product_no=11`;
  const data = {
    about: {
      eyebrow: "ABOUT",
      title: "판매자가 아니라 사업가의 시선으로 봅니다.",
      intro: "상품과 플랫폼의 기술을 넘어 유통, 고객, 브랜드와 사업 구조를 함께 설명합니다.",
      blocks: [
        ["AUTHOR", "『그냥 팔지 말라 스마트스토어』 저자"],
        ["MERCHANDISING", "The North Face에서 Sales와 MD 경험"],
        ["GLOBAL BUSINESS", "글로벌 브랜드 OEM·ODM 해외영업"],
        ["ENTREPRENEUR", "제조업 창업과 온라인 커머스 운영 경험"]
      ]
    },
    book: {
      eyebrow: "BOOK",
      title: "그냥 팔지 말라 스마트스토어",
      intro: "검색과 광고의 사용법만이 아니라 온라인 판매가 사업으로 작동하는 구조를 다룹니다.",
      image: media.book,
      facts: [
        ["종이책", "2026.01.19 · 546쪽"],
        ["ISBN", "9791124121061"],
        ["전자책", "EPUB · ISBN 9791124121122"]
      ],
      blocks: [
        ["STRUCTURE", "상품 기획, 유통, 검색, 광고, 상세페이지, 고객 경험을 하나의 흐름으로 봅니다."],
        ["BRAND", "단기 판매 기술과 장기 브랜드 자산을 따로 떼어 보지 않습니다."],
        ["AI", "AI를 도구가 아니라 조사, 판단, 협업과 운영 체계의 일부로 연결합니다."]
      ],
      action: `<a class="njs-btn njs-btn-dark" href="${escapeHtml(bookPurchaseUrl)}">종이책 구매</a><a class="njs-btn njs-btn-line" href="/class">관련 강의 보기</a>`
    },
    class: {
      eyebrow: "CLASS",
      title: "온라인 판매를 사업의 언어로 배우는 강의",
      intro: "유통의 본질부터 검색, 키워드, 마케팅, 브랜드와 AI까지 순서대로 연결합니다.",
      blocks: [
        ["01", "유통사와 네이버 검색의 구조"],
        ["02", "키워드와 롱테일, 탐색 행동"],
        ["03", "인포먼스, 브랜드, 고객 경험과 AI"]
      ],
      action: `<a class="njs-btn njs-btn-dark" href="${escapeHtml(authOrigin(env))}/courses/online-commerce-basics">무료 강의 수강 신청</a><a class="njs-btn njs-btn-line" href="${escapeHtml(authOrigin(env))}/classroom">내 강의실</a>`
    },
    content: {
      eyebrow: "CONTENT",
      title: "유행보다 오래 남는 설명을 만듭니다.",
      intro: "온라인 판매의 통념과 현상을 유통, 소비자 행동, 마케팅과 브랜드의 관점에서 해석합니다.",
      blocks: [
        ["YOUTUBE", "검색, 플랫폼, 유통과 판매 전략을 영상으로 설명합니다."],
        ["WRITING", "마케팅과 비즈니스 이론을 온라인 판매자의 언어로 풀어냅니다."],
        ["COMMUNITY", "질문과 실행 경험이 축적되는 검색 가능한 지식 공간을 만듭니다."]
      ],
      action: `<a class="njs-btn njs-btn-dark" href="/community">커뮤니티 보기</a><a class="njs-btn njs-btn-line" href="/book">책 보기</a>`
    },
    lecture: {
      eyebrow: "LECTURE",
      title: "온라인 커머스를 현장의 문제와 연결합니다.",
      intro: "판로, 유통, 마케팅, 브랜드, 수출과 AI를 주제에 맞게 구성합니다.",
      image: media.lecture,
      blocks: [
        ["ONLINE COMMERCE", "온라인 판매와 판로 구조"],
        ["MARKETING & BRAND", "고객 접점, 브랜드와 사업 구조"],
        ["GLOBAL & AI", "글로벌 플랫폼, AI 활용과 협업"]
      ]
    }
  }[type];

  const image = data.image ? `<div class="njs-detail-image"><img src="${data.image}" alt="" loading="lazy"></div>` : "";
  const facts = Array.isArray(data.facts)
    ? `<dl class="njs-facts">${data.facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`
    : "";
  const blocks = data.blocks.map(([label, copy]) => `<article><span>${escapeHtml(label)}</span><p>${escapeHtml(copy)}</p></article>`).join("");
  return `
    <main id="main-content">
      <section class="njs-detail-hero">
        <div class="njs-shell njs-detail-grid">
          <div><p class="njs-eyebrow">${escapeHtml(data.eyebrow)}</p><h1>${escapeHtml(data.title)}</h1><p class="njs-detail-intro">${escapeHtml(data.intro)}</p>${facts}<div class="njs-actions">${data.action || ""}</div></div>
          ${image}
        </div>
      </section>
      <section class="njs-detail-body"><div class="njs-shell njs-detail-cards">${blocks}</div></section>
      <section class="njs-community njs-section-dark"><div class="njs-shell njs-community-inner"><div><p class="njs-eyebrow njs-eyebrow-light">NEXT</p><h2>읽는 데서 끝내지 않고<br>실행과 경험을 연결합니다.</h2></div><a class="njs-btn njs-btn-light" href="/community">커뮤니티 들어가기</a></div></section>
    </main>`;
}

function structuredData(origin, pathname, data) {
  const personId = `${origin}/about#person`;
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: "NEVER JUST SELL",
      inLanguage: "ko-KR"
    },
    {
      "@type": "Person",
      "@id": personId,
      name: "맥작가",
      url: `${origin}/about`,
      jobTitle: "온라인 커머스 작가·사업가"
    },
    {
      "@type": "WebPage",
      "@id": `${origin}${pathname === "/" ? "/" : pathname}#webpage`,
      url: `${origin}${pathname === "/" ? "/" : pathname}`,
      name: data.title,
      description: data.description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${origin}/#website` }
    }
  ];

  if (pathname === "/book") {
    graph.push({
      "@type": "Book",
      name: "그냥 팔지 말라 스마트스토어",
      author: { "@id": personId },
      publisher: { "@type": "Organization", name: "애플씨드" },
      datePublished: "2026-01-19",
      isbn: "9791124121061",
      numberOfPages: 546,
      inLanguage: "ko-KR"
    });
  }

  if (pathname === "/class") {
    graph.push({
      "@type": "Course",
      name: "온라인 판매를 사업의 언어로 배우는 강의",
      description: data.description,
      provider: { "@id": personId },
      inLanguage: "ko-KR"
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function renderPage(request, env, data) {
  const origin = siteOrigin(env);
  const url = new URL(request.url);
  const canonical = `${origin}${url.pathname === "/" ? "/" : url.pathname}`;
  const body = data.body === "home" ? homeBody(env) : detailBody(data.body, env);
  const image = data.image || media.profile;

  return text(`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(data.title)}</title>
<meta name="description" content="${escapeHtml(data.description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(data.title)}">
<meta property="og:description" content="${escapeHtml(data.description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="NEVER JUST SELL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(data.title)}">
<meta name="twitter:description" content="${escapeHtml(data.description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${structuredData(origin, url.pathname, data)}</script>
</head>
<body>
<a class="njs-skip" href="#main-content">본문 바로가기</a>
${nav(env)}
${body}
${footer(env)}
<script src="/app.js" defer></script>
</body>
</html>`, "text/html; charset=utf-8", {
    headers: {
      "Cache-Control": "public, max-age=120, s-maxage=600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
    }
  });
}

function sitemap(env) {
  const origin = siteOrigin(env);
  const paths = ["/", "/about", "/book", "/class", "/content", "/lecture"];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${origin}${path === "/" ? "/" : path}</loc></url>`).join("\n")}\n</urlset>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "neverjustsell-site",
        canonical_origin: siteOrigin(env),
        classroom_origin: authOrigin(env),
        community_origin: communityOrigin(env),
        shop_origin: shopOrigin(env)
      });
    }

    if (url.pathname === "/robots.txt") {
      return text(`User-agent: *\nAllow: /\nSitemap: ${siteOrigin(env)}/sitemap.xml\n`);
    }

    if (url.pathname === "/sitemap.xml") {
      return text(sitemap(env), "application/xml; charset=utf-8", {
        headers: { "Cache-Control": "public, max-age=3600" }
      });
    }

    if (url.pathname === "/llms.txt") {
      return text(`NEVER JUST SELL\n\n온라인 판매를 사업의 관점에서 설명하는 맥작가의 공식 사이트입니다.\n\nMain: ${siteOrigin(env)}/\nAbout: ${siteOrigin(env)}/about\nBook: ${siteOrigin(env)}/book\nClass: ${siteOrigin(env)}/class\nContent: ${siteOrigin(env)}/content\nLecture: ${siteOrigin(env)}/lecture\nCommunity: ${communityOrigin(env)}/\n`);
    }

    if (url.pathname === "/community") return redirect(`${communityOrigin(env)}/${url.search}`);
    if (url.pathname === "/classroom") return redirect(`${authOrigin(env)}/classroom${url.search}`);
    if (url.pathname === "/login") {
      const returnTo = `${siteOrigin(env)}/`;
      return redirect(
        `${authOrigin(env)}/oauth/cafe24/customer/start?return_to=${encodeURIComponent(returnTo)}`
      );
    }
    if (url.pathname === "/logout") {
      const returnTo = `${siteOrigin(env)}/`;
      return redirect(
        `${authOrigin(env)}/session/logout-sync?return_to=${encodeURIComponent(returnTo)}`
      );
    }
    if (url.pathname === "/store") return redirect(`${shopOrigin(env)}/`);
    if (url.pathname === "/cart") return redirect(`${shopOrigin(env)}/order/basket.html`);

    const data = pageData(url.pathname);
    if (data) return renderPage(request, env, data);

    if (env.ASSETS) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
    }

    return text(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>페이지를 찾을 수 없습니다 | NEVER JUST SELL</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"></head><body><main id="main-content" class="njs-not-found"><p class="njs-eyebrow">404</p><h1>페이지를 찾을 수 없습니다.</h1><a class="njs-btn njs-btn-dark" href="/">홈으로</a></main></body></html>`, "text/html; charset=utf-8", { status: 404 });
  }
};

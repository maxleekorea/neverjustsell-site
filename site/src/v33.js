import { loadKnowledgeEntries } from "./knowledge-runtime.js";

const YOUTUBE_CHANNEL_ID = "UCjKn4fGi2SuYRQmgWdi9XhA";
const YOUTUBE_FEED = "https://www.youtube.com/feeds/videos.xml?channel_id=" + YOUTUBE_CHANNEL_ID;
const HERO_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/68868a93-5045-4e7b-936d-a9a37c82b85b.png";
const LECTURE_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/19678aa3-1daa-4ede-bca4-2bf24092c9b3.png";
const BOOK_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/remove_background.png";
const RELEASE_REVISION = "v33-20261002-01";

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

function decodeXml(value) {
  return String(value || "").replaceAll("&amp;", "&").replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
}
function daysSince(value) {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time) ? Math.max(0, (Date.now() - time) / 86400000) : Infinity;
}
function dateKo(value) {
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    ? d.getUTCFullYear() + "." + String(d.getUTCMonth()+1).padStart(2,"0") + "." + String(d.getUTCDate()).padStart(2,"0")
    : "";
}

async function loadYoutubeFeed() {
  try {
    const response = await fetch(YOUTUBE_FEED, { headers:{Accept:"application/atom+xml"}, cf:{cacheTtl:900,cacheEverything:true} });
    if (!response.ok) return [];
    const xml = await response.text();
    return (xml.match(/<entry>[\s\S]*?<\/entry>/g) || []).map((entry) => {
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || "";
      return {
        videoId,
        title: decodeXml(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] || ""),
        published: entry.match(/<published>([^<]+)<\/published>/)?.[1] || "",
        url: videoId ? "https://www.youtube.com/watch?v=" + videoId : "",
        thumbnail: videoId ? "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg" : ""
      };
    }).filter((x) => x.videoId && x.title && x.published);
  } catch { return []; }
}

function splitKnowledge(entries) {
  const list = [...(Array.isArray(entries) ? entries : [])]
    .sort((a,b) => String(b.updated||"").localeCompare(String(a.updated||"")));
  return {
    briefs:list.filter((x)=>String(x.type||"")==="brief"),
    knowledge:list.filter((x)=>String(x.type||"")!=="brief")
  };
}
function currentBrief(items) {
  const x=items?.[0]||null;
  return x && daysSince(x.updated)<=14 ? x : null;
}
function currentVideo(items) {
  const x=items?.[0]||null;
  return x && daysSince(x.published)<=30 ? x : null;
}

function nav(communityOrigin, authOrigin) {
  return `<header class="r33-header"><div class="r33-shell r33-header-inner">
    <a class="r33-brand" href="/v33">NEVER JUST SELL</a>
    <nav class="r33-nav">
      <a href="/v33/content">콘텐츠</a>
      <a href="/v33/knowledge">지식</a>
      <a href="${esc(authOrigin)}/courses">배우기</a>
      <a href="${esc(communityOrigin)}/">커뮤니티</a>
      <a href="/v33/about">맥작가</a>
      <details class="r33-more"><summary>더보기</summary><div><a href="/v33/book">책</a><a href="/v33/lecture">강연·컨설팅</a></div></details>
    </nav>
    <div class="r33-head-actions"><a class="r33-search" href="/v33/knowledge">검색</a>
      <details class="r33-mobile-menu"><summary>메뉴</summary><div>
        <a href="/v33/content">콘텐츠</a><a href="/v33/knowledge">지식</a><a href="${esc(authOrigin)}/courses">배우기</a><a href="${esc(communityOrigin)}/">커뮤니티</a><a href="/v33/about">맥작가</a><a href="/v33/book">책</a><a href="/v33/lecture">강연·컨설팅</a>
      </div></details>
    </div>
  </div></header>`;
}
function footer(communityOrigin, authOrigin) {
  return `<footer class="r33-footer"><div class="r33-shell r33-footer-grid">
    <div><b>NEVER JUST SELL</b><p>맥작가의 글과 지식, 강의와 커뮤니티를 한곳에서 이어봅니다.</p></div>
    <nav><a href="/v33/content">콘텐츠</a><a href="/v33/knowledge">지식</a><a href="${esc(authOrigin)}/courses">배우기</a><a href="${esc(communityOrigin)}/">커뮤니티</a><a href="/v33/book">책</a><a href="/v33/lecture">강연·컨설팅</a><a href="/support">고객지원</a></nav>
  </div></footer>`;
}
function productionizeLinks(html) {
  return String(html)
    .replaceAll('href="/v33/content"', 'href="/content"')
    .replaceAll('href="/v33/knowledge"', 'href="/knowledge"')
    .replaceAll('href="/v33/about"', 'href="/about"')
    .replaceAll('href="/v33/book"', 'href="/book"')
    .replaceAll('href="/v33/lecture"', 'href="/lecture"')
    .replaceAll('href="/v33"', 'href="/"');
}

function publicStructuredData(siteOrigin, canonical, title, description, routeKey) {
  const personId = siteOrigin + "/about#person";
  const graph = [
    {
      "@type": "WebSite",
      "@id": siteOrigin + "/#website",
      url: siteOrigin + "/",
      name: "NEVER JUST SELL",
      inLanguage: "ko-KR"
    },
    {
      "@type": "Person",
      "@id": personId,
      name: "맥작가",
      url: siteOrigin + "/about",
      jobTitle: "작가·사업가"
    },
    {
      "@type": "WebPage",
      "@id": canonical + "#webpage",
      url: canonical,
      name: title,
      description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": siteOrigin + "/#website" },
      about: { "@id": personId }
    }
  ];
  if (routeKey === "/book") {
    graph.push({
      "@type": "Book",
      name: "그냥 팔지 말라 스마트스토어",
      inLanguage: "ko-KR",
      author: { "@id": personId },
      isbn: "9791124121061"
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
}

function shell({title,description,body,communityOrigin,authOrigin,siteOrigin,canonicalPath,routeKey,preview=true,image=HERO_IMAGE}) {
  const isPreview = preview === true;
  const canonical = siteOrigin + (canonicalPath === "/" ? "/" : canonicalPath);
  const chrome = nav(communityOrigin,authOrigin) + body + footer(communityOrigin,authOrigin);
  const rendered = isPreview ? chrome : productionizeLinks(chrome);
  const structured = isPreview ? "" : publicStructuredData(siteOrigin, canonical, title, description, routeKey);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
${isPreview
  ? `<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="njs-preview-revision" content="v33-korean-editorial-01">`
  : `<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="njs-site-revision" content="${RELEASE_REVISION}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="NEVER JUST SELL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<script type="application/ld+json">${structured}</script>`}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/v33.css"></head><body>
${isPreview ? '<div class="r33-preview">재구성 프리뷰 · 공개 페이지가 아닙니다.</div>' : ""}
<a class="r33-skip" href="#main-content">본문 바로가기</a>
${rendered.replace("<main>", '<main id="main-content">')}
</body></html>`;
}

function homePage({briefs,knowledge,videos,communityOrigin,authOrigin}) {
  const brief=currentBrief(briefs), video=currentVideo(videos), k=knowledge.slice(0,3);
  const briefBlock=brief
    ? `<a class="r33-news-main" href="/knowledge/${encodeURIComponent(brief.slug)}"><span>최신 브리핑 · ${esc(brief.updated)}</span><h3>${esc(brief.title)}</h3><p>${esc(brief.summary)}</p><em>브리핑 읽기 →</em></a>`
    : `<div class="r33-news-main r33-placeholder"><span>최신 브리핑</span><h3>새 브리핑을 준비하고 있습니다.</h3><p>빠르게 바뀌는 소식은 확인된 내용만 짧고 분명하게 정리합니다.</p></div>`;
  const videoBlock=video
    ? `<a class="r33-video-card" href="${esc(video.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(video.thumbnail)}" alt="" loading="lazy"><span>최근 영상 · ${esc(dateKo(video.published))}</span><strong>${esc(video.title)}</strong></a>`
    : `<div class="r33-video-card r33-placeholder"><span>최근 영상</span><strong>최근 공개 영상을 불러옵니다.</strong></div>`;

  return `<main>
  <section class="r33-hero"><div class="r33-shell">
    <div class="r33-context-line"><span>맥작가의 글 · 지식 · 배움 · 커뮤니티</span><span>NEVER JUST SELL</span></div>
    <div class="r33-hero-grid">
      <div class="r33-hero-copy"><p class="r33-eyebrow">그냥 팔지 말라, 그다음의 이야기</p><h1>팔기 전에,<br>왜 사는지를 봅니다.</h1>
        <p>광고 하나, 플랫폼 하나만 봐서는 답이 잘 안 나옵니다. 고객이 어떻게 발견하고, 고르고, 다시 찾는지. 상품·유통·브랜드를 함께 봅니다. 맥작가의 글과 강의, 현장에서 나온 질문과 경험도 이 흐름 안에 모읍니다.</p>
        <div class="r33-actions"><a class="r33-btn r33-btn-dark" href="/v33/content">최근 글 보기</a><a class="r33-link" href="/v33/knowledge">필요한 지식 찾기 →</a></div>
      </div>
      <aside class="r33-cycle" aria-label="NJS 배움과 실행의 순환">
        <div class="r33-cycle-head"><span>배운 것을 혼자 묵혀두지 않도록</span><b>5단계</b></div>
        <ol>
          <li><b>01</b><div><strong>배운다</strong><p>필요한 개념과 관점을 먼저 익힙니다.</p></div></li>
          <li><b>02</b><div><strong>해본다</strong><p>내 사업에 맞게 작게라도 직접 써봅니다.</p></div></li>
          <li><b>03</b><div><strong>묻고 나눈다</strong><p>막힌 지점과 해본 결과를 서로 나눕니다.</p></div></li>
          <li><b>04</b><div><strong>경험을 남긴다</strong><p>다시 볼 만한 경험은 정리해서 쌓아둡니다.</p></div></li>
          <li><b>05</b><div><strong>다시 배운다</strong><p>쌓인 지식과 경험을 다음 판단에 다시 씁니다.</p></div></li>
        </ol>
        <a href="${esc(communityOrigin)}/">커뮤니티 둘러보기 →</a>
      </aside>
    </div>
  </div></section>

  <section class="r33-section r33-now"><div class="r33-shell">
    <div class="r33-section-head r33-rule-head"><div><p class="r33-eyebrow">지금 읽을 것</p><h2>요즘, 무엇이<br>달라지고 있나.</h2></div><p>빨리 바뀌는 소식은 브리핑으로 짧게 정리합니다. 오래 두고 볼 생각은 칼럼과 지식으로 남깁니다.</p></div>
    <div class="r33-now-grid">
      ${briefBlock}
      <div class="r33-column-preview"><span>맥작가 칼럼</span><h3>첫 글을 준비하고 있습니다.</h3><p>한 가지 문제를 오래 붙잡고, 맥작가의 경험과 근거를 함께 풀어내는 글입니다. 첫 글이 올라오면 이 자리에서 바로 볼 수 있습니다.</p><a href="/v33/content#column">칼럼 영역 보기 →</a></div>
      ${videoBlock}
    </div>
  </div></section>

  <section class="r33-section r33-knowledge"><div class="r33-shell">
    <div class="r33-section-head r33-rule-head"><div><p class="r33-eyebrow">지식</p><h2>필요할 때<br>다시 꺼내볼 것.</h2></div><p>뉴스처럼 흘려보내지 않고, 고객·브랜드·유통·온라인 판매에서 자주 부딪히는 문제를 주제별로 정리합니다.</p></div>
    <div class="r33-knowledge-grid">${k.map((x,i)=>`<a href="/knowledge/${encodeURIComponent(x.slug)}"><span>${String(i+1).padStart(2,"0")} · ${esc(x.updated)}</span><strong>${esc(x.title)}</strong><p>${esc(x.summary)}</p><em>읽기 →</em></a>`).join("")}</div>
    <a class="r33-link r33-more-link" href="/v33/knowledge">지식 전체 보기 →</a>
  </div></section>

  <section class="r33-section r33-do"><div class="r33-shell">
    <div class="r33-section-head r33-rule-head"><div><p class="r33-eyebrow">배우기</p><h2>아는 데서<br>끝나지 않게.</h2></div><p>읽고 끝내지 않고, 순서대로 배우고 직접 해보는 쪽으로 이어갑니다.</p></div>
    <div class="r33-do-grid">
      <a href="${esc(authOrigin)}/courses"><span>01</span><h3>강의</h3><p>한 주제를 순서대로 배우고, 내 사업에 직접 적용해봅니다.</p><em>강의 보기 →</em></a>
      <a href="/v33/book"><span>02</span><h3>책·전자책</h3><p>한 가지 문제를 오래 붙잡고 생각하고 싶을 때 읽습니다.</p><em>책 보기 →</em></a>
      <a href="/v33/lecture"><span>03</span><h3>강연·컨설팅</h3><p>조직이 실제로 막혀 있는 문제에 맞춰 내용을 다시 구성합니다.</p><em>안내 보기 →</em></a>
    </div>
  </div></section>

  <section class="r33-author"><div class="r33-shell r33-author-grid">
    <figure><img src="${esc(HERO_IMAGE)}" alt="맥작가" loading="lazy"></figure>
    <div><p class="r33-eyebrow">맥작가</p><h2>현장에서 팔아보고,<br>만들어보고, 운영해봤습니다.</h2><p>영업과 상품기획, 제조와 해외 거래, 온라인 판매까지 직접 해봤습니다. 그래서 마케팅을 광고나 검색 한 가지로 설명하지 않습니다. 고객과 상품, 유통과 브랜드가 어떻게 이어지는지를 함께 봅니다.</p><a class="r33-link" href="/v33/about">맥작가 이야기 보기 →</a></div>
  </div></section>

  <section class="r33-community"><div class="r33-shell r33-community-grid">
    <div><p class="r33-eyebrow r33-light">커뮤니티</p><h2>혼자 해보다 막히는 지점은,<br>사람에게 묻습니다.</h2><p>해본 사람의 질문과 실패, 결과가 오갑니다. 그중 다시 볼 만한 경험은 검토를 거쳐 지식으로 정리합니다.</p><a class="r33-btn r33-btn-light" href="${esc(communityOrigin)}/">커뮤니티 들어가기</a></div>
    <div class="r33-community-note"><b>정리된 지식</b><p>NJS가 검토하고 오래 남길 내용</p><b>현장의 질문</b><p>사용자가 직접 해보다 생긴 문제와 경험</p><b>다시 쌓이는 경험</b><p>다른 사람에게도 도움이 될 내용은 다시 정리합니다.</p></div>
  </div></section>
  </main>`;
}

function contentPage({briefs,videos}) {
  const brief=briefs?.[0]||null, video=videos?.[0]||null;
  return `<main>
  <section class="r33-page-hero"><div class="r33-shell"><p class="r33-eyebrow">콘텐츠</p><h1>짧게 볼 것과<br>오래 읽을 것을 나눴습니다.</h1><p>빠르게 변하는 소식은 브리핑에서, 한 가지 문제를 오래 파고든 글은 칼럼에서 봅니다. 영상과 책 해석, 사례도 주제별로 모읍니다.</p></div></section>
  <section class="r33-content-tabs"><div class="r33-shell"><a href="#column">칼럼</a><a href="#briefing">브리핑</a><a href="#video">영상</a><a href="#books">책 해석</a><a href="#case">사례</a></div></section>
  <section class="r33-section" id="column"><div class="r33-shell r33-two-col"><div><p class="r33-eyebrow">맥작가 칼럼</p><h2>한 번 더 생각해볼 문제를 길게 씁니다.</h2><p>한 줄 요약으로 끝내기 어려운 문제를 경험과 근거를 붙여 차근차근 풀어냅니다.</p></div><div class="r33-empty-editorial"><span>준비 중</span><strong>첫 칼럼이 올라오면 이곳에서 바로 볼 수 있습니다.</strong><p>아직 공개한 글은 없습니다.</p></div></div></section>
  <section class="r33-section r33-muted" id="briefing"><div class="r33-shell"><div class="r33-section-head"><div><p class="r33-eyebrow">브리핑</p><h2>요즘 달라진 것, 먼저 짚습니다.</h2></div><p>무슨 일이 있었는지보다, 내 일에 어떤 변화가 생기는지를 먼저 봅니다.</p></div>
    ${brief ? `<a class="r33-wide-story" href="/knowledge/${encodeURIComponent(brief.slug)}"><span>${esc(brief.updated)}</span><h3>${esc(brief.title)}</h3><p>${esc(brief.summary)}</p><em>브리핑 읽기 →</em></a>` : `<div class="r33-empty-editorial"><strong>지금 보여드릴 새 브리핑이 없습니다.</strong><p>새 소식이 생기면 확인해서 정리합니다.</p></div>`}
  </div></section>
  <section class="r33-section" id="video"><div class="r33-shell r33-two-col"><div><p class="r33-eyebrow">영상</p><h2>글보다 말이<br>빠를 때가 있습니다.</h2></div>
    ${video ? `<a class="r33-video-feature" href="${esc(video.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(video.thumbnail)}" alt=""><span>${esc(dateKo(video.published))}</span><strong>${esc(video.title)}</strong></a>` : `<div class="r33-empty-editorial">최근 영상 없음</div>`}
  </div></section>
  <section class="r33-section r33-muted" id="books"><div class="r33-shell"><p class="r33-eyebrow">책 해석</p><h2>책을 요약하지 않고, 지금 내 일에 맞춰 다시 읽습니다.</h2><p>핵심 문장을 줄여 적기보다, 지금의 마케팅과 브랜드 문제에 어떻게 써먹을 수 있는지 봅니다.</p></div></section>
  <section class="r33-section" id="case"><div class="r33-shell"><p class="r33-eyebrow">사례</p><h2>결과보다,<br>그 결과가 나온 이유를 봅니다.</h2><p>기업과 브랜드, 플랫폼의 사례를 따라가며 사실과 해석을 나눠 봅니다.</p></div></section>
  </main>`;
}

function knowledgePage(knowledge) {
  return `<main><section class="r33-page-hero"><div class="r33-shell"><p class="r33-eyebrow">지식</p><h1>필요할 때<br>다시 꺼내볼 것.</h1><p>고객, 브랜드, 유통, 온라인 판매를 하면서 자주 부딪히는 문제를 개념·사례·방법으로 정리합니다. 최신 뉴스와 커뮤니티 글은 섞지 않습니다.</p></div></section>
  <section class="r33-section"><div class="r33-shell"><div class="r33-knowledge-list">
  ${knowledge.slice(0,12).map((x)=>`<a href="/knowledge/${encodeURIComponent(x.slug)}"><small>${esc(x.updated)} · ${esc(x.type||"지식")}</small><strong>${esc(x.title)}</strong><p>${esc(x.summary)}</p></a>`).join("")}
  </div><a class="r33-btn r33-btn-dark" href="/knowledge">지식 전체 보기</a></div></section></main>`;
}

function aboutPage() {
  return `<main><section class="r33-about-hero"><div class="r33-shell r33-about-hero-grid"><div><p class="r33-eyebrow">맥작가</p><h1>마케팅만<br>따로 떼어 보지 않습니다.</h1><p>고객을 만나고, 상품을 만들고, 유통을 고민하고, 직접 팔아본 경험에서 출발합니다.</p></div><figure><img src="${esc(HERO_IMAGE)}" alt="맥작가"></figure></div></section>
  <section class="r33-section"><div class="r33-shell r33-story-list">
    <article><span>현장과 상품</span><h2>고객을 만나고, 상품을 봤습니다.</h2><p>고객을 직접 만나고 상품과 수요, 재고를 함께 보면서 숫자만으로는 보이지 않는 현장을 배웠습니다.</p></article>
    <article><span>시장과 제조</span><h2>시장부터 보고,<br>필요한 것을 만들었습니다.</h2><p>해외영업과 제조업을 하며 시장을 찾고, 제품을 만들고, 생산과 수출까지 이어봤습니다.</p></article>
    <article><span>온라인 커머스와 저술</span><h2>직접 팔아본 경험을<br>글과 강의로 다시 정리합니다.</h2><p>온라인 판매를 직접 운영한 경험을 『그냥 팔지 말라』에 담았고, 지금은 글과 영상, 강의와 NJS에서 그 생각을 이어가고 있습니다.</p></article>
  </div></section></main>`;
}

function bookPage() {
  return `<main><section class="r33-book-hero"><div class="r33-shell r33-book-grid"><div class="r33-book-cover"><img src="${esc(BOOK_IMAGE)}" alt="그냥 팔지 말라 스마트스토어 책 표지"></div><div><p class="r33-eyebrow">책</p><h1>그냥 팔지 말라<br>스마트스토어</h1><p>검색 순위와 광고만 쫓다 보면 놓치는 것이 있습니다. 고객이 왜 찾고, 왜 고르고, 왜 다시 오는지를 상품과 유통, 브랜드까지 함께 살펴봅니다.</p><div class="r33-ratings"><div><span>YES24</span><b>9.4 / 10</b></div><div><span>교보문고</span><b>9.9 / 10</b></div></div><a class="r33-btn r33-btn-dark" href="/book">책 자세히 보기</a></div></div></section>
  <section class="r33-section r33-muted"><div class="r33-shell r33-book-points"><div><span>01</span><h2>검색보다 먼저 고객을 봅니다.</h2></div><div><span>02</span><h2>판매와 브랜드를 따로 떼어 보지 않습니다.</h2></div><div><span>03</span><h2>책에서 끝내지 않고 NJS에서 다시 이어갑니다.</h2></div></div></section></main>`;
}

function lecturePage() {
  return `<main><section class="r33-lecture-hero"><div class="r33-shell r33-lecture-grid"><div><p class="r33-eyebrow">강연·컨설팅</p><h1>정해진 강의안을<br>그대로 들고 가지 않습니다.</h1><p>같은 마케팅 이야기라도 조직마다 막히는 지점이 다릅니다. 실제 과제를 먼저 듣고 주제를 맞춰 구성합니다.</p></div><figure><img src="${esc(LECTURE_IMAGE)}" alt="맥작가 강연"></figure></div></section>
  <section class="r33-section"><div class="r33-shell"><div class="r33-lecture-topics"><article><span>01</span><h2>마케팅·브랜드</h2><p>누구에게, 왜 선택받는지부터 봅니다.</p></article><article><span>02</span><h2>온라인 커머스·유통</h2><p>광고 기법보다 시장과 유통 구조를 먼저 짚습니다.</p></article><article><span>03</span><h2>AI와 사업</h2><p>도구 소개보다 조사하고 판단하고 운영하는 방식이 어떻게 달라지는지 봅니다.</p></article></div><div class="r33-contact-note"><strong>온라인 신청은 아직 준비 중입니다.</strong><p>문의 방법이 정리되면 이곳에서 안내하겠습니다.</p></div></div></section></main>`;
}

export async function renderV33Page({request,env,siteOrigin,authOrigin,communityOrigin,preview=true}) {
  const url=new URL(request.url);
  const isPreview=preview===true;
  const routePath=isPreview
    ? (url.pathname.replace(/^\/v33/, "") || "/")
    : url.pathname;
  const [{entries},videos]=await Promise.all([loadKnowledgeEntries(env),loadYoutubeFeed()]);
  const {briefs,knowledge}=splitKnowledge(entries);
  let body,title,description,image=HERO_IMAGE;
  if (routePath==="/" || routePath==="") {
    body=homePage({briefs,knowledge,videos,communityOrigin,authOrigin});
    title=isPreview ? "NJS 에디토리얼 프리뷰" : "NEVER JUST SELL | 맥작가의 마케팅·브랜딩 지식과 배움";
    description="맥작가의 글과 지식, 강의와 커뮤니티를 연결해 마케팅과 사업을 배우고 직접 적용할 수 있는 NEVER JUST SELL.";
  } else if (routePath==="/content") {
    body=contentPage({briefs,videos});
    title=isPreview ? "콘텐츠 에디토리얼 프리뷰 | NJS" : "콘텐츠 | NEVER JUST SELL";
    description="맥작가의 칼럼, 브리핑, 영상, 책 해석과 사례를 한곳에서 봅니다.";
  } else if (routePath==="/knowledge") {
    body=knowledgePage(knowledge);
    title=isPreview ? "지식 에디토리얼 프리뷰 | NJS" : "지식 | NEVER JUST SELL";
    description="고객, 브랜드, 유통과 온라인 판매에서 자주 부딪히는 문제를 개념·사례·방법으로 정리합니다.";
  } else if (routePath==="/about") {
    body=aboutPage();
    title=isPreview ? "맥작가 에디토리얼 프리뷰 | NJS" : "맥작가 | NEVER JUST SELL";
    description="영업, 상품, 제조, 글로벌 B2B와 온라인 커머스를 직접 경험한 맥작가의 관점과 이력을 소개합니다.";
  } else if (routePath==="/book") {
    body=bookPage();
    title=isPreview ? "책 에디토리얼 프리뷰 | NJS" : "그냥 팔지 말라 스마트스토어 | NEVER JUST SELL";
    description="검색과 광고만이 아니라 고객, 상품, 유통과 브랜드를 함께 보는 『그냥 팔지 말라 스마트스토어』.";
    image=BOOK_IMAGE;
    if (!isPreview) {
      body=body.replace(
        '<a class="r33-btn r33-btn-dark" href="/book">책 자세히 보기</a>',
        '<a class="r33-btn r33-btn-dark" href="/store">스토어 보기</a>'
      );
    }
  } else if (routePath==="/lecture") {
    body=lecturePage();
    title=isPreview ? "강연·컨설팅 에디토리얼 프리뷰 | NJS" : "강연·컨설팅 | NEVER JUST SELL";
    description="마케팅, 브랜드, 온라인 커머스와 AI를 조직의 실제 과제에 맞춰 구성하는 맥작가 강연·컨설팅.";
    image=LECTURE_IMAGE;
  } else return new Response("Not found",{status:404});

  const responseBody=shell({
    title,description,body,communityOrigin,authOrigin,siteOrigin,
    canonicalPath:routePath || "/",routeKey:routePath || "/",preview:isPreview,image
  });
  const headers={
    "Content-Type":"text/html; charset=utf-8",
    "Cache-Control":isPreview ? "no-store" : "public, max-age=120, s-maxage=600",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"strict-origin-when-cross-origin",
    "Permissions-Policy":"camera=(), microphone=(), geolocation=()"
  };
  if (isPreview) headers["X-Robots-Tag"]="noindex, nofollow, noarchive";
  return new Response(responseBody,{status:200,headers});
}

import { loadKnowledgeEntries } from "./knowledge-runtime.js";

const YOUTUBE_CHANNEL_ID = "UCjKn4fGi2SuYRQmgWdi9XhA";
const YOUTUBE_FEED = "https://www.youtube.com/feeds/videos.xml?channel_id=" + YOUTUBE_CHANNEL_ID;

const HERO_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/68868a93-5045-4e7b-936d-a9a37c82b85b.png";
const LECTURE_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/19678aa3-1daa-4ede-bca4-2bf24092c9b3.png";
const BOOK_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/remove_background.png";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function decodeXml(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function daysSince(value, now = Date.now()) {
  const time = Date.parse(String(value || ""));
  if (!Number.isFinite(time)) return Infinity;
  return Math.max(0, (now - time) / 86400000);
}

async function loadYoutubeFeed() {
  try {
    const response = await fetch(YOUTUBE_FEED, {
      headers: { Accept: "application/atom+xml,application/xml;q=0.9,text/xml;q=0.8" },
      cf: { cacheTtl: 900, cacheEverything: true }
    });
    if (!response.ok) return [];
    const xml = await response.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    return entries.map((entry) => {
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || "";
      const title = decodeXml(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "");
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] || "";
      return {
        videoId,
        title,
        published,
        url: videoId ? "https://www.youtube.com/watch?v=" + videoId : "",
        thumbnail: videoId ? "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg" : ""
      };
    }).filter((item) => item.videoId && item.title && item.published);
  } catch {
    return [];
  }
}

function latestKnowledge(entries) {
  const now = Date.now();
  return [...(Array.isArray(entries) ? entries : [])]
    .filter((item) => {
      const maxAge = String(item.type || "") === "brief" ? 7 : 14;
      return daysSince(item.updated, now) <= maxAge;
    })
    .sort((a, b) => String(b.updated || "").localeCompare(String(a.updated || "")))[0] || null;
}

function recentKnowledge(entries, limit = 2) {
  return [...(Array.isArray(entries) ? entries : [])]
    .sort((a, b) => String(b.updated || "").localeCompare(String(a.updated || "")))
    .slice(0, limit);
}

function youtubeCurrent(items) {
  const item = items[0] || null;
  if (!item) return null;
  const age = daysSince(item.published);
  if (age > 30) return null;
  return { ...item, freshness: age <= 7 ? "새 영상" : "최근 영상" };
}

function dateKo(value) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")}`;
}

function renderCurrent(youtube, knowledge) {
  if (!youtube && !knowledge) return "";

  const feature = youtube
    ? `<a class="v3-current-feature" href="${esc(youtube.url)}" target="_blank" rel="noopener noreferrer">
        <span class="v3-current-media"><img src="${esc(youtube.thumbnail)}" alt="" loading="lazy"></span>
        <span class="v3-current-body"><small>YOUTUBE · ${esc(dateKo(youtube.published))}</small><strong>${esc(youtube.title)}</strong><em>영상 보기 ↗</em></span>
      </a>`
    : `<a class="v3-current-feature v3-current-feature-text" href="/knowledge/${encodeURIComponent(knowledge.slug)}">
        <span class="v3-current-art">KNOWLEDGE</span>
        <span class="v3-current-body"><small>${esc(String(knowledge.type || "지식").toUpperCase())} · ${esc(knowledge.updated)}</small><strong>${esc(knowledge.title)}</strong><em>지식 보기 →</em></span>
      </a>`;

  const side = youtube && knowledge
    ? `<a class="v3-current-side-card" href="/knowledge/${encodeURIComponent(knowledge.slug)}">
        <small>KNOWLEDGE · ${esc(knowledge.updated)}</small>
        <strong>${esc(knowledge.title)}</strong>
        <p>${esc(knowledge.summary)}</p>
        <em>읽기 →</em>
      </a>`
    : `<div class="v3-current-side-card v3-current-side-note">
        <small>NJS</small>
        <strong>콘텐츠에서 끝나지 않도록.</strong>
        <p>영상에서 시작한 생각을 지식으로 다시 찾고, 필요하면 배우고 묻는 흐름으로 이어갑니다.</p>
      </div>`;

  return `<section class="v3-current" aria-labelledby="v3-current-title">
    <div class="v3-shell">
      <div class="v3-current-head"><p class="v3-kicker v3-kicker-light">NOW</p><h2 id="v3-current-title">지금 이야기하는 것.</h2></div>
      <div class="v3-current-grid">${feature}<div class="v3-current-side">${side}<p class="v3-current-note">맥작가의 현재 관점과 최근 콘텐츠를 기준으로 연결합니다.</p></div></div>
    </div>
  </section>`;
}

function renderRecent(youtube, knowledgeItems) {
  const cards = [];
  if (youtube) {
    cards.push(`<a class="v3-content-card v3-content-card-video" href="${esc(youtube.url)}" target="_blank" rel="noopener noreferrer">
      <span class="v3-content-media"><img src="${esc(youtube.thumbnail)}" alt="" loading="lazy"></span>
      <small>YOUTUBE · ${esc(dateKo(youtube.published))}</small><strong>${esc(youtube.title)}</strong><em>보기 ↗</em>
    </a>`);
  }
  for (const item of knowledgeItems) {
    cards.push(`<a class="v3-content-card" href="/knowledge/${encodeURIComponent(item.slug)}">
      <span class="v3-content-media v3-content-art">KNOWLEDGE</span>
      <small>${esc(String(item.type || "지식").toUpperCase())} · ${esc(item.updated)}</small><strong>${esc(item.title)}</strong><em>읽기 →</em>
    </a>`);
  }
  if (!cards.length) return "";

  return `<section class="v3-section v3-recent"><div class="v3-shell">
    <div class="v3-section-head"><div><p class="v3-kicker">RECENT</p><h2>최근에 이어진 생각.</h2></div><a class="v3-text-link" href="/content">콘텐츠 전체 보기 →</a></div>
    <div class="v3-content-grid">${cards.slice(0, 3).join("")}</div>
  </div></section>`;
}

export async function renderHomeV3Page({ env, siteOrigin, authOrigin, communityOrigin }) {
  const [{ entries }, youtubeItems] = await Promise.all([
    loadKnowledgeEntries(env),
    loadYoutubeFeed()
  ]);
  const knowledge = latestKnowledge(entries);
  const recent = recentKnowledge(entries, 2);
  const youtube = youtubeCurrent(youtubeItems);
  const mySpace = authOrigin + "/my-space";
  const courses = authOrigin + "/courses";
  const community = communityOrigin + "/";

  const body = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>NJS Home V3 Author Editorial Preview | NEVER JUST SELL</title>
<meta name="description" content="『그냥 팔지 말라』 저자 맥작가의 관점에서 시작해 지식, 학습과 커뮤니티로 이어지는 NEVER JUST SELL Home V3 프리뷰.">
<meta name="robots" content="noindex,nofollow,noarchive">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/home-v3.css">
</head>
<body class="v3-body">
<a class="v3-skip" href="#main-content">본문 바로가기</a>
<header class="v3-header">
  <div class="v3-shell v3-header-inner">
    <a class="v3-brand" href="/home-v3" aria-label="NJS Home V3 Preview"><span class="v3-brand-mark">NJS</span><span class="v3-brand-name">NEVER JUST SELL</span></a>
    <button class="v3-menu-toggle" type="button" aria-controls="v3-nav" aria-expanded="false">메뉴</button>
    <nav class="v3-nav" id="v3-nav" aria-label="주요 메뉴">
      <a href="/content">콘텐츠</a>
      <a href="/knowledge">지식</a>
      <a href="${esc(courses)}">배우기</a>
      <a href="${esc(community)}">커뮤니티</a>
      <a href="/about">맥작가</a>
    </nav>
    <div class="v3-utility"><a href="/knowledge">검색</a><a class="v3-space" href="${esc(mySpace)}">내 공간</a></div>
  </div>
</header>

<main id="main-content">
<section class="v3-hero">
  <div class="v3-shell v3-hero-grid">
    <div class="v3-hero-copy">
      <p class="v3-kicker">『그냥 팔지 말라』 저자 맥작가 · NEVER JUST SELL</p>
      <h1>팔리는 순간만<br><em>보지 않습니다.</em></h1>
      <p class="v3-lead">상품이 만들어지고, 고객에게 발견되고, 선택되고, 다시 관계로 이어지는 전체를 봅니다. 책과 영상에서 시작한 생각을 NJS에서 지식과 학습, 커뮤니티로 이어갑니다.</p>
      <div class="v3-actions"><a class="v3-btn v3-btn-primary" href="/knowledge">지식 둘러보기</a><a class="v3-text-link" href="#njs-loop">NJS가 이어지는 방식 ↓</a></div>
    </div>
    <figure class="v3-hero-photo"><img src="${esc(HERO_IMAGE)}" alt="맥작가" loading="eager" fetchpriority="high"><figcaption><strong>맥작가</strong><span>브랜딩 · 마케팅 · 사업</span></figcaption></figure>
  </div>
</section>

${renderCurrent(youtube, knowledge)}

<section class="v3-section v3-loop" id="njs-loop">
  <div class="v3-shell">
    <div class="v3-loop-intro"><p class="v3-kicker">HOW NJS WORKS</p><h2>배우고, 해보고,<br>묻고, 다시 쌓입니다.</h2><p>책이나 영상에서 알게 된 생각이 실제 사업에서 끝까지 이어지도록 합니다. 필요한 지식을 찾고, 구조적으로 배우고, 실행 중 생긴 질문과 경험을 나누면 그 결과가 다시 누군가의 지식이 됩니다.</p></div>
    <div class="v3-loop-grid">
      <a href="/knowledge"><span>01</span><small>KNOWLEDGE</small><strong>이해한다</strong><p>문제와 개념을 빠르게 이해하고 필요할 때 다시 찾습니다.</p><em>지식 둘러보기 →</em></a>
      <div><span>02</span><small>STRUCTURED LEARNING</small><strong>배운다</strong><p>한 주제를 순서대로 익히고 실제 적용까지 이어가는 학습 경로입니다.</p><em>강의는 준비 중</em></div>
      <a href="${esc(community)}"><span>03</span><small>COMMUNITY</small><strong>해보고 묻는다</strong><p>실행하다 막힌 문제와 직접 해본 경험을 사람들과 나눕니다.</p><em>커뮤니티 보기 →</em></a>
      <div><span>04</span><small>FEEDBACK</small><strong>다시 쌓인다</strong><p>좋은 질문과 경험은 콘텐츠와 지식, 다음 학습을 더 정확하게 만듭니다.</p><em>반복되는 학습 루프</em></div>
    </div>
  </div>
</section>

<section class="v3-section v3-author">
  <div class="v3-shell v3-author-grid">
    <figure class="v3-author-photo"><img src="${esc(LECTURE_IMAGE)}" alt="강연 중인 맥작가" loading="lazy"></figure>
    <div class="v3-author-copy">
      <p class="v3-kicker">WHY 맥작가</p>
      <h2>마케팅을 좁게 보지 않는 데에는<br>이유가 있습니다.</h2>
      <p class="v3-author-lead">판매 기술 하나를 오래 다룬 경력이 아니라, 현장과 상품, 글로벌 B2B와 제조, 온라인 커머스까지 서로 다른 사업 구조를 직접 지나왔습니다.</p>
      <div class="v3-author-proof">
        <div><span>01</span><strong>현장 · 상품 · 데이터</strong><p>노스페이스 현장 영업에서 영업MD로 역할을 넓히며 매장, 상품, 수요와 재고를 함께 봤습니다.</p></div>
        <div><span>02</span><strong>시장개척 · 제조 · 글로벌 B2B</strong><p>효성 해외영업에서 신규 시장을 개척했고, 이후 제조·R&D·수출 사업을 장기간 운영했습니다.</p></div>
        <div><span>03</span><strong>온라인 커머스 · 저술</strong><p>온라인 판매망을 직접 운영한 뒤 경험과 관점을 책, 강의와 콘텐츠로 구조화해 왔습니다.</p></div>
      </div>
      <a class="v3-text-link" href="/about">맥작가와 NJS의 관점 보기 →</a>
    </div>
  </div>
</section>

<section class="v3-book">
  <div class="v3-shell v3-book-grid">
    <div class="v3-book-art"><img src="${esc(BOOK_IMAGE)}" alt="그냥 팔지 말라 스마트스토어 책 표지" loading="lazy"></div>
    <div class="v3-book-copy">
      <p class="v3-kicker">BOOK → NJS</p>
      <h2>책에서 시작한 질문을<br>계속 이어갑니다.</h2>
      <p>『그냥 팔지 말라』는 판매 요령만을 다루기보다 고객과 유통, 검색과 브랜드를 함께 보자는 문제의식에서 출발했습니다. NJS에서는 그 질문을 더 넓은 사업의 문제로 이어갑니다.</p>
      <div class="v3-ratings" aria-label="도서 독자 평가"><div><span>YES24</span><strong>9.4 / 10</strong><small>리뷰 20건 · 한줄평 16건</small></div><div><span>교보문고</span><strong>9.9 / 10</strong><small>평가 19건</small></div></div>
      <div class="v3-actions"><a class="v3-btn v3-btn-primary" href="/book">책 이야기 보기</a><a class="v3-text-link" href="/content">관련 콘텐츠 보기 →</a></div>
    </div>
  </div>
</section>

<section class="v3-community">
  <div class="v3-shell v3-community-grid">
    <div class="v3-community-copy"><p class="v3-kicker v3-kicker-light">COMMUNITY OF PRACTICE</p><h2>누군가 해본 경험은<br>다른 사람의 다음 판단이 됩니다.</h2><p>맥작가가 일방적으로 말하는 곳에 머물지 않습니다. 질문과 실행 경험, 결과와 반례가 쌓이면 다른 사람의 선택에 도움이 되고, 좋은 사례는 다시 지식과 콘텐츠를 더 정확하게 만듭니다.</p><a class="v3-btn v3-btn-light" href="${esc(community)}">커뮤니티 둘러보기</a></div>
    <div class="v3-community-flow" aria-label="커뮤니티 학습 흐름"><div><span>01</span><strong>묻는다</strong><p>지금 막힌 문제를 구체적으로 묻습니다.</p></div><div><span>02</span><strong>해본다</strong><p>조언을 실제 상황에 적용해 봅니다.</p></div><div><span>03</span><strong>남긴다</strong><p>과정과 결과, 실패와 반례를 나눕니다.</p></div><div><span>04</span><strong>다시 배운다</strong><p>축적된 경험이 다음 사람의 판단을 돕습니다.</p></div></div>
  </div>
</section>

${renderRecent(youtube, recent)}

<section class="v3-continuity">
  <div class="v3-shell v3-continuity-inner"><div><p class="v3-kicker">CONTINUE</p><h2>이미 이어서 보고 있나요?</h2><p>저장한 지식과 학습 중인 내용을 내 공간에서 계속할 수 있습니다.</p></div><a class="v3-btn v3-btn-primary" href="${esc(mySpace)}">내 공간으로</a></div>
</section>
</main>

<footer class="v3-footer"><div class="v3-shell v3-footer-grid"><div><a class="v3-brand" href="/home-v3"><span class="v3-brand-mark">NJS</span><span class="v3-brand-name">NEVER JUST SELL</span></a><p>맥작가의 미디어, 지식, 학습과 커뮤니티를 연결합니다.</p></div><nav><a href="/content">콘텐츠</a><a href="/knowledge">지식</a><a href="${esc(courses)}">배우기</a><a href="${esc(community)}">커뮤니티</a><a href="/book">책</a><a href="/about">맥작가</a></nav></div></footer>
<script src="/home-v3-app.js" defer></script>
</body></html>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow,noarchive",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}

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
  return \`\${d.getUTCFullYear()}.\${String(d.getUTCMonth() + 1).padStart(2, "0")}.\${String(d.getUTCDate()).padStart(2, "0")}\`;
}

function renderNow(youtube, knowledge) {
  if (!youtube && !knowledge) return "";
  const primary = youtube
    ? \`<article class="v3-now-feature">
        <span class="v3-status v3-status-live">\${esc(youtube.freshness)} · \${esc(dateKo(youtube.published))}</span>
        <h2>\${esc(youtube.title)}</h2>
        <p>최근 공개된 맥작가 YouTube 콘텐츠입니다. 공개 날짜가 freshness 기준을 넘으면 이 영역에서 자동으로 빠집니다.</p>
        <a href="\${esc(youtube.url)}" target="_blank" rel="noopener noreferrer">영상 보기 ↗</a>
      </article>\`
    : \`<article class="v3-now-feature">
        <span class="v3-status v3-status-live">최근 업데이트 · \${esc(knowledge.updated)}</span>
        <h2>\${esc(knowledge.title)}</h2>
        <p>\${esc(knowledge.summary)}</p>
        <a href="/knowledge/\${encodeURIComponent(knowledge.slug)}">지식 보기 →</a>
      </article>\`;

  const rail = [
    youtube && knowledge ? \`<article><span>KNOWLEDGE · \${esc(knowledge.updated)}</span><strong>\${esc(knowledge.title)}</strong><small>\${esc(knowledge.summary)}</small><a href="/knowledge/\${encodeURIComponent(knowledge.slug)}">읽기 →</a></article>\` : "",
    \`<article class="v3-now-rule"><span>LIVE RULE</span><strong>실제 최신 항목만 노출</strong><small>새 강의·프로그램·커뮤니티 활동이 freshness gate를 통과할 때만 이 영역에 추가됩니다.</small></article>\`
  ].join("");

  return \`<section class="v3-now" aria-labelledby="v3-now-title">
    <div class="v3-shell">
      <p class="v3-kicker v3-kicker-light" id="v3-now-title">NOW · 실제 최신 데이터</p>
      <div class="v3-now-layout">\${primary}<div class="v3-now-rail">\${rail}</div></div>
    </div>
  </section>\`;
}

function renderRecent(youtube, knowledgeItems) {
  const cards = [];
  if (youtube) {
    cards.push(\`<a class="v3-content-card" href="\${esc(youtube.url)}" target="_blank" rel="noopener noreferrer">
      <span class="v3-content-media"><img src="\${esc(youtube.thumbnail)}" alt="" loading="lazy"></span>
      <small>YOUTUBE · \${esc(dateKo(youtube.published))}</small><strong>\${esc(youtube.title)}</strong>
    </a>\`);
  }
  for (const item of knowledgeItems) {
    cards.push(\`<a class="v3-content-card v3-content-knowledge" href="/knowledge/\${encodeURIComponent(item.slug)}">
      <span class="v3-content-media v3-content-art">KNOWLEDGE</span>
      <small>\${esc(String(item.type || "지식").toUpperCase())} · \${esc(item.updated)}</small><strong>\${esc(item.title)}</strong>
    </a>\`);
  }
  if (!cards.length) return "";
  return \`<section class="v3-section v3-recent"><div class="v3-shell">
    <div class="v3-section-head"><div><p class="v3-kicker">RECENT</p><h2>최근 콘텐츠.</h2></div><a class="v3-text-link" href="/content">전체 보기 →</a></div>
    <div class="v3-content-grid">\${cards.slice(0,3).join("")}</div>
  </div></section>\`;
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
  const community = communityOrigin + "/";

  const body = \`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>NJS Home V3 Preview | NEVER JUST SELL</title>
<meta name="description" content="맥작가의 실제 사업 경험, 책, 지식, 강의와 커뮤니티를 연결하는 Home V3 격리 프리뷰.">
<meta name="robots" content="noindex,nofollow,noarchive">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/home-v3.css">
</head>
<body class="v3-body">
<a class="v3-skip" href="#main-content">본문 바로가기</a>
<header class="v3-header">
  <div class="v3-shell v3-header-inner">
    <a class="v3-brand" href="/home-v3" aria-label="NJS Home V3 Preview">NJS <span>NEVER JUST SELL</span></a>
    <button class="v3-menu-toggle" type="button" aria-controls="v3-nav" aria-expanded="false">메뉴</button>
    <nav class="v3-nav" id="v3-nav" aria-label="주요 메뉴">
      <a href="/class">강의·프로그램</a>
      <a href="/book">책·전자책</a>
      <a href="/knowledge">지식</a>
      <a href="\${esc(community)}">커뮤니티</a>
      <a href="/about">맥작가</a>
    </nav>
    <div class="v3-utility"><a href="/knowledge">검색</a><a class="v3-space" href="\${esc(mySpace)}">내 공간</a></div>
  </div>
</header>
<main id="main-content">
<section class="v3-hero v3-section">
  <div class="v3-shell v3-hero-grid">
    <div class="v3-hero-copy">
      <p class="v3-kicker">『그냥 팔지 말라』 저자 맥작가</p>
      <h1>사업을 해본 사람에게 배우는<br><em>마케팅과 비즈니스.</em></h1>
      <p class="v3-lead">노스페이스 영업·MD, 효성 해외영업, 제조업 창업과 온라인 커머스까지. 직접 만들고 팔고 부딪힌 경험을 강의, 책, 지식과 커뮤니티로 나눕니다.</p>
      <div class="v3-actions"><a class="v3-btn v3-btn-primary" href="/knowledge">지식 둘러보기</a><a class="v3-text-link" href="/about">맥작가 알아보기 →</a></div>
      <p class="v3-provisional">Preview: 현재 Hero 이미지는 임시 자산이며 Production 승격 전 브랜드 촬영이 필요합니다.</p>
    </div>
    <figure class="v3-hero-photo"><img src="\${esc(HERO_IMAGE)}" alt="맥작가" loading="eager" fetchpriority="high"><figcaption>맥작가 · Preview용 임시 이미지</figcaption></figure>
  </div>
</section>

\${renderNow(youtube, knowledge)}

<section class="v3-section v3-offers">
  <div class="v3-shell">
    <div class="v3-section-head"><div><p class="v3-kicker">USE NJS</p><h2>지금 이용할 수 있는 것.</h2></div><p>판매 가능한 것은 분명하게, 준비 중인 것은 준비 중이라고 보여줍니다.</p></div>
    <div class="v3-offers-grid">
      <article class="v3-book-live">
        <div class="v3-book-cover"><img src="\${esc(BOOK_IMAGE)}" alt="그냥 팔지 말라 스마트스토어 책 표지" loading="lazy"></div>
        <div><span class="v3-status v3-status-live">현재 구매 가능</span><h3>『그냥 팔지 말라』</h3><p>현재 실제 출간된 책입니다. 판매처는 책 상세에서 확인합니다.</p><a class="v3-btn v3-btn-primary v3-btn-small" href="/book">책 보기</a></div>
      </article>
      <div class="v3-offer-list">
        <article><span class="v3-status v3-status-prep">준비 중</span><h3>동영상 강의</h3><p>실제 강의 2종이 준비되어 있지만 현재 판매·공개 상태가 아닙니다.</p></article>
        <article><span class="v3-status v3-status-wait">아직 판매 상품 없음</span><h3>전자책</h3><p>새 재해석 전자책이 실제 상품으로 준비되기 전까지 판매 CTA를 만들지 않습니다.</p></article>
        <article><span class="v3-status v3-status-wait">현재 열린 회차 없음</span><h3>완독 프로그램</h3><p>실제 모집 run이 생길 때만 일정·가격·신청 상태를 표시합니다.</p></article>
        <article><span class="v3-status v3-status-info">안내 제공</span><h3>강연·컨설팅</h3><p>서비스 안내는 존재하지만 현재 예약·문의 전환 동선은 준비가 더 필요합니다.</p></article>
      </div>
    </div>
  </div>
</section>

<section class="v3-section v3-story">
  <div class="v3-shell v3-story-grid">
    <div class="v3-story-copy"><p class="v3-kicker">WHY 맥작가</p><h2>경력이 아니라,<br>직접 지나온 사업의 경로.</h2>
      <ol>
        <li><b>노스페이스</b><span>영업 → 영업 MD</span></li>
        <li><b>효성</b><span>해외영업 · 글로벌 B2B</span></li>
        <li><b>2011–2012</b><span>창업 · 마이팝 법인 설립</span></li>
        <li><b>제조업</b><span>B2B · OEM/ODM · 수출</span></li>
        <li><b>온라인 커머스</b><span>스마트스토어 판매망 운영</span></li>
        <li><b>현재</b><span>『그냥 팔지 말라』 저자 · NJS</span></li>
      </ol>
    </div>
    <div class="v3-story-media">
      <img src="\${esc(LECTURE_IMAGE)}" alt="맥작가 강연" loading="lazy">
      <div class="v3-archive"><span>ARCHIVAL PROOF</span><strong>LG 탭북2 · VIEWS · 제조 제품</strong><small>과거 원본을 확보한 뒤 실제 증거 이미지로 교체합니다. 현재 사진을 과거 경력 증거처럼 사용하지 않습니다.</small></div>
    </div>
  </div>
</section>

<section class="v3-book-proof">
  <div class="v3-shell v3-book-proof-grid">
    <div class="v3-book-art"><img src="\${esc(BOOK_IMAGE)}" alt="그냥 팔지 말라 스마트스토어" loading="lazy"></div>
    <div><p class="v3-kicker">BOOK & TRUST</p><h2>책으로 먼저 만난 사람에게,<br>그 다음을 보여줍니다.</h2><p>『그냥 팔지 말라』에서 시작한 문제의식을 강의, 지식, 콘텐츠와 커뮤니티에서 더 넓은 사업의 문제로 이어갑니다.</p>
      <div class="v3-ratings"><div><span>YES24</span><strong>9.4 / 10</strong></div><div><span>교보문고</span><strong>9.9 / 10</strong></div></div>
      <a class="v3-text-link" href="/book">책 자세히 보기 →</a>
    </div>
  </div>
</section>

<section class="v3-section v3-return"><div class="v3-shell">
  <div class="v3-section-head"><div><p class="v3-kicker">COME BACK FOR</p><h2>한 번 보고 끝나지 않는 이유.</h2></div></div>
  <div class="v3-return-grid">
    <a href="/knowledge"><span>01</span><h3>필요할 때 검색하기</h3><p>마케팅과 온라인 커머스 지식을 문제 상황에서 다시 찾습니다.</p></a>
    <a href="/content"><span>02</span><h3>영상에서 본 내용 다시 찾기</h3><p>영상의 아이디어를 지식과 관련 자료로 이어봅니다.</p></a>
    <a href="/knowledge"><span>03</span><h3>바뀐 시장 빠르게 이해하기</h3><p>신선도 기준을 통과한 브리핑만 최신 정보로 다룹니다.</p></a>
    <a href="\${esc(community)}"><span>04</span><h3>혼자 막힌 문제 묻기</h3><p>실제 질문과 경험을 사람들과 나눕니다.</p></a>
  </div>
</div></section>

<section class="v3-community">
  <div class="v3-shell v3-community-inner"><div><p class="v3-kicker v3-kicker-light">COMMUNITY</p><h2>혼자 막힌 문제를 묻고,<br>다른 사람의 실제 경험을 참고하는 곳.</h2><p>Home에서는 커뮤니티 내부 구조를 설명하지 않습니다. 실제 organic 활동이 freshness 기준을 통과하면 최근 질문을 연결하고, 그렇지 않으면 이 가치와 진입점만 유지합니다.</p></div><a class="v3-community-link" href="\${esc(community)}">커뮤니티 둘러보기 →</a></div>
</section>

\${renderRecent(youtube, recent)}

<section class="v3-section v3-member"><div class="v3-shell v3-member-inner"><div><p class="v3-kicker">MEMBER</p><h2>이어보세요.</h2><p>로그인한 사용자는 저장한 지식과 수강·프로그램 상태를 내 공간에서 이어갈 수 있습니다.</p></div><a class="v3-btn v3-btn-primary v3-btn-small" href="\${esc(mySpace)}">내 공간</a></div></section>
</main>
<footer class="v3-footer"><div class="v3-shell v3-footer-grid"><div><strong>NJS · NEVER JUST SELL</strong><p>실제 사업 경험을 책, 강의, 지식과 커뮤니티로 연결합니다.</p></div><nav><a href="/class">강의</a><a href="/book">책</a><a href="/knowledge">지식</a><a href="\${esc(community)}">커뮤니티</a><a href="/lecture">강연·컨설팅</a></nav></div></footer>
<script src="/home-v3-app.js" defer></script>
</body></html>\`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}

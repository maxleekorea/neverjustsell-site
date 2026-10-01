import { loadKnowledgeEntries } from "./knowledge-runtime.js";

const YOUTUBE_CHANNEL_ID = "UCjKn4fGi2SuYRQmgWdi9XhA";
const YOUTUBE_FEED = "https://www.youtube.com/feeds/videos.xml?channel_id=" + YOUTUBE_CHANNEL_ID;
const HERO_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/68868a93-5045-4e7b-936d-a9a37c82b85b.png";
const LECTURE_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/19678aa3-1daa-4ede-bca4-2bf24092c9b3.png";
const BOOK_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/remove_background.png";

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
  return `<header class="r31-header"><div class="r31-shell r31-header-inner">
    <a class="r31-brand" href="/v31"><b>NJS</b><span>NEVER JUST SELL</span></a>
    <nav class="r31-nav"><a href="/v31/content">콘텐츠</a><a href="/v31/knowledge">지식</a><a href="${esc(authOrigin)}/courses">배우기</a><a href="${esc(communityOrigin)}/">커뮤니티</a><a href="/v31/about">맥작가</a></nav>
    <a class="r31-search" href="/v31/knowledge">검색</a>
  </div></header>`;
}
function footer(communityOrigin, authOrigin) {
  return `<footer class="r31-footer"><div class="r31-shell r31-footer-grid">
    <div><b>NEVER JUST SELL</b><p>마케팅과 사업을 이해하고, 배우고, 직접 해보는 사람들을 위한 공간입니다.</p></div>
    <nav><a href="/v31/content">콘텐츠</a><a href="/v31/knowledge">지식</a><a href="${esc(authOrigin)}/courses">배우기</a><a href="${esc(communityOrigin)}/">커뮤니티</a><a href="/v31/book">책</a><a href="/v31/lecture">강연·컨설팅</a><a href="/support">고객지원</a></nav>
  </div></footer>`;
}
function shell({title,description,body,communityOrigin,authOrigin}) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="noindex,nofollow,noarchive">
<meta name="njs-preview-revision" content="v31-ia-02"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/v31.css"></head><body>
<div class="r31-preview">재구성 프리뷰 · 공개 페이지가 아닙니다.</div>
${nav(communityOrigin,authOrigin)}${body}${footer(communityOrigin,authOrigin)}
</body></html>`;
}

function homePage({briefs,knowledge,videos,communityOrigin,authOrigin}) {
  const brief=currentBrief(briefs), video=currentVideo(videos), k=knowledge.slice(0,3);
  const briefBlock=brief
    ? `<a class="r31-news-main" href="/knowledge/${encodeURIComponent(brief.slug)}"><span>최신 브리핑 · ${esc(brief.updated)}</span><h3>${esc(brief.title)}</h3><p>${esc(brief.summary)}</p><em>브리핑 읽기 →</em></a>`
    : `<div class="r31-news-main r31-placeholder"><span>브리핑 자리</span><h3>시장과 플랫폼의 변화를 따로 다룹니다.</h3><p>실제 브리핑이 등록되면 최신 뉴스와 변화만 이곳에 표시합니다. 장기 지식과 섞지 않습니다.</p></div>`;
  const videoBlock=video
    ? `<a class="r31-video-card" href="${esc(video.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(video.thumbnail)}" alt="" loading="lazy"><span>최근 영상 · ${esc(dateKo(video.published))}</span><strong>${esc(video.title)}</strong></a>`
    : `<div class="r31-video-card r31-placeholder"><span>최근 영상</span><strong>최근 공개 영상을 불러옵니다.</strong></div>`;

  return `<main>
  <section class="r31-hero"><div class="r31-shell r31-hero-grid">
    <div class="r31-hero-copy"><p class="r31-eyebrow">『그냥 팔지 말라』 저자 맥작가</p><h1>팔리는 순간보다<br>그 앞과 뒤를 봅니다.</h1>
      <p>상품을 만들고, 알리고, 선택받고, 다시 찾게 만드는 과정은 따로 떨어져 있지 않습니다. NJS에서는 그 과정을 이해하고, 배우고, 직접 해볼 수 있습니다.</p>
      <div class="r31-actions"><a class="r31-btn r31-btn-dark" href="/v31/content">지금 볼 것</a><a class="r31-link" href="/v31/knowledge">지식 찾아보기 →</a></div>
    </div><figure class="r31-hero-photo"><img src="${esc(HERO_IMAGE)}" alt="맥작가"></figure>
  </div></section>

  <section class="r31-section r31-now"><div class="r31-shell">
    <div class="r31-section-head"><div><p class="r31-eyebrow">지금 볼 것</p><h2>지금 바뀌는 것과<br>지금 생각하는 것.</h2></div><p>뉴스와 시장 변화는 브리핑으로, 오래 남길 생각은 칼럼으로 나눕니다. 지식 라이브러리와는 별도입니다.</p></div>
    <div class="r31-now-grid">${briefBlock}
      <div class="r31-column-preview"><span>맥작가 칼럼 · 구조 시안</span><h3>뉴스를 요약하는 글보다,<br>왜 그런 변화가 생겼는지 씁니다.</h3><p>실제 칼럼 자산이 등록되기 전까지는 공개하지 않습니다. 칼럼은 맥작가의 긴 논지와 해석을 쌓는 자리입니다.</p><a href="/v31/content#column">칼럼 자리 보기 →</a></div>
      ${videoBlock}
    </div>
  </div></section>

  <section class="r31-section r31-knowledge"><div class="r31-shell">
    <div class="r31-section-head"><div><p class="r31-eyebrow">마케팅 지식</p><h2>시간이 지나도<br>다시 찾을 수 있게.</h2></div><p>브리핑과 달리, 개념·사례·가이드는 나중에도 다시 꺼내볼 수 있도록 정리합니다.</p></div>
    <div class="r31-knowledge-grid">${k.map((x)=>`<a href="/knowledge/${encodeURIComponent(x.slug)}"><span>${esc(x.updated)}</span><strong>${esc(x.title)}</strong><p>${esc(x.summary)}</p><em>지식 보기 →</em></a>`).join("")}</div>
    <a class="r31-link r31-more" href="/v31/knowledge">지식 전체 보기 →</a>
  </div></section>

  <section class="r31-section r31-do"><div class="r31-shell">
    <div class="r31-section-head"><div><p class="r31-eyebrow">배우고 써보기</p><h2>읽는 것과<br>해보는 것은 다릅니다.</h2></div></div>
    <div class="r31-do-grid">
      <a href="${esc(authOrigin)}/courses"><span>01</span><h3>강의</h3><p>한 주제를 순서대로 배우고 실제 적용까지 이어갑니다.</p><em>배우기 →</em></a>
      <a href="/v31/book"><span>02</span><h3>책·전자책</h3><p>한 가지 문제를 더 깊게 읽고 생각할 수 있도록 묶습니다.</p><em>책 보기 →</em></a>
      <a href="/v31/lecture"><span>03</span><h3>강연·컨설팅</h3><p>기업과 조직의 실제 과제에 맞춰 주제를 다시 구성합니다.</p><em>안내 보기 →</em></a>
    </div>
  </div></section>

  <section class="r31-author"><div class="r31-shell r31-author-grid">
    <figure><img src="${esc(LECTURE_IMAGE)}" alt="강연 중인 맥작가" loading="lazy"></figure>
    <div><p class="r31-eyebrow">맥작가</p><h2>한 가지 채널만<br>본 사람이 아닙니다.</h2><p>현장 영업과 MD, 글로벌 B2B와 제조, 온라인 커머스를 직접 경험했습니다. 그래서 광고나 검색 한 가지보다 고객·상품·유통·브랜드가 어떻게 이어지는지를 함께 봅니다.</p><a class="r31-link" href="/v31/about">맥작가 알아보기 →</a></div>
  </div></section>

  <section class="r31-community"><div class="r31-shell r31-community-grid">
    <div><p class="r31-eyebrow r31-light">커뮤니티</p><h2>지식은 정리해서 남기고,<br>커뮤니티에서는 현실을 묻습니다.</h2><p>같은 문제를 먼저 겪은 사람의 경험을 보고, 내가 해본 결과도 남길 수 있습니다. 커뮤니티의 글은 곧바로 공식 지식이 되지 않습니다.</p><a class="r31-btn r31-btn-light" href="${esc(communityOrigin)}/">커뮤니티 들어가기</a></div>
    <div class="r31-community-note"><b>지식</b><p>NJS가 정리하고 검토한 내용</p><b>커뮤니티</b><p>사용자의 질문·경험·실패·결과</p><b>둘 사이</b><p>검토할 가치가 있는 경험만 다시 지식으로 다듬습니다.</p></div>
  </div></section>
  </main>`;
}

function contentPage({briefs,videos}) {
  const brief=briefs?.[0]||null, video=videos?.[0]||null;
  return `<main>
  <section class="r31-page-hero"><div class="r31-shell"><p class="r31-eyebrow">콘텐츠</p><h1>지금 볼 것과<br>오래 남길 글을 나눕니다.</h1><p>뉴스·플랫폼 변화는 브리핑으로 빠르게 다루고, 맥작가의 긴 해석은 칼럼으로 남깁니다. 영상·책 해석·사례도 한곳에서 찾아볼 수 있습니다.</p></div></section>
  <section class="r31-content-tabs"><div class="r31-shell"><a href="#column">칼럼</a><a href="#briefing">브리핑</a><a href="#video">영상</a><a href="#books">책 해석</a><a href="#case">사례</a></div></section>
  <section class="r31-section" id="column"><div class="r31-shell r31-two-col"><div><p class="r31-eyebrow">맥작가 칼럼</p><h2>생각을 길게 남기는 자리.</h2><p>단순 요약보다 한 가지 문제를 끝까지 따라가며 맥작가의 관점과 근거를 정리합니다.</p></div><div class="r31-empty-editorial"><span>프리뷰 전용 자리</span><strong>실제 칼럼 자산이 등록되면 이 영역에 최신 글이 표시됩니다.</strong><p>없는 글을 만들어 채우지 않습니다.</p></div></div></section>
  <section class="r31-section r31-muted" id="briefing"><div class="r31-shell"><div class="r31-section-head"><div><p class="r31-eyebrow">브리핑</p><h2>지금 알아야 할 변화.</h2></div><p>뉴스 자체보다 사업자에게 어떤 의미인지 빠르게 정리합니다.</p></div>
    ${brief ? `<a class="r31-wide-story" href="/knowledge/${encodeURIComponent(brief.slug)}"><span>${esc(brief.updated)}</span><h3>${esc(brief.title)}</h3><p>${esc(brief.summary)}</p><em>브리핑 읽기 →</em></a>` : `<div class="r31-empty-editorial"><strong>현재 freshness 기준을 통과한 브리핑이 없습니다.</strong><p>새 브리핑이 등록되면 자동으로 나타납니다.</p></div>`}
  </div></section>
  <section class="r31-section" id="video"><div class="r31-shell r31-two-col"><div><p class="r31-eyebrow">영상</p><h2>말로 설명하면<br>더 잘 보이는 것들.</h2></div>
    ${video ? `<a class="r31-video-feature" href="${esc(video.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(video.thumbnail)}" alt=""><span>${esc(dateKo(video.published))}</span><strong>${esc(video.title)}</strong></a>` : `<div class="r31-empty-editorial">최근 영상 없음</div>`}
  </div></section>
  <section class="r31-section r31-muted" id="books"><div class="r31-shell"><p class="r31-eyebrow">책 해석</p><h2>다른 책을 맥작가의 관점으로 다시 읽습니다.</h2><p>단순 요약보다 지금의 마케팅·브랜딩 문제에 어떤 의미가 있는지 해석합니다.</p></div></section>
  <section class="r31-section" id="case"><div class="r31-shell"><p class="r31-eyebrow">사례</p><h2>잘됐다는 결과보다<br>왜 그렇게 됐는지를 봅니다.</h2><p>기업·브랜드·플랫폼 사례를 사실과 해석을 구분해 정리합니다.</p></div></section>
  </main>`;
}

function knowledgePage(knowledge) {
  return `<main><section class="r31-page-hero"><div class="r31-shell"><p class="r31-eyebrow">지식</p><h1>뉴스가 지나간 뒤에도<br>남아 있는 것.</h1><p>마케팅·브랜딩·온라인 커머스의 개념, 사례, 가이드를 정리합니다. 최신 뉴스와 커뮤니티 글은 이곳에 섞지 않습니다.</p></div></section>
  <section class="r31-section"><div class="r31-shell"><div class="r31-knowledge-list">
  ${knowledge.slice(0,12).map((x)=>`<a href="/knowledge/${encodeURIComponent(x.slug)}"><small>${esc(x.updated)} · ${esc(x.type||"지식")}</small><strong>${esc(x.title)}</strong><p>${esc(x.summary)}</p></a>`).join("")}
  </div><a class="r31-btn r31-btn-dark" href="/knowledge">현재 지식 허브 열기</a></div></section></main>`;
}

function aboutPage() {
  return `<main><section class="r31-about-hero"><div class="r31-shell r31-about-hero-grid"><div><p class="r31-eyebrow">맥작가</p><h1>마케팅을<br>사업 안에서 봅니다.</h1><p>한 가지 플랫폼의 사용법보다 고객, 상품, 유통, 브랜드가 어떻게 연결되는지를 오래 고민해 왔습니다.</p></div><figure><img src="${esc(HERO_IMAGE)}" alt="맥작가"></figure></div></section>
  <section class="r31-section"><div class="r31-shell r31-story-list">
    <article><span>현장과 상품</span><h2>영업에서 MD까지.</h2><p>매장에서 고객을 만나고, 상품과 수요·재고를 함께 보면서 숫자 뒤의 현장을 배웠습니다.</p></article>
    <article><span>시장과 제조</span><h2>팔 물건보다<br>필요한 시장을 먼저 찾았습니다.</h2><p>해외영업과 제조업 운영을 거치며 시장개척, 제품개발, 생산과 수출을 함께 다뤘습니다.</p></article>
    <article><span>온라인 커머스와 저술</span><h2>직접 팔아본 경험을<br>생각과 지식으로 남깁니다.</h2><p>온라인 판매망을 운영한 뒤 『그냥 팔지 말라』를 쓰고, 영상·강의·NJS로 경험을 다시 구조화하고 있습니다.</p></article>
  </div></section></main>`;
}

function bookPage() {
  return `<main><section class="r31-book-hero"><div class="r31-shell r31-book-grid"><div class="r31-book-cover"><img src="${esc(BOOK_IMAGE)}" alt="그냥 팔지 말라 스마트스토어 책 표지"></div><div><p class="r31-eyebrow">책</p><h1>그냥 팔지 말라<br>스마트스토어</h1><p>온라인 판매를 검색·광고 기술만으로 보지 않고 상품, 유통, 고객과 브랜드를 함께 보는 책입니다.</p><div class="r31-ratings"><div><span>YES24</span><b>9.4 / 10</b></div><div><span>교보문고</span><b>9.9 / 10</b></div></div><a class="r31-btn r31-btn-dark" href="/book">현재 책 페이지 보기</a></div></div></section>
  <section class="r31-section r31-muted"><div class="r31-shell r31-book-points"><div><span>01</span><h2>검색보다 먼저 고객을 봅니다.</h2></div><div><span>02</span><h2>판매와 브랜드를 따로 보지 않습니다.</h2></div><div><span>03</span><h2>책의 질문은 NJS에서 계속 이어집니다.</h2></div></div></section></main>`;
}

function lecturePage() {
  return `<main><section class="r31-lecture-hero"><div class="r31-shell r31-lecture-grid"><div><p class="r31-eyebrow">강연·컨설팅</p><h1>정해진 강의안을<br>그대로 들고 가지 않습니다.</h1><p>조직이 실제로 고민하는 시장, 고객, 유통, 브랜드 문제에 맞춰 주제를 다시 구성합니다.</p></div><figure><img src="${esc(LECTURE_IMAGE)}" alt="맥작가 강연"></figure></div></section>
  <section class="r31-section"><div class="r31-shell"><div class="r31-lecture-topics"><article><span>01</span><h2>마케팅·브랜드</h2><p>고객에게 선택받는 이유와 관계를 만드는 방법을 다룹니다.</p></article><article><span>02</span><h2>온라인 커머스·유통</h2><p>플랫폼 사용법보다 시장과 유통 구조를 이해하는 데 초점을 둡니다.</p></article><article><span>03</span><h2>AI와 사업</h2><p>AI를 도구 목록이 아니라 조사·판단·운영 방식의 변화로 봅니다.</p></article></div><div class="r31-contact-note"><strong>현재 공개 신청 동선은 준비 중입니다.</strong><p>실제 문의·예약 경로가 확정되기 전에는 신청 가능한 것처럼 표시하지 않습니다.</p></div></div></section></main>`;
}

export async function renderV31Page({request,env,siteOrigin,authOrigin,communityOrigin}) {
  const url=new URL(request.url);
  const [{entries},videos]=await Promise.all([loadKnowledgeEntries(env),loadYoutubeFeed()]);
  const {briefs,knowledge}=splitKnowledge(entries);
  let body,title,description;
  if (url.pathname==="/v31" || url.pathname==="/v31/") {
    body=homePage({briefs,knowledge,videos,communityOrigin,authOrigin}); title="NJS 재구성 프리뷰"; description="브리핑·칼럼·지식·커뮤니티를 분리한 NJS 재구성 프리뷰";
  } else if (url.pathname==="/v31/content") {
    body=contentPage({briefs,videos}); title="콘텐츠 재구성 프리뷰 | NJS"; description="칼럼·브리핑·영상·책 해석·사례를 분리한 콘텐츠 허브 프리뷰";
  } else if (url.pathname==="/v31/knowledge") {
    body=knowledgePage(knowledge); title="지식 재구성 프리뷰 | NJS"; description="최신 뉴스와 커뮤니티를 분리한 마케팅 지식 프리뷰";
  } else if (url.pathname==="/v31/about") {
    body=aboutPage(); title="맥작가 재구성 프리뷰 | NJS"; description="맥작가 소개 페이지 재구성 프리뷰";
  } else if (url.pathname==="/v31/book") {
    body=bookPage(); title="책 재구성 프리뷰 | NJS"; description="책 페이지 재구성 프리뷰";
  } else if (url.pathname==="/v31/lecture") {
    body=lecturePage(); title="강연·컨설팅 재구성 프리뷰 | NJS"; description="강연·컨설팅 페이지 재구성 프리뷰";
  } else return new Response("Not found",{status:404});
  return new Response(shell({title,description,body,communityOrigin,authOrigin}),{status:200,headers:{
    "Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow, noarchive","X-Content-Type-Options":"nosniff"
  }});
}

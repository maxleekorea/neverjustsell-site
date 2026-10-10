import { loadKnowledgeEntries } from "./knowledge-runtime.js";
import { renderNjsJourneyHome } from "./njs-home-journey.js";
import {contentPageV38,knowledgePageV38,classPageV38,storePageV38,supportPageV38,aboutPageV38,bookPageV38,lecturePageV38} from "./njs-subpages.js";

const YOUTUBE_CHANNEL_ID = "UCjKn4fGi2SuYRQmgWdi9XhA";
const YOUTUBE_FEED = "https://www.youtube.com/feeds/videos.xml?channel_id=" + YOUTUBE_CHANNEL_ID;
const HERO_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/68868a93-5045-4e7b-936d-a9a37c82b85b.png";
const LECTURE_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/19678aa3-1daa-4ede-bca4-2bf24092c9b3.png";
const BOOK_IMAGE = "https://ecimg.cafe24img.com/pg3384b83272540024/neverjustsell/remove_background.png";
const COURSE_MAIN_IMAGE = "https://cdn.liveklass.com/course/01a08446ae4f75678a16661236fa9dc6.png.medium";
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

function nav(communityOrigin, authOrigin, routeKey="/") {
  const current=(key)=>routeKey===key ? ' aria-current="page"' : '';
  return `<header class="r33-header"><div class="r33-shell r33-header-inner">
    <a class="r33-brand" href="/v33" aria-label="NEVER JUST SELL 홈"><img src="/njs-brand-mark.svg" alt="" width="29" height="29">NEVER JUST SELL</a>
    <nav class="r33-nav" aria-label="주 메뉴">
      <a href="/v33/content"${current("/content")}>콘텐츠</a>
      <a href="${esc(authOrigin)}/courses">강의</a>
      <a href="${esc(communityOrigin)}/">커뮤니티</a>
      <a href="/v33/knowledge"${current("/knowledge")}>지식·자료</a>
      <a href="/v33/book"${current("/book")}>책</a>
      <a href="/v33/about"${current("/about")}>맥작가</a>
      <details class="r33-more"><summary>더보기</summary><div>
        <a href="/v33/lecture"${current("/lecture")}>강연·컨설팅</a>
        <a href="/v33/store"${current("/store")}>스토어</a>
        <a href="/v33/support"${current("/support")}>고객지원</a>
      </div></details>
    </nav>
    <div class="r33-head-actions">
      <a class="r33-search" href="/v33/knowledge" aria-label="지식·자료 검색">검색</a>
      <a class="r33-myspace" href="${esc(authOrigin)}/my-space">내 공간</a>
      <details class="r33-mobile-menu"><summary aria-label="전체 메뉴 열기">메뉴</summary><div>
        <a href="${esc(authOrigin)}/my-space">내 공간 · 이어보기</a>
        <span class="r37-mobile-group">읽고 배우기</span>
        <a href="/v33/content"${current("/content")}>콘텐츠</a>
        <a href="/v33/knowledge"${current("/knowledge")}>지식·자료</a>
        <a href="${esc(authOrigin)}/courses">강의</a>
        <span class="r37-mobile-group">함께하기</span>
        <a href="${esc(communityOrigin)}/">커뮤니티</a>
        <span class="r37-mobile-group">맥작가와 이용 안내</span>
        <a href="/v33/book"${current("/book")}>책</a>
        <a href="/v33/about"${current("/about")}>맥작가</a>
        <a href="/v33/lecture"${current("/lecture")}>강연·컨설팅</a>
        <a href="/v33/store"${current("/store")}>스토어</a>
        <a href="/v33/support"${current("/support")}>고객지원</a>
      </div></details>
    </div>
  </div></header>`;
}
function footer(communityOrigin, authOrigin) {
  return `<footer class="r33-footer"><div class="r33-shell r33-footer-grid">
    <div><b>NEVER JUST SELL</b><p>맥작가의 글과 영상에서 시작해 강의로 배우고, 커뮤니티에서 질문과 경험을 이어갑니다.</p></div>
    <nav aria-label="바로가기 및 이용 안내">
      <a href="/v33/content">콘텐츠</a><a href="${esc(authOrigin)}/courses">강의</a>
      <a href="${esc(communityOrigin)}/">커뮤니티</a><a href="/v33/knowledge">지식·자료</a>
      <a href="/v33/book">책</a><a href="/v33/about">맥작가</a>
      <a href="/v33/lecture">강연·컨설팅</a><a href="/v33/store">스토어</a><a href="/v33/support">고객지원</a>
    </nav>
  </div></footer>`;
}
function productionizeLinks(html) {
  return String(html)
    .replaceAll('href="/v33/content', 'href="/content')
    .replaceAll('href="/v33/knowledge', 'href="/knowledge')
    .replaceAll('href="/v33/about', 'href="/about')
    .replaceAll('href="/v33/book', 'href="/book')
     .replaceAll('href="/v33/lecture', 'href="/lecture')
    .replaceAll('href="/v33/store', 'href="/store')
    .replaceAll('href="/v33/support', 'href="/support')
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
      isbn: "9791124121061",
      workExample: {
        "@type": "Book",
        bookFormat: "https://schema.org/EBook",
        isbn: "9791124121122"
      }
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
}

function shell({title,description,body,communityOrigin,authOrigin,siteOrigin,canonicalPath,routeKey,preview=true,image=HERO_IMAGE}) {
  const isPreview = preview === true;
  const canonical = siteOrigin + (canonicalPath === "/" ? "/" : canonicalPath);
  const chrome = nav(communityOrigin,authOrigin,routeKey) + body + footer(communityOrigin,authOrigin);
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
  return renderNjsJourneyHome({briefs,knowledge,videos,communityOrigin,authOrigin},{
    esc,dateKo,HERO_IMAGE,BOOK_IMAGE,COURSE_MAIN_IMAGE,YOUTUBE_CHANNEL_ID
  });
}

function contentPage({briefs,videos,knowledge}){return contentPageV38({briefs,videos,knowledge},{esc,dateKo,YOUTUBE_CHANNEL_ID});}

function knowledgePage(knowledge){return knowledgePageV38(knowledge,{esc});}

function classPage(authOrigin){return classPageV38(authOrigin,{esc,COURSE_MAIN_IMAGE});}

function storePage(authOrigin){return storePageV38(authOrigin,{esc,BOOK_IMAGE});}

function supportPage(authOrigin,shopOrigin){return supportPageV38(authOrigin,shopOrigin,{esc});}

function aboutPage(){return aboutPageV38({esc,HERO_IMAGE});}

function bookPage(){return bookPageV38({esc,BOOK_IMAGE});}

function lecturePage(){return lecturePageV38({esc,LECTURE_IMAGE});}

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
    description="맥작가의 실제 사업 경험과 콘텐츠를 바탕으로 고객의 선택과 시장 변화를 이해하고, 강의와 커뮤니티에서 배우고 질문하는 NEVER JUST SELL.";
  } else if (routePath==="/content") {
    body=contentPage({briefs,videos,knowledge});
    title=isPreview ? "콘텐츠 개편 프리뷰 | NJS" : "콘텐츠 | 유튜브·브리핑·사례 | NEVER JUST SELL";
    description="맥작가의 유튜브 영상, 시장·마케팅 브리핑, 공개된 실제 사례를 읽고 시청하세요.";
  } else if (routePath==="/knowledge") {
    body=knowledgePage(knowledge);
    title=isPreview ? "지식·자료 개편 프리뷰 | NJS" : "지식·자료 | 마케팅·사업 사례와 용어 검색 | NEVER JUST SELL";
    description="광고·가격·고객·브랜드 문제와 마케팅·사업 용어를 실제 사례와 설명으로 찾아보세요.";
  } else if (routePath==="/class") {
    body=classPage(authOrigin);
    title=isPreview ? "강의 안내 개편 프리뷰 | NJS" : "강의 안내 | 무료 온라인 유통 강의 | NEVER JUST SELL";
    description="현재 수강 가능한 온라인 유통 무료 강의와 준비 중인 강의 내용을 확인하고 내 강의실에서 학습을 이어가세요.";
  } else if (routePath==="/store") {
    body=storePage(authOrigin);
    title=isPreview ? "스토어 통합 프리뷰 | NJS" : "스토어 | NEVER JUST SELL";
    description="출간된 종이책과 전자책 구매처, 무료 온라인 강의, 준비 중인 콘텐츠를 구분해 안내합니다.";
  } else if (routePath==="/support") {
    body=supportPage(authOrigin, String(env?.SHOP_ORIGIN || "https://neverjustsell.cafe24.com").replace(/\/$/,""));
    title=isPreview ? "고객지원 통합 프리뷰 | NJS" : "고객지원 | NEVER JUST SELL";
    description="강의 수강 내역, 주문·결제 내역, 취소·환불 관련 주문 확인, 강의 질문 게시판으로 안내합니다.";
  } else if (routePath==="/about") {
    body=aboutPage();
    title=isPreview ? "맥작가 에디토리얼 프리뷰 | NJS" : "맥작가 | NEVER JUST SELL";
    description="영업·상품기획·제조·유통·온라인 판매 경험을 바탕으로 마케팅과 브랜드를 이야기하는 맥작가를 소개합니다.";
  } else if (routePath==="/book") {
    body=bookPage();
    title=isPreview ? "책 에디토리얼 프리뷰 | NJS" : "그냥 팔지 말라 스마트스토어 | NEVER JUST SELL";
    description="검색과 광고만이 아니라 고객, 상품, 유통과 브랜드를 함께 보는 『그냥 팔지 말라 스마트스토어』.";
    image=BOOK_IMAGE;
  } else if (routePath==="/lecture") {
    body=lecturePage();
    title=isPreview ? "강연·컨설팅 에디토리얼 프리뷰 | NJS" : "강연·컨설팅 | NEVER JUST SELL";
    description="조직의 마케팅·브랜드, 온라인 유통과 AI 대응을 함께 살펴볼 수 있는 맥작가의 강연·기업 교육 주제를 소개합니다.";
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

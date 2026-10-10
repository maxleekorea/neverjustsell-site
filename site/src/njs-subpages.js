/**
 * NJS P30 customer-oriented subpages, draft V3.8.
 * Copy must describe live functionality and a reader benefit, not internal service labels.
 * Keep the approved Home / D-099 / P20, classroom, community and Cafe24 contracts intact.
 */
const YES24_PAPER="https://www.yes24.com/product/goods/171660478";
const YES24_EBOOK="https://www.yes24.com/product/goods/195224748";

function head({eyebrow,title,description,extra=""}){
  return `<section class="r38-hero"><div class="r33-shell"><p class="r38-eyebrow">${eyebrow}</p><h1>${title}</h1><p class="r38-lead">${description}</p>${extra}</div></section>`;
}
function sectionHead(eyebrow,title,desc=""){
  return `<div class="r38-section-head"><div><p class="r38-eyebrow">${eyebrow}</p><h2>${title}</h2></div>${desc? `<p>${desc}</p>`:""}</div>`;
}
function metaDate(raw){return String(raw||"").slice(0,10);}
function page(html){return `<main id="main-content" class="r38-page">${html}</main>`; }
function btn(href,label,other=""){return `<a class="r38-button ${other}" href="${href}">${label} <span aria-hidden="true">→</span></a>`; }
function link(href,label){return `<a class="r38-text-link" href="${href}">${label} <span aria-hidden="true">→</span></a>`; }

export function contentPageV38({briefs=[],videos=[]},{esc,dateKo,YOUTUBE_CHANNEL_ID}){
  const brief=briefs[0]||null,video=videos[0]||null;
  const menu=`<nav class="r38-jump-nav" aria-label="콘텐츠 종류 바로가기">
    <a href="#r38-videos">유튜브 영상</a><a href="#r38-briefings">시장·마케팅 브리핑</a><a href="#r38-case-list">사례 분석</a>
  </nav>`;
  const videoHtml=video
    ? `<a class="r38-feature-media" href="${esc(video.url)}" target="_blank" rel="noopener noreferrer">
      <img src="${esc(video.thumbnail)}" alt="" loading="lazy">
      <div><small>유튜브 · ${esc(dateKo(video.published))}</small><strong>${esc(video.title)}</strong><span>유튜브에서 영상 보기 ↗</span></div>
    </a>`
    : `<a class="r38-simple-action" href="https://www.youtube.com/channel/${esc(YOUTUBE_CHANNEL_ID)}" target="_blank" rel="noopener noreferrer">맥작가 유튜브 채널에서 영상 보기 ↗</a>`;
  const briefHtml=brief
    ? `<a class="r38-feature-brief" href="/knowledge/${encodeURIComponent(brief.slug)}">
      <small>브리핑 · ${esc(metaDate(brief.updated))}</small><strong>${esc(brief.title)}</strong><p>${esc(brief.summary)}</p><span>브리핑 내용 읽기 →</span>
    </a>`
    : `<p class="r38-no-content">현재 표시할 브리핑이 없습니다. 공개 자료는 지식·자료 메뉴에서 찾아볼 수 있습니다.</p>`;
  return page(`${head({eyebrow:"영상·칼럼·브리핑",title:"시장과 고객의 변화를<br>영상과 글로 살펴보세요.",description:"맥작가가 최근 이야기한 주제부터 마케팅·브랜드·유통 사례까지. 관심 있는 내용을 골라 읽거나 시청할 수 있습니다.",extra:menu})}
    <section class="r38-section" aria-label="현재 공개된 콘텐츠"><div class="r33-shell r38-media-two">
      <section id="r38-videos"><p class="r38-eyebrow">유튜브</p><h2>맥작가의 최근 영상</h2><p class="r38-aside-description">검색·고객·브랜드에 관한 이야기를 영상으로 확인해 보세요.</p>${videoHtml}</section>
      <section id="r38-briefings"><p class="r38-eyebrow">브리핑</p><h2>시장 변화와 마케팅 이슈</h2><p class="r38-aside-description">알아두면 도움이 될 변화와 사업에 미치는 영향을 살펴봅니다.</p>${briefHtml}</section>
    </div></section>
    <section class="r38-section r38-muted" id="r38-case-list"><div class="r33-shell">
      ${sectionHead("실제 문제별 자료","광고·가격·고객 문제를 사례로 살펴보세요.","자료를 읽다가 개념이 궁금하면 지식·자료에서 이어서 찾아볼 수 있습니다.")}
      <div class="r38-row-links">
        <a href="/knowledge/case-roas-high-profit-low"><strong>광고 효율은 좋은데 실제 이익이 남지 않는 경우</strong><span>광고와 수익 구조 살펴보기 →</span></a>
        <a href="/knowledge/case-discount-no-conversion"><strong>가격을 낮춰도 구매가 늘지 않는 경우</strong><span>고객이 선택하지 않는 이유 읽기 →</span></a>
        <a href="/knowledge/case-platform-rule-change"><strong>플랫폼 규정 변경으로 성과가 흔들리는 경우</strong><span>사업의 의존 구조 점검하기 →</span></a>
      </div>
      <p class="r38-bottom-action">${link("/v33/knowledge","사례·용어 전체에서 검색하기")}</p>
    </div></section>
    <section class="r38-low-notice"><div class="r33-shell"><strong>맥작가 칼럼·책 해석</strong><p>긴 글과 책 해석 콘텐츠는 공개된 글이 생기면 이곳에서 소개하겠습니다. 현재는 위의 영상과 브리핑, 공개 사례를 이용하실 수 있습니다.</p></div></section>`);
}

export function knowledgePageV38(knowledge=[],{esc}){
  const items=Array.isArray(knowledge)?knowledge.slice(0,50):[];
  const groups=[
    {id:"r38-cases",label:"사례로 문제 살펴보기",subtitle:"내 사업과 비슷한 상황이 있다면 문제의 원인부터 확인해 보세요.",items:items.filter(x=>x.type==="case")},
    {id:"r38-terms",label:"마케팅·사업 용어 이해하기",subtitle:"검색, 광고, 브랜딩, 재무 등 자주 쓰는 개념을 쉬운 설명으로 확인해 보세요.",items:items.filter(x=>x.type==="term")},
    {id:"r38-more-data",label:"주제별 참고 자료",subtitle:"사례와 용어 외에 더 살펴볼 내용을 모았습니다.",items:items.filter(x=>!["case","term"].includes(x.type))}
  ];
  const card=x=>`<a class="r38-knowledge-entry" data-r38-entry data-search="${esc([x.title,x.summary,x.type,x.category,...(x.keywords||[])].join(" ").toLowerCase())}" href="/knowledge/${encodeURIComponent(x.slug)}">
    <span><small>${esc(x.type==="case"?"문제별 사례":x.type==="term"?"용어 설명":"참고 자료")}</small><strong>${esc(x.title)}</strong><span>${esc(x.summary)}</span></span><b aria-hidden="true">↗</b>
  </a>`;
  const sections=groups.filter(g=>g.items.length).map(g=>`<section class="r38-knowledge-group" id="${g.id}" data-r38-group><h2>${g.label}</h2><p>${g.subtitle}</p><div class="r38-knowledge-results">${g.items.map(card).join("")}</div></section>`).join("");
  return page(`${head({eyebrow:"지식·자료",title:"마케팅과 사업에 필요한<br>사례·용어를 찾아보세요.",description:"광고 효율, 가격, 고객, 브랜드, 검색 등 궁금한 주제를 찾아보세요. 실제로 겪는 문제와 자주 쓰는 용어를 구분해 정리했습니다."})}
    <section class="r38-section r38-knowledge"><div class="r33-shell">
      <div class="r38-searchbar"><label for="r38-search">무엇이 궁금하신가요?</label>
        <div><input type="search" id="r38-search" placeholder="예: 광고비, 재구매, 포지셔닝" autocomplete="off" aria-controls="r38-search-results"><span id="r38-count" role="status" aria-live="polite">${items.length}개 자료</span></div>
      </div>
      <div class="r38-knowledge-shortcuts">
        <a href="#r38-cases">문제별 사례</a><a href="#r38-terms">마케팅·사업 용어</a>
        ${link("/knowledge/saved","내가 저장한 자료")}
      </div>
      <div id="r38-search-results">${sections || '<p class="r38-no-content">자료 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>'}
      </div>
      <p class="r38-no-results" id="r38-empty" hidden>검색 결과가 없습니다. 다른 주제어나 짧은 단어로 검색해 보세요.</p>
    </div></section>
    <script>(function(){
      const input=document.getElementById("r38-search");
      const cards=[...document.querySelectorAll("[data-r38-entry]")];
      const count=document.getElementById("r38-count");
      const empty=document.getElementById("r38-empty");
      if(!input)return;
      function update(){
        const q=input.value.trim().toLocaleLowerCase("ko-KR");let n=0;
        for(const c of cards){const ok=!q||(c.getAttribute("data-search")||"").includes(q);c.hidden=!ok;if(ok)n++;}
        for(const g of document.querySelectorAll("[data-r38-group]")){
          g.hidden=!Array.from(g.querySelectorAll("[data-r38-entry]")).some(e=>!e.hidden);
        }
        count.textContent=n+"개 자료";empty.hidden=n>0;
      }
      input.addEventListener("input",update);update();
    })();</script>`);
}

export function classPageV38(authOrigin,{esc,COURSE_MAIN_IMAGE}){
  const base=esc(authOrigin);
  const course=base+"/courses/online-commerce-basics";
  return page(`${head({eyebrow:"강의",title:"온라인 커머스,<br>기본 구조부터 배워보세요.",description:"상품을 잘 등록하는 방법에 앞서 고객·유통·검색·브랜드가 어떻게 연결되는지 이해하는 강의입니다. 현재 수강 가능한 무료 강의부터 확인해 보세요.",
     extra:`<div class="r38-hero-actions">${btn(course,"무료 강의 내용 보기")}${link(base+"/my-space","내 강의 이어보기")}</div>`})}
    <section class="r38-section"><div class="r33-shell r38-course-feature">
      <div><p class="r38-eyebrow">현재 수강 가능 · 무료</p><h2>온라인 유통의 기본</h2><p class="r38-description">온라인 판매를 시작하거나 사업 방식을 다시 점검하고 싶은 분을 위한 기초 강의입니다.</p>
        <h3>이런 내용을 배웁니다</h3>
        <ul><li>고객의 검색과 상품 선택이 어떻게 연결되는지</li><li>네이버 쇼핑과 온라인 유통이 어떻게 움직이는지</li><li>광고·콘텐츠·브랜드를 함께 살펴보는 이유</li></ul>
        <div class="r38-inline-actions">${btn(course,"강의 소개와 무료 수강 신청")}${link(base+"/courses","모든 강의 살펴보기")}</div>
        <p class="r38-fineprint">무료 강의도 수강 신청 후 내 강의실에 추가됩니다.</p>
      </div>
      <a class="r38-course-image" href="${course}" aria-label="온라인 유통의 기본 강의 자세히 보기"><img src="${esc(COURSE_MAIN_IMAGE)}" alt="온라인 유통의 기본 강의 대표 이미지" loading="lazy"></a>
    </div></section>
    <section class="r38-section r38-muted"><div class="r33-shell">
      ${sectionHead("강의 목록","다음으로 살펴볼 주제","아래 두 강의는 소개를 확인할 수 있지만 아직 판매 준비 중입니다.")}
      <div class="r38-row-links">
        <a href="${base}/courses/naver-search-algorithm"><strong>온라인 커머스 역사와 네이버 쇼핑 검색 알고리즘</strong><span>판매 준비 중 · 강의 내용 확인 →</span></a>
        <a href="${base}/courses/naver-keyword-strategy"><strong>네이버 쇼핑 키워드 전략</strong><span>판매 준비 중 · 강의 내용 확인 →</span></a>
      </div>
      <p class="r38-bottom-action">${link(base+"/courses","강의실에서 전체 목록 확인하기")}</p>
    </div></section>
    <section class="r38-low-notice"><div class="r33-shell"><strong>강의에서 궁금한 점이 생겼다면</strong><p>강의실에서 학습을 이어보고, 관련 질문과 토론은 커뮤니티에서 확인해 보세요.</p><p>${link("https://community.neverjustsell.com/","커뮤니티 글과 질문 살펴보기")}</p></div></section>`);
}

export function storePageV38(authOrigin,{esc,BOOK_IMAGE}){
  const a=esc(authOrigin);
  return page(`${head({eyebrow:"스토어·이용 안내",title:"책과 강의,<br>현재 이용할 수 있는 내용을 확인하세요.",description:"출간된 책은 외부 서점에서 구매할 수 있고, 무료 강의는 NJS 강의실에서 수강 신청할 수 있습니다. 준비 중인 상품은 별도로 표시합니다."})}
    <section class="r38-section"><div class="r33-shell">
      ${sectionHead("지금 이용할 수 있습니다","책과 무료 강의")}
      <div class="r38-store-published">
        <div class="r38-book-mini"><img src="${esc(BOOK_IMAGE)}" alt="『그냥 팔지 말라 스마트스토어』 책 표지" loading="lazy">
          <div><p class="r38-eyebrow">종이책·전자책 · 외부 서점 구매</p><h3>그냥 팔지 말라 스마트스토어</h3><p>온라인 유통과 고객의 선택, 검색과 브랜드의 관계를 다룬 책입니다.</p>
            <div class="r38-inline-actions"><a class="r38-text-link" href="${YES24_PAPER}" rel="noopener noreferrer" target="_blank">종이책 서점에서 보기 ↗</a><a class="r38-text-link" href="${YES24_EBOOK}" rel="noopener noreferrer" target="_blank">전자책 서점에서 보기 ↗</a></div>
          </div>
        </div>
        <div class="r38-store-course"><p class="r38-eyebrow">온라인 강의 · 무료</p><h3>온라인 유통의 기본</h3><p>고객·상품·유통·검색이 연결되는 과정을 배우는 기초 강의입니다.</p>
          ${btn(a+"/courses/online-commerce-basics","무료 강의 소개 보기")}
        </div>
      </div>
    </div></section>
    <section class="r38-section r38-muted"><div class="r33-shell r38-minor-grid">
      <div><h2>앞으로 제공할 콘텐츠</h2><p>별도의 실용 전자책과 프로그램은 준비 중입니다. 현재 신청할 수 있는 상품과 혼동되지 않도록 판매가 시작되면 안내하겠습니다.</p></div>
      <div><h2>이미 수강 중이라면</h2><p>신청한 강의와 학습 자료는 내 공간에서 확인해 보세요.</p>${link(a+"/my-space","내 공간에서 수강 내역 확인")}</div>
    </div></section>`);
}

export function supportPageV38(authOrigin,shopOrigin,{esc}){
  const a=esc(authOrigin),orders=esc(shopOrigin)+"/myshop/order/list.html";
  return page(`${head({eyebrow:"고객지원",title:"수강·주문·환불,<br>어떤 도움이 필요하신가요?",description:"강의가 보이지 않거나 주문 내역을 확인해야 할 때, 상황에 맞는 페이지로 이동해 처리할 수 있습니다."})}
    <section class="r38-section"><div class="r33-shell">
      <div class="r38-support-grid">
        <a href="${a}/my-space"><span class="r38-eyebrow">강의 이용</span><h2>신청한 강의가 어디 있나요?</h2><p>내 공간에서 수강 중인 강의와 학습 자료를 확인할 수 있습니다.</p><strong>내 강의실 확인하기 →</strong></a>
        <a href="${orders}"><span class="r38-eyebrow">주문 내역</span><h2>주문이나 결제 내용을 확인하고 싶어요.</h2><p>주문 목록에서 결제 내역과 처리 상태를 확인할 수 있습니다.</p><strong>스토어 주문 내역 보기 →</strong></a>
        <a href="${orders}"><span class="r38-eyebrow">취소·환불</span><h2>주문을 취소하거나 환불받고 싶어요.</h2><p>먼저 주문 내역을 확인하세요. 취소·환불 가능 여부와 처리 방법은 해당 주문의 정책에 따릅니다.</p><strong>취소·환불 대상 주문 확인하기 →</strong></a>
        <a href="https://community.neverjustsell.com/course-questions"><span class="r38-eyebrow">강의 내용 질문</span><h2>강의를 듣다가 궁금한 점이 생겼어요.</h2><p>강의 관련 질문과 다른 수강자의 답변을 확인할 수 있습니다.</p><strong>강의 질문 게시판 보기 →</strong></a>
      </div>
      <p class="r38-legal-note">각 서비스의 주문·수강·회원 정보는 해당 서비스의 로그인 상태와 이용 규정에 따라 표시됩니다.</p>
    </div></section>`);
}

export function aboutPageV38({esc,HERO_IMAGE}){
  return page(`<section class="r38-about-hero"><div class="r33-shell r38-about-grid">
    <div><p class="r38-eyebrow">맥작가 · 저자이자 사업가</p><h1>마케팅을 고객과 상품,<br>사업 전체의 관점에서 이야기합니다.</h1><p class="r38-lead">영업 현장, 상품기획, 제조와 유통, 온라인 판매를 직접 경험했습니다. 이 과정에서 얻은 질문을 글과 영상, 강의로 나누고 있습니다.</p>
      <div class="r38-hero-actions">${link("/v33/book","맥작가의 책 살펴보기")}${link("/v33/content","영상과 글 보기")}</div>
    </div><figure><img src="${esc(HERO_IMAGE)}" alt="맥작가의 인물 사진" loading="lazy"></figure>
  </div></section>
  <section class="r38-section"><div class="r33-shell">
    ${sectionHead("경험의 바탕","어떤 경험에서 나온 이야기인가요?")}
    <div class="r38-bio-rows">
      <article><span>영업·상품기획</span><div><h3>상품을 고르는 고객과 판매 현장을 가까이에서 봤습니다.</h3><p>매장 운영과 상품 배분, 수요·재고를 다루면서 숫자와 실제 고객 행동을 함께 살폈습니다.</p></div></article>
      <article><span>제조·유통</span><div><h3>상품을 만들고 유통하는 과정에도 참여했습니다.</h3><p>개발과 생산, 거래 구조를 경험하며 제품이 시장에 도달하기까지의 현실적인 조건을 고민했습니다.</p></div></article>
      <article><span>온라인 판매·저술</span><div><h3>그 경험을 온라인 판매와 브랜드 문제로 연결해 왔습니다.</h3><p>직접 사업을 운영하며 마주한 시행착오와 고민을 『그냥 팔지 말라 스마트스토어』, 영상, 강의에서 다룹니다.</p></div></article>
    </div>
  </div></section>
  <section class="r38-low-notice"><div class="r33-shell"><strong>맥작가의 관점을 더 알아보시려면</strong><p>${link("/v33/book","저서 소개 보기")} ${link("/v33/lecture","강연·조직 교육 주제 확인")}</p></div></section>`);
}

export function bookPageV38({esc,BOOK_IMAGE}){
  return page(`<section class="r38-book-hero"><div class="r33-shell r38-book-grid">
    <figure><img src="${esc(BOOK_IMAGE)}" alt="『그냥 팔지 말라 스마트스토어』 책 표지"></figure>
    <div><p class="r38-eyebrow">맥작가의 저서 · 종이책·전자책 출간</p><h1>그냥 팔지 말라 스마트스토어</h1>
      <p class="r38-lead">검색 순위나 광고 성과만 보고 사업을 판단하고 계신가요? 고객이 상품을 발견하고, 선택하고, 다시 찾는 과정을 함께 살펴보는 책입니다.</p>
      <p class="r38-book-meta">맥작가 지음 · 애플씨드 · 종이책 ISBN 9791124121061</p>
      <div class="r38-hero-actions"><a class="r38-button" href="${YES24_PAPER}" target="_blank" rel="noopener noreferrer">종이책 서점에서 보기 ↗</a><a class="r38-text-link" href="${YES24_EBOOK}" target="_blank" rel="noopener noreferrer">전자책 서점에서 보기 ↗</a></div>
    </div>
  </div></section>
  <section class="r38-section"><div class="r33-shell">
    ${sectionHead("이 책에서 다루는 질문","판매 방법보다 먼저 확인할 문제가 있습니다.")}
    <div class="r38-row-links">
      <div><strong>검색광고를 하는데 왜 매출이나 이익은 기대만큼 늘지 않을까요?</strong><span>광고와 실제 수익, 고객의 구매 과정을 살펴봅니다.</span></div>
      <div><strong>상품 페이지를 고쳐도 왜 구매로 이어지지 않을까요?</strong><span>고객이 비교하고 신뢰하는 기준을 점검합니다.</span></div>
      <div><strong>한 번 구매한 고객이 왜 다시 찾아오지 않을까요?</strong><span>상품과 구매 이후 경험을 연결해서 봅니다.</span></div>
    </div>
    <p class="r38-bottom-action">${link("/v33/knowledge","책의 주제와 관련된 사례 읽기")}</p>
  </div></section>`);
}

export function lecturePageV38({esc,LECTURE_IMAGE}){
  return page(`<section class="r38-about-hero"><div class="r33-shell r38-about-grid">
    <div><p class="r38-eyebrow">강연·기업 교육·컨설팅</p><h1>조직의 마케팅·브랜드 문제를<br>다른 관점에서 살펴보세요.</h1>
      <p class="r38-lead">고객이 왜 선택하는지, 유통 환경이 어떻게 달라지는지, AI가 사업 판단에 어떤 변화를 가져오는지 등 조직의 상황에 맞춰 다룰 수 있는 주제를 소개합니다.</p>
      <p class="r38-fineprint">현재 온라인 신청은 준비 중입니다. 아래에서 다룰 수 있는 주제를 먼저 확인해 주세요.</p>
    </div><figure><img src="${esc(LECTURE_IMAGE)}" alt="맥작가 강연 현장 이미지" loading="lazy"></figure>
  </div></section>
  <section class="r38-section"><div class="r33-shell">
    ${sectionHead("주요 강연 주제","어떤 내용을 함께 살펴볼 수 있나요?")}
    <div class="r38-bio-rows">
      <article><span>마케팅·브랜딩</span><div><h3>고객은 무엇을 기준으로 우리 브랜드를 선택할까요?</h3><p>브랜드의 차별점, 고객의 구매 판단, 마케팅 실행을 함께 살펴봅니다.</p></div></article>
      <article><span>유통·온라인 커머스</span><div><h3>검색과 플랫폼이 바뀔 때 사업은 어떻게 대응해야 할까요?</h3><p>판매 채널의 구조와 고객 유입·재구매를 장기적인 관점에서 점검합니다.</p></div></article>
      <article><span>AI와 사업</span><div><h3>AI 시대에 사업가는 무엇을 직접 판단해야 할까요?</h3><p>도구 사용법만이 아니라 조사·분석·의사결정의 변화에 관해 다룹니다.</p></div></article>
    </div>
  </div></section>
  <section class="r38-low-notice"><div class="r33-shell"><strong>온라인 문의 접수는 아직 준비 중입니다.</strong><p>강연·교육 신청 경로가 준비되면 이 페이지에 안내하겠습니다. 먼저 맥작가의 관점이 궁금하시다면 ${link("/v33/content","영상과 브리핑 살펴보기")}</p></div></section>`);
}

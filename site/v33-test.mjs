import runtime from "./src/runtime.js";

const originalFetch=globalThis.fetch;
const now=new Date().toISOString();
const today=now.slice(0,10);

const entries=[
  {slug:"brief-test",title:"브리핑 테스트",type:"brief",category:"brief",summary:"최신 브리핑",body:"brief",keywords:["brief"],updated:today,version:1},
  {slug:"knowledge-one",title:"지식 테스트 1",type:"article",category:"marketing",summary:"오래 두고 찾는 지식",body:"one",keywords:["지식"],updated:today,version:1},
  {slug:"knowledge-two",title:"지식 테스트 2",type:"guide",category:"commerce",summary:"두 번째 지식",body:"two",keywords:["가이드"],updated:today,version:1}
];

const env={
  SITE_ORIGIN:"https://www.neverjustsell.com",
  AUTH_ORIGIN:"https://classroom.neverjustsell.com",
  COMMUNITY_ORIGIN:"https://community.neverjustsell.com",
  SHOP_ORIGIN:"https://neverjustsell.cafe24.com",
  KNOWLEDGE_BRIDGE:{
    async fetch(){return new Response(JSON.stringify({ok:true,active:true,version:"test",items:entries}),{status:200,headers:{"Content-Type":"application/json"}});}
  }
};

globalThis.fetch=async (input)=>{
  const url=String(input instanceof Request?input.url:input);
  if(url.startsWith("https://www.youtube.com/feeds/videos.xml")){
    return new Response(`<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><entry><yt:videoId>abc123</yt:videoId><title>최근 영상 테스트</title><published>${now}</published></entry></feed>`,{status:200,headers:{"Content-Type":"application/xml"}});
  }
  throw new Error("Unexpected external fetch: "+url);
};

async function check(path, expected){
  const response=await runtime.fetch(new Request("https://preview.invalid"+path),env,{});
  if(response.status!==200) throw new Error(path+" must return 200");
  if(!String(response.headers.get("X-Robots-Tag")||"").includes("noindex")) throw new Error(path+" must stay noindex");
  const body=await response.text();
  for(const text of expected){if(!body.includes(text)) throw new Error(path+" missing "+text);}
  return body;
}

try{
  let body=await check("/v33",["v33-korean-editorial-01",'data-home-design="journey-v2"','id="main-content"',"지금 겪고 있는 문제부터 살펴보세요.","광고 성과는 좋은데 이익이 남지 않는다면","지금 읽을 사례 보기","무료 강의 살펴보기","브리핑 테스트","온라인 유통의 기본","비슷한 경험을 읽고","그냥 팔지 말라"]);
  if(!body.includes('href="/knowledge/case-roas-high-profit-low"') || !body.includes("community.neverjustsell.com/p/29/customer-experience-vs-price-competition")) throw new Error("Published problem and community links must remain direct");
  for(const href of ['/v33/knowledge','/v33/content','/v33/book','/v33/about','/v33/lecture','/v33/store','/v33/support']) {
    if(!body.includes('href="'+href+'"')) throw new Error("Missing mapped preview nav/utility: "+href);
  }
  if(!body.includes('aria-label="주 메뉴"')||!body.includes('href="https://classroom.neverjustsell.com/my-space"')) throw new Error("Actual site navigation or My Space utility is missing");
  if(body.includes('없는 이용 후기')||body.includes('지금 모집 중인 프로그램')) throw new Error("Unverified customer proof/offer leaked");
  if(body.includes("STRUCTURED LEARNING")||body.includes("COMMUNITY OF PRACTICE")||body.includes("NJS 배움과 실행의 순환")) throw new Error("Personal-brand Home must not expose platform/product architecture in the Hero");

  body=await check("/v33/content",["시장과 고객의 변화를","최근 영상 테스트","브리핑 테스트","광고·가격·고객 문제","첫 칼럼"]);
  if(body.includes('id="column"')||body.includes('id="books"')) throw new Error("Empty columns/book explanations must not dominate Content");
  if(!body.includes('href="/knowledge/case-roas-high-profit-low"')) throw new Error("Content problem link missing");
  body=await check("/v33/knowledge",["마케팅과 사업에 필요한","무엇이 궁금하신가요?","지식 테스트 1","지식 테스트 2","내가 저장한 자료",'id="r38-search"']);
  if(body.includes("브리핑 테스트")) throw new Error("Briefing must be excluded from Knowledge");
  if(body.includes("필요할 때<br>다시 꺼내볼 것.")) throw new Error("Old Knowledge poetic label remains");
  body=await check("/v33/class",["온라인 커머스,","온라인 유통의 기본","무료 강의 내용 보기","판매 준비 중","네이버 쇼핑 키워드 전략","내 강의 이어보기","https://classroom.neverjustsell.com/courses/online-commerce-basics"]);
  if(body.includes("읽은 것을<br>직접 써볼 수 있게.")) throw new Error("Old class reading copy remains");
  body=await check("/v33/store",["종이책·전자책","무료 강의","앞으로 제공할 콘텐츠","www.yes24.com/product/goods/171660478","www.yes24.com/product/goods/195224748","수강 내역 확인"]);
  if(body.includes("다음에 열릴 것")||body.includes("전자책</span><strong>준비 중")) throw new Error("Published ebook must not appear unavailable");
  body=await check("/v33/support",["수강·주문·환불","주문이나 결제 내용을 확인","취소·환불 대상 주문 확인하기","강의 질문 게시판 보기","https://neverjustsell.cafe24.com/myshop/order/list.html"]);
  if(body.includes("취소·환불 신청")) throw new Error("Order listing is not direct refund application");
  await check("/v33/about",["저자이자 사업가","어떤 경험에서 나온 이야기인가요?","영업·상품기획","제조·유통"]);
  body=await check("/v33/book",["그냥 팔지 말라 스마트스토어","종이책 서점에서 보기","전자책 서점에서 보기","9791124121061"]);
  if(body.includes('href="/book">책 자세히 보기')) throw new Error("Book page self-link remains");
  await check("/v33/lecture",["조직의 마케팅·브랜드 문제","어떤 내용을 함께 살펴볼 수 있나요?","온라인 문의 접수는 아직 준비 중"]);
  for(const route of ["/v33/content","/v33/knowledge","/v33/class","/v33/store","/v33/support","/v33/about","/v33/book","/v33/lecture"]){
    const page=await check(route,['id="main-content"','class="r38-page"']);
    if(page.includes("<h1>필요할 때")||page.includes("<h1>읽은 것을")) throw new Error("Abstract page headline regression: "+route);
  }

  const prod=await runtime.fetch(new Request("https://www.neverjustsell.com/"),env,{});
  const prodBody=await prod.text();
  if(!prodBody.includes("ae-20261001-04")) throw new Error("Production root must remain current Home V3 while V3.3 is preview-only");
  if(prodBody.includes("v33-korean-editorial-01")) throw new Error("V3.3 preview must not leak into production root");

  console.log("NJS V3.3 Korean editorial preview checks passed.");
} finally {
  globalThis.fetch=originalFetch;
}


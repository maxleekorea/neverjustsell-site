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
  let body=await check("/v33",["v33-korean-editorial-01","고객의 구매 여정은 갈수록 다양해지고 있습니다.","정해진 공식을 따라가기보다","내 사업의 기준을 세워야 합니다.","팔기 전에, 왜 사는지를 봅니다.","지금 읽을 것 보기","배우기 시작하기","배운다","요즘, 무엇이","필요할 때","브리핑 테스트","지식 테스트 1","맥작가 칼럼"]);
  if(body.includes("STRUCTURED LEARNING")||body.includes("COMMUNITY OF PRACTICE")) throw new Error("V3.3 must not expose internal English product jargon");

  body=await check("/v33/content",["맥작가 칼럼","요즘 달라진 것, 먼저 짚습니다.","브리핑 테스트","책 해석","사례"]);
  body=await check("/v33/knowledge",["필요할 때","찾고 싶은 지식","지식 테스트 1","지식 테스트 2","내 학습함"]);
  if(body.includes("브리핑 테스트")) throw new Error("Briefing must be excluded from V3.3 knowledge page");

  await check("/v33/class",["읽은 것을","무료 강의 보기","유통사와 네이버 검색의 구조","키워드와 롱테일, 탐색 행동","내 강의실에서 이어보기","https://classroom.neverjustsell.com/courses/online-commerce-basics"]);
  await check("/v33/store",["지금 이용할 수 있는","온라인 판매를 사업의 언어로 배우는 강의","전자책","준비 중","프로그램","모집 시 안내","구매한 콘텐츠 보기"]);
  await check("/v33/support",["필요한 곳으로","내 강의실에서 이어보기","주문 및 결제 내역 확인","취소·환불 신청","https://neverjustsell.cafe24.com/myshop/order/list.html"]);
  await check("/v33/about",["마케팅만","따로 떼어 보지 않습니다","현장과 상품","시장과 제조"]);
  await check("/v33/book",["그냥 팔지 말라","YES24","교보문고"]);
  await check("/v33/lecture",["강연·컨설팅","정해진 강의안을","온라인 신청은 아직 준비 중"]);

  const prod=await runtime.fetch(new Request("https://www.neverjustsell.com/"),env,{});
  const prodBody=await prod.text();
  if(!prodBody.includes("ae-20261001-04")) throw new Error("Production root must remain current Home V3 while V3.3 is preview-only");
  if(prodBody.includes("v33-korean-editorial-01")) throw new Error("V3.3 preview must not leak into production root");

  console.log("NJS V3.3 Korean editorial preview checks passed.");
} finally {
  globalThis.fetch=originalFetch;
}


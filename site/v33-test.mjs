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
  let body=await check("/v33",["v33-korean-editorial-01","팔기 전에","왜 사는지를 봅니다","배운다","요즘, 무엇이","필요할 때","브리핑 테스트","지식 테스트 1","맥작가 칼럼"]);
  if(body.includes("STRUCTURED LEARNING")||body.includes("COMMUNITY OF PRACTICE")) throw new Error("V3.3 must not expose internal English product jargon");

  body=await check("/v33/content",["맥작가 칼럼","지금 알아야 할 변화","브리핑 테스트","책 해석","사례"]);
  body=await check("/v33/knowledge",["뉴스가 지나간 뒤에도","지식 테스트 1","지식 테스트 2"]);
  if(body.includes("브리핑 테스트")) throw new Error("Briefing must be excluded from V3.3 knowledge page");

  await check("/v33/about",["마케팅을","사업 안에서 봅니다","현장과 상품","시장과 제조"]);
  await check("/v33/book",["그냥 팔지 말라","YES24","교보문고"]);
  await check("/v33/lecture",["강연·컨설팅","정해진 강의안을","현재 공개 신청 동선은 준비 중"]);

  const prod=await runtime.fetch(new Request("https://www.neverjustsell.com/"),env,{});
  const prodBody=await prod.text();
  if(!prodBody.includes("ae-20261001-04")) throw new Error("Production root must remain current Home V3 while V3.3 is preview-only");
  if(prodBody.includes("v33-korean-editorial-01")) throw new Error("V3.3 preview must not leak into production root");

  console.log("NJS V3.3 restructure preview checks passed.");
} finally {
  globalThis.fetch=originalFetch;
}


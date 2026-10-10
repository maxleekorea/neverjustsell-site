import runtime from "./src/runtime.js";

const originalFetch=globalThis.fetch;
const now=new Date().toISOString();
const today=now.slice(0,10);
const entries=[
  {slug:"release-brief",title:"릴리즈 브리핑",type:"brief",category:"brief",summary:"릴리즈 테스트 브리핑",body:"brief",keywords:["release"],updated:today,version:1},
  {slug:"release-knowledge",title:"릴리즈 지식",type:"article",category:"marketing",summary:"릴리즈 테스트 지식",body:"knowledge",keywords:["release"],updated:today,version:1}
];
const bridge={async fetch(){return new Response(JSON.stringify({ok:true,active:true,version:"release-test",items:entries}),{status:200,headers:{"Content-Type":"application/json"}});}};

globalThis.fetch=async (input)=>{
  const url=String(input instanceof Request?input.url:input);
  if(url.startsWith("https://www.youtube.com/feeds/videos.xml")){
    return new Response(`<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><entry><yt:videoId>release123</yt:videoId><title>릴리즈 최근 영상</title><published>${now}</published></entry></feed>`,{status:200,headers:{"Content-Type":"application/xml"}});
  }
  throw new Error("Unexpected external fetch: "+url);
};

const baseEnv={
  SITE_ORIGIN:"https://www.neverjustsell.com",
  AUTH_ORIGIN:"https://classroom.neverjustsell.com",
  COMMUNITY_ORIGIN:"https://community.neverjustsell.com",
  SHOP_ORIGIN:"https://neverjustsell.cafe24.com",
  KNOWLEDGE_BRIDGE:bridge
};

async function get(path,release="v33"){
  return runtime.fetch(new Request("https://www.neverjustsell.com"+path),{...baseEnv,SITE_RELEASE:release},{});
}
async function html(path,release="v33"){
  const response=await get(path,release);
  if(response.status!==200) throw new Error(path+" expected 200, got "+response.status);
  return {response,body:await response.text()};
}
function expect(body,text,label){if(!body.includes(text)) throw new Error(label+" missing "+text);}
function forbid(body,text,label){if(body.includes(text)) throw new Error(label+" leaked "+text);}

try{
  let x=await html("/");
  expect(x.body,'name="njs-site-revision" content="v33-20261002-01"',"root");
  expect(x.body,'name="robots" content="index,follow,max-image-preview:large"',"root");
  expect(x.body,'<link rel="canonical" href="https://www.neverjustsell.com/">',"root");
  expect(x.body,"고객이 선택하는 이유를 알면,","root");
  expect(x.body,'data-home-design="journey-v2"',"root journey-design home");
  expect(x.body,'href="/content"',"root");
  expect(x.body,'href="/knowledge"',"root");
  expect(x.body,'href="https://classroom.neverjustsell.com/my-space">내 공간</a>',"root member continuity");
  forbid(x.body,'href="/v33/"',"root preview links");
  forbid(x.body,'href="/v33">',"root preview home link");
  forbid(x.body,'href="/v33/store"',"root store route");
  forbid(x.body,'href="/v33/support"',"root support route");
  forbid(x.body,"재구성 프리뷰","root");
  if(x.response.headers.get("Cache-Control")!=="public, max-age=120, s-maxage=600") throw new Error("root public cache contract");
  if(String(x.response.headers.get("X-Robots-Tag")||"").includes("noindex")) throw new Error("root must not emit noindex header");

  x=await html("/content");
  expect(x.body,'<link rel="canonical" href="https://www.neverjustsell.com/content">',"content");
  expect(x.body,"짧게 볼 것과","content");
  forbid(x.body,"에디토리얼 프리뷰","content");

  x=await html("/about");
  expect(x.body,'<link rel="canonical" href="https://www.neverjustsell.com/about">',"about");
  expect(x.body,"마케팅만","about");

  x=await html("/book");
  expect(x.body,'<link rel="canonical" href="https://www.neverjustsell.com/book">',"book");
  expect(x.body,'"@type":"Book"',"book");
  expect(x.body,"9791124121061","book print isbn");
  expect(x.body,"9791124121122","book ebook isbn");
  expect(x.body,'href="/store">스토어 보기</a>',"book");
  forbid(x.body,'href="/book">책 자세히 보기</a>',"book");

  x=await html("/lecture");
  expect(x.body,'<link rel="canonical" href="https://www.neverjustsell.com/lecture">',"lecture");
  expect(x.body,"온라인 신청은 아직 준비 중","lecture");

  x=await html("/knowledge");
  expect(x.body,'name="njs-site-revision" content="v33-20261002-01"',"knowledge");
  expect(x.body,'<link rel="canonical" href="https://www.neverjustsell.com/knowledge">',"knowledge");
  expect(x.body,"찾고 싶은 지식","knowledge");
  expect(x.body,"내 학습함","knowledge");
  forbid(x.body,"NJS KNOWLEDGE HUB","knowledge legacy shell");

  x=await html("/knowledge/release-knowledge");
  expect(x.body,"릴리즈 지식","knowledge detail preservation");
  forbid(x.body,"v33-20261002-01","knowledge detail remains canonical runtime");

  x=await html("/class");
  expect(x.body,'name="njs-site-revision" content="v33-20261002-01"',"class");
  expect(x.body,"읽은 것을","class");
  expect(x.body,"무료 강의 보기","class");
  x=await html("/store");
  expect(x.body,'name="njs-site-revision" content="v33-20261002-01"',"store");
  expect(x.body,"지금 이용할 수 있는","store");
  expect(x.body,"모집 시 안내","store");
  x=await html("/support");
  expect(x.body,'name="njs-site-revision" content="v33-20261002-01"',"support");
  expect(x.body,"필요한 곳으로","support");
  expect(x.body,"취소·환불 신청","support");

  x=await html("/v33");
  expect(x.body,'name="robots" content="noindex,nofollow,noarchive"',"preview");
  expect(x.body,"재구성 프리뷰","preview");
  if(!String(x.response.headers.get("X-Robots-Tag")||"").includes("noindex")) throw new Error("preview header noindex");

  x=await html("/","v3");
  expect(x.body,'name="njs-home-revision" content="ae-20261001-04"',"release gate off");
  forbid(x.body,"v33-20261002-01","release gate off");

  console.log("PASS: V3.3 dormant release contract");
} finally {
  globalThis.fetch=originalFetch;
}

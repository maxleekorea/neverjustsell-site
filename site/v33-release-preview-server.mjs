import http from "node:http";
import { readFile } from "node:fs/promises";
import runtime from "./src/runtime.js";

const PORT = 8790;
const CSS = await readFile(new URL("./public/v33.css", import.meta.url), "utf8");
const BRAND_MARK=await readFile(new URL("./public/njs-brand-mark.svg",import.meta.url),"utf8");
const mockEntries = [
  { slug:"brief-brand-search-asset", title:"브랜드 검색이 쌓이는 구조", type:"brief", category:"brief", summary:"일반 키워드로 발견된 고객이 다음에는 이름을 직접 찾도록 만드는 장기 자산.", body:"visual-preview", keywords:["브랜드","검색"], updated:"2026-09-27", version:1 },
  { slug:"case-roas-high-profit-low", title:"ROAS는 좋은데 이익이 안 남는 경우", type:"case", category:"case", summary:"광고 대시보드의 매출과 실제 주문 손익을 분리한다.", body:"visual-preview", keywords:["광고","ROAS","이익"], updated:"2026-09-27", version:1 },
  { slug:"case-discount-no-conversion", title:"가격을 내렸는데도 안 팔리는 경우", type:"case", category:"case", summary:"가격이 아니라 이해·신뢰가 병목인지 확인한다.", body:"visual-preview", keywords:["가격","고객","구매"], updated:"2026-09-27", version:1 },
  { slug:"case-platform-rule-change", title:"플랫폼 규정 변경으로 성과가 흔들린 경우", type:"case", category:"case", summary:"한 가지 노출 기술에 의존한 구조를 여러 접점으로 분산한다.", body:"visual-preview", keywords:["플랫폼","노출"], updated:"2026-09-27", version:1 },
  { slug:"positioning", title:"포지셔닝", type:"term", category:"term", summary:"고객의 머릿속에서 어떤 기준으로 기억되고 비교될지를 정하는 전략.", body:"visual-preview", keywords:["브랜드","고객"], updated:"2026-09-27", version:1 },
  { slug:"search-intent", title:"검색 의도", type:"term", category:"term", summary:"사용자가 검색어를 입력할 때 실제로 해결하려는 목적과 상황.", body:"visual-preview", keywords:["검색","고객"], updated:"2026-09-27", version:1 }
];

const env = {
  SITE_ORIGIN:"https://www.neverjustsell.com",
  AUTH_ORIGIN:"https://classroom.neverjustsell.com",
  COMMUNITY_ORIGIN:"https://community.neverjustsell.com",
  SHOP_ORIGIN:"https://neverjustsell.cafe24.com",
  SITE_RELEASE:"v33",
  KNOWLEDGE_BRIDGE:{
    async fetch(){
      return new Response(JSON.stringify({ok:true,active:true,version:"release-preview",items:mockEntries}),{
        status:200,headers:{"Content-Type":"application/json"}
      });
    }
  }
};

const originalFetch=globalThis.fetch;
globalThis.fetch=async (input,init)=>{
  const url=String(input instanceof Request?input.url:input);
  if(url.startsWith("https://www.youtube.com/feeds/videos.xml")){
    return new Response(`<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><entry><yt:videoId>BLMi5zdy2-M</yt:videoId><title>스마트스토어 현실, 검색순위에 매출이 묶이면 위험한 이유</title><published>2026-09-30T03:00:00Z</published></entry></feed>`,{status:200,headers:{"Content-Type":"application/xml"}});
  }
  return originalFetch(input,init);
};

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||"/",`http://127.0.0.1:${PORT}`);
  if(url.pathname==="/njs-brand-mark.svg"){res.writeHead(200,{"Content-Type":"image/svg+xml; charset=utf-8"});res.end(BRAND_MARK);return;}
  if(url.pathname==="/v33.css"){
    res.writeHead(200,{"Content-Type":"text/css; charset=utf-8"});
    res.end(CSS);return;
  }
  try{
    const response=await runtime.fetch(new Request("https://www.neverjustsell.com"+url.pathname+url.search),env,{});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(await response.text());
  }catch(error){
    res.writeHead(500,{"Content-Type":"text/plain; charset=utf-8"});
    res.end(String(error?.stack||error));
  }
});
server.listen(PORT,"127.0.0.1",()=>console.log(`NJS V3.3 release preview server listening on http://127.0.0.1:${PORT}`));

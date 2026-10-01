import http from "node:http";
import { readFile } from "node:fs/promises";
import { renderV31Page } from "./src/v31.js";

const PORT = 8789;
const CSS = await readFile(new URL("./public/v31.css", import.meta.url), "utf8");

const mockEntries = [
  { slug:"brief-platform-change", title:"플랫폼이 바뀔 때 판매자가 먼저 확인할 것", type:"brief", category:"brief", summary:"기능 변화보다 고객의 발견과 선택 과정이 어떻게 달라지는지 먼저 봅니다.", body:"preview", keywords:["플랫폼","변화"], updated:"2026-10-01", version:1 },
  { slug:"customer-value", title:"고객가치는 가격보다 먼저 결정됩니다", type:"article", category:"marketing", summary:"고객이 무엇을 비교하고 왜 선택하는지부터 정리합니다.", body:"preview", keywords:["고객","가치"], updated:"2026-09-29", version:1 },
  { slug:"distribution-structure", title:"유통 구조를 모르면 광고 효율도 오래가지 않습니다", type:"guide", category:"commerce", summary:"채널과 광고보다 먼저 수익과 고객 접점의 구조를 봅니다.", body:"preview", keywords:["유통","광고"], updated:"2026-09-27", version:1 },
  { slug:"brand-search", title:"브랜드 검색은 결과가 아니라 과정입니다", type:"article", category:"marketing", summary:"사람들이 왜 이름을 기억하고 다시 찾는지 행동의 흐름으로 봅니다.", body:"preview", keywords:["브랜드","검색"], updated:"2026-09-25", version:1 }
];

const env = {
  KNOWLEDGE_BRIDGE: {
    async fetch() {
      return new Response(JSON.stringify({ ok:true, active:true, version:"preview", items:mockEntries }), {
        status:200,
        headers:{ "Content-Type":"application/json" }
      });
    }
  }
};

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.startsWith("https://www.youtube.com/feeds/videos.xml")) {
    return new Response(`<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><entry><yt:videoId>qJ1C1preview</yt:videoId><title>최근 영상: 마케팅은 왜 자꾸 더 어려워지는가</title><published>2026-09-30T03:00:00Z</published></entry></feed>`, {
      status:200,
      headers:{ "Content-Type":"application/xml" }
    });
  }
  return originalFetch(input, init);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname === "/v31.css") {
    res.writeHead(200, { "Content-Type":"text/css; charset=utf-8" });
    res.end(CSS);
    return;
  }
  try {
    const request = new Request(`https://preview.invalid${url.pathname}`);
    const response = await renderV31Page({
      request,
      env,
      siteOrigin:"https://www.neverjustsell.com",
      authOrigin:"https://classroom.neverjustsell.com",
      communityOrigin:"https://community.neverjustsell.com"
    });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch (error) {
    res.writeHead(500, { "Content-Type":"text/plain; charset=utf-8" });
    res.end(String(error?.stack || error));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`NJS V3.1 preview server listening on http://127.0.0.1:${PORT}`);
});

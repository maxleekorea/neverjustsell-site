import runtime from "./src/runtime.js";

const nowIso = new Date().toISOString();
const today = nowIso.slice(0, 10);

function knowledgeBridge(items) {
  return {
    async fetch() {
      return new Response(JSON.stringify({
        ok: true,
        active: true,
        source_mode: "canonical",
        version: "test",
        items
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  };
}

function youtubeFeed({ title, published, videoId = "v3FreshVideo" }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
    <entry>
      <yt:videoId>${videoId}</yt:videoId>
      <title>${title}</title>
      <published>${published}</published>
    </entry>
  </feed>`;
}

const originalFetch = globalThis.fetch;

try {
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://www.youtube.com/feeds/videos.xml")) {
      return new Response(youtubeFeed({
        title: "Home V3 fresh YouTube test",
        published: nowIso
      }), { status: 200, headers: { "Content-Type": "application/xml" } });
    }
    throw new Error("unexpected external fetch: " + url);
  };

  const env = {
    SITE_ORIGIN: "https://www.neverjustsell.com",
    AUTH_ORIGIN: "https://classroom.neverjustsell.com",
    COMMUNITY_ORIGIN: "https://community.neverjustsell.com",
    SHOP_ORIGIN: "https://neverjustsell.cafe24.com",
    KNOWLEDGE_BRIDGE: knowledgeBridge([{
      slug: "home-v3-fresh-knowledge",
      title: "Home V3 fresh Knowledge test",
      type: "brief",
      category: "brief",
      summary: "실제 최신성 계약을 확인하는 테스트 항목",
      body: "test",
      keywords: ["home-v3"],
      updated: today,
      version: 1
    }])
  };

  let response = await runtime.fetch(new Request("https://preview.invalid/home-v3"), env, {});
  if (response.status !== 200) throw new Error("Home V3 preview must return 200");
  if (response.headers.get("Cache-Control") !== "no-store") throw new Error("Home V3 preview must be no-store");
  if (!String(response.headers.get("X-Robots-Tag") || "").includes("noindex")) throw new Error("Home V3 header must stay noindex");
  let body = await response.text();

  for (const expected of [
    'name="robots" content="noindex,nofollow,noarchive"',
    'name="njs-preview-revision" content="ae-20261001-05"',
    'href="/home-v3.css"',
    'src="/home-v3-app.js"',
    "팔리는 순간만",
    "Home V3 fresh YouTube test",
    "Home V3 fresh Knowledge test",
    "지금 이야기하는 것",
    "배우고, 해보고",
    "강의는 준비 중",
    "마케팅을 좁게 보지 않는 데에는",
    "누군가 해본 경험은",
    "최근에 다룬 생각들",
    "v3-mobile-search"
  ]) {
    if (!body.includes(expected)) throw new Error("Home V3 missing: " + expected);
  }

  for (const forbidden of [
    "무료 강의 수강 신청",
    "모집 중",
    "product_no=13",
    "사업을 해본 사람에게 배우는",
    "LG 탭북2",
    "ARCHIVAL PROOF",
    "현재 열린 회차 없음",
    "아직 판매 상품 없음",
    "판매 가능한 것은 분명하게",
    "vnext-problem-grid",
    "homev2-feature"
  ]) {
    if (body.includes(forbidden)) throw new Error("Home V3 forbidden public state leaked: " + forbidden);
  }

  response = await runtime.fetch(new Request("https://www.neverjustsell.com/"), env, {});
  if (response.status !== 200) throw new Error("Production Home V3 root must return 200");
  if (response.headers.get("Cache-Control") !== "public, max-age=120, s-maxage=600") {
    throw new Error("Production Home V3 root must use public cache policy");
  }
  if (String(response.headers.get("X-Robots-Tag") || "").includes("noindex")) {
    throw new Error("Production Home V3 root must not emit noindex header");
  }
  body = await response.text();
  for (const expected of [
    'name="robots" content="index,follow,max-image-preview:large"',
    'name="njs-home-revision" content="ae-20261001-05"',
    '<link rel="canonical" href="https://www.neverjustsell.com/">',
    'property="og:image"',
    'name="twitter:image"',
    '"@type":"WebSite"',
    '"@type":"Person"',
    '"@type":"WebPage"',
    'href="/home-v3.css"',
    'src="/home-v3-app.js"',
    'href="/" aria-label="NEVER JUST SELL 홈"',
    "팔리는 순간만",
    "지식 둘러보기",
    "누군가 해본 경험은"
  ]) {
    if (!body.includes(expected)) throw new Error("Production Home V3 missing: " + expected);
  }
  if (body.includes("브랜드와 마케팅을")) throw new Error("Production root must not fall back to Home V2");
  if (body.includes('name="robots" content="noindex')) throw new Error("Production Home V3 must be indexable");

  const staleDate = "2020-01-01T00:00:00Z";
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://www.youtube.com/feeds/videos.xml")) {
      return new Response(youtubeFeed({
        title: "STALE YOUTUBE MUST NOT BE NOW",
        published: staleDate,
        videoId: "staleVideo"
      }), { status: 200, headers: { "Content-Type": "application/xml" } });
    }
    throw new Error("unexpected external fetch: " + url);
  };

  const staleEnv = {
    ...env,
    KNOWLEDGE_BRIDGE: knowledgeBridge([{
      slug: "stale-knowledge",
      title: "STALE KNOWLEDGE",
      type: "brief",
      category: "brief",
      summary: "stale",
      body: "stale",
      keywords: [],
      updated: "2020-01-01",
      version: 1
    }])
  };

  response = await runtime.fetch(new Request("https://preview.invalid/home-v3"), staleEnv, {});
  body = await response.text();
  if (body.includes('class="v3-current"')) throw new Error("Stale data must not create a current editorial section");
  if (body.includes("STALE YOUTUBE MUST NOT BE NOW")) throw new Error("Stale YouTube must not appear as current content");

  console.log("Home V3 preview + production release checks passed.");
} finally {
  globalThis.fetch = originalFetch;
}

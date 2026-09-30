import worker from "./src/index.js";

const env = {
  SITE_ORIGIN: "https://www.neverjustsell.com",
  AUTH_ORIGIN: "https://classroom.neverjustsell.com",
  COMMUNITY_ORIGIN: "https://community.neverjustsell.com",
  SHOP_ORIGIN: "https://neverjustsell.cafe24.com"
};

async function fetchPath(path) {
  return worker.fetch(new Request(`https://preview.invalid${path}`), env);
}

async function check(path, expectedStatus, expectedText = null, expectedLocation = null) {
  const response = await fetchPath(path);
  if (response.status !== expectedStatus) {
    throw new Error(`${path}: expected ${expectedStatus}, got ${response.status}`);
  }
  if (expectedText) {
    const body = await response.text();
    if (!body.includes(expectedText)) throw new Error(`${path}: missing ${expectedText}`);
  }
  if (expectedLocation && response.headers.get("Location") !== expectedLocation) {
    throw new Error(`${path}: unexpected redirect ${response.headers.get("Location")}`);
  }
}

await check("/", 200, "브랜드와 마케팅을");
await check("/home-vnext", 200, "문제는 내 사업에");
await check("/home-vnext", 200, "지금 필요한 것 찾기");
await check("/home-vnext", 200, "포지셔닝");
await check("/home-v2", 200, "브랜드와 마케팅을");
await check("/home-v2", 200, "경쟁사가 쉽게 따라 하지 못하게 만드는 법");
await check("/home-v2", 200, "『그냥 팔지 말라』에서");
await check("/about", 200, "판매자가 아니라 사업가의 시선으로 봅니다.");
await check("/book", 200, "9791124121061");
await check("/book", 200, "9791124121122");
await check("/book", 200, "스토어 보기");
await check("/class", 200, "무료 강의 수강 신청");
await check("/content", 200, "유행보다 오래 남는 설명을 만듭니다.");
await check("/lecture", 200, "온라인 커머스를 현장의 문제와 연결합니다.");
await check("/robots.txt", 200, "Sitemap: https://www.neverjustsell.com/sitemap.xml");
await check("/sitemap.xml", 200, "https://www.neverjustsell.com/about");
await check("/sitemap.xml", 200, "https://www.neverjustsell.com/store");
await check("/llms.txt", 200, "Main: https://www.neverjustsell.com/");
let authRedirect = await fetchPath("/login");
if (authRedirect.status !== 302) throw new Error("/login must redirect");
let authTarget = new URL(authRedirect.headers.get("Location"));
if (
  authTarget.origin !== "https://classroom.neverjustsell.com" ||
  authTarget.pathname !== "/oauth/cafe24/customer/start" ||
  authTarget.searchParams.get("return_to") !== "https://www.neverjustsell.com/"
) {
  throw new Error("/login auth target mismatch");
}

let logoutRedirect = await fetchPath("/logout");
if (logoutRedirect.status !== 302) throw new Error("/logout must redirect");
let logoutTarget = new URL(logoutRedirect.headers.get("Location"));
if (
  logoutTarget.origin !== "https://classroom.neverjustsell.com" ||
  logoutTarget.pathname !== "/session/logout-sync" ||
  logoutTarget.searchParams.get("return_to") !== "https://www.neverjustsell.com/"
) {
  throw new Error("/logout target mismatch");
}
await check("/store", 200, "구매한 콘텐츠를 바로 이용하는 스토어");
await check("/cart", 302, null, "https://neverjustsell.cafe24.com/order/basket.html");
await check("/community", 302, null, "https://community.neverjustsell.com/");
await check("/classroom?course=free-lesson-1", 302, null, "https://classroom.neverjustsell.com/classroom?course=free-lesson-1");
await check("/missing", 404, "페이지를 찾을 수 없습니다.");

let response = await fetchPath("/");
let body = await response.text();
for (const expected of [
  '<link rel="canonical" href="https://www.neverjustsell.com/">',
  'property="og:image"',
  'name="twitter:image"',
  'href="/favicon.svg"',
  'class="homev2-skip"',
  'class="homev2-mobile-search"',
  '지식에서 시작하기',
  'pretendardvariable-dynamic-subset.min.css'
]) {
  if (!body.includes(expected)) throw new Error(`home launch markup missing: ${expected}`);
}
if (body.includes('content="noindex,nofollow"')) throw new Error("production home must be indexable");
if (body.includes("workers.dev")) throw new Error("production-facing homepage contains workers.dev");
if (!body.includes('href="https://classroom.neverjustsell.com/my-space">내 공간</a>')) {
  throw new Error("primary navigation must expose My Space");
}
if (body.includes(">장바구니</a>")) {
  throw new Error("digital-first primary navigation must not expose cart");
}

response = await fetchPath("/book");
body = await response.text();
if (!body.includes('"@type":"Book"')) throw new Error("book JSON-LD missing");
if (!body.includes('"numberOfPages":546')) throw new Error("book page count JSON-LD missing");

response = await fetchPath("/class");
body = await response.text();
if (!body.includes('"@type":"Course"')) throw new Error("course JSON-LD missing");

response = await fetchPath("/health");
if (response.status !== 200) throw new Error("/health must return 200");
const health = await response.json();
if (
  health.ok !== true ||
  health.canonical_origin !== "https://www.neverjustsell.com" ||
  health.classroom_origin !== "https://classroom.neverjustsell.com" ||
  health.community_origin !== "https://community.neverjustsell.com"
) {
  throw new Error("health contract mismatch");
}

console.log("Unified site launch checks passed.");

response = await fetchPath("/home-vnext");
body = await response.text();
for (const expected of [
  'href="/home-vnext.css"',
  'src="/home-vnext-app.js"',
  'class="vnext-problem-grid"',
  'class="vnext-hero-product"',
  '>지식</a>',
  '>배우기</a>',
  '>프로그램</a>',
  '>커뮤니티</a>'
]) {
  if (!body.includes(expected)) throw new Error(`Home VNext missing: ${expected}`);
}
if (!body.includes('name="robots" content="noindex,nofollow"')) throw new Error("Home VNext preview must stay noindex");

response = await fetchPath("/");
body = await response.text();
if (!body.includes("브랜드와 마케팅을") || body.includes("vnext-problem-grid")) throw new Error("Home VNext must remain isolated from production home");

response = await fetchPath("/home-v2");
body = await response.text();
for (const expected of [
  'href="/home-v2.css"',
  'pretendardvariable-dynamic-subset.min.css',
  'src="/home-v2-app.js"',
  'class="homev2-feature"',
  'class="homev2-mobile-search"',
  '지식에서 시작하기',
  'f7DDTrCNTPY',
  '>콘텐츠</a>',
  '>지식</a>',
  '>배우기</a>',
  '>커뮤니티</a>',
  '책에서 NJS로'
]) {
  if (!body.includes(expected)) throw new Error(`Home V2 missing: ${expected}`);
}
if (!body.includes('name="robots" content="noindex,nofollow"')) throw new Error("Home V2 preview must stay noindex");
if (body.includes("vnext-problem-grid") || body.includes("vnext-hero-product")) throw new Error("Home V2 must not regress to Home VNext product-loop UI");

response = await fetchPath("/");
body = await response.text();
if (!body.includes("브랜드와 마케팅을")) throw new Error("Home V2 production home contract missing");
if (body.includes('content="noindex,nofollow"')) throw new Error("production home must not inherit preview noindex");

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

await check("/", 200, "NEVER JUST SELL");
await check("/about", 200, "판매자가 아니라 사업가의 시선으로 봅니다.");
await check("/book", 200, "9791124121061");
await check("/book", 200, "9791124121122");
await check("/book", 200, "product/detail.html?product_no=11");
await check("/class", 200, "무료 1강 보기");
await check("/content", 200, "유행보다 오래 남는 설명을 만듭니다.");
await check("/lecture", 200, "온라인 커머스를 현장의 문제와 연결합니다.");
await check("/robots.txt", 200, "Sitemap: https://www.neverjustsell.com/sitemap.xml");
await check("/sitemap.xml", 200, "https://www.neverjustsell.com/about");
await check("/llms.txt", 200, "Main: https://www.neverjustsell.com/");
await check("/login", 302, null, "https://neverjustsell.cafe24.com/member/login.html");
await check("/store", 302, null, "https://neverjustsell.cafe24.com/");
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
  'class="njs-skip"',
  'class="njs-mobile-services"'
]) {
  if (!body.includes(expected)) throw new Error(`home launch markup missing: ${expected}`);
}
if (body.includes("workers.dev")) throw new Error("production-facing homepage contains workers.dev");

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

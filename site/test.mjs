import worker from "./src/index.js";

const env = {
  SITE_ORIGIN: "https://www.neverjustsell.com",
  AUTH_ORIGIN: "https://classroom.neverjustsell.com",
  COMMUNITY_ORIGIN: "https://community.neverjustsell.com",
  SHOP_ORIGIN: "https://neverjustsell.cafe24.com"
};

async function check(path, expectedStatus, expectedText = null, expectedLocation = null) {
  const response = await worker.fetch(new Request(`https://preview.invalid${path}`), env);
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
await check("/book", 200, "그냥 팔지 말라 스마트스토어");
await check("/class", 200, "온라인 판매를 사업의 언어로 배우는 강의");
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

console.log("Unified site smoke tests passed.");

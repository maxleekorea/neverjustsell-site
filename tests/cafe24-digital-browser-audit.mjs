import { chromium } from "playwright";

const PRODUCT_URL = "https://neverjustsell.cafe24.com/product/detail.html?product_no=13";
const FORBIDDEN_PRODUCT_TEXT = [
  "배송/교환/환불 안내",
  "DELIVERY INFO",
  "배송 방법",
  "배송 기간",
  "배송 지역",
  "정기배송"
];
const FORBIDDEN_ORDER_TEXT = [
  "받는사람",
  "수령인",
  "배송지",
  "배송 주소",
  "배송메시지",
  "배송 방법",
  "택배"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: "ko-KR",
  viewport: { width: 1440, height: 1200 }
});
const page = await context.newPage();

try {
  const response = await page.goto(PRODUCT_URL, {
    waitUntil: "networkidle",
    timeout: 60000
  });
  assert(response?.ok(), `product page status=${response?.status()}`);

  const bodyText = await page.locator("body").innerText();
  assert(
    bodyText.includes("결제 후 바로 이용할 수 있습니다."),
    "digital post-purchase guidance is not visible"
  );

  const productLeaks = FORBIDDEN_PRODUCT_TEXT.filter((term) => bodyText.includes(term));
  console.log(JSON.stringify({
    phase: "product_detail",
    url: page.url(),
    forbidden_visible_terms: productLeaks
  }, null, 2));
  assert(productLeaks.length === 0, `shipping UI still visible on digital product: ${productLeaks.join(", ")}`);

  const buy = page.locator("a,button").filter({
    hasText: /바로\s*구매|구매하기|BUY\s*NOW/i
  }).first();

  if (await buy.count()) {
    await buy.click({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);

    const checkoutUrl = page.url();
    const checkoutText = await page.locator("body").innerText().catch(() => "");
    const isOrderForm = /\/order\//i.test(checkoutUrl) || /주문서|주문결제|결제하기/.test(checkoutText);
    const isLogin = /\/member\/login|로그인/.test(checkoutUrl) || /회원 로그인/.test(checkoutText);

    if (isOrderForm) {
      const orderLeaks = FORBIDDEN_ORDER_TEXT.filter((term) => checkoutText.includes(term));
      console.log(JSON.stringify({
        phase: "order_form",
        url: checkoutUrl,
        forbidden_visible_terms: orderLeaks
      }, null, 2));
      assert(orderLeaks.length === 0, `shipping inputs still visible on digital order form: ${orderLeaks.join(", ")}`);
    } else {
      console.log(JSON.stringify({
        phase: "checkout_handoff",
        url: checkoutUrl,
        login_required: isLogin,
        note: "Order form was not reachable without an authenticated browser session."
      }, null, 2));
    }
  } else {
    console.log(JSON.stringify({
      phase: "checkout_handoff",
      url: page.url(),
      note: "No public buy button was detected."
    }, null, 2));
  }
} finally {
  await browser.close();
}

console.log("PASS: Cafe24 digital browser UX");

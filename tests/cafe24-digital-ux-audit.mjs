const PRODUCTS = [
  [13, "E2E 강의"],
  [16, "온라인 커머스 역사와 네이버 검색 알고리즘"],
  [17, "네이버 쇼핑 - 키워드 전략"]
];

function visibleText(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[\s\S]*?<\/template>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function rawContexts(html, keyword, radius = 700) {
  const out = [];
  let from = 0;
  while (out.length < 6) {
    const index = html.indexOf(keyword, from);
    if (index < 0) break;
    out.push(html.slice(Math.max(0, index - radius), Math.min(html.length, index + keyword.length + radius)));
    from = index + keyword.length;
  }
  return out;
}

function contexts(text, keyword, radius = 90) {
  const out = [];
  let from = 0;
  while (out.length < 12) {
    const index = text.indexOf(keyword, from);
    if (index < 0) break;
    out.push(text.slice(Math.max(0, index - radius), Math.min(text.length, index + keyword.length + radius)));
    from = index + keyword.length;
  }
  return out;
}

let hardFailure = false;
for (const [productNo, label] of PRODUCTS) {
  const url = `https://neverjustsell.cafe24.com/product/detail.html?product_no=${productNo}`;
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "neverjustsell-digital-ux-audit/1.0" }
  });
  const html = await response.text();
  const text = visibleText(html);
  const shippingTerms = ["배송", "수령인", "배송지", "택배", "송장", "배송비", "배송방법"];
  const hits = Object.fromEntries(
    shippingTerms.map((term) => [term, contexts(text, term)])
  );
  const detected = Object.fromEntries(
    Object.entries(hits).filter(([, values]) => values.length > 0)
  );

  console.log(JSON.stringify({
    product_no: productNo,
    label,
    status: response.status,
    final_url: response.url,
    visible_text_length: text.length,
    shipping_terms_detected: Object.keys(detected),
    contexts: detected
  }, null, 2));

  if (productNo === 13 && !response.ok) hardFailure = true;
}

if (hardFailure) {
  throw new Error("Public Cafe24 E2E product page could not be fetched");
}

const ORIGIN = "https://www.neverjustsell.com";
const INDEXABLE = ["/", "/about", "/book", "/class", "/content", "/lecture"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(url, init = {}) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "neverjustsell-public-crawl/1.0" },
    ...init
  });
  const body = await response.text();
  return { response, body };
}

for (const path of INDEXABLE) {
  const { response, body } = await fetchText(`${ORIGIN}${path}`);
  assert(response.status === 200, `${path}: expected 200, got ${response.status}`);
  assert(/<meta name="description" content="[^"]+"/i.test(body), `${path}: description missing`);
  assert(/<meta name="robots" content="index,follow,max-image-preview:large"/i.test(body), `${path}: robots meta missing`);
  const canonical = path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path}`;
  assert(body.includes(`<link rel="canonical" href="${canonical}">`), `${path}: canonical mismatch`);
  assert((body.match(/<h1\b/gi) || []).length === 1, `${path}: must have exactly one h1`);
  assert(!body.includes("workers.dev"), `${path}: production page leaks workers.dev`);
  assert(!body.includes("/board/index.html"), `${path}: legacy Cafe24 board path leaked`);
  assert(/property="og:image"/i.test(body), `${path}: og:image missing`);
  assert(/name="twitter:image"/i.test(body), `${path}: twitter:image missing`);
}

let result = await fetchText(`${ORIGIN}/favicon.svg`);
assert(result.response.status === 200, `favicon: expected 200, got ${result.response.status}`);
assert((result.response.headers.get("content-type") || "").includes("image/svg"), "favicon: wrong content type");

result = await fetchText(`${ORIGIN}/robots.txt`);
assert(result.response.status === 200, "robots.txt unavailable");
assert(result.body.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), "robots.txt sitemap mismatch");

result = await fetchText(`${ORIGIN}/sitemap.xml`);
assert(result.response.status === 200, "sitemap unavailable");
for (const path of INDEXABLE) {
  const loc = path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path}`;
  assert(result.body.includes(`<loc>${loc}</loc>`), `sitemap missing ${loc}`);
}

result = await fetchText(`${ORIGIN}/llms.txt`);
assert(result.response.status === 200, "llms.txt unavailable");
assert(result.body.includes(`Main: ${ORIGIN}/`), "llms.txt canonical origin mismatch");

const homepage = await fetchText(`${ORIGIN}/`);
const internalLinks = [...homepage.body.matchAll(/<a\b[^>]*href="(\/[^"#?]*)[^"]*"/gi)]
  .map((match) => match[1])
  .filter((value, index, all) => all.indexOf(value) === index);

for (const path of internalLinks) {
  const { response } = await fetchText(`${ORIGIN}${path}`);
  assert([200, 301, 302, 307, 308].includes(response.status), `homepage link ${path}: bad status ${response.status}`);
}

result = await fetchText("https://neverjustsell.cafe24.com/product/detail.html?product_no=11");
assert([200, 301, 302, 307, 308].includes(result.response.status), `book purchase target unavailable: ${result.response.status}`);

console.log(`PASS: public-site launch crawl (${INDEXABLE.length} indexable pages, ${internalLinks.length} homepage links)`);

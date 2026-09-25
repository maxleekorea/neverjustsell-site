import runtime from "../site/src/runtime.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(url) {
  return runtime.fetch(new Request(url), {
    SITE_ORIGIN: "https://www.neverjustsell.com",
    AUTH_ORIGIN: "https://classroom.neverjustsell.com",
    COMMUNITY_ORIGIN: "https://community.neverjustsell.com",
    SHOP_ORIGIN: "https://neverjustsell.cafe24.com"
  }, {});
}

let r = await request("https://neverjustsell.com/about?x=1");
assert(r.status === 308, "apex must canonicalize");
assert(r.headers.get("location") === "https://www.neverjustsell.com/about?x=1", "apex must preserve path/query");

r = await request("https://www.neverjustsell.com/login");
assert(r.status === 302, "public login is a redirect");
let loginTarget = new URL(r.headers.get("location"));
assert(loginTarget.origin === "https://classroom.neverjustsell.com", "public login must use classroom auth");
assert(loginTarget.pathname === "/oauth/cafe24/customer/start", "public login must start Cafe24 customer OAuth");
assert(loginTarget.searchParams.get("return_to") === "https://www.neverjustsell.com/", "public login must return to canonical site");

r = await request("https://www.neverjustsell.com/logout");
assert(r.status === 302, "public logout is a redirect");
let logoutTarget = new URL(r.headers.get("location"));
assert(logoutTarget.origin === "https://classroom.neverjustsell.com", "public logout must use classroom logout sync");
assert(logoutTarget.pathname === "/session/logout-sync", "public logout must clear classroom and Cafe24 sessions");
assert(logoutTarget.searchParams.get("return_to") === "https://www.neverjustsell.com/", "public logout must return to canonical site");

r = await request("https://www.neverjustsell.com/auth/complete");
assert(r.status === 302 && r.headers.get("location") === "/", "legacy auth complete must only return home");
assert(!r.headers.get("set-cookie"), "public site must not create auth cookies");

r = await request("https://www.neverjustsell.com/classroom");
assert(r.status === 302 && r.headers.get("location") === "https://classroom.neverjustsell.com/classroom", "classroom bridge must use canonical classroom origin");

r = await request("https://www.neverjustsell.com/community");
assert(r.status === 302 && r.headers.get("location") === "https://community.neverjustsell.com/", "community bridge must use canonical community origin");

r = await request("https://www.neverjustsell.com/support");
assert(r.status === 200, "customer support page must be available");
const supportHtml = await r.text();
assert(supportHtml.includes("고객지원"), "customer support page must identify its purpose");
assert(supportHtml.includes("취소·환불"), "customer support page must expose cancellation/refund help");
assert(
  supportHtml.includes("https://neverjustsell.cafe24.com/myshop/order/list.html"),
  "customer support cancellation entry must use Cafe24 order history"
);

r = await request("https://www.neverjustsell.com/");
const homeHtml = await r.text();
const headerHtml = homeHtml.split("</header>")[0] || "";
assert(!headerHtml.includes("취소·환불"), "refund action must not be promoted in the primary navigation");
assert(homeHtml.includes('href="/support">고객지원</a>'), "customer support must remain discoverable in the footer");

console.log("PASS: public-site responsibility contract");

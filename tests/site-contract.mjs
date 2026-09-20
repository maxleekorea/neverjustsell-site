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
assert(r.headers.get("location") === "https://neverjustsell.cafe24.com/member/login.html", "public login must go to commerce login, not site-login bridge");

r = await request("https://www.neverjustsell.com/auth/complete");
assert(r.status === 302 && r.headers.get("location") === "/", "legacy auth complete must only return home");
assert(!r.headers.get("set-cookie"), "public site must not create auth cookies");

r = await request("https://www.neverjustsell.com/classroom");
assert(r.status === 302 && r.headers.get("location") === "https://classroom.neverjustsell.com/classroom", "classroom bridge must use canonical classroom origin");

r = await request("https://www.neverjustsell.com/community");
assert(r.status === 302 && r.headers.get("location") === "https://community.neverjustsell.com/", "community bridge must use canonical community origin");

console.log("PASS: public-site responsibility contract");

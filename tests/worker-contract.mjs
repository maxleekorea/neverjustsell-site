import { readFile } from "node:fs/promises";
import app from "../worker/src/production.js";

class MemoryKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key) : null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
}

const env = {
  CAFE24_CLIENT_ID: "test-client",
  CAFE24_CLIENT_SECRET: "test-secret",
  CAFE24_AUTH: new MemoryKV(),
  CAFE24_REDIRECT_URI: "https://classroom.neverjustsell.com/oauth/cafe24/callback",
  SITE_ORIGIN: "https://www.neverjustsell.com",
  COMMUNITY_ALLOWED_ORIGINS: "https://community.neverjustsell.com",
  COURSE_ADMIN_PASSWORD: "test-admin-password"
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const classroomProductionConfig = JSON.parse(
  await readFile(new URL("../worker/wrangler.production.jsonc", import.meta.url), "utf8")
);
const classroomDefaultConfig = JSON.parse(
  await readFile(new URL("../worker/wrangler.jsonc", import.meta.url), "utf8")
);
const classroomDeployScript = await readFile(
  new URL("../worker/deploy.mjs", import.meta.url),
  "utf8"
);
assert(classroomProductionConfig.workers_dev === false, "production classroom workers.dev route must stay disabled");
assert(
  classroomProductionConfig.routes?.some((route) => route.pattern === "classroom.neverjustsell.com" && route.custom_domain === true),
  "production classroom must use the canonical custom domain"
);
assert(classroomDefaultConfig.workers_dev === false, "default classroom config must not re-enable workers.dev");
assert(
  classroomDefaultConfig.routes?.some((route) => route.pattern === "classroom.neverjustsell.com" && route.custom_domain === true),
  "default classroom config must use the canonical custom domain"
);
assert(
  classroomDeployScript.includes('"--config", "wrangler.production.jsonc"'),
  "Cloudflare Worker build deploy must use the canonical production config"
);

async function get(url, init = {}) {
  return app.fetch(new Request(url, init), env, {});
}

let r = await get("https://neverjustsell-course-access.max-lee-korea.workers.dev/classroom");
assert(r.status === 302, "legacy workers.dev must redirect");
assert(r.headers.get("location") === "https://classroom.neverjustsell.com/classroom", "legacy host must canonicalize");

r = await get("https://classroom.neverjustsell.com/migration-health");
let body = await r.json();
assert([200, 503].includes(r.status) && body.route_owner === "production-dispatch-v3", "production dispatcher health missing");
assert(r.status !== 503 || body.program_schema?.skipped === true, "local migration health may only degrade when D1 is intentionally unbound");
assert(body.redirect_uri === "https://classroom.neverjustsell.com/oauth/cafe24/callback", "callback must be canonical");
assert(body.admin_scopes.includes("mall.write_product"), "Cafe24 product write scope must be requested");
assert(body.admin_scopes.includes("mall.write_order"), "Cafe24 order write scope must be requested");

r = await get("https://classroom.neverjustsell.com/course-admin");
let adminHtml = await r.text();
assert(r.status === 200 && adminHtml.includes("강의 관리자"), "course admin login must render");
assert(!adminHtml.includes("새 강의"), "anonymous course admin must not expose dashboard");

r = await get("https://classroom.neverjustsell.com/course-admin/api/courses");
body = await r.json();
assert(r.status === 401 && body.error === "admin_auth_required", "course admin API must require admin auth");

r = await get("https://classroom.neverjustsell.com/vimeo/status");
body = await r.json();
assert(r.status === 503 && body.error === "vimeo_token_missing", "Vimeo route must fail closed without a token");
assert(body.expected_binding === "VIMEO_ACCESS_TOKEN", "Vimeo diagnostic must report the expected binding name");
assert(Array.isArray(body.detected_vimeo_bindings), "Vimeo diagnostic must report detected Vimeo binding names");

r = await get("https://classroom.neverjustsell.com/site-login?return_to=https%3A%2F%2Fwww.neverjustsell.com%2Fauth%2Fcomplete");
body = await r.json();
assert(r.status === 404 && body.error === "not_found", "auth worker must not own public-site login state");

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/status");
body = await r.json();
assert(r.status === 200 && body.ok === true && body.connected === false, "admin OAuth status must be owned by the Cafe24 adapter");

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/customer/start?return_to=https%3A%2F%2Fevil.example%2Fauth%2Fcallback");
body = await r.json();
assert(r.status === 400 && body.error === "invalid_customer_return_to", "invalid customer return_to must be rejected");

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/customer/start?return_to=https%3A%2F%2Fwww.neverjustsell.com%2F");
assert(r.status === 302, "site login must start Cafe24 customer OAuth");
let authLocation = new URL(r.headers.get("location"));
assert(authLocation.origin === "https://neverjustsell.cafe24.com", "site login must go to Cafe24");
assert(
  authLocation.searchParams.get("redirect_uri") === "https://classroom.neverjustsell.com/oauth/cafe24/callback",
  "Cafe24 redirect_uri must remain canonical and single-decoded"
);

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/customer/start");
assert(r.status === 302, "generic classroom auth must start without return_to");
assert((r.headers.get("location") || "").startsWith("https://neverjustsell.cafe24.com/api/v2/oauth/authorize"), "generic auth must go to Cafe24");

r = await get("https://classroom.neverjustsell.com/courses");
assert(r.status === 200, "public course catalog must render without login");

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/callback?error=access_denied&error_description=scope%20not%20approved&state=test");
body = await r.json();
assert(r.status === 400 && body.error === "cafe24_authorization_denied", "Cafe24 authorization errors must not be mislabeled as expired state");
assert(body.oauth_error === "access_denied" && body.detail === "scope not approved", "Cafe24 OAuth error detail must be preserved");

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/callback?state=unknown&code=test");
body = await r.json();
assert(r.status === 401 && body.error === "invalid_or_expired_state", "OAuth callback must have one state owner");

r = await get("https://classroom.neverjustsell.com/classroom?course=free-lesson-1");
assert(r.status === 302, "anonymous free course must require authentication");
assert(
  new URL(r.headers.get("location")).searchParams.get("return_to") === "https://classroom.neverjustsell.com/classroom?course=free-lesson-1",
  "anonymous free course login must return to the selected lesson"
);

r = await get("https://classroom.neverjustsell.com/library");
assert(r.status === 302, "anonymous learner library must require authentication");
assert(
  new URL(r.headers.get("location")).searchParams.get("return_to") === "https://classroom.neverjustsell.com/library",
  "member must return to My Courses, not generic classroom"
);

r = await get("https://classroom.neverjustsell.com/my-space");
assert(r.status === 302, "anonymous My Space must require authentication");
assert(
  new URL(r.headers.get("location")).searchParams.get("return_to") === "https://classroom.neverjustsell.com/my-space",
  "My Space login must return directly to My Space"
);

r = await get("https://classroom.neverjustsell.com/classroom");
assert(r.status === 302, "anonymous classroom must immediately start authentication");
assert(
  new URL(r.headers.get("location")).searchParams.get("return_to") === "https://classroom.neverjustsell.com/classroom",
  "anonymous classroom login must resume the selected learning home without a redundant screen"
);


// Visitor continuity: safe destinations are carried across OAuth state.
for (const [entry,target] of [
  ["/my-space","https://classroom.neverjustsell.com/my-space"],
  ["/library","https://classroom.neverjustsell.com/library"],
  ["/classroom?course=free-lesson-1","https://classroom.neverjustsell.com/classroom?course=free-lesson-1"]
]) {
  const landing = await get("https://classroom.neverjustsell.com" + entry);
  assert(landing.status===302,"anonymous destination must require login: "+entry);
  const login = new URL(landing.headers.get("location"));
  assert(login.pathname==="/oauth/cafe24/customer/start","must use existing Cafe24 OAuth bridge");
  assert(login.searchParams.get("return_to")===target,"must remember visitor destination: "+entry);
  const authorize=await get(login.toString());
  assert(authorize.status===302,"allowed visitor return must be accepted in OAuth state");
  const authorizeUrl=new URL(authorize.headers.get("location"));
  assert(authorizeUrl.origin==="https://neverjustsell.cafe24.com","must keep canonical identity provider");
  const state=authorizeUrl.searchParams.get("state");
  const stored=await env.CAFE24_AUTH.get("cafe24:customer-oauth-state:"+state);
  assert(JSON.parse(stored).return_to===target,"state must retain selected destination until callback");
}
const badReturn="https://evil.example/my-space";
r = await get("https://classroom.neverjustsell.com/oauth/cafe24/customer/start?return_to="+encodeURIComponent(badReturn));
assert(r.status===400,"cross-domain return must still be rejected");
r = await get("https://classroom.neverjustsell.com/courses/enroll",{
  method:"POST",
  headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:"course_slug=online-commerce-basics"
});
assert(r.status===302,"guest free enrollment must ask for login");
assert(
  new URL(r.headers.get("location")).searchParams.get("return_to")==="https://classroom.neverjustsell.com/courses/online-commerce-basics",
  "non-replayable enrollment POST must return to the course detail after login"
);

// End-to-end AUTH STATE UNIT SIMULATION: mock only Cafe24 token + identifier,
// then verify the genuine worker callback restores the selected visitor screen.
// This deliberately does NOT claim a real Cafe24 password/login session was tested.
{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async (url) => {
    const target=String(url);
    if (target==="https://neverjustsell.cafe24.com/api/v2/oauth/token") {
      return new Response(JSON.stringify({access_token:"mock-visitor-token",user_id:"visitor-test",shop_no:1,scopes:["mall.read_customer_identifier"]}),{status:200,headers:{"Content-Type":"application/json"}});
    }
    if (target==="https://neverjustsell.cafe24.com/api/v2/customers/identifier") {
      return new Response(JSON.stringify({identifier:{user_identifier:"visitor-identity",shop_no:1}}),{status:200,headers:{"Content-Type":"application/json"}});
    }
    throw new Error("Unexpected network call during simulated login");
  };
  try {
    for (const destination of ["/my-space","/library","/classroom?course=free-lesson-1"]) {
      const returnTo="https://classroom.neverjustsell.com"+destination;
      const start=await get("https://classroom.neverjustsell.com/oauth/cafe24/customer/start?return_to="+encodeURIComponent(returnTo));
      assert(start.status===302,"simulated OAuth start failed");
      const state=new URL(start.headers.get("location")).searchParams.get("state");
      const callback=await get("https://classroom.neverjustsell.com/oauth/cafe24/callback?state="+encodeURIComponent(state)+"&code=mock-code");
      assert(callback.status===302,"simulated OAuth callback must redirect");
      assert(callback.headers.get("location")===returnTo,"callback must return to exact visitor destination "+destination);
      assert(String(callback.headers.get("set-cookie")||"").includes("njs_session="),"callback must issue classroom session");
    }
  } finally {
    globalThis.fetch=originalFetch;
  }
}

r = await get("https://classroom.neverjustsell.com/session/status", {
  headers: { Origin: "https://www.neverjustsell.com" }
});
body = await r.json();
assert(r.status === 200 && body.authenticated === false, "anonymous session status must be explicit");
assert(
  r.headers.get("Access-Control-Allow-Origin") === "https://www.neverjustsell.com",
  "public site must be allowed to read classroom session status"
);
assert(
  r.headers.get("Access-Control-Allow-Credentials") === "true",
  "session status CORS must allow credentialed requests"
);

r = await get("https://classroom.neverjustsell.com/session/logout-sync?return_to=https%3A%2F%2Fwww.neverjustsell.com%2F");
assert(r.status === 302, "synchronized logout must redirect to Cafe24 logout");
let logoutLocation = new URL(r.headers.get("location"));
assert(logoutLocation.origin === "https://neverjustsell.cafe24.com", "synchronized logout must terminate Cafe24 session");
assert(logoutLocation.pathname === "/exec/front/Member/logout/", "Cafe24 logout path mismatch");
assert(logoutLocation.searchParams.get("returnUrl") === "https://www.neverjustsell.com/", "synchronized logout must return to public site");

r = await get("https://classroom.neverjustsell.com/system-check");
const anonymousSystemCheck = await r.text();
assert(r.status === 200, "system check must render");
assert(!anonymousSystemCheck.includes("CHECK 1"), "anonymous system check must match redirect-based classroom auth UX");
assert(anonymousSystemCheck.includes("익명 유료 접근 인증 전환"), "system check must verify auth redirect instead of legacy 401 behavior");

r = await get("https://classroom.neverjustsell.com/community-auth/redeem", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ticket: "bad-ticket" })
});
body = await r.json();
assert(r.status === 401 && body.error === "ticket_invalid_or_expired", "community ticket verifier must reject malformed ticket");

await env.CAFE24_AUTH.put(
  "cafe24:customer-session:test-session",
  JSON.stringify({
    member_id: "member-1",
    identifier: { user_identifier: "identifier-1", shop_no: 1 },
    shop_no: 1,
    scopes: ["mall.read_customer_identifier"],
    authenticated_at: new Date().toISOString()
  })
);
await env.CAFE24_AUTH.put(
  "cafe24:admin-token",
  JSON.stringify({
    access_token: "admin-access-token",
    refresh_token: "admin-refresh-token",
    expires_at: "2099-01-01T00:00:00+09:00",
    scopes: ["mall.read_product", "mall.write_product", "mall.read_order", "mall.write_order"]
  })
);

const originalFetch = globalThis.fetch;
globalThis.fetch = async () =>
  new Response(JSON.stringify({ orders: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

try {
  r = await get("https://classroom.neverjustsell.com/session/status", {
    headers: { Cookie: "njs_session=test-session" }
  });
  body = await r.json();
  assert(r.status === 200 && body.authenticated === true, "stored classroom session must be recognized");

  r = await get("https://classroom.neverjustsell.com/classroom?course=free-lesson-1", {
    headers: { Cookie: "njs_session=test-session" }
  });
  const authenticatedFreeCourse = await r.text();
  assert(r.status === 200, "authenticated member must access free course without purchase");
  assert(authenticatedFreeCourse.includes("FREE CLASS"), "free course must render after member authentication");

  r = await get("https://classroom.neverjustsell.com/classroom", {
    headers: { Cookie: "njs_session=test-session" }
  });
  const authenticatedClassroom = await r.text();
  assert(r.status === 200, "authenticated learning home must not return login-required 401");
  assert(authenticatedClassroom.includes("학습 홈"), "authenticated learner must reach personalized learning home");

  r = await get("https://classroom.neverjustsell.com/library", {
    headers: { Cookie: "njs_session=test-session" }
  });
  const authenticatedLibrary = await r.text();
  assert(r.status === 200, "authenticated learner library must render");
  assert(authenticatedLibrary.includes("내 강의"), "learner library heading missing");
  assert(authenticatedLibrary.includes("아직 등록된 강의가 없습니다."), "unenrolled learner must see empty library state");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("PASS: worker route ownership and auth boundary contract");

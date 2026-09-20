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
  COMMUNITY_ALLOWED_ORIGINS: "https://community.neverjustsell.com"
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function get(url, init = {}) {
  return app.fetch(new Request(url, init), env, {});
}

let r = await get("https://neverjustsell-course-access.max-lee-korea.workers.dev/classroom");
assert(r.status === 302, "legacy workers.dev must redirect");
assert(r.headers.get("location") === "https://classroom.neverjustsell.com/classroom", "legacy host must canonicalize");

r = await get("https://classroom.neverjustsell.com/migration-health");
let body = await r.json();
assert(r.status === 200 && body.route_owner === "production-dispatch-v2", "production dispatcher health missing");
assert(body.redirect_uri === "https://classroom.neverjustsell.com/oauth/cafe24/callback", "callback must be canonical");


r = await get("https://classroom.neverjustsell.com/site-login?return_to=https%3A%2F%2Fwww.neverjustsell.com%2Fauth%2Fcomplete");
body = await r.json();
assert(r.status === 404 && body.error === "not_found", "auth worker must not own public-site login state");


r = await get("https://classroom.neverjustsell.com/oauth/cafe24/status");
body = await r.json();
assert(r.status === 200 && body.ok === true && body.connected === false, "admin OAuth status must be owned by the Cafe24 adapter");

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/customer/start?return_to=https%3A%2F%2Fevil.example%2Fauth%2Fcallback");
body = await r.json();
assert(r.status === 400 && body.error === "invalid_community_return_to", "invalid community return_to must be rejected");

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/customer/start");
assert(r.status === 302, "generic classroom auth must start without community return_to");
assert((r.headers.get("location") || "").startsWith("https://neverjustsell.cafe24.com/api/v2/oauth/authorize"), "generic auth must go to Cafe24");

r = await get("https://classroom.neverjustsell.com/oauth/cafe24/callback?state=unknown&code=test");
body = await r.json();
assert(r.status === 401 && body.error === "invalid_or_expired_state", "OAuth callback must have one state owner");

r = await get("https://classroom.neverjustsell.com/classroom");
assert(r.status === 302, "anonymous classroom must immediately start authentication");
assert(
  r.headers.get("location") === "https://classroom.neverjustsell.com/oauth/cafe24/customer/start",
  "anonymous classroom must not add a redundant verification screen"
);

r = await get("https://classroom.neverjustsell.com/session/status");
body = await r.json();
assert(r.status === 200 && body.authenticated === false, "anonymous session status must be explicit");

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

// Regression: getCustomerSession() returns { sessionId, record }.
// The classroom home must read member_id from session.record rather than
// treating the wrapper object itself as the customer record.
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
    scopes: ["mall.read_product", "mall.read_order"]
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

  r = await get("https://classroom.neverjustsell.com/classroom", {
    headers: { Cookie: "njs_session=test-session" }
  });
  const authenticatedClassroom = await r.text();
  assert(r.status === 200, "authenticated classroom home must not return login-required 401");
  assert(!authenticatedClassroom.includes("회원 인증이 필요합니다."), "authenticated classroom home must not loop back to member verification");
  assert(authenticatedClassroom.includes("현재 수강 가능한 강의가 없습니다."), "authenticated no-purchase member must reach classroom home state");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("PASS: worker route ownership and auth boundary contract");

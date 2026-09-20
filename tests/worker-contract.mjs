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
const classroom = await r.text();
assert(r.status === 401, "anonymous classroom must require authentication");
assert(classroom.includes("https://classroom.neverjustsell.com/oauth/cafe24/customer/start"), "classroom auth link must be canonical");
assert(!classroom.includes("invalid_community_return_to"), "classroom must not use community validation");

r = await get("https://classroom.neverjustsell.com/session/status");
body = await r.json();
assert(r.status === 200 && body.authenticated === false, "anonymous session status must be explicit");

r = await get("https://classroom.neverjustsell.com/community-auth/redeem", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ticket: "bad-ticket" })
});
body = await r.json();
assert(r.status === 401 && body.error === "ticket_invalid_or_expired", "community ticket verifier must reject malformed ticket");

console.log("PASS: worker route ownership and auth boundary contract");

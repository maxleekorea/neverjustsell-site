import assert from "node:assert/strict";
import knowledgeAdminApp from "../worker/src/knowledge-admin.js";
import {
  ensureKnowledgeOpsSchema,
  handleKnowledgePublic,
  KNOWLEDGE_OPS_VERSION,
  VALID_STATUSES,
  VALID_TYPES
} from "../worker/src/knowledge-ops.js";

assert.equal(typeof KNOWLEDGE_OPS_VERSION, "string");
assert.ok(VALID_TYPES.has("term"));
assert.ok(VALID_TYPES.has("case"));
assert.ok(VALID_TYPES.has("brief"));
assert.ok(VALID_STATUSES.has("draft"));
assert.ok(VALID_STATUSES.has("review"));
assert.ok(VALID_STATUSES.has("published"));
assert.ok(VALID_STATUSES.has("archived"));

const missing = await ensureKnowledgeOpsSchema({});
assert.equal(missing.ok, false);
assert.equal(missing.skipped, true);
assert.equal(missing.reason, "course_db_binding_missing");

let response = await handleKnowledgePublic(
  new Request("https://classroom.neverjustsell.com/knowledge/public"),
  {}
);
assert.equal(response.status, 503);
let body = await response.json();
assert.equal(body.error, "course_db_binding_missing");

response = await handleKnowledgePublic(
  new Request("https://classroom.neverjustsell.com/knowledge/public", { method: "POST" }),
  {}
);
assert.equal(response.status, 405);
body = await response.json();
assert.equal(body.error, "method_not_allowed");

response = await knowledgeAdminApp.fetch(
  new Request("https://classroom.neverjustsell.com/course-admin/knowledge"),
  { COURSE_ADMIN_PASSWORD: "test-secret" }
);
assert.equal(response.status, 200);
let text = await response.text();
assert.ok(text.includes("Knowledge Admin"));
assert.ok(text.includes("기존 Course Admin 비밀번호"));

response = await knowledgeAdminApp.fetch(
  new Request("https://classroom.neverjustsell.com/course-admin/knowledge/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://classroom.neverjustsell.com" },
    body: new URLSearchParams({ password: "wrong" })
  }),
  { COURSE_ADMIN_PASSWORD: "test-secret" }
);
assert.equal(response.status, 401);
text = await response.text();
assert.ok(text.includes("비밀번호가 올바르지 않습니다"));

console.log("knowledge-ops contract: ok");

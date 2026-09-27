import assert from "node:assert/strict";
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

console.log("knowledge-ops contract: ok");

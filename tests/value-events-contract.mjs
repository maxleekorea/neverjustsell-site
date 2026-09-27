import assert from "node:assert/strict";
import {
  ALLOWED_EVENT_TYPES,
  ensureValueEventSchema,
  recordValueEvent,
  VALUE_EVENT_VERSION
} from "../worker/src/value-events.js";

assert.equal(typeof VALUE_EVENT_VERSION, "string");
assert.ok(ALLOWED_EVENT_TYPES.has("knowledge_save"));
assert.ok(ALLOWED_EVENT_TYPES.has("lesson_complete"));
assert.ok(ALLOWED_EVENT_TYPES.has("program_checkin"));
assert.ok(ALLOWED_EVENT_TYPES.has("community_contribution"));

const missing = await ensureValueEventSchema({});
assert.equal(missing.ok, false);
assert.equal(missing.skipped, true);
assert.equal(missing.reason, "course_db_binding_missing");

const invalid = await recordValueEvent({}, {
  memberId: "member-1",
  eventType: "page_view"
});
assert.equal(invalid.ok, false);
assert.equal(invalid.recorded, false);
assert.equal(invalid.reason, "invalid_value_event");

console.log("value-events contract: ok");

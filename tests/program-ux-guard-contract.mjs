import assert from "node:assert/strict";
import { focusProgramParticipant } from "../worker/src/program-participant-ux.js";
import { filterReviewInbox } from "../worker/src/program-review-guard.js";

const participantHtml = `<!doctype html><html><body>
<form method="post" action="/programs/run-1/missions/m-1/submit"><textarea></textarea></form>
<form method="post" action="/programs/run-1/missions/m-2/submit"><textarea></textarea></form>
<form method="post" action="/programs/run-1/missions/m-3/submit"><textarea></textarea></form>
</body></html>`;
const participantResponse = await focusProgramParticipant(
  new Response(participantHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
  new Request("https://classroom.neverjustsell.com/programs/run-1")
);
const focused = await participantResponse.text();
assert.equal((focused.match(/data-deferred-mission-form/g) || []).length, 2);
assert.equal((focused.match(/<form method="post"/g) || []).length, 1);
assert.equal(participantResponse.headers.get("X-NJS-Program-Focus"), "single-next-action");

const reviewHtml = `<!doctype html><html><body><main>
<section class="card"><h1>제출 검토</h1></section>
<section class="card"><span class="pill">submitted</span><div class="submission">A</div></section>
<section class="card"><span class="pill">revision_requested</span><div class="submission">B</div></section>
<section class="card"><span class="pill">rejected</span><div class="submission">C</div></section>
</main></body></html>`;
const reviewResponse = await filterReviewInbox(
  new Response(reviewHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
  new Request("https://classroom.neverjustsell.com/program-host/review")
);
const filtered = await reviewResponse.text();
assert.ok(filtered.includes("submitted"));
assert.ok(!filtered.includes("revision_requested"));
assert.ok(!filtered.includes("rejected"));
assert.equal(reviewResponse.headers.get("X-NJS-Review-Guard"), "filtered-2");

console.log("program UX guard contract: ok");

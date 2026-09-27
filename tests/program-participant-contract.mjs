import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { completionThreshold, missionState } from "../worker/src/program-participant.js";

assert.equal(completionThreshold('{"threshold":0.85}'), 0.85);
assert.equal(completionThreshold('{}'), 1);
assert.equal(completionThreshold('invalid'), 1);

assert.equal(missionState({ submission_status: "accepted" }, "2026-09-27"), "complete");
assert.equal(missionState({ submission_status: "submitted" }, "2026-09-27"), "review");
assert.equal(missionState({ submission_status: "revision_requested" }, "2026-09-27"), "revise");
assert.equal(missionState({ opens_at: "2026-10-01", status: "scheduled" }, "2026-09-27"), "upcoming");
assert.equal(missionState({ opens_at: "2026-09-01", due_at: "2026-09-20", status: "scheduled" }, "2026-09-27"), "overdue");
assert.equal(missionState({ opens_at: "2026-09-01", due_at: "2026-10-20", status: "scheduled" }, "2026-09-27"), "open");

const [entrypoint, participant, review, onboarding, communityProgramAccess] = await Promise.all([
  readFile(new URL("../worker/src/entrypoint.js", import.meta.url), "utf8"),
  readFile(new URL("../worker/src/program-participant.js", import.meta.url), "utf8"),
  readFile(new URL("../worker/src/program-review.js", import.meta.url), "utf8"),
  readFile(new URL("../worker/src/member-onboarding.js", import.meta.url), "utf8"),
  readFile(new URL("../community/src/program-access.js", import.meta.url), "utf8")
]);

assert.match(entrypoint, /programParticipantApp/);
assert.match(entrypoint, /programReviewApp/);
assert.match(entrypoint, /injectProgramReviewLink/);
assert.match(participant, /program_mission_submissions/);
assert.match(participant, /completion_policy_snapshot/);
assert.match(participant, /program_milestone_complete/);
assert.match(participant, /status='completed'/);

// The dark next-action surface must navigate to the exact mission card that owns
// the actionable submission form. Do not regress to a decorative CTA.
assert.match(participant, /href="#mission-\$\{encodeURIComponent\(next\.id\)\}"/);
assert.match(participant, /id="mission-\$\{esc\(m\.id\)\}"/);
assert.match(participant, /\["open","overdue","revise"\]\.includes\(missionState\(next,today\)\)/);

assert.match(review, /canManageProgram/);
assert.match(review, /revision_requested/);
assert.match(review, /recomputeProgramCompletion/);
assert.match(onboarding, /href="\/programs"/);

// Completion is not just a label in Program UI. It must change Community access:
// the run becomes read-only for the participant while the program alumni space
// becomes active. This keeps the completion → alumni journey real and revocable.
assert.match(communityProgramAccess, /access\?\.participant_status === "completed"/);
assert.match(communityProgramAccess, /completedPrograms\.add\(run\.program_id\)/);
assert.match(communityProgramAccess, /\? "read_only"/);
assert.match(communityProgramAccess, /completedPrograms\.has\(programId\) \|\| hostOrModerator/);
assert.match(communityProgramAccess, /program_completed/);
assert.match(communityProgramAccess, /access_status='revoked'/);

console.log("program participant contract: ok");

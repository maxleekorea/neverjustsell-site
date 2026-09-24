import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const foundation = await readFile(
  new URL("../worker/migrations/0027_program_community_foundation.sql", import.meta.url),
  "utf8"
);
const operations = await readFile(
  new URL("../worker/migrations/0028_program_operations.sql", import.meta.url),
  "utf8"
);
const community = await readFile(
  new URL("../community/migrations/0002_program_spaces.sql", import.meta.url),
  "utf8"
);
const roles = await readFile(
  new URL("../worker/src/roles.js", import.meta.url),
  "utf8"
);
const communityDeploy = await readFile(
  new URL("../community/deploy.mjs", import.meta.url),
  "utf8"
);

assert(foundation.includes("CREATE TABLE IF NOT EXISTS programs"), "program template table missing");
assert(foundation.includes("CREATE TABLE IF NOT EXISTS program_runs"), "program run table missing");
assert(foundation.includes("CREATE TABLE IF NOT EXISTS program_enrollments"), "program enrollment table missing");
assert(foundation.includes("CREATE TABLE IF NOT EXISTS platform_role_grants"), "platform roles missing");
assert(foundation.includes("CREATE TABLE IF NOT EXISTS scoped_role_grants"), "scoped roles missing");

assert(operations.includes("CREATE TABLE IF NOT EXISTS program_mission_templates"), "mission template table missing");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_run_missions"), "run mission table missing");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_mission_submissions"), "mission submission table missing");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_content_progress"), "content progress must be independent from mission progress");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_event_templates"), "event template table missing");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_events"), "program event table missing");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_event_rsvps"), "event RSVP table missing");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_event_attendance"), "event attendance table missing");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_completion_reviews"), "completion review snapshot missing");
assert(operations.includes("CREATE TABLE IF NOT EXISTS program_reward_claims"), "completion reward ledger missing");
assert(operations.includes("'fixed_cashback'"), "fixed completion cashback reward missing");
assert(operations.includes("Completion reward is NOT a refund"), "reward/refund separation must remain explicit");
assert(operations.includes("'completion_review','reward_processing','alumni'"), "program lifecycle phases missing");
assert(operations.includes("'host_review'"), "creator-reviewed missions missing");
assert(operations.includes("'njs-readalong-w3-action'"), "pilot action mission template missing");
assert(operations.includes("'njs-readalong-kickoff'"), "pilot kickoff event template missing");
assert(operations.includes("'njs-readalong-closing'"), "pilot closing event template missing");

assert(community.includes("CREATE TABLE IF NOT EXISTS program_run_projections"), "community program projection missing");
assert(community.includes("CREATE TABLE IF NOT EXISTS spaces"), "community spaces missing");
assert(community.includes("CREATE TABLE IF NOT EXISTS space_members"), "space access projection missing");
assert(community.includes("'program_participant'"), "participant-gated space access missing");
assert(community.includes("'program_completed'"), "alumni space access missing");
assert(community.includes("ADD COLUMN knowledge_state"), "knowledge promotion state missing");
assert(community.includes("CREATE TABLE IF NOT EXISTS knowledge_promotions"), "knowledge promotion ledger missing");
assert(community.includes("'space-njs-readalong-qna'"), "author Q&A pilot space missing");
assert(community.includes("'space-njs-readalong-alumni'"), "pilot alumni space missing");

assert(roles.includes("canManageProgram"), "program management permission helper missing");
assert(roles.includes("canHostProgram"), "program host permission helper missing");
assert(roles.includes("canModerateSpace"), "space moderation permission helper missing");
assert(roles.includes("PLATFORM_ROLES.STAFF_OPERATOR"), "staff operator must be able to perform operating work");
assert(roles.includes('SCOPED_ROLES.PROGRAM_HOST, "program"'), "program-scoped host check missing");
assert(roles.includes('SCOPED_ROLES.PROGRAM_MODERATOR, "program_run"'), "run-scoped moderator check missing");

assert(communityDeploy.includes('"d1"'), "community deploy must apply D1 migrations");
assert(communityDeploy.includes('"neverjustsell-community"'), "community deploy must target community D1");
assert(
  communityDeploy.indexOf('"migrations"') < communityDeploy.lastIndexOf('"deploy"'),
  "community migrations must run before Worker deploy"
);

console.log("PASS: creator-reader program and community operating scaffold");

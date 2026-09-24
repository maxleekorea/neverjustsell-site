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
const host = await readFile(
  new URL("../worker/src/program-host.js", import.meta.url),
  "utf8"
);
const production = await readFile(
  new URL("../worker/src/production.js", import.meta.url),
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

assert(host.includes("getCustomerSession"), "program host workspace must use member login");
assert(host.includes("listManagedPrograms"), "program host workspace must scope visible programs");
assert(host.includes("program_host"), "program host scoped permission missing");
assert(host.includes("program_moderator"), "program moderator scoped permission missing");
assert(host.includes("/program-host/run-create"), "creator run creation route missing");
assert(host.includes("program_mission_templates"), "run creation must clone mission templates");
assert(host.includes("program_event_templates"), "run creation must clone event templates");
assert(host.includes("relative_open_day"), "mission dates must be relative to run start");
assert(host.includes("relative_day"), "event dates must be relative to run start");
assert(host.includes("새 회차 만들기"), "creator host run creation UX missing");
assert(host.includes("모더레이션 권한만 있습니다"), "moderator/host authority distinction missing");
assert(production.includes('import programHostApp from "./program-host.js"'), "production program host import missing");
assert(production.includes('url.pathname === "/program-host"'), "production program host route missing");

assert(communityDeploy.includes('"d1"'), "community deploy must apply D1 migrations");
assert(communityDeploy.includes('"neverjustsell-community"'), "community deploy must target community D1");
assert(
  communityDeploy.indexOf('"migrations"') < communityDeploy.lastIndexOf('"deploy"'),
  "community migrations must run before Worker deploy"
);

console.log("PASS: creator-reader program and community operating scaffold");

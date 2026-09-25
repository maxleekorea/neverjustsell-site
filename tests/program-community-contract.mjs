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
const paymentFixture = await readFile(
  new URL("../worker/migrations/0029_program_payment_e2e_fixture.sql", import.meta.url),
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
const unified = await readFile(
  new URL("../worker/src/unified.js", import.meta.url),
  "utf8"
);
const config = await readFile(
  new URL("../worker/src/config.js", import.meta.url),
  "utf8"
);
const programSchema = await readFile(
  new URL("../worker/src/program-schema.js", import.meta.url),
  "utf8"
);
const communitySchema = await readFile(
  new URL("../community/src/program-schema.js", import.meta.url),
  "utf8"
);
const communityRuntime = await readFile(
  new URL("../community/src/index.js", import.meta.url),
  "utf8"
);
const communityProductionConfig = JSON.parse(
  await readFile(new URL("../community/wrangler.production.jsonc", import.meta.url), "utf8")
);
const communityDefaultConfig = JSON.parse(
  await readFile(new URL("../community/wrangler.jsonc", import.meta.url), "utf8")
);
const workerDeploy = await readFile(
  new URL("../worker/deploy.mjs", import.meta.url),
  "utf8"
);
const programAccess = await readFile(
  new URL("../worker/src/program-access.js", import.meta.url),
  "utf8"
);
const systemOperations = await readFile(
  new URL("../worker/src/system-operations.js", import.meta.url),
  "utf8"
);
const ticketRuntime = await readFile(
  new URL("../worker/src/runtime.js", import.meta.url),
  "utf8"
);
const communityAccess = await readFile(
  new URL("../community/src/program-access.js", import.meta.url),
  "utf8"
);
const admin = await readFile(
  new URL("../worker/src/course-admin.js", import.meta.url),
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

assert(paymentFixture.includes("'system-check-payment-program'"), "program payment E2E fixture missing");
assert(paymentFixture.includes("'system-check-payment-program-run'"), "program payment E2E run missing");
assert(paymentFixture.includes("cafe24_product_no=13"), "program payment E2E must reuse hidden Cafe24 product 13");
assert(paymentFixture.includes("price_krw=1000"), "program payment E2E price must remain 1,000 KRW");
assert(paymentFixture.includes("'private'"), "program payment E2E fixture must remain private");

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

assert(programSchema.includes("0027_program_community_foundation.sql"), "runtime reconciler must track program foundation migration");
assert(programSchema.includes("0028_program_operations.sql"), "runtime reconciler must track program operations migration");
assert(programSchema.includes("INSERT OR IGNORE INTO d1_migrations"), "runtime program migrations must be recorded for Wrangler compatibility");
assert(programSchema.includes("PRAGMA table_info"), "runtime program reconciler must detect existing columns");
assert(production.includes("ensureProgramSchema"), "migration health must reconcile program schema");
assert(host.includes("ensureProgramSchema"), "program host must self-heal schema before access");

assert(programSchema.includes("0029_program_payment_e2e_fixture.sql"), "runtime reconciler must apply program payment fixture");
assert(programSchema.includes("0030_open_payment_e2e_product.sql"), "runtime reconciler must apply one-time payment product operation");
assert(programSchema.includes("0031_reopen_payment_e2e_product_without_group_lock.sql"), "runtime reconciler must apply logged-in E2E fallback operation");
assert(programSchema.includes("0032_reconcile_latest_payment_e2e_order.sql"), "runtime reconciler must apply latest paid order reconciliation");
assert(systemOperations.includes("reconcile_latest_payment_e2e_order"), "latest paid E2E order reconciliation operation missing");
assert(systemOperations.includes("syncPaidCourseEntitlementForPurchase"), "automatic E2E reconciliation must create course entitlement");
assert(systemOperations.includes("reconcilePurchasedProgramEnrollments"), "automatic E2E reconciliation must create Program enrollment");
assert(systemOperations.includes("open_payment_e2e_product_13"), "one-time payment E2E operation missing");
assert(systemOperations.includes("price: 1000"), "one-time operation must force 1,000 KRW");
assert(systemOperations.includes('display: "T"'), "one-time operation must expose the product");
assert(systemOperations.includes('selling: "T"'), "one-time operation must enable selling");
assert(systemOperations.includes('buy_limit_type: "M"'), "one-time operation must keep member-only purchase");
assert(systemOperations.includes("getPaymentE2EProductStatus"), "read-only payment E2E product status missing");

assert(config.includes('"mall.read_category"'), "Cafe24 category read scope missing");
assert(config.includes('"mall.write_category"'), "Cafe24 category write scope missing");
assert(systemOperations.includes('CATALOG_CATEGORY_NAMES = ["강의", "전자책", "프로그램", "일반상품"]'), "canonical Cafe24 product categories missing");
assert(systemOperations.includes("bootstrapCafe24Catalog"), "Cafe24 catalog bootstrap missing");
assert(systemOperations.includes("/categories"), "Cafe24 category creation endpoint missing");
assert(systemOperations.includes("product_13"), "payment E2E product category assignment missing");
assert(unified.includes("bootstrapCafe24Catalog"), "Cafe24 reauthorization must bootstrap product categories");
assert(unified.includes('ADMIN_SCOPES.join(",")'), "Cafe24 OAuth scopes must be comma-separated");
assert(production.includes("/system-check/payment-e2e/status"), "payment E2E product status route missing");
assert(programAccess.includes("reconcilePurchasedProgramEnrollments"), "Cafe24 program enrollment sync missing");
assert(programAccess.includes("findValidCoursePurchase"), "program enrollment must reuse confirmed purchase rules");
assert(programAccess.includes("findRevokedCoursePurchase"), "program enrollment must react to refund/cancellation");
assert(programAccess.includes("status='withdrawn'"), "revoked purchase must withdraw program enrollment");
assert(programAccess.includes("getProgramCommunityProjection"), "canonical community program projection missing");
assert(ticketRuntime.includes("getProgramCommunityProjection"), "community ticket redemption must include canonical program access");

assert(communityAccess.includes("syncMemberProgramSpaces"), "community program space projection missing");
assert(communityAccess.includes("'program_run'"), "program discussion spaces must be run-scoped");
assert(communityAccess.includes("program_participant"), "run spaces must be participant gated");
assert(communityAccess.includes("program_completed"), "alumni space must require completion");
assert(communityAccess.includes("access_status='revoked'"), "stale projected space access must be revoked");
assert(communityAccess.includes("moderation_role"), "creator/moderator projection missing");
assert(communityRuntime.includes("syncMemberProgramSpaces"), "community login must sync program space access");

assert(admin.includes("program_enrollment"), "payment E2E inspection must expose Program enrollment");
assert(admin.includes("Program 참가권"), "payment E2E admin must show Program enrollment state");
assert(admin.includes("withdrawn"), "payment E2E must verify Program access withdrawal after refund");

assert(communitySchema.includes("0002_program_spaces.sql"), "runtime community migration tracking missing");
assert(communitySchema.includes("INSERT OR IGNORE INTO d1_migrations"), "runtime community migration must be recorded for Wrangler compatibility");
assert(communitySchema.includes("PRAGMA table_info"), "community schema reconciler must detect existing post columns");
assert(communityRuntime.includes("ensureCommunityProgramSchema"), "community DB health must reconcile program spaces");
assert(communityProductionConfig.workers_dev === false, "production community workers.dev route must stay disabled");
assert(
  communityProductionConfig.routes?.some((route) => route.pattern === "community.neverjustsell.com" && route.custom_domain === true),
  "production community must use the canonical custom domain"
);
assert(communityDefaultConfig.workers_dev === false, "default community config must not re-enable workers.dev");
assert(
  communityDefaultConfig.routes?.some((route) => route.pattern === "community.neverjustsell.com" && route.custom_domain === true),
  "default community config must use the canonical custom domain"
);

assert(workerDeploy.includes("migration-health"), "course deploy must reconcile schema through runtime binding");
assert(!workerDeploy.includes('"migrations",\n    "apply"'), "course deploy must not depend on D1 management API");
assert(communityDeploy.includes("/auth/db-health"), "community deploy must reconcile schema through runtime binding");
assert(!communityDeploy.includes('"d1"'), "community deploy must not depend on D1 management API");

console.log("PASS: creator-reader program and community operating scaffold");

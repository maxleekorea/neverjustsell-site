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
const refundMigration = await readFile(
  new URL("../worker/migrations/0040_cancel_payment_e2e_order.sql", import.meta.url),
  "utf8"
);
const refundRetryMigration = await readFile(
  new URL("../worker/migrations/0041_retry_final_payment_e2e_consistency.sql", import.meta.url),
  "utf8"
);
const community = await readFile(
  new URL("../community/migrations/0002_program_spaces.sql", import.meta.url),
  "utf8"
);
const sessionAccessRefresh = await readFile(
  new URL("../community/migrations/0003_session_access_refresh.sql", import.meta.url),
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
const workerEntrypoint = await readFile(
  new URL("../worker/src/entrypoint.js", import.meta.url),
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
const fulfillment = await readFile(
  new URL("../worker/src/fulfillment.js", import.meta.url),
  "utf8"
);
const fulfillmentMigration = await readFile(
  new URL("../worker/migrations/0036_commerce_fulfillment_profiles.sql", import.meta.url),
  "utf8"
);
const router = await readFile(
  new URL("../worker/src/router.js", import.meta.url),
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
assert(programSchema.includes("0040_cancel_payment_e2e_order.sql"), "runtime reconciler must apply final paid order cancellation");
assert(refundMigration.includes("'cancel_payment_e2e_order'"), "final payment E2E cancellation migration missing");
assert(refundMigration.includes('{"product_no":13,"date":"2026-09-25"}'), "final cancellation must target only the known E2E order date and product");
assert(programSchema.includes("0041_retry_final_payment_e2e_consistency.sql"), "runtime reconciler must apply final E2E consistency retry");
assert(programSchema.includes("0047_reassert_separated_refund_processing.sql"), "runtime reconciler must reassert separated refund processing");
assert(programSchema.includes("0048_advance_payment_e2e_to_awaiting_refund.sql"), "runtime reconciler must advance accepted cancellation to awaiting refund");
assert(programSchema.includes("0044_rerun_payment_e2e_withdrawal_after_source_pin.sql"), "runtime reconciler must rerun withdrawal after source-order pin");
assert(refundRetryMigration.includes("'cancel_payment_e2e_order'"), "final consistency retry must reuse guarded cancellation operation");
assert(refundRetryMigration.includes('{"product_no":13,"date":"2026-09-25"}'), "final consistency retry must stay scoped to the known E2E order");
assert(systemOperations.includes("reconcile_latest_payment_e2e_order"), "latest paid E2E order reconciliation operation missing");
assert(systemOperations.includes("syncPaidCourseEntitlementForPurchase"), "automatic E2E reconciliation must create course entitlement");
assert(systemOperations.includes("reconcilePurchasedProgramEnrollments"), "automatic E2E reconciliation must create Program enrollment");
assert(systemOperations.includes("open_payment_e2e_product_13"), "one-time payment E2E operation missing");
assert(systemOperations.includes("price: 1000"), "one-time operation must force 1,000 KRW");
assert(systemOperations.includes('display: "T"'), "one-time operation must expose the product");
assert(systemOperations.includes('selling: "T"'), "one-time operation must enable selling");
assert(systemOperations.includes('buy_limit_type: "M"'), "one-time operation must keep member-only purchase");
assert(systemOperations.includes("getPaymentE2EProductStatus"), "read-only payment E2E product status missing");
assert(systemOperations.includes("cancel_payment_e2e_order"), "guarded payment E2E cancellation operation missing");
assert(systemOperations.includes("revokePaidCourseEntitlementForPurchase"), "payment E2E cancellation must revoke course entitlement");
assert(systemOperations.includes('PAYMENT_E2E_PG_CANCEL_METHODS'), "payment E2E cancellation must decide PG cancellation by payment method");
assert(systemOperations.includes('payment_gateway_cancel: requestPaymentGatewayCancel ? "T" : "F"'), "payment E2E cancellation must not request PG cancellation for bank deposit");
assert(systemOperations.includes('cancellationBody.refund_method_code = ["T"]'), "bank-deposit cancellation must use Cafe24 cash refund only with stored refund account data");
assert(systemOperations.includes('recover_inventory: "F"'), "digital payment E2E cancellation must not restore physical inventory");
assert(systemOperations.includes('display: "F", selling: "F"'), "completed payment E2E must hide the test product");
assert(systemOperations.includes("e2e_refund_verified_hidden"), "hidden post-refund fixture state missing");
assert(systemOperations.includes('"withdrawn"'), "payment E2E cancellation must verify Program withdrawal");
assert(systemOperations.includes('refund_processing_setting: "D"'), "customer cancellation acceptance must stay separate from refund completion");
assert(systemOperations.includes('order_state: orderState'), "payment E2E flow status must expose active/revoked order state");
assert(systemOperations.includes("access_state_consistent"), "payment E2E flow status must verify access state consistency");

assert(config.includes('"mall.read_category"'), "Cafe24 category read scope missing");
assert(config.includes('"mall.write_category"'), "Cafe24 category write scope missing");
assert(systemOperations.includes('CATALOG_CATEGORY_NAMES = ["강의", "전자책", "프로그램", "일반상품"]'), "canonical Cafe24 product categories missing");
assert(systemOperations.includes("bootstrapCafe24Catalog"), "Cafe24 catalog bootstrap missing");
assert(systemOperations.includes("bootstrap_cafe24_catalog"), "Cafe24 catalog bootstrap system operation missing");
assert(systemOperations.includes("add_category_no"), "Cafe24 category product assignment must use product add_category_no");
assert(systemOperations.includes("attempt <= 3"), "Cafe24 category creation retry guard missing");
assert(systemOperations.includes("AUTOMATION_DUPLICATE_CATEGORY_IDS"), "automation-created duplicate category cleanup missing");
assert(systemOperations.includes("cleanup_cafe24_catalog_duplicates"), "one-time duplicate category cleanup operation missing");
assert(programSchema.includes("0035_set_all_current_products_no_shipping.sql"), "runtime reconciler must apply current-product no-shipping migration");
assert(systemOperations.includes("set_all_current_products_no_shipping"), "current-product no-shipping operation missing");
assert(systemOperations.includes('shipping_method: "09"'), "no-shipping operation must use Cafe24 shipping method 09");
assert(systemOperations.includes('shipping_fee_by_product: "T"'), "no-shipping operation must use individual product shipping mode");
assert(production.includes("/system-check/shipping-status"), "shipping status route missing");
assert(systemOperations.includes("contains_products"), "duplicate category cleanup must protect non-empty categories");
assert(systemOperations.includes("/categories"), "Cafe24 category creation endpoint missing");
assert(systemOperations.includes("product_13"), "payment E2E product category assignment missing");
assert(unified.includes("bootstrapCafe24Catalog"), "Cafe24 reauthorization must bootstrap product categories");
assert(unified.includes('ADMIN_SCOPES.join(",")'), "Cafe24 OAuth scopes must be comma-separated");
assert(production.includes("/system-check/payment-e2e/status"), "payment E2E product status route missing");
assert(programAccess.includes("reconcilePurchasedProgramEnrollments"), "Cafe24 program enrollment sync missing");
assert(programAccess.includes("findValidCoursePurchase"), "program enrollment must reuse confirmed purchase rules");
assert(programAccess.includes("findRevokedCoursePurchase"), "program enrollment must react to refund/cancellation");
assert(programAccess.includes("status='withdrawn'"), "revoked purchase must withdraw program enrollment");
assert(programAccess.includes('PAYMENT_E2E_ORDER_ID = "20260925-0000013"'), "payment E2E Program must stay pinned to the dedicated source order");
assert(programAccess.includes('String(run.run_id) === PAYMENT_E2E_RUN_ID'), "payment E2E Program must use isolated source-order reconciliation");

assert(programAccess.includes("getProgramCommunityProjection"), "canonical community program projection missing");
assert(ticketRuntime.includes("getProgramCommunityProjection"), "community ticket redemption must include canonical program access");

assert(communityAccess.includes("syncMemberProgramSpaces"), "community program space projection missing");
assert(communityAccess.includes("'program_run'"), "program discussion spaces must be run-scoped");
assert(communityAccess.includes("program_participant"), "run spaces must be participant gated");
assert(communityAccess.includes("program_completed"), "alumni space must require completion");
assert(communityAccess.includes("access_status='revoked'"), "stale projected space access must be revoked");
assert(communityAccess.includes("moderation_role"), "creator/moderator projection missing");
assert(communityRuntime.includes("syncMemberProgramSpaces"), "community login must sync program space access");
assert(communityRuntime.includes("refreshAuthenticatedProgramAccess"), "authenticated community sessions must refresh program access");
assert(communityRuntime.includes("getCommunityIdentity"), "community refresh must use private RPC identity lookup");
assert(communityRuntime.includes("payment-e2e-space-status"), "community payment E2E projection status route missing");
assert(communityRuntime.includes("revokeProjectedProgramSpaces"), "community refresh must fail closed on source lookup failure");
assert(communityAccess.includes("revokeProjectedProgramSpaces"), "community fail-closed projection revocation helper missing");
assert(sessionAccessRefresh.includes("access_checked_at"), "community session access refresh migration missing");
assert(communitySchema.includes("0003_session_access_refresh.sql"), "runtime community schema must track access refresh migration");
assert(workerEntrypoint.includes("CommunityAuthRpc"), "course Worker private Community RPC entrypoint missing");
assert(workerEntrypoint.includes("getCommunityIdentity"), "course Worker Community identity RPC missing");
assert(workerEntrypoint.includes("getPaymentE2ECommunityIdentity"), "course Worker payment E2E Community RPC missing");

assert(admin.includes("program_enrollment"), "payment E2E inspection must expose Program enrollment");
assert(admin.includes("Program 참가권"), "payment E2E admin must show Program enrollment state");
assert(admin.includes("withdrawn"), "payment E2E must verify Program access withdrawal after refund");

assert(fulfillment.includes("CAFE24_CATEGORY_PROFILES"), "canonical Cafe24 category profiles missing");
assert(fulfillment.includes("categoryNo: 42"), "course category 42 mapping missing");
assert(fulfillment.includes("categoryNo: 43"), "ebook category 43 mapping missing");
assert(fulfillment.includes("categoryNo: 48"), "program category 48 mapping missing");
assert(fulfillment.includes("categoryNo: 53"), "physical category 53 mapping missing");
assert(fulfillment.includes('fulfillmentType: FULFILLMENT_TYPES.ENTITLEMENT'), "digital entitlement fulfillment mapping missing");
assert(fulfillment.includes('fulfillmentType: FULFILLMENT_TYPES.SHIPMENT'), "physical shipment fulfillment mapping missing");
assert(fulfillment.includes('shipping_method: "09"'), "digital Cafe24 no-shipping patch missing");
assert(fulfillment.includes("mixed_fulfillment_categories"), "mixed fulfillment category guard missing");
assert(fulfillmentMigration.includes("commerce_category_profiles"), "commerce fulfillment profile migration missing");
assert(fulfillmentMigration.includes("(42,'강의','course','entitlement',0"), "course fulfillment seed missing");
assert(fulfillmentMigration.includes("(43,'전자책','ebook','entitlement',0"), "ebook fulfillment seed missing");
assert(fulfillmentMigration.includes("(48,'프로그램','program','entitlement',0"), "program fulfillment seed missing");
assert(fulfillmentMigration.includes("(53,'일반상품','physical','shipment',1"), "physical fulfillment seed missing");
assert(programSchema.includes("0036_commerce_fulfillment_profiles.sql"), "runtime reconciler must apply commerce fulfillment profiles");
assert(programSchema.includes("0037_reconcile_all_course_product_fulfillment.sql"), "runtime reconciler must apply linked-course fulfillment reconciliation");
assert(systemOperations.includes("reconcile_all_course_product_fulfillment"), "linked-course fulfillment operation missing");
assert(systemOperations.includes("Course fulfillment verification failed"), "linked-course fulfillment must fail closed on shipping drift");
assert(systemOperations.includes("Course category verification failed"), "linked-course fulfillment must fail closed on category drift");
assert(programSchema.includes("0038_hide_digital_product_shipping_properties.sql"), "runtime reconciler must apply product-detail shipping visibility migration");
assert(programSchema.includes("0039_apply_digital_product_detail_ux.sql"), "runtime reconciler must apply digital product detail UX migration");
assert(systemOperations.includes("apply_digital_product_detail_ux"), "digital product detail UX operation missing");
assert(fulfillment.includes("DIGITAL_PRODUCT_UX_MARKER"), "digital product UX marker missing");
assert(fulfillment.includes("결제 후 바로 이용할 수 있습니다."), "digital post-purchase guidance missing");
assert(production.includes("/system-check/digital-product-ux-status"), "digital product UX status route missing");
assert(systemOperations.includes("hide_digital_product_shipping_properties"), "digital product shipping-property operation missing");
assert(systemOperations.includes("products_properties_before_digital_shipping_hide"), "Cafe24 product-property snapshot missing");
assert(systemOperations.includes('display: "F"'), "digital shipping fields must be hidden");
assert(systemOperations.includes("all_shipping_properties_hidden"), "shipping-property visibility verification missing");
assert(production.includes("/system-check/product-detail-properties-status"), "product-detail property visibility status route missing");


assert(admin.includes("ensureCafe24CourseDigitalProfile"), "course admin must enforce digital fulfillment profile");
assert(admin.includes("digitalCafe24ProductPatch"), "course admin must use canonical digital Cafe24 patch");
assert(admin.includes("강의 상품의 배송 없음 설정을 확인하지 못했습니다."), "course sales must fail closed when no-shipping verification fails");
assert(router.includes('url.pathname === "/my-space"'), "digital My Space route missing");
assert(router.includes("구매하거나 신청한 디지털 콘텐츠와 프로그램을 이곳에서 바로 이용합니다."), "My Space digital post-purchase UX missing");
assert(!router.includes("주문 배송상태를 찾을 필요 없이"), "customer My Space must not mention shipping-state workflow");

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
assert(
  communityProductionConfig.services?.some((service) =>
    service.binding === "AUTH_BRIDGE" &&
    service.service === "neverjustsell-course-access" &&
    service.entrypoint === "CommunityAuthRpc"
  ),
  "production Community AUTH_BRIDGE must use the private RPC entrypoint"
);
assert(
  communityDefaultConfig.services?.some((service) =>
    service.binding === "AUTH_BRIDGE" &&
    service.service === "neverjustsell-course-access" &&
    service.entrypoint === "CommunityAuthRpc"
  ),
  "default Community AUTH_BRIDGE must use the private RPC entrypoint"
);

assert(workerDeploy.includes("migration-health"), "course deploy must reconcile schema through runtime binding");
assert(!workerDeploy.includes('"migrations",\n    "apply"'), "course deploy must not depend on D1 management API");
assert(communityDeploy.includes("/auth/db-health"), "community deploy must reconcile schema through runtime binding");
assert(!communityDeploy.includes('"d1"'), "community deploy must not depend on D1 management API");

console.log("PASS: creator-reader program and community operating scaffold");

assert(!systemOperations.includes('undone: "F"'), "awaiting-refund transition must not send undone=F to Cafe24");

assert(programSchema.includes("0049_supersede_incorrect_awaiting_refund_transition.sql"), "runtime reconciler must retire the incorrect cancellation-change refund transition");
assert(programSchema.includes("0050_begin_payment_e2e_customer_refund.sql"), "runtime reconciler must start Cafe24 native refund processing");
assert(systemOperations.includes("begin_payment_e2e_customer_refund"), "native refund-pending operation missing");
assert(systemOperations.includes('status: "canceling"'), "native refund-pending operation must use Cafe24 canceling status");
assert(systemOperations.includes('reason: "NEVER JUST SELL 고객 취소 승인 후 환불 대기 E2E"'), "refund-pending operation must stay scoped to the dedicated E2E path");
assert(systemOperations.includes('"/cancellation/" + encodeURIComponent(claimCode)'), "refund processing must read Cafe24 cancellation detail");
assert(systemOperations.includes('refund_method_code: ["T"]'), "bank-deposit refund processing must explicitly use Cafe24 cash refund");
assert(systemOperations.includes("findStringByKeyDeep"), "refund processing must recover nested Cafe24 cancellation data without guessing");
assert(systemOperations.includes("cancellation_detail_refund_bank_code_present"), "claim diagnostics must report bank-code availability without exposing the value");
assert(systemOperations.includes("CAFE24_REFUND_BANK_CODE_BY_NAME"), "Cafe24 official refund bank code table must be embedded for missing-code recovery");
assert(systemOperations.includes('return CAFE24_REFUND_BANK_CODE_BY_NAME.get(normalized) || "bank_m"'), "unmatched stored bank names must use Cafe24 official direct-input code");
assert(systemOperations.includes("refund_bank_code_resolvable_from_name"), "claim diagnostics must verify bank-code recovery without exposing bank details");

assert(programSchema.includes("0051_delegate_refund_workflow_to_cafe24.sql"), "runtime reconciler must retire custom Cafe24 refund mutation jobs");

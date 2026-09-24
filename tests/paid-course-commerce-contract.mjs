import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const seed = await readFile(
  new URL("../worker/migrations/0008_seed_paid_courses.sql", import.meta.url),
  "utf8"
);
assert(seed.includes("'naver-search-algorithm'"), "search algorithm paid course seed missing");
assert(seed.includes("'naver-keyword-strategy'"), "keyword strategy paid course seed missing");
assert(seed.includes("'maxjagga'"), "paid course owner seed missing");
assert(seed.includes("'paid'"), "paid access type missing");


const e2eSeed = await readFile(
  new URL("../worker/migrations/0011_seed_payment_e2e_fixture.sql", import.meta.url),
  "utf8"
);
assert(e2eSeed.includes("'system-check-paid-course'"), "payment E2E D1 fixture missing");
assert(e2eSeed.includes("1227604364"), "payment E2E Vimeo fixture 1 missing");
assert(e2eSeed.includes("1227604365"), "payment E2E Vimeo fixture 2 missing");
assert(e2eSeed.includes("'system_check'"), "payment E2E fixture must remain outside public catalog");

const entitlements = await readFile(
  new URL("../worker/migrations/0009_course_entitlements.sql", import.meta.url),
  "utf8"
);
assert(entitlements.includes("CREATE TABLE IF NOT EXISTS course_entitlements"), "entitlement ledger migration missing");
assert(entitlements.includes("'active','revoked'"), "entitlement revocation state missing");

const admin = await readFile(
  new URL("../worker/src/course-admin.js", import.meta.url),
  "utf8"
);
assert(admin.includes("Cafe24 상품 생성 · 연결"), "Cafe24 product creation action missing");
assert(admin.includes("createCafe24CourseProductById(id, env)"), "paid course creation must auto-create hidden Cafe24 product");
assert(admin.includes("Cafe24 관리자 권한 재연결이 필요합니다."), "Cafe24 write-scope recovery guidance missing");
assert(admin.includes("고급 · 기존 Cafe24 상품 연결"), "existing product link must remain recovery-only");
assert(admin.includes("linked_hidden"), "new course products must start hidden");
assert(admin.includes('display: "F"'), "new Cafe24 course product must start undisplayed");
assert(admin.includes('selling: "F"'), "new Cafe24 course product must start not selling");
assert(admin.includes('stateButton("presale", "사전판매")'), "paid course presale control missing");
assert(admin.includes('stateButton("selling", "판매 중"'), "paid course selling control missing");
assert(admin.includes('stateButton("paused", "판매 중단")'), "paid course pause control missing");
assert(admin.includes('stateButton("preparing", "준비 중")'), "paid course preparing control missing");
assert(admin.includes("결제 E2E 테스트"), "isolated payment E2E admin panel missing");
assert(admin.includes("updatePaymentE2ETest"), "payment E2E control handler missing");
assert(admin.includes("inspectPaymentE2EOrder"), "order-level E2E inspector missing");
assert(admin.includes("source_order_id=?"), "E2E inspector must join D1 entitlement by source order");
assert(admin.includes("주문번호 검증"), "E2E order verification UI missing");
assert(admin.includes("catalog_visible"), "course admin must manage catalog visibility separately from publishing");
assert(admin.includes('tabLink("students", "수강생")'), "course admin student tab missing");
assert(admin.includes("listCourseStudents"), "student list query missing");
assert(admin.includes("studentManagementPanel"), "student management UI missing");
assert(admin.includes("source_order_id"), "student management must expose source order");
assert(admin.includes("progress_percent"), "student management must calculate learning progress");
assert(admin.includes("취소·환불"), "student management must show cancellation/refund state");
assert(admin.includes("loadCourseStudentDetail"), "student detail loader missing");
assert(admin.includes("studentDetailPanel"), "student detail UI missing");
assert(admin.includes("course_entitlement_events"), "student detail must expose entitlement history");
assert(admin.includes("차시별 학습 진도"), "student detail progress table missing");
assert(admin.includes("수동 수강권 부여"), "manual grant UI missing");
assert(admin.includes("수동 수강권 회수"), "manual revoke UI missing");
assert(admin.includes("수강기간 저장"), "manual access expiry control missing");
assert(admin.includes("course_access_admin_log"), "manual access admin log missing");
assert(admin.includes("Cafe24 구매 수강권은 주문 취소·환불로 관리해 주세요."), "purchase entitlements must not be manually revoked");
assert(admin.includes("updateManualCourseAccess"), "manual access handler missing");
assert(admin.includes("reorderCurriculum"), "curriculum reorder handler missing");
assert(admin.includes("curriculum-group"), "compact curriculum group UI missing");
assert(admin.includes("lesson-drag"), "lesson drag handle missing");
assert(admin.includes("module-drag"), "module drag handle missing");
assert(admin.includes("data-curriculum-status"), "curriculum autosave status missing");
assert(admin.includes("/course-admin/api/curriculum/reorder"), "curriculum reorder API route missing");
assert(admin.includes("refreshCurriculumDisplay"), "curriculum display refresh missing");
assert(admin.includes("미리보기 지정"), "preview designation status badge missing");
assert(admin.includes("영상 연결됨"), "video connection status badge missing");
assert(admin.includes("비구매자에게 무료 미리보기 공개"), "course admin preview publication control missing");
assert(admin.includes("강의가 게시된 상태에서만 공개 재생됩니다."), "preview publication warning missing");
assert(admin.includes('tabLink("landing", "판매 페이지")'), "course sales page admin tab missing");
assert(admin.includes("updateCourseSalesPage"), "course sales page save handler missing");
assert(admin.includes("강사 소개"), "course sales page instructor editor missing");
assert(admin.includes("이런 분께 추천합니다"), "course sales page audience editor missing");
assert(admin.includes("이 강의에서 배우는 내용"), "course sales page outcomes editor missing");
assert(admin.includes("환불 기준은 자동 생성하지 않습니다."), "refund policy must not be auto-generated");
assert(admin.includes('url.searchParams.get("student")'), "student detail route query missing");
assert(admin.includes("price: 1000"), "payment E2E test must use a 1,000 KRW bank-transfer order");
assert(admin.includes("e2e_selling_member_only"), "payment E2E selling state missing");
assert(admin.includes("display: \"F\""), "payment E2E must configure policy while hidden");
assert(admin.includes('buy_limit_by_product: "T"'), "sales activation must enforce customer-only purchase restriction");
assert(admin.includes('buy_limit_type: "M"'), "sales activation must require a customer account");
assert(admin.includes("selling_member_only"), "member-only selling state must be persisted");
assert(admin.includes("Cafe24 회원 전용 구매 설정을 확인하지 못해 판매 상태를 변경하지 않았습니다."), "sales activation must fail closed when member-only policy cannot be verified");
assert(!admin.includes('repurchase_restriction: "T"'), "repurchase restriction remains intentionally deferred until its Cafe24 prerequisites are verified");
assert(admin.includes('shipping_method: "09"'), "digital course must use no-delivery shipping method");
assert(!admin.includes('use_naverpay: "F"'), "course product must not force Naver Pay setting");
const adminApi = await readFile(
  new URL("../worker/src/session-orders.js", import.meta.url),
  "utf8"
);
assert(adminApi.includes("Request parameter"), "Cafe24 write request wrapper fallback missing");
assert(adminApi.includes("send({ request: init.body })"), "Cafe24 request wrapper retry missing");

const router = await readFile(
  new URL("../worker/src/router.js", import.meta.url),
  "utf8"
);
assert(router.includes("isPublicPreviewLesson"), "public preview access predicate missing");
assert(router.includes('course.status === "published"'), "preview must require a published course");
assert(router.includes("lesson.isPreview"), "preview must require a designated lesson");
assert(router.includes('["ready", "published"]'), "preview must require a ready lesson");
assert(router.includes("renderPublicPreview"), "public preview player missing");
assert(router.includes("?preview="), "public preview lesson URL missing");
assert(router.includes("이 차시는 공개 미리보기가 아닙니다."), "locked lesson direct preview guard missing");
assert(router.includes("contentPublished"), "course entry must require published content");
assert(router.includes("수강 준비 중"), "entitled but unpublished course state missing");
assert(router.includes("courseSalesState"), "explicit course sales state resolver missing");
assert(router.includes("사전판매 구매하기"), "presale purchase CTA missing");
assert(router.includes("판매 중단"), "paused sales CTA missing");
assert(router.includes("기존 수강생의 수강권은 유지됩니다."), "paused sales state must preserve existing access messaging");
assert(router.includes("renderSalesListSection"), "sales page list renderer missing");
assert(router.includes("renderInstructorSection"), "sales page instructor section missing");
assert(router.includes("sales-layout"), "sales page layout missing");
assert(router.includes("수강 이용 안내"), "sales page access information missing");
assert(router.includes("환불 안내"), "sales page refund information missing");
assert(router.includes("수강을 시작하시겠습니까?"), "sales page bottom CTA missing");
assert(router.includes("showTitle: false"), "sales page curriculum heading should not be duplicated");


const access = await readFile(
  new URL("../worker/src/access.js", import.meta.url),
  "utf8"
);
assert(access.includes("persistEntitlement"), "paid entitlement persistence missing");
assert(access.includes("status='revoked'"), "paid entitlement revocation persistence missing");
assert(access.includes("course_entitlement_events"), "entitlement changes must be recorded");
assert(access.includes('"restored"'), "restored entitlement event missing");
assert(access.includes('"revoked"'), "revoked entitlement event missing");
assert(access.includes("manualAccessDecision"), "manual entitlement access decision missing");
assert(access.includes("access_expires_at"), "manual entitlement expiry check missing");
assert(access.includes('"manual_entitlement"'), "manual entitlement access reason missing");
assert(access.includes("expireManualEntitlement"), "expired manual entitlement revocation missing");
assert(access.includes("manualProductNos"), "manual entitlements must be included in My Courses");

const entitlementEvents = await readFile(
  new URL("../worker/migrations/0015_course_entitlement_events.sql", import.meta.url),
  "utf8"
);
assert(entitlementEvents.includes("CREATE TABLE IF NOT EXISTS course_entitlement_events"), "entitlement event migration missing");
assert(entitlementEvents.includes("backfill-granted"), "existing entitlement grant history must be backfilled");
assert(entitlementEvents.includes("backfill-revoked"), "existing revoked history must be backfilled");

const manualAccessMigration = await readFile(
  new URL("../worker/migrations/0016_manual_course_access.sql", import.meta.url),
  "utf8"
);
assert(manualAccessMigration.includes("ALTER TABLE course_entitlements ADD COLUMN access_expires_at"), "manual access expiry migration missing");
assert(manualAccessMigration.includes("CREATE TABLE IF NOT EXISTS course_access_admin_log"), "manual access admin log migration missing");
assert(manualAccessMigration.includes("previous_expires_at"), "manual access audit must preserve previous expiry");
assert(manualAccessMigration.includes("new_expires_at"), "manual access audit must preserve new expiry");

const salesPageMigration = await readFile(
  new URL("../worker/migrations/0017_course_sales_page_content.sql", import.meta.url),
  "utf8"
);
assert(salesPageMigration.includes("instructor_name"), "course sales page instructor field migration missing");
assert(salesPageMigration.includes("target_audience"), "course sales page audience field migration missing");
assert(salesPageMigration.includes("learning_outcomes"), "course sales page outcomes field migration missing");
assert(salesPageMigration.includes("access_info"), "course sales page access information migration missing");
assert(salesPageMigration.includes("refund_policy_text"), "course sales page refund policy migration missing");

const courseStore = await readFile(
  new URL("../worker/src/course-store.js", import.meta.url),
  "utf8"
);
assert(courseStore.includes("instructor_name"), "course store must expose sales page content");
assert(courseStore.includes("refund_policy_text"), "course store must expose refund policy content");
assert(courseStore.includes("sales_state"), "course store must expose explicit sales state");

const salesStateMigration = await readFile(
  new URL("../worker/migrations/0018_course_sales_state.sql", import.meta.url),
  "utf8"
);
assert(salesStateMigration.includes("'preparing','presale','selling','paused'"), "course sales state enum migration missing");
assert(salesStateMigration.includes("WHEN sales_enabled=1 THEN 'selling'"), "existing active sales state backfill missing");
assert(salesStateMigration.includes("cafe24_sync_status IN ('paused_hidden','e2e_hidden')"), "paused sales state backfill missing");

console.log("PASS: paid course commerce and entitlement scaffold");

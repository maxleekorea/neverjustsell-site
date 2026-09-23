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
assert(admin.includes("판매 시작"), "paid course sales activation control missing");
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
assert(admin.includes('url.searchParams.get("student")'), "student detail route query missing");
assert(admin.includes("price: 1000"), "payment E2E test must use a 1,000 KRW bank-transfer order");
assert(admin.includes("e2e_selling_member_only"), "payment E2E selling state missing");
assert(admin.includes("display: \"F\""), "payment E2E must configure policy while hidden");
assert(admin.includes('buy_limit_by_product: "T"'), "sales activation must enforce customer-only purchase restriction");
assert(admin.includes('buy_limit_type: "M"'), "sales activation must require a customer account");
assert(admin.includes("selling_member_only"), "member-only selling state must be persisted");
assert(admin.includes("Cafe24 회원 전용 구매 설정을 확인하지 못해 판매를 시작하지 않았습니다."), "sales activation must fail closed when member-only policy cannot be verified");
assert(!admin.includes('repurchase_restriction: "T"'), "repurchase restriction remains intentionally deferred until its Cafe24 prerequisites are verified");
assert(admin.includes('shipping_method: "09"'), "digital course must use no-delivery shipping method");
assert(!admin.includes('use_naverpay: "F"'), "course product must not force Naver Pay setting");
const adminApi = await readFile(
  new URL("../worker/src/session-orders.js", import.meta.url),
  "utf8"
);
assert(adminApi.includes("Request parameter"), "Cafe24 write request wrapper fallback missing");
assert(adminApi.includes("send({ request: init.body })"), "Cafe24 request wrapper retry missing");

const access = await readFile(
  new URL("../worker/src/access.js", import.meta.url),
  "utf8"
);
assert(access.includes("persistEntitlement"), "paid entitlement persistence missing");
assert(access.includes("status='revoked'"), "paid entitlement revocation persistence missing");
assert(access.includes("course_entitlement_events"), "entitlement changes must be recorded");
assert(access.includes('"restored"'), "restored entitlement event missing");
assert(access.includes('"revoked"'), "revoked entitlement event missing");

const entitlementEvents = await readFile(
  new URL("../worker/migrations/0015_course_entitlement_events.sql", import.meta.url),
  "utf8"
);
assert(entitlementEvents.includes("CREATE TABLE IF NOT EXISTS course_entitlement_events"), "entitlement event migration missing");
assert(entitlementEvents.includes("backfill-granted"), "existing entitlement grant history must be backfilled");
assert(entitlementEvents.includes("backfill-revoked"), "existing revoked history must be backfilled");

console.log("PASS: paid course commerce and entitlement scaffold");

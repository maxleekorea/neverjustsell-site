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

console.log("PASS: paid course commerce and entitlement scaffold");

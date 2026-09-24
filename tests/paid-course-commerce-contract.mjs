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
assert(!admin.includes("/course-admin/presale-schedule"), "presale scheduling UI and route must stay removed");
assert(!admin.includes("/course-admin/course-access-policy"), "standard VOD policy must not require per-course admin editing");
assert(admin.includes("일반 유료 VOD는 별도 설정 없이 이 정책을 자동 적용합니다."), "fixed standard VOD policy summary missing");
assert(admin.includes("다음 할 일"), "course admin next-action guide missing");
assert(admin.includes("기존 Vimeo 영상 연결"), "existing Vimeo video must be linkable to an existing lesson");
assert(admin.includes("/course-admin/api/vimeo/link"), "direct existing Vimeo lesson-link API missing");
assert(admin.includes("linkExistingVimeoVideo"), "existing Vimeo lesson-link handler missing");
assert(admin.includes("linked_to"), "Vimeo library must expose reuse information");
assert(admin.includes("재사용"), "Vimeo reuse must be visible in the admin UI");
assert(admin.includes("짧은 사전판매가 필요하면"), "manual short-presale guidance missing");
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
assert(admin.includes("mandatory-preview-badge"), "mandatory preview drag-state badge missing");
assert(admin.includes("additional-preview-toggle"), "additional preview toggle missing after reorder");
assert(admin.includes("1차시 무료"), "mandatory first-lesson preview badge missing");
assert(admin.includes("추가 미리보기"), "additional preview badge missing");
assert(admin.includes("영상 연결됨"), "video connection status badge missing");
assert(admin.includes("1차시는 의무 무료 미리보기"), "mandatory first-lesson preview control missing");
assert(admin.includes("이 차시도 추가 무료 미리보기로 공개"), "additional preview control missing");
assert(admin.includes("OT·소개가 아니라 실제 강의 품질을 판단할 수 있는 본강의를 배치하세요."), "mandatory preview substantive-lesson guidance missing");
assert(admin.includes("강의가 게시된 상태에서만 공개 재생됩니다."), "preview publication warning missing");
assert(admin.includes('tabLink("landing", "판매 페이지")'), "course sales page admin tab missing");
assert(admin.includes('activeTab = "basic"'), "course editor must default to the basic-information step");
assert(admin.includes('selectedTab || "basic"'), "selected real course must open on the basic-information step");
assert(admin.includes("&tab=basic"), "course list management links must start from the basic-information step");
assert(admin.includes("가격 미정"), "paid courses with no confirmed price must not be displayed as free");
assert(admin.includes("salesPageReady"), "five-step flow must include sales-page readiness");
assert(admin.includes("판매 페이지를 작성하세요"), "next-action guidance must route to the sales-page step");
assert(admin.includes("판매가를 입력하고 기본 정보를 확인하세요"), "paid course readiness must detect an unset price");
assert(admin.includes("updateCourseSalesPage"), "course sales page save handler missing");
assert(admin.includes("강사 소개"), "course sales page instructor editor missing");
assert(admin.includes("이런 분께 추천합니다"), "course sales page audience editor missing");
assert(admin.includes("이 강의에서 배우는 내용"), "course sales page outcomes editor missing");
assert(admin.includes("이용·환불 안내는 자동 적용"), "sales page must explain automatic policy content");
assert(!admin.includes('name="access_info"'), "standard access policy must not be manually edited on sales page");
assert(!admin.includes('name="refund_policy_text"'), "standard refund policy must not be manually edited on sales page");
assert(admin.includes("access_duration_days"), "standard VOD access duration data missing");
assert(admin.includes("refund_policy_version"), "refund policy version data missing");
assert(admin.includes("watched_seconds"), "student detail watched seconds missing");
assert(admin.includes("누적 시청"), "student detail watch-time summary missing");
assert(admin.includes("구매 당시 조건"), "purchase snapshot admin section missing");
assert(admin.includes("환불 참고 계산"), "usage-based refund estimate panel missing");
assert(admin.includes("paid_usage_ratio"), "paid-content usage ratio calculation missing");
assert(admin.includes("suggested_refund_krw"), "suggested refund amount calculation missing");
assert(admin.includes("Math.min(duration, watched)"), "refund usage must cap repeated watch time at lesson duration");
assert(admin.includes("index > 0 && Number(row.is_preview || 0) !== 1"), "mandatory and additional previews must be excluded from refund usage");
assert(admin.includes("최소 한 개의 유료 차시가 필요합니다."), "paid course must retain paid content after mandatory preview");
assert(admin.includes("DEFAULT_PAID_ACCESS_DAYS = 180"), "new paid VOD default duration must be 180 days");
assert(admin.includes("access_duration_days=CASE WHEN ?='paid' THEN ?"), "paid courses must always use the standard duration");
assert(admin.includes("DEFAULT_REFUND_POLICY_TEXT"), "paid courses must always use the standard refund policy");
assert(admin.includes('"fair-trust-v1.0"'), "new paid VOD policy version default missing");
assert(!admin.includes("|| items[0] || null"), "student detail must not infer an unrelated order item");
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
assert(router.includes("mandatoryFirstLesson"), "first paid lesson must be an effective public preview");
assert(router.includes("Number(lessonIndex) === 0"), "mandatory preview must follow current lesson order");
assert(router.includes("FIRST LESSON · FREE PREVIEW"), "mandatory first preview player label missing");
assert(router.includes("첫 차시 무료"), "mandatory first preview curriculum badge missing");
assert(router.includes("추가 미리보기"), "additional preview curriculum badge missing");
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
assert(!router.includes("presaleScheduleText"), "public course pages must not depend on presale scheduling");
assert(!router.includes("promoteScheduledPresales"), "course page requests must not mutate presale state");
assert(router.includes("renderSalesListSection"), "sales page list renderer missing");
assert(router.includes("renderInstructorSection"), "sales page instructor section missing");
assert(router.includes("sales-layout"), "sales page layout missing");
assert(router.includes("수강 이용 안내"), "sales page access information missing");
assert(router.includes("환불 안내"), "sales page refund information missing");
assert(router.includes("수강을 시작하시겠습니까?"), "sales page bottom CTA missing");
assert(router.includes("showTitle: false"), "sales page curriculum heading should not be duplicated");
assert(router.includes("formatAccessDuration"), "sales page structured access duration missing");
assert(router.includes('course.access_type === "paid"'), "paid policy sections must be gated from free course pages");
assert(router.includes("수강기간 "), "sales page access duration label missing");
assert(router.includes("learning-player"), "authenticated Vimeo player tracking hook missing");
assert(router.includes("player-tracking.js"), "learning player tracker route missing");
assert(router.includes("/classroom/progress/watch"), "watch progress endpoint missing");
assert(router.includes("watched_delta_seconds"), "watch-time delta payload missing");
assert(router.includes("step>0&&step<=3"), "watch tracker must ignore large seek jumps");


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
assert(access.includes("coursePurchaseSnapshot"), "purchase policy snapshot lookup missing");
assert(access.includes("purchase_price_krw"), "purchase price snapshot persistence missing");
assert(access.includes("purchased_at"), "purchase date snapshot persistence missing");
assert(access.includes("policy_version"), "policy version snapshot persistence missing");
assert(access.includes("refund_policy_snapshot"), "refund policy text snapshot persistence missing");
assert(access.includes("access_duration_days_snapshot"), "access duration snapshot persistence missing");
assert(access.includes("payment_amount"), "Cafe24 item payment amount snapshot source missing");
assert(access.includes("purchaseAccessPeriod"), "purchase-date access period calculation missing");
assert(access.includes("days - 1"), "180-day access period must be inclusive from purchase date");
assert(access.includes("purchaseEntitlementExpired"), "purchase entitlement expiry check missing");
assert(access.includes("expirePurchaseEntitlement"), "purchase entitlement expiry persistence missing");
assert(access.includes('"구매 수강기간 만료"'), "purchase expiry event reason missing");
assert(access.includes("findValidCoursePurchase"), "latest valid repurchase resolution missing");
assert(access.includes("candidates.sort"), "valid purchases must prefer the latest order");


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
assert(!courseStore.includes("promoteScheduledPresales"), "scheduled presale promotion must stay removed");
assert(courseStore.includes("recordLessonWatch"), "lesson watch-time persistence function missing");
assert(courseStore.includes("watched_seconds=lesson_progress.watched_seconds+excluded.watched_seconds"), "watch-time accumulation missing");
assert(courseStore.includes("Math.min(30"), "watch-time server delta cap missing");
assert(courseStore.includes("access_duration_days"), "course store must expose structured access duration");
assert(courseStore.includes("refund_policy_version"), "course store must expose policy version");

const salesStateMigration = await readFile(
  new URL("../worker/migrations/0018_course_sales_state.sql", import.meta.url),
  "utf8"
);
assert(salesStateMigration.includes("'preparing','presale','selling','paused'"), "course sales state enum migration missing");
assert(salesStateMigration.includes("WHEN sales_enabled=1 THEN 'selling'"), "existing active sales state backfill missing");
assert(salesStateMigration.includes("cafe24_sync_status IN ('paused_hidden','e2e_hidden')"), "paused sales state backfill missing");

const learningPolicyMigration = await readFile(
  new URL("../worker/migrations/0020_learning_policy_foundation.sql", import.meta.url),
  "utf8"
);
assert(learningPolicyMigration.includes("access_duration_days"), "course access duration migration missing");
assert(learningPolicyMigration.includes("refund_policy_version"), "refund policy version migration missing");
assert(learningPolicyMigration.includes("purchase_price_krw"), "purchase snapshot price migration missing");
assert(learningPolicyMigration.includes("refund_policy_snapshot"), "refund policy snapshot migration missing");
assert(learningPolicyMigration.includes("watched_seconds"), "watch-time migration missing");

const entitlementDurationMigration = await readFile(
  new URL("../worker/migrations/0021_entitlement_duration_snapshot.sql", import.meta.url),
  "utf8"
);
assert(entitlementDurationMigration.includes("access_duration_days_snapshot"), "entitlement duration snapshot migration missing");

const generalVodPolicyMigration = await readFile(
  new URL("../worker/migrations/0022_general_vod_policy_v1.sql", import.meta.url),
  "utf8"
);
assert(generalVodPolicyMigration.includes("access_duration_days=180"), "real paid courses must use 180-day access policy");
assert(generalVodPolicyMigration.includes("fair-trust-v1.0"), "real paid courses must use Fair-trust policy v1");
assert(generalVodPolicyMigration.includes("paid-naver-search-algorithm"), "first real paid course policy migration missing");
assert(generalVodPolicyMigration.includes("paid-naver-keyword-strategy"), "second real paid course policy migration missing");

const simpleAccessMigration = await readFile(
  new URL("../worker/migrations/0023_simple_purchase_date_access.sql", import.meta.url),
  "utf8"
);
assert(simpleAccessMigration.includes("결제일 기준 180일"), "real paid courses must explain simple purchase-date access period");


const realCurriculaMigration = await readFile(
  new URL("../worker/migrations/0024_seed_real_paid_course_curricula.sql", import.meta.url),
  "utf8"
);
assert(realCurriculaMigration.includes("naver-search-algorithm-01"), "real search-algorithm curriculum shell missing");
assert(realCurriculaMigration.includes("naver-keyword-strategy-01"), "real keyword-strategy curriculum shell missing");
assert(realCurriculaMigration.includes("NOT EXISTS"), "real curriculum seed must not overwrite an existing curriculum");
assert(realCurriculaMigration.includes("방법보다 방향이 먼저인 이유"), "search-algorithm free first lesson shell missing");
assert(realCurriculaMigration.includes("키워드를 보는 관점과 황금 키워드의 함정"), "keyword-strategy free first lesson shell missing");


const fastTestMediaMigration = await readFile(
  new URL("../worker/migrations/0026_reuse_vimeo_for_real_paid_course_test.sql", import.meta.url),
  "utf8"
);
assert(fastTestMediaMigration.includes("1227604364"), "real paid course test video 1 missing");
assert(fastTestMediaMigration.includes("1227604365"), "real paid course test video 2 missing");
assert(fastTestMediaMigration.includes("naver-search-algorithm-04"), "all real search-algorithm test lessons must be video-linked");

const realSalesPageMigration = await readFile(
  new URL("../worker/migrations/0025_seed_real_paid_course_sales_pages.sql", import.meta.url),
  "utf8"
);
assert(realSalesPageMigration.includes("NULLIF(TRIM(instructor_name),'')"), "real sales-page seed must preserve manual instructor edits");
assert(realSalesPageMigration.includes("NULLIF(TRIM(target_audience),'')"), "real sales-page seed must preserve manual audience edits");
assert(realSalesPageMigration.includes("paid-naver-search-algorithm"), "search-algorithm sales-page seed missing");
assert(realSalesPageMigration.includes("paid-naver-keyword-strategy"), "keyword-strategy sales-page seed missing");
assert(realSalesPageMigration.includes("맥작가"), "real paid course instructor seed missing");
assert(realSalesPageMigration.includes("검색·콘텐츠·브랜드가 선순환"), "search-algorithm learning outcome seed missing");
assert(realSalesPageMigration.includes("브랜드 자산으로 확장"), "keyword-strategy learning outcome seed missing");


const productionWorker = await readFile(
  new URL("../worker/src/production.js", import.meta.url),
  "utf8"
);
assert(!productionWorker.includes("async scheduled"), "course Worker should not need a presale cron");

const wranglerConfig = await readFile(
  new URL("../worker/wrangler.jsonc", import.meta.url),
  "utf8"
);
assert(!wranglerConfig.includes('"crons"'), "course Worker should not carry presale cron triggers");

console.log("PASS: paid course commerce and entitlement scaffold");

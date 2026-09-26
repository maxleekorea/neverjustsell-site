import { getCustomerSession } from "./session-orders.js";
import { getCatalogD1Course, isCourseEnrolled } from "./course-store.js";
import { getCourseAccessDecision } from "./access.js";
import { CLASSROOM_ORIGIN } from "./config.js";

const DISCUSSION_VERSION = "2026-09-26-lesson-discussion-v1";
const COURSE_SLUGS = {
  "paid-naver-search-algorithm": "naver-search-algorithm",
  "paid-naver-keyword-strategy": "naver-keyword-strategy"
};

const SEEDED_QA = [
  {
    id: "seed-q-search-01", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-01", order: 1,
    question: "오프라인 유통의 ‘입지’ 개념을 온라인 판매에서는 무엇으로 봐야 하나요?",
    answer: "온라인에서는 입지가 사라진 것이 아니라 형태가 바뀌었습니다. 검색 결과, 플랫폼 추천, 콘텐츠 노출, 브랜드 검색처럼 고객이 상품을 발견하는 위치가 온라인의 입지입니다. 그래서 단순히 상품을 등록하는 것보다 고객이 어디에서 발견하고 비교하는지를 먼저 봐야 합니다."
  },
  {
    id: "seed-q-search-02", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-02", order: 2,
    question: "1세대 쇼핑몰과 지금의 스마트스토어는 본질적으로 무엇이 가장 달라졌나요?",
    answer: "초기에는 판매자가 직접 트래픽을 만들어 자기 쇼핑몰로 데려오는 비중이 컸다면 지금은 플랫폼이 검색과 추천, 결제, 리뷰, 신뢰 장치를 함께 제공합니다. 대신 플랫폼 안에서 경쟁하는 만큼 플랫폼의 이해관계와 규칙을 이해해야 한다는 점이 더 중요해졌습니다."
  },
  {
    id: "seed-q-search-03", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-03", order: 3,
    question: "네이버와 쿠팡처럼 플랫폼마다 같은 상품의 판매 전략을 다르게 잡아야 하나요?",
    answer: "그렇습니다. 고객이 상품을 발견하고 비교하고 구매하는 맥락이 다르기 때문입니다. 같은 상품명과 같은 광고 운영을 그대로 복제하기보다 각 플랫폼에서 고객이 어떤 경로로 들어오고 무엇을 신뢰하는지부터 확인해야 합니다."
  },
  {
    id: "seed-q-search-04", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-04", order: 4,
    question: "네이버 쇼핑 검색에서 적합도와 인기도 중 무엇이 더 중요하나요?",
    answer: "둘을 따로 떼어 하나만 중요하다고 보기 어렵습니다. 검색어와 상품의 연결이 맞아야 후보가 되고, 그 뒤 실제 고객 반응과 판매 신호가 경쟁력을 만듭니다. 먼저 검색 의도에 맞는 상품 정보를 만들고 그 다음 고객 반응을 쌓는 순서로 보는 편이 실무적입니다."
  },
  {
    id: "seed-q-search-05", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-05", order: 5,
    question: "리워드 트래픽이나 슬롯 방식은 왜 장기 전략이 되기 어려운가요?",
    answer: "실제 구매 의도와 다른 행동을 인위적으로 섞으면 데이터 품질이 떨어지고 플랫폼이 탐지 규칙을 바꾸는 순간 효과가 사라질 수 있습니다. 더 큰 문제는 중단했을 때 고객, 검색 자산, 브랜드 같은 것이 남지 않는다는 점입니다."
  },
  {
    id: "seed-q-search-06", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-06", order: 6,
    question: "인포먼스 마케팅은 콘텐츠 마케팅과 무엇이 다른가요?",
    answer: "콘텐츠 자체를 만드는 데서 끝나지 않고 검색, 광고, 콘텐츠, 브랜드 검색, 재방문을 하나의 유입 구조로 연결해서 봅니다. 퍼포먼스의 즉시성과 인바운드의 축적성을 함께 활용해 고객 접점이 반복되는 구조를 만드는 것이 핵심입니다."
  },
  {
    id: "seed-q-search-07", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-07", order: 7,
    question: "검색량이 낮은 키워드도 실제로 좋은 키워드가 될 수 있나요?",
    answer: "가능합니다. 검색량보다 구매 의도가 얼마나 구체적인지가 더 중요할 때가 많습니다. 작은 검색량이라도 상품과 고객 상황이 정확하게 맞고 경쟁이 덜하다면 전환이 높을 수 있습니다. 여러 롱테일 수요를 합치면 의미 있는 시장이 되기도 합니다."
  },
  {
    id: "seed-q-search-08", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-08", order: 8,
    question: "브랜드 키워드는 처음부터 검색량이 없는데 왜 만들어야 하나요?",
    answer: "기존 검색량을 가져오는 키워드와 기억을 만들어 새 검색을 발생시키는 브랜드 키워드는 역할이 다릅니다. 고객이 이름을 기억하고 다시 검색하기 시작하면 경쟁 상품과 직접 비교되는 비율을 줄이고 콘텐츠와 재구매를 연결할 수 있습니다."
  },
  {
    id: "seed-q-search-09", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-09", order: 9,
    question: "검색 알고리즘을 기술적으로 완전히 알아야 판매 전략을 세울 수 있나요?",
    answer: "내부 수식을 알아야 하는 것은 아닙니다. 어떤 정보를 입력값으로 받고 어떤 고객 반응을 좋은 결과로 보는지 이해하는 정도면 충분합니다. 공개된 규칙과 실제 검색 결과를 관찰하면서 가설을 검증하는 능력이 더 중요합니다."
  },
  {
    id: "seed-q-search-10", courseId: "paid-naver-search-algorithm", lessonId: "naver-search-algorithm-10", order: 10,
    question: "키워드 도구에서 숫자를 보기 전에 무엇을 먼저 해야 하나요?",
    answer: "상품이 해결하는 문제, 사용하는 상황, 대상 고객, 핵심 속성을 먼저 언어로 풀어보는 것이 좋습니다. 그 다음 자동완성, 연관검색, 경쟁 상품, 리뷰 문장을 보면서 실제 고객이 어떤 표현을 쓰는지 대조하면 숫자를 훨씬 정확하게 해석할 수 있습니다."
  },
  {
    id: "seed-q-keyword-01", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-01", order: 1,
    question: "검색량이 높고 경쟁이 낮은 ‘황금 키워드’를 찾는 방식이 왜 위험한가요?",
    answer: "검색량과 경쟁도만 보면 그 검색어를 입력한 사람이 실제로 무엇을 원하는지 빠집니다. 숫자가 좋아 보여도 내 상품과 검색 의도가 맞지 않으면 노출과 클릭은 생겨도 구매가 나오지 않습니다. 키워드는 수치보다 맥락부터 봐야 합니다."
  },
  {
    id: "seed-q-keyword-02", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-02", order: 2,
    question: "같은 키워드라도 검색 의도가 다를 수 있다는 뜻인가요?",
    answer: "그렇습니다. 같은 단어도 정보 탐색, 비교, 구매, 문제 해결처럼 목적이 달라질 수 있습니다. 검색 결과에 어떤 유형의 문서와 상품이 주로 보이는지를 보면 검색엔진이 그 질의를 어떤 의도로 해석하는지 추정할 수 있습니다."
  },
  {
    id: "seed-q-keyword-03", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-03", order: 3,
    question: "상품명만 잘 쓰면 네이버 쇼핑 검색 노출이 해결되나요?",
    answer: "상품명은 중요한 입력 항목이지만 전부는 아닙니다. 카테고리, 속성, 태그, 브랜드, 주요 정보처럼 여러 필드가 함께 상품을 설명합니다. 서로 모순되지 않게 같은 상품 정의를 전달하는 것이 중요합니다."
  },
  {
    id: "seed-q-keyword-04", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-04", order: 4,
    question: "롱테일 키워드는 단순히 긴 검색어를 뜻하나요?",
    answer: "길이 자체가 핵심은 아닙니다. 수요가 더 구체적으로 나뉘고 구매 상황이 선명해지는 검색어 묶음을 롱테일 관점에서 보는 것이 좋습니다. 단어 수가 짧아도 특정 용도나 대상이 분명하면 롱테일 역할을 할 수 있습니다."
  },
  {
    id: "seed-q-keyword-05", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-05", order: 5,
    question: "붙여 쓰는 복합어와 띄어 쓰는 키워드는 검색에서 같은 것으로 봐도 되나요?",
    answer: "항상 같다고 가정하면 안 됩니다. 플랫폼의 형태소 처리와 키워드 사전, 카테고리 맥락에 따라 다르게 해석될 수 있습니다. 실제 검색 결과와 상품 노출을 직접 확인해 보는 검증 과정이 필요합니다."
  },
  {
    id: "seed-q-keyword-06", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-06", order: 6,
    question: "태그는 상품명에 넣지 못한 키워드를 전부 넣는 공간인가요?",
    answer: "그렇게 보면 과도하게 나열하기 쉽습니다. 태그도 상품과 실제로 관련 있는 표현을 보완하는 입력값으로 보는 편이 좋습니다. 상품명, 카테고리, 브랜드와 서로 다른 상품을 말하는 것처럼 구성하면 오히려 정보 일관성이 약해질 수 있습니다."
  },
  {
    id: "seed-q-keyword-07", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-07", order: 7,
    question: "내 상품이 특정 키워드에 반영됐는지 가장 확실하게 확인하는 방법은 무엇인가요?",
    answer: "등록 정보만 보고 반영됐다고 가정하지 말고 실제 검색 결과에서 상품 노출과 카테고리, 경쟁 상품을 확인해야 합니다. 조건을 하나씩 바꾸고 결과를 기록하면 어떤 입력이 영향을 주는지 훨씬 잘 보입니다."
  },
  {
    id: "seed-q-keyword-08", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-08", order: 8,
    question: "키워드보다 상품 정의를 먼저 하라는 이유가 무엇인가요?",
    answer: "상품이 누구에게 어떤 문제를 해결하는지 불분명하면 어떤 키워드를 붙여도 메시지가 흔들립니다. 문제, 기능, 상황, 대상, 감각을 먼저 정의하면 상품명과 상세페이지, 광고, 콘텐츠가 같은 방향을 바라보게 됩니다."
  },
  {
    id: "seed-q-keyword-09", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-09", order: 9,
    question: "전문용어를 쉬운 말로 바꾸면 검색 전문성이 떨어지지 않나요?",
    answer: "고객이 실제로 사용하는 말과 전문가가 내부에서 쓰는 말은 다를 수 있습니다. 전문성은 어려운 단어의 수가 아니라 정확한 문제 해결에서 나옵니다. 고객이 이해하고 기억할 수 있는 표현으로 번역해야 검색과 구매까지 이어질 가능성이 높아집니다."
  },
  {
    id: "seed-q-keyword-10", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-10", order: 10,
    question: "여러 장점을 한 이름에 넣으면 오히려 복잡해지지 않나요?",
    answer: "그래서 모든 장점을 넣는 것이 아니라 가장 중요한 두 요소 정도를 압축해야 합니다. 뜻을 짐작할 수 있고 발음이 자연스럽고 기억하기 쉬운지 검토해야 하며, 설명이 없으면 이해할 수 없는 조합은 다시 줄이는 편이 좋습니다."
  },
  {
    id: "seed-q-keyword-11", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-11", order: 11,
    question: "비유나 은유를 상품명에 쓰면 검색 키워드와 멀어지지 않나요?",
    answer: "기능 키워드를 완전히 버리라는 뜻이 아닙니다. 검색에서 발견될 정보는 상품 정보 구조에 남겨 두고, 기억과 차별화를 만드는 이름에는 장면과 감각을 활용할 수 있습니다. 발견용 언어와 기억용 언어의 역할을 나누는 방식입니다."
  },
  {
    id: "seed-q-keyword-12", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-12", order: 12,
    question: "좋은 줄임말이나 혼성어를 판단하는 기준이 있나요?",
    answer: "짧다는 이유만으로 좋은 이름은 아닙니다. 듣고 어느 정도 뜻을 짐작할 수 있는지, 소리 내기 쉬운지, 다른 의미와 충돌하지 않는지, 한 번 들은 뒤 다시 말할 수 있는지를 함께 봐야 합니다."
  },
  {
    id: "seed-q-keyword-13", courseId: "paid-naver-keyword-strategy", lessonId: "naver-keyword-strategy-13", order: 13,
    question: "브랜드 키워드가 AI 검색이나 AEO·GEO에도 실제로 도움이 되나요?",
    answer: "브랜드 이름만 만든다고 자동으로 도움이 되는 것은 아닙니다. 다만 일관된 이름 아래 정확한 설명, 사례, 출처, 고객 반응이 누적되면 검색엔진과 생성형 AI가 하나의 개체와 맥락으로 이해하기 쉬워집니다. 이름과 정보 축적을 함께 설계해야 합니다."
  }
];

let seedPromise = null;

function cleanText(value, max = 1600) {
  return String(value || "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraphs(value) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS course_discussions (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    author_member_id TEXT,
    author_label TEXT NOT NULL DEFAULT '수강생',
    source_type TEXT NOT NULL DEFAULT 'learner',
    question TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'course',
    status TEXT NOT NULL DEFAULT 'open',
    is_featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 999,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS course_discussion_replies (
    id TEXT PRIMARY KEY,
    discussion_id TEXT NOT NULL,
    author_member_id TEXT,
    author_label TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'staff',
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discussion_id) REFERENCES course_discussions(id) ON DELETE CASCADE
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_course_discussions_course ON course_discussions(course_id,visibility,status,sort_order,created_at DESC)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_course_discussions_lesson ON course_discussions(course_id,lesson_id,status,sort_order,created_at DESC)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_course_discussion_replies_discussion ON course_discussion_replies(discussion_id,status,created_at ASC)").run();
}

async function seedDiscussions(db) {
  for (const item of SEEDED_QA) {
    await db.prepare(`INSERT OR IGNORE INTO course_discussions
      (id,course_id,lesson_id,author_member_id,author_label,source_type,question,visibility,status,is_featured,sort_order)
      VALUES(?,?,?,NULL,'대표 질문','editorial',?,'public','answered',1,?)`
    ).bind(item.id, item.courseId, item.lessonId, item.question, item.order).run();
    await db.prepare(`INSERT OR IGNORE INTO course_discussion_replies
      (id,discussion_id,author_member_id,author_label,source_type,body,status)
      VALUES(?,?,NULL,'NJS 가이드','staff',?,'published')`
    ).bind(item.id.replace("seed-q-", "seed-a-"), item.id, item.answer).run();
  }
}

export async function ensureLessonDiscussionData(env) {
  if (!env?.COURSE_DB) return { ok: false, skipped: true, reason: "course_db_binding_missing" };
  if (!seedPromise) {
    seedPromise = (async () => {
      await ensureSchema(env.COURSE_DB);
      await seedDiscussions(env.COURSE_DB);
      return true;
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  await seedPromise;

  const rows = await env.COURSE_DB.prepare(`SELECT course_id,
    COUNT(*) AS question_count,
    SUM(CASE WHEN status='answered' THEN 1 ELSE 0 END) AS answered_count
    FROM course_discussions WHERE source_type='editorial' GROUP BY course_id`).all();
  const byCourse = Object.fromEntries((rows.results || []).map((row) => [row.course_id, {
    question_count: Number(row.question_count || 0),
    answered_count: Number(row.answered_count || 0)
  }]));
  const first = byCourse["paid-naver-search-algorithm"] || { question_count: 0, answered_count: 0 };
  const second = byCourse["paid-naver-keyword-strategy"] || { question_count: 0, answered_count: 0 };
  return {
    ok: first.question_count >= 10 && first.answered_count >= 10 && second.question_count >= 13 && second.answered_count >= 13,
    version: DISCUSSION_VERSION,
    total_seed_questions: first.question_count + second.question_count,
    total_seed_answers: first.answered_count + second.answered_count,
    courses: {
      "paid-naver-search-algorithm": first,
      "paid-naver-keyword-strategy": second
    }
  };
}

export async function listLessonDiscussions(env, { courseId, lessonId = null, limit = 50, publicOnly = false } = {}) {
  await ensureLessonDiscussionData(env);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
  const conditions = ["d.course_id=?", "d.status!='hidden'"];
  const bindings = [courseId];
  if (lessonId) {
    conditions.push("d.lesson_id=?");
    bindings.push(lessonId);
  }
  if (publicOnly) conditions.push("d.visibility='public'");
  bindings.push(safeLimit);

  const query = `SELECT d.id,d.course_id,d.lesson_id,d.author_label,d.source_type,d.question,d.visibility,d.status,d.is_featured,d.sort_order,d.created_at,
    c.slug AS course_slug,c.title AS course_title,l.title AS lesson_title
    FROM course_discussions d
    LEFT JOIN courses c ON c.id=d.course_id
    LEFT JOIN lessons l ON l.id=d.lesson_id AND l.course_id=d.course_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY d.is_featured DESC,d.sort_order ASC,d.created_at DESC LIMIT ?`;
  const result = await env.COURSE_DB.prepare(query).bind(...bindings).all();
  const discussions = result.results || [];
  if (!discussions.length) return [];

  const placeholders = discussions.map(() => "?").join(",");
  const replies = await env.COURSE_DB.prepare(`SELECT id,discussion_id,author_label,source_type,body,status,created_at
    FROM course_discussion_replies WHERE discussion_id IN (${placeholders}) AND status='published' ORDER BY created_at ASC`)
    .bind(...discussions.map((item) => item.id)).all();
  const replyMap = new Map();
  for (const reply of replies.results || []) {
    if (!replyMap.has(reply.discussion_id)) replyMap.set(reply.discussion_id, []);
    replyMap.get(reply.discussion_id).push(reply);
  }
  return discussions.map((item) => ({ ...item, replies: replyMap.get(item.id) || [] }));
}

export async function listPublicCourseQa(env, limit = 8) {
  await ensureLessonDiscussionData(env);
  const safeLimit = Math.max(1, Math.min(30, Number(limit) || 8));
  const result = await env.COURSE_DB.prepare(`SELECT d.id,d.course_id,d.lesson_id,d.question,d.sort_order,
    c.slug AS course_slug,c.title AS course_title,l.title AS lesson_title,
    (SELECT body FROM course_discussion_replies r WHERE r.discussion_id=d.id AND r.status='published' ORDER BY r.created_at ASC LIMIT 1) AS answer
    FROM course_discussions d
    JOIN courses c ON c.id=d.course_id
    JOIN lessons l ON l.id=d.lesson_id AND l.course_id=d.course_id
    WHERE d.visibility='public' AND d.status='answered' AND d.is_featured=1
    ORDER BY d.course_id,d.sort_order ASC LIMIT ?`).bind(safeLimit).all();
  return (result.results || []).map((row) => ({ ...row, course_slug: row.course_slug || COURSE_SLUGS[row.course_id] || "" }));
}

async function learnerHasAccess(request, env, course, memberId) {
  if (course.access_type === "public") return isCourseEnrolled(env, memberId, course.id);
  const productNo = Number(course.cafe24_product_no || 0);
  if (!productNo) return false;
  const decision = await getCourseAccessDecision(request, env, productNo, course.id);
  return Boolean(decision?.body?.access);
}

function safeReturnPath(value, fallback) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export async function handleLessonDiscussionPost(request, env) {
  const origin = String(request.headers.get("Origin") || "");
  if (origin && origin !== CLASSROOM_ORIGIN) return new Response("요청을 확인할 수 없습니다.", { status: 403 });
  const session = await getCustomerSession(request, env);
  const memberId = String(session?.record?.member_id || "").trim();
  if (!memberId) return Response.redirect(`${CLASSROOM_ORIGIN}/oauth/cafe24/customer/start`, 302);

  const form = await request.formData().catch(() => null);
  const courseSlug = cleanText(form?.get("course_slug"), 120);
  const lessonId = cleanText(form?.get("lesson_id"), 160);
  const question = cleanText(form?.get("question"), 1600);
  const fallback = `/classroom?course=${encodeURIComponent(courseSlug)}`;
  const returnTo = safeReturnPath(form?.get("return_to"), fallback);
  if (question.length < 5) return Response.redirect(new URL(returnTo, CLASSROOM_ORIGIN).toString(), 303);

  const course = await getCatalogD1Course(env, courseSlug);
  if (!course || !Array.isArray(course.lessons) || !course.lessons.some((lesson) => lesson.id === lessonId)) {
    return new Response("강의 또는 차시를 확인할 수 없습니다.", { status: 400 });
  }
  if (!(await learnerHasAccess(request, env, course, memberId))) {
    return new Response("현재 이 강의에 질문을 남길 수 없습니다.", { status: 403 });
  }

  await ensureLessonDiscussionData(env);
  const id = `learner-q-${crypto.randomUUID()}`;
  await env.COURSE_DB.prepare(`INSERT INTO course_discussions
    (id,course_id,lesson_id,author_member_id,author_label,source_type,question,visibility,status,is_featured,sort_order)
    VALUES(?,?,?,?,'수강생','learner',?,'course','open',0,999)`)
    .bind(id, course.id, lessonId, memberId, question).run();
  return Response.redirect(new URL(returnTo + "#lesson-qna", CLASSROOM_ORIGIN).toString(), 303);
}

function qaStyles() {
  return `<style>
  .lesson-qna{margin-top:22px;background:#151515;border:1px solid #292929;border-radius:18px;padding:24px}
  .lesson-qna h2{margin:0 0 6px;font-size:22px}.lesson-qna-intro{margin:0 0 18px;color:#888;font-size:13px;line-height:1.6}
  .qa-list{display:grid;gap:12px}.qa-item{border:1px solid #2f2f2f;border-radius:14px;padding:17px;background:#101010}
  .qa-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:11px;color:#888}
  .qa-badge{border:1px solid #3a3a3a;border-radius:999px;padding:3px 7px;color:#bbb}.qa-question{font-size:15px;font-weight:700;line-height:1.6;color:#f2f2f2}
  .qa-answer{margin-top:11px;padding-top:11px;border-top:1px solid #292929;color:#bbb;font-size:14px;line-height:1.7}.qa-answer strong{display:block;color:#e7e7e7;font-size:12px;margin-bottom:5px}
  .qa-open{color:#aaa;font-size:13px;margin-top:9px}.qa-form{margin-top:16px;padding-top:16px;border-top:1px solid #292929}.qa-form label{display:block;font-size:13px;font-weight:700;margin-bottom:7px}
  .qa-form textarea{width:100%;min-height:92px;resize:vertical;border:1px solid #3a3a3a;border-radius:12px;background:#0d0d0d;color:#f5f5f5;padding:12px;font:inherit;line-height:1.6}.qa-form button{margin-top:10px;border:0;border-radius:999px;padding:11px 16px;background:#f5f5f5;color:#111;font-weight:700;cursor:pointer}
  .public-qa{margin-top:20px}.public-qa .qa-item{background:#111}.public-qa a{color:#ddd;text-underline-offset:3px}
  @media(max-width:560px){.lesson-qna{padding:18px;border-radius:14px}.qa-item{padding:14px}.qa-form button{width:100%}}
  </style>`;
}

function renderQaItems(items, { showLesson = false } = {}) {
  if (!items.length) return '<p class="lesson-qna-intro">아직 등록된 질문이 없습니다.</p>';
  return `<div class="qa-list">${items.map((item) => {
    const replies = Array.isArray(item.replies) ? item.replies : [];
    const label = item.source_type === "editorial" ? "대표 질문" : "수강생 질문";
    return `<article class="qa-item"><div class="qa-meta"><span class="qa-badge">${escapeHtml(label)}</span>${showLesson && item.lesson_title ? `<span>${escapeHtml(item.lesson_title)}</span>` : ""}</div><div class="qa-question">Q. ${paragraphs(item.question)}</div>${replies.map((reply) => `<div class="qa-answer"><strong>${escapeHtml(reply.author_label || "답변")}</strong>${paragraphs(reply.body)}</div>`).join("")}${!replies.length ? '<div class="qa-open">답변 준비 중</div>' : ""}</article>`;
  }).join("")}</div>`;
}

async function injectHtmlResponse(response, markup) {
  const type = String(response.headers.get("Content-Type") || "");
  if (!type.includes("text/html") || response.status !== 200 || !markup) return response;
  const body = await response.text();
  const marker = "</main></body>";
  if (!body.includes(marker)) return new Response(body, { status: response.status, headers: response.headers });
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, markup + marker), { status: response.status, headers });
}

export async function injectLessonDiscussionExperience(response, request, env) {
  const url = new URL(request.url);
  if (request.method !== "GET" || response.status !== 200) return response;

  if (url.pathname === "/classroom" && url.searchParams.get("course")) {
    const slug = String(url.searchParams.get("course") || "");
    const course = await getCatalogD1Course(env, slug);
    if (!course?.lessons?.length) return response;
    const lessonNumber = Math.max(1, Math.min(course.lessons.length, Number(url.searchParams.get("lesson") || 1) || 1));
    const lesson = course.lessons[lessonNumber - 1];
    if (!lesson) return response;
    const discussions = await listLessonDiscussions(env, { courseId: course.id, lessonId: lesson.id, limit: 30 });
    const returnTo = `${url.pathname}${url.search}`;
    const markup = `${qaStyles()}<section class="lesson-qna" id="lesson-qna"><div class="eyebrow">LESSON Q&A</div><h2>이 차시의 질문과 답변</h2><p class="lesson-qna-intro">대표 질문과 수강생 질문을 같은 차시 맥락에서 확인할 수 있습니다.</p>${renderQaItems(discussions)}<form class="qa-form" method="post" action="/classroom/discussions"><label for="lesson-question">이 차시에서 궁금한 점을 남겨주세요.</label><textarea id="lesson-question" name="question" maxlength="1600" required placeholder="질문을 구체적으로 적을수록 답변하기 쉽습니다."></textarea><input type="hidden" name="course_slug" value="${escapeHtml(slug)}"><input type="hidden" name="lesson_id" value="${escapeHtml(lesson.id)}"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}"><button type="submit">질문 등록</button></form></section>`;
    return injectHtmlResponse(response, markup);
  }

  if (url.pathname.startsWith("/courses/")) {
    const slug = decodeURIComponent(url.pathname.slice("/courses/".length));
    if (!slug || slug === "enroll") return response;
    const course = await getCatalogD1Course(env, slug);
    if (!course) return response;
    const discussions = await listLessonDiscussions(env, { courseId: course.id, limit: 6, publicOnly: true });
    if (!discussions.length) return response;
    const markup = `${qaStyles()}<section class="lesson-qna public-qa" id="course-qna"><div class="eyebrow">COURSE Q&A</div><h2>강의에서 먼저 확인해 볼 질문</h2><p class="lesson-qna-intro">각 차시의 핵심 개념에서 자주 생기는 질문을 미리 확인할 수 있습니다.</p>${renderQaItems(discussions, { showLesson: true })}</section>`;
    return injectHtmlResponse(response, markup);
  }

  return response;
}

export { DISCUSSION_VERSION };

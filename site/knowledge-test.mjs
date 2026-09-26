import runtime from "./src/runtime.js";
import { KNOWLEDGE_ENTRIES } from "./src/knowledge-hub-v2.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(KNOWLEDGE_ENTRIES.length >= 40, `knowledge hub needs at least 40 entries, got ${KNOWLEDGE_ENTRIES.length}`);
assert(KNOWLEDGE_ENTRIES.length <= 60, `knowledge hub MVP should stay focused at 60 or fewer entries, got ${KNOWLEDGE_ENTRIES.length}`);
assert(KNOWLEDGE_ENTRIES.some((x) => x.type === "term" && x.category === "marketing"), "marketing glossary missing");
assert(KNOWLEDGE_ENTRIES.some((x) => x.type === "term" && x.category === "commerce"), "commerce glossary missing");
assert(KNOWLEDGE_ENTRIES.some((x) => x.type === "case"), "case cards missing");
assert(KNOWLEDGE_ENTRIES.some((x) => x.type === "brief"), "briefing cards missing");

const activityFixture = {
  ok: true,
  totals: { published_posts: 35, published_comments: 105, course_qa: 23 },
  posts: [{
    id: 101,
    title: "상품명에 키워드를 많이 넣으면 더 잘 노출될까요?",
    excerpt: "상품명과 검색 의도를 함께 봐야 합니다.",
    category_name: "온라인 판매 질문",
    author: "NJS 가이드",
    comment_count: 3,
    url: "https://community.neverjustsell.com/p/101/sample"
  }],
  course_qa: [{
    question: "오프라인 유통의 입지를 온라인에서는 무엇으로 봐야 하나요?",
    answer: "검색과 추천, 콘텐츠 노출이 온라인의 입지 역할을 합니다.",
    course_slug: "naver-search-algorithm",
    course_title: "온라인 커머스 역사와 네이버 쇼핑 검색 알고리즘",
    lesson_title: "대형마트 시대"
  }]
};

const env = {
  SITE_ORIGIN: "https://www.neverjustsell.com",
  AUTH_ORIGIN: "https://classroom.neverjustsell.com",
  COMMUNITY_ORIGIN: "https://community.neverjustsell.com",
  SHOP_ORIGIN: "https://neverjustsell.cafe24.com",
  COMMUNITY_BRIDGE: {
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname !== "/public/activity") return new Response("not found", { status: 404 });
      return new Response(JSON.stringify(activityFixture), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
  }
};

async function get(path) {
  return runtime.fetch(new Request(`https://www.neverjustsell.com${path}`), env, {});
}

let response = await get("/knowledge");
let body = await response.text();
assert(response.status === 200, "/knowledge must return 200");
assert(body.includes("NJS KNOWLEDGE HUB"), "knowledge hub identity missing");
assert(body.includes('id="search"'), "knowledge search missing");
assert(body.includes('data-filter="all"'), "knowledge filters missing");
assert(body.includes('name="description"'), "knowledge index description missing");

const sample = KNOWLEDGE_ENTRIES[0];
response = await get(`/knowledge/${sample.slug}`);
body = await response.text();
assert(response.status === 200, "knowledge detail must return 200");
assert(body.includes(sample.title), "knowledge detail title missing");
assert(body.includes('rel="canonical"'), "knowledge canonical missing");
assert(body.includes("같이 보면 좋은 지식"), "related knowledge block missing");
assert(body.includes("커뮤니티"), "knowledge-to-community connection missing");

response = await get("/");
body = await response.text();
assert(response.status === 200, "home must return 200 through runtime");
assert(body.includes("지금 이어지는 질문과 지식"), "live activity heading missing");
assert(body.includes("강의 Q&amp;A 23개"), "real Q&A count summary missing");
assert(body.includes("커뮤니티 글 35개"), "community post count summary missing");
assert(body.includes("댓글·답변 105개"), "community reply count summary missing");
assert(body.includes("상품명에 키워드를 많이 넣으면"), "latest community post missing");
assert(body.includes("오프라인 유통의 입지를 온라인에서는"), "course Q&A card missing");
assert(body.includes("지식 브리핑"), "knowledge briefing card missing");
assert((body.match(/njs-live-activity-style/g) || []).length === 1, "live activity module must not duplicate");

response = await get("/sitemap.xml");
body = await response.text();
assert(body.includes("https://www.neverjustsell.com/knowledge"), "knowledge index missing from sitemap");
assert(body.includes(`/knowledge/${sample.slug}`), "knowledge detail missing from sitemap");

response = await get("/llms.txt");
body = await response.text();
assert(body.includes("Knowledge Hub: https://www.neverjustsell.com/knowledge"), "knowledge hub missing from llms.txt");

console.log(`PASS: knowledge hub + live activity contract (${KNOWLEDGE_ENTRIES.length} entries)`);

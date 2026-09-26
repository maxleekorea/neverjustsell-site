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

const env = {
  SITE_ORIGIN: "https://www.neverjustsell.com",
  AUTH_ORIGIN: "https://classroom.neverjustsell.com",
  COMMUNITY_ORIGIN: "https://community.neverjustsell.com",
  SHOP_ORIGIN: "https://neverjustsell.cafe24.com"
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
assert(body.includes("관련 지식"), "related knowledge block missing");
assert(body.includes("커뮤니티"), "knowledge-to-community connection missing");

response = await get("/sitemap.xml");
body = await response.text();
assert(body.includes("https://www.neverjustsell.com/knowledge"), "knowledge index missing from sitemap");
assert(body.includes(`/knowledge/${sample.slug}`), "knowledge detail missing from sitemap");

response = await get("/llms.txt");
body = await response.text();
assert(body.includes("Knowledge Hub: https://www.neverjustsell.com/knowledge"), "knowledge hub missing from llms.txt");

console.log(`PASS: knowledge hub contract (${KNOWLEDGE_ENTRIES.length} entries)`);

const cases = [];

async function request(url) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "neverjustsell-live-smoke/1.0" }
  });
  const body = await response.text();
  return { response, body };
}

function expect(label, condition, detail) {
  cases.push({ label, ok: Boolean(condition), detail });
  if (!condition) process.exitCode = 1;
}

let r = await request("https://www.neverjustsell.com/");
expect("www home is site Worker", r.response.status === 200 && /NEVER JUST SELL/i.test(r.body) && !/board\/index\.html/i.test(r.body), `status=${r.response.status}`);

r = await request("https://www.neverjustsell.com/auth/complete");
expect("www auth complete returns home", r.response.status === 302 && r.response.headers.get("location") === "/", `status=${r.response.status} location=${r.response.headers.get("location")}`);

r = await request("https://neverjustsell.com/");
expect("apex canonicalizes to www", r.response.status === 308 && r.response.headers.get("location") === "https://www.neverjustsell.com/", `status=${r.response.status} location=${r.response.headers.get("location")}`);

r = await request("https://neverjustsell.com/auth/complete");
expect("apex preserves auth path while canonicalizing", r.response.status === 308 && r.response.headers.get("location") === "https://www.neverjustsell.com/auth/complete", `status=${r.response.status} location=${r.response.headers.get("location")}`);

r = await request("https://www.neverjustsell.com/login");
const loginLocation = r.response.headers.get("location") || "";
expect("site login uses classroom custom domain", r.response.status === 302 && loginLocation.startsWith("https://classroom.neverjustsell.com/site-login?") && loginLocation.includes(encodeURIComponent("https://www.neverjustsell.com/auth/complete")), `status=${r.response.status} location=${loginLocation}`);

r = await request("https://www.neverjustsell.com/community");
expect("site community bridge uses custom domain", r.response.status === 302 && r.response.headers.get("location") === "https://community.neverjustsell.com/", `status=${r.response.status} location=${r.response.headers.get("location")}`);

r = await request("https://www.neverjustsell.com/classroom");
expect("site classroom bridge uses custom domain", r.response.status === 302 && (r.response.headers.get("location") || "").startsWith("https://classroom.neverjustsell.com/classroom"), `status=${r.response.status} location=${r.response.headers.get("location")}`);

r = await request("https://classroom.neverjustsell.com/classroom");
expect("anonymous classroom shows member auth, not community error", [200,401].includes(r.response.status) && /회원 인증/i.test(r.body) && /https:\/\/classroom\.neverjustsell\.com\/oauth\/cafe24\/customer\/start/.test(r.body) && !/invalid_community_return_to/.test(r.body), `status=${r.response.status}`);

r = await request("https://community.neverjustsell.com/");
expect("community custom domain is live", r.response.status === 200 && /NEVER JUST SELL COMMUNITY/i.test(r.body), `status=${r.response.status}`);

r = await request("https://www.neverjustsell.com/board/index.html");
expect("legacy Cafe24 board path is not public-site content", r.response.status === 404 && !/게시판 메인/.test(r.body), `status=${r.response.status}`);

r = await request("https://neverjustsell-course-access.max-lee-korea.workers.dev/classroom");
expect("legacy classroom hostname canonicalizes", r.response.status === 302 && (r.response.headers.get("location") || "").startsWith("https://classroom.neverjustsell.com/classroom"), `status=${r.response.status} location=${r.response.headers.get("location")}`);

for (const item of cases) {
  console.log(`${item.ok ? "PASS" : "FAIL"}: ${item.label} — ${item.detail}`);
}
if (process.exitCode) throw new Error("Live smoke test failed");

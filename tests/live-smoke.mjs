const cases = [];

async function request(url, init = {}) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "neverjustsell-live-smoke/2.0", ...(init.headers || {}) },
    ...init
  });
  const body = await response.text();
  return { response, body };
}

async function requestUntil(url, predicate, { attempts = 12, delayMs = 5000 } = {}) {
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    last = await request(url);
    if (predicate(last)) return last;
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return last;
}

function expect(label, condition, detail) {
  cases.push({ label, ok: Boolean(condition), detail });
  if (!condition) process.exitCode = 1;
}

let r = await request("https://www.neverjustsell.com/");
expect(
  "www home is site Worker",
  r.response.status === 200 && /NEVER JUST SELL/i.test(r.body) && !/board\/index\.html/i.test(r.body),
  `status=${r.response.status}`
);

expect(
  "digital-first primary navigation uses My Space without cart",
  /https:\/\/classroom\.neverjustsell\.com\/my-space/.test(r.body) &&
    /내 공간/.test(r.body) &&
    !/>장바구니<\/a>/.test(r.body),
  "home navigation must lead digital buyers to My Space"
);

r = await requestUntil(
  "https://www.neverjustsell.com/store",
  ({ response, body }) =>
    response.status === 200 &&
    /구매한 콘텐츠를 바로 이용하는 스토어/.test(body) &&
    !/neverjustsell\.cafe24\.com\/$/.test(response.headers.get("location") || "")
);
expect(
  "store discovery stays on NEVER JUST SELL",
  r.response.status === 200 &&
    /구매한 콘텐츠를 바로 이용하는 스토어/.test(r.body) &&
    /강의/.test(r.body) &&
    /전자책/.test(r.body) &&
    /프로그램/.test(r.body),
  `status=${r.response.status} location=${r.response.headers.get("location") || ""}`
);

let launchHealth = null;
let launchHealthStatus = null;
for (let attempt = 1; attempt <= 12; attempt += 1) {
  r = await request("https://www.neverjustsell.com/health");
  launchHealthStatus = r.response.status;
  if (r.response.status === 200) {
    try {
      const candidate = JSON.parse(r.body || "{}");
      if (
        candidate.ok === true &&
        candidate.canonical_origin === "https://www.neverjustsell.com" &&
        candidate.classroom_origin === "https://classroom.neverjustsell.com" &&
        candidate.community_origin === "https://community.neverjustsell.com"
      ) {
        launchHealth = candidate;
        break;
      }
    } catch {
      // Cloudflare may still be serving the prior deployment during cutover.
    }
  }
  if (attempt < 12) await new Promise((resolve) => setTimeout(resolve, 5000));
}
expect(
  "public-site health reports canonical launch services",
  Boolean(launchHealth),
  `status=${launchHealthStatus} canonical=${launchHealth?.canonical_origin || "not-ready"}`
);

r = await request("https://www.neverjustsell.com/book");
expect(
  "book launch page has store CTA and SEO metadata",
  r.response.status === 200 &&
    /9791124121061/.test(r.body) &&
    /9791124121122/.test(r.body) &&
    /스토어 보기/.test(r.body) &&
    !/product\/detail\.html\?product_no=11/.test(r.body) &&
    /property="og:image"/.test(r.body) &&
    /href="\/favicon\.svg"/.test(r.body),
  `status=${r.response.status}`
);

r = await request("https://www.neverjustsell.com/auth/complete");
expect(
  "legacy auth complete only returns home",
  r.response.status === 302 && r.response.headers.get("location") === "/" && !r.response.headers.get("set-cookie"),
  `status=${r.response.status} location=${r.response.headers.get("location")}`
);

r = await request("https://neverjustsell.com/");
expect(
  "apex canonicalizes to www",
  r.response.status === 308 && r.response.headers.get("location") === "https://www.neverjustsell.com/",
  `status=${r.response.status} location=${r.response.headers.get("location")}`
);

r = await request("https://neverjustsell.com/auth/complete");
expect(
  "apex preserves path while canonicalizing",
  r.response.status === 308 && r.response.headers.get("location") === "https://www.neverjustsell.com/auth/complete",
  `status=${r.response.status} location=${r.response.headers.get("location")}`
);

r = await request("https://www.neverjustsell.com/login");
let publicLoginTarget = null;
try {
  publicLoginTarget = new URL(r.response.headers.get("location") || "");
} catch {
  publicLoginTarget = null;
}
expect(
  "public site delegates customer auth to classroom OAuth",
  r.response.status === 302 &&
    publicLoginTarget?.origin === "https://classroom.neverjustsell.com" &&
    publicLoginTarget?.pathname === "/oauth/cafe24/customer/start" &&
    publicLoginTarget?.searchParams.get("return_to") === "https://www.neverjustsell.com/",
  `status=${r.response.status} location=${r.response.headers.get("location")}`
);

r = await request("https://www.neverjustsell.com/community");
expect(
  "site community bridge uses canonical custom domain",
  r.response.status === 302 && r.response.headers.get("location") === "https://community.neverjustsell.com/",
  `status=${r.response.status} location=${r.response.headers.get("location")}`
);

r = await request("https://www.neverjustsell.com/classroom");
expect(
  "site classroom bridge uses canonical custom domain",
  r.response.status === 302 && r.response.headers.get("location") === "https://classroom.neverjustsell.com/classroom",
  `status=${r.response.status} location=${r.response.headers.get("location")}`
);

r = await requestUntil(
  "https://classroom.neverjustsell.com/classroom",
  ({ response }) =>
    response.status === 302 &&
    response.headers.get("location") === "https://classroom.neverjustsell.com/oauth/cafe24/customer/start"
);
expect(
  "anonymous classroom immediately starts member authentication",
  r.response.status === 302 &&
    r.response.headers.get("location") === "https://classroom.neverjustsell.com/oauth/cafe24/customer/start",
  `status=${r.response.status} location=${r.response.headers.get("location")}`
);

r = await requestUntil(
  "https://classroom.neverjustsell.com/my-space",
  ({ response }) =>
    response.status === 302 &&
    response.headers.get("location") === "https://classroom.neverjustsell.com/oauth/cafe24/customer/start"
);
expect(
  "anonymous My Space uses the same member authentication boundary",
  r.response.status === 302 &&
    r.response.headers.get("location") === "https://classroom.neverjustsell.com/oauth/cafe24/customer/start",
  `status=${r.response.status} location=${r.response.headers.get("location")}`
);

r = await request("https://classroom.neverjustsell.com/migration-health");
let payload = JSON.parse(r.body || "{}");
expect(
  "classroom dispatcher and callback are canonical",
  r.response.status === 200 &&
    payload.route_owner === "production-dispatch-v3" &&
    payload.redirect_uri === "https://classroom.neverjustsell.com/oauth/cafe24/callback",
  `status=${r.response.status} route_owner=${payload.route_owner} redirect_uri=${payload.redirect_uri}`
);

expect(
  "program schema is reconciled in production",
  payload.program_schema?.ok === true &&
    Number(payload.program_schema?.program_count || 0) >= 1 &&
    Number(payload.program_schema?.mission_template_count || 0) >= 4 &&
    Number(payload.program_schema?.event_template_count || 0) >= 2,
  `program_schema=${JSON.stringify(payload.program_schema || null)}`
);

r = await request("https://classroom.neverjustsell.com/site-login?return_to=https%3A%2F%2Fwww.neverjustsell.com%2Fauth%2Fcomplete");
payload = JSON.parse(r.body || "{}");
expect(
  "obsolete site-login route is removed",
  r.response.status === 404 && payload.error === "not_found",
  `status=${r.response.status} error=${payload.error}`
);

r = await request("https://classroom.neverjustsell.com/oauth/cafe24/customer/start");
const authLocation = r.response.headers.get("location") || "";
expect(
  "classroom member auth starts at Cafe24 with canonical callback",
  r.response.status === 302 &&
    authLocation.startsWith("https://neverjustsell.cafe24.com/api/v2/oauth/authorize") &&
    authLocation.includes(encodeURIComponent("https://classroom.neverjustsell.com/oauth/cafe24/callback")),
  `status=${r.response.status} location=${authLocation}`
);

r = await request("https://classroom.neverjustsell.com/oauth/cafe24/status");
payload = JSON.parse(r.body || "{}");
expect(
  "Cafe24 Admin connection status remains reachable",
  r.response.status === 200 && payload.ok === true && payload.connected === true,
  `status=${r.response.status} connected=${payload.connected} error=${payload.error || ""}`
);

r = await request("https://community.neverjustsell.com/login?return_to=%2F");
const communityLoginLocation = r.response.headers.get("location") || "";
expect(
  "community login delegates to classroom OAuth with community callback",
  r.response.status === 302 &&
    communityLoginLocation.startsWith("https://classroom.neverjustsell.com/oauth/cafe24/customer/start?") &&
    communityLoginLocation.includes(encodeURIComponent("https://community.neverjustsell.com/auth/callback?return_to=%2F")),
  `status=${r.response.status} location=${communityLoginLocation}`
);

r = await request("https://community.neverjustsell.com/");
expect(
  "community custom domain is live with cross-product navigation",
  r.response.status === 200 &&
    /NEVER JUST SELL COMMUNITY/i.test(r.body) &&
    /https:\/\/www\.neverjustsell\.com\//.test(r.body) &&
    /https:\/\/classroom\.neverjustsell\.com\/classroom/.test(r.body),
  `status=${r.response.status}`
);

r = await request("https://community.neverjustsell.com/auth/bridge-health");
payload = JSON.parse(r.body || "{}");
expect(
  "community service binding reaches auth worker",
  r.response.status === 200 &&
    payload.ok === true &&
    payload.binding_present === true &&
    payload.rpc_ready === true &&
    payload.upstream_ok === true,
  `status=${r.response.status} binding=${payload.binding_present} rpc=${payload.rpc_ready} upstream=${payload.upstream_status}`
);

r = await request("https://community.neverjustsell.com/auth/db-health");
payload = JSON.parse(r.body || "{}");
expect(
  "community program spaces are reconciled in production",
  r.response.status === 200 &&
    payload.ok === true &&
    payload.program_schema?.ok === true &&
    Number(payload.program_schema?.pilot_space_count || 0) >= 4,
  `status=${r.response.status} program_schema=${JSON.stringify(payload.program_schema || null)} error=${payload.error || ""}`
);

r = await request("https://community.neverjustsell.com/auth/payment-e2e-space-status");
payload = JSON.parse(r.body || "{}");
const paymentE2ECommunityObservable =
  (r.response.status === 200 &&
    payload.ok === true &&
    payload.logged_in_once === true &&
    payload.access_consistent === true) ||
  (r.response.status === 409 &&
    payload.ok === false &&
    payload.logged_in_once === false &&
    payload.error === "community_login_required");
expect(
  "payment E2E Community projection state is observable",
  paymentE2ECommunityObservable,
  `status=${r.response.status} payload=${JSON.stringify(payload)}`
);

r = await request("https://www.neverjustsell.com/board/index.html");
expect(
  "legacy Cafe24 board path is not public-site content",
  r.response.status === 404 && !/게시판 메인/.test(r.body),
  `status=${r.response.status}`
);

let legacyWorkersDev = null;
try {
  legacyWorkersDev = await request("https://neverjustsell-course-access.max-lee-korea.workers.dev/classroom");
} catch (error) {
  legacyWorkersDev = { unreachable: true, error: String(error?.cause?.code || error?.message || error) };
}
expect(
  "legacy classroom workers.dev route stays disabled",
  legacyWorkersDev.unreachable === true ||
    (legacyWorkersDev.response.status === 404 && !legacyWorkersDev.response.headers.get("location")),
  legacyWorkersDev.unreachable
    ? `unreachable=${legacyWorkersDev.error}`
    : `status=${legacyWorkersDev.response.status} location=${legacyWorkersDev.response.headers.get("location")}`
);

for (const item of cases) {
  console.log(`${item.ok ? "PASS" : "FAIL"}: ${item.label} — ${item.detail}`);
}

if (process.exitCode) throw new Error("Live smoke test failed");

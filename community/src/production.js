import community from "./index.js";

function json(data, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getCourseQa(env, limit = 6) {
  if (!env.AUTH_BRIDGE || typeof env.AUTH_BRIDGE.listPublicCourseQa !== "function") return [];
  try {
    const result = await env.AUTH_BRIDGE.listPublicCourseQa(limit);
    return result?.ok && Array.isArray(result.items) ? result.items : [];
  } catch (error) {
    console.error("course Q&A RPC failed", error);
    return [];
  }
}

async function getPublicActivity(env, limit = 3) {
  if (!env.DB || typeof env.DB.prepare !== "function") {
    return { ok: false, error: "community_db_binding_missing", posts: [], course_qa: [] };
  }
  const safeLimit = Math.max(1, Math.min(6, Number(limit) || 3));
  const [postResult, totals, qas] = await Promise.all([
    env.DB.prepare(`SELECT p.id,p.slug,p.title,p.body,p.published_at,p.comment_count,p.like_count,
      c.slug AS category_slug,c.name AS category_name,m.display_name
      FROM posts p
      JOIN categories c ON c.id=p.category_id
      JOIN members m ON m.member_id=p.author_member_id
      WHERE p.status='published' AND p.is_indexable=1
      ORDER BY p.published_at DESC,p.id DESC LIMIT ?`).bind(safeLimit).all(),
    env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM posts WHERE status='published') AS post_count,
      (SELECT COUNT(*) FROM comments WHERE status='published') AS comment_count`).first(),
    getCourseQa(env, Math.max(30, safeLimit))
  ]);
  const posts = (postResult.results || []).map((row) => ({
    id: Number(row.id),
    title: String(row.title || ""),
    excerpt: String(row.body || "").replace(/\s+/g, " ").trim().slice(0, 150),
    category_slug: String(row.category_slug || ""),
    category_name: String(row.category_name || ""),
    author: String(row.display_name || ""),
    published_at: row.published_at || null,
    comment_count: Number(row.comment_count || 0),
    like_count: Number(row.like_count || 0),
    url: `https://community.neverjustsell.com/p/${Number(row.id)}/${encodeURIComponent(String(row.slug || ""))}`
  }));
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    totals: {
      published_posts: Number(totals?.post_count || 0),
      published_comments: Number(totals?.comment_count || 0),
      course_qa: qas.length
    },
    posts,
    course_qa: qas.slice(0, safeLimit)
  };
}

async function getCommunityStatus(env) {
  if (!env.DB || typeof env.DB.prepare !== "function") {
    return { ok: false, phase: "system-first", error: "community_db_binding_missing" };
  }
  const [counts, qas] = await Promise.all([
    env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM posts WHERE status='published') AS published_posts,
      (SELECT COUNT(*) FROM comments WHERE status='published') AS published_comments,
      (SELECT COUNT(*) FROM categories WHERE is_active=1) AS active_categories`).first(),
    getCourseQa(env, 50)
  ]);
  return {
    ok: true,
    phase: "system-first",
    seeding_paused: true,
    published_posts: Number(counts?.published_posts || 0),
    published_comments: Number(counts?.published_comments || 0),
    active_categories: Number(counts?.active_categories || 0),
    course_qa_count: qas.length
  };
}

function courseQuestionsPage(items) {
  const groups = new Map();
  for (const item of items) {
    const key = String(item.course_title || "강의 질문");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const sections = [...groups.entries()].map(([title, rows]) => {
    const cards = rows.map((item) => {
      const courseUrl = `https://classroom.neverjustsell.com/courses/${encodeURIComponent(item.course_slug || "")}`;
      return `<article class="qa-card"><div class="qa-meta">${esc(item.lesson_title || title)}</div><h3>${esc(item.question || "")}</h3>${item.answer ? `<p>${esc(item.answer)}</p>` : ""}<a href="${courseUrl}">강의 정보 보기 →</a></article>`;
    }).join("");
    return `<section class="qa-section"><h2>${esc(title)}</h2><div class="qa-list">${cards}</div></section>`;
  }).join("");
  const body = sections || `<div class="empty">공개된 강의 질문이 아직 없습니다.</div>`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>강의 질문 | NEVER JUST SELL Community</title><meta name="description" content="NEVER JUST SELL 강의에서 이어진 공개 질문과 답변"><style>
*{box-sizing:border-box}body{margin:0;background:#f4f1ec;color:#171512;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(920px,calc(100% - 32px));margin:0 auto}.top{padding:22px 0;border-bottom:1px solid #ddd6cc;display:flex;gap:18px;align-items:center;justify-content:space-between}.brand{font-weight:900;text-decoration:none;letter-spacing:.06em}.nav{display:flex;gap:14px;flex-wrap:wrap;font-size:13px}.hero{padding:54px 0 22px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#77502e}.hero h1{font-size:clamp(34px,6vw,58px);line-height:1.05;letter-spacing:-.05em;margin:8px 0 16px}.hero p{color:#6f675f;max-width:680px}.qa-section{margin:34px 0}.qa-section h2{font-size:24px;margin:0 0 12px}.qa-list{display:grid;gap:10px}.qa-card{background:#fff;border:1px solid #ddd5cb;padding:22px}.qa-meta{font-size:12px;color:#765333;font-weight:750}.qa-card h3{font-size:19px;line-height:1.5;margin:7px 0 9px}.qa-card p{font-size:14px;color:#6f675f;margin:0 0 11px}.qa-card a{font-size:13px;font-weight:750}.empty{background:#fff;border:1px solid #ddd5cb;padding:30px}.foot{padding:32px 0 54px;border-top:1px solid #ddd6cc;margin-top:50px;color:#81786f;font-size:12px}@media(max-width:600px){.shell{width:calc(100% - 22px)}.top{align-items:flex-start}.hero{padding-top:38px}.qa-card{padding:18px}}
</style></head><body><header class="shell top"><a class="brand" href="/">NEVER JUST SELL COMMUNITY</a><nav class="nav"><a href="/">커뮤니티</a><a href="/write?intent=question">질문하기</a><a href="/c/case-study">경험·사례</a><a href="https://classroom.neverjustsell.com/courses">강의</a></nav></header><main class="shell"><section class="hero"><div class="eyebrow">COURSE DISCUSSIONS</div><h1>강의에서 이어진 질문</h1><p>강의를 듣기 전에 궁금한 내용을 살펴보고, 수강 중에는 해당 차시에서 질문을 이어갈 수 있습니다. 질문과 답변은 강의 안에만 갇히지 않고 필요한 사람이 다시 찾을 수 있게 연결합니다.</p></section>${body}</main><footer class="shell foot">질문은 학습 맥락에서 시작하고 커뮤니티에서 다시 발견됩니다.</footer></body></html>`;
}

async function injectCommunityJourney(response, url) {
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  let body = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");

  if (!body.includes('href="/course-questions"')) {
    body = body.replace('<a href="/">전체 글</a>', '<a href="/">전체 글</a><a href="/course-questions">강의 질문</a>');
  }

  if (url.pathname === "/" && !body.includes('id="community-journey"')) {
    const style = `<style id="community-journey-style">.community-journey{margin:0 0 34px}.community-journey h2{font-size:25px;margin:0 0 6px;letter-spacing:-.03em}.community-journey>p{margin:0 0 14px;color:#746b63}.journey-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.journey-card{display:block;background:#171512;color:#fff;padding:22px;text-decoration:none;min-height:150px}.journey-card:nth-child(2),.journey-card:nth-child(3){background:#fff;color:#171512;border:1px solid #d9d1c7}.journey-card span{font-size:11px;font-weight:800;letter-spacing:.12em;opacity:.66}.journey-card strong{display:block;font-size:20px;margin-top:9px}.journey-card p{font-size:13px;line-height:1.6;margin:8px 0 0;opacity:.72}@media(max-width:720px){.journey-grid{grid-template-columns:1fr}.journey-card{min-height:auto}}</style>`;
    const journey = `<section class="community-journey" id="community-journey"><h2>무엇이 필요하신가요?</h2><p>게시판을 고르기 전에 지금 하려는 일부터 선택하세요.</p><div class="journey-grid"><a class="journey-card" href="/write?intent=question"><span>ASK</span><strong>질문하기</strong><p>판매와 마케팅에서 막힌 상황을 구체적으로 묻습니다.</p></a><a class="journey-card" href="/c/case-study"><span>EXPERIENCE</span><strong>경험·사례 보기</strong><p>다른 판매자가 실제로 시도한 과정과 결과를 살펴봅니다.</p></a><a class="journey-card" href="/course-questions"><span>LEARN</span><strong>강의 질문 보기</strong><p>강의에서 나온 질문과 답변을 공개된 지식으로 이어서 봅니다.</p></a></div></section>`;
    body = body.replace("</head>", style + "</head>");
    const heroEnd = body.indexOf("</section>", body.indexOf('<section class="hero">'));
    if (heroEnd >= 0) body = body.slice(0, heroEnd + 10) + journey + body.slice(heroEnd + 10);
  }

  if (url.pathname === "/write" && requestIntent(url)) {
    const intent = requestIntent(url);
    const title = intent === "case" ? "경험·사례 나누기" : "질문하기";
    const notice = intent === "case"
      ? "무엇을 시도했고 어떤 결과가 나왔는지, 조건과 배운 점을 함께 적어 주세요."
      : "현재 상황, 이미 시도한 것, 무엇이 막혔는지를 적으면 다른 회원이 맥락을 이해하고 답하기 쉽습니다.";
    body = body.replace('<h1 class="page-title">글쓰기</h1>', `<h1 class="page-title">${title}</h1>`);
    body = body.replace(/<div class="notice">[\s\S]*?<\/div><form class="form-card"/, `<div class="notice">${notice}</div><form class="form-card"`);
    body = body.replace('<label for="category">게시판</label>', '<label for="category">주제</label>');
    const category = intent === "case" ? "case-study" : "online-selling";
    body = body.replace(new RegExp(`<option value="${category}"([^>]*)>`), `<option value="${category}"$1 selected>`);
  }

  return new Response(body, { status: response.status, headers });
}

function requestIntent(url) {
  const intent = String(url.searchParams.get("intent") || "").toLowerCase();
  return intent === "case" ? "case" : intent === "question" ? "question" : "";
}

async function injectMobileCommunityNavigation(response) {
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes("community-mobile-menu-script")) {
    return new Response(body, { status: response.status, headers: response.headers });
  }
  const marker = "</head>";
  if (!body.includes(marker)) return new Response(body, { status: response.status, headers: response.headers });

  const mobileIa = `<style>
.community-mobile-menu{display:none}
@media(max-width:800px){
  .site-header{position:sticky!important;top:0!important}
  .header-inner{min-height:58px!important;padding:9px 0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important}
  .site-header .header-inner>nav{display:none!important}
  .community-mobile-menu{display:block;position:relative;margin-left:auto}
  .community-mobile-menu>summary{list-style:none;cursor:pointer;border:1px solid #cfc6bb;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:800;background:#fff}
  .community-mobile-menu>summary::-webkit-details-marker{display:none}
  .community-mobile-panel{position:absolute;right:0;top:42px;z-index:30;width:min(270px,calc(100vw - 24px));padding:8px;background:#fff;border:1px solid #d7cec3;border-radius:14px;box-shadow:0 14px 34px rgba(34,25,17,.16)}
  .community-mobile-panel a,.community-mobile-panel .member-name{display:block;padding:10px 11px;border-radius:8px;font-size:14px;text-decoration:none}
  .community-mobile-panel a:active{background:#f2ede7}
  .community-mobile-panel .member-name{padding-bottom:5px;color:#81776e;font-size:12px}
}
</style><script id="community-mobile-menu-script">(function(){function init(){var header=document.querySelector('.site-header .header-inner');var nav=header&&header.querySelector(':scope > nav');if(!header||!nav||header.querySelector('.community-mobile-menu'))return;var d=document.createElement('details');d.className='community-mobile-menu';var s=document.createElement('summary');s.textContent='메뉴';s.setAttribute('aria-label','커뮤니티 메뉴 열기');var p=document.createElement('div');p.className='community-mobile-panel';Array.from(nav.children).forEach(function(node){p.appendChild(node.cloneNode(true));});d.appendChild(s);d.appendChild(p);header.appendChild(d);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();</script>`;
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, mobileIa + marker), { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/public/activity") {
      try {
        const activity = await getPublicActivity(env, url.searchParams.get("limit"));
        return json(activity, activity.ok ? 200 : 503, "public, max-age=60, s-maxage=120");
      } catch (error) {
        console.error("public activity feed failed", error);
        return json({ ok: false, error: "activity_feed_failed", posts: [], course_qa: [] }, 503);
      }
    }

    if (request.method === "GET" && url.pathname === "/auth/prelaunch-seed-status") {
      try {
        const status = await getCommunityStatus(env);
        return json(status, status.ok ? 200 : 503);
      } catch (error) {
        console.error("community status failed", error);
        return json({ ok: false, phase: "system-first", seeding_paused: true, error: String(error?.message || error) }, 503);
      }
    }

    if (request.method === "GET" && url.pathname === "/course-questions") {
      const items = await getCourseQa(env, 50);
      return new Response(courseQuestionsPage(items), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60, s-maxage=120",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/ask") {
      return Response.redirect(`${url.origin}/write?intent=question`, 302);
    }
    if (request.method === "GET" && url.pathname === "/share") {
      return Response.redirect(`${url.origin}/write?intent=case`, 302);
    }

    let response = await community.fetch(request, env, ctx);
    if (request.method === "GET") {
      response = await injectCommunityJourney(response, url);
      response = await injectMobileCommunityNavigation(response);
    }
    return response;
  }
};

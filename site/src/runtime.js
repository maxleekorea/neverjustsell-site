import app from "./index.js";
import {
  KNOWLEDGE_ENTRIES,
  findKnowledgeEntry,
  knowledgeSitemapXml,
  renderKnowledgeEntry,
  renderKnowledgeIndex
} from "./knowledge-hub-v2.js";
import { renderStartPage, safeSiteReturnTo } from "./onboarding.js";

const CANONICAL_SITE_ORIGIN = "https://www.neverjustsell.com";
const CLASSROOM_ORIGIN = "https://classroom.neverjustsell.com";
const COMMUNITY_ORIGIN = "https://community.neverjustsell.com";

function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=120, s-maxage=600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      ...extraHeaders
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

function loginRedirect(returnTo) {
  const location = `${CLASSROOM_ORIGIN}/oauth/cafe24/customer/start?return_to=${encodeURIComponent(returnTo)}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store"
    }
  });
}

async function injectKnowledgeNavigation(response) {
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes('href="/knowledge"')) return new Response(body, { status: response.status, headers: response.headers });
  const updated = body.replaceAll('<a href="/content">콘텐츠</a>', '<a href="/content">콘텐츠</a><a href="/knowledge">지식</a>');
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(updated, { status: response.status, headers });
}

async function getPlatformActivity(env) {
  if (!env.COMMUNITY_BRIDGE || typeof env.COMMUNITY_BRIDGE.fetch !== "function") return null;
  try {
    const response = await env.COMMUNITY_BRIDGE.fetch(
      new Request(`${COMMUNITY_ORIGIN}/public/activity?limit=3`, {
        method: "GET",
        headers: { Accept: "application/json" }
      })
    );
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    return payload?.ok ? payload : null;
  } catch (error) {
    console.error("public activity bridge failed", error);
    return null;
  }
}

function activityCard({ eyebrow, title, summary, href, meta }) {
  return `<a class="njs-live-card" href="${esc(href)}"><span class="njs-live-eyebrow">${esc(eyebrow)}</span><h3>${esc(title)}</h3>${summary ? `<p>${esc(summary)}</p>` : ""}${meta ? `<span class="njs-live-meta">${esc(meta)}</span>` : ""}<strong>이어보기 →</strong></a>`;
}

async function injectHomeActivity(response, env) {
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const activity = await getPlatformActivity(env);
  if (!activity) return response;

  const qa = Array.isArray(activity.course_qa) ? activity.course_qa[0] : null;
  const post = Array.isArray(activity.posts) ? activity.posts[0] : null;
  const knowledge = Array.isArray(KNOWLEDGE_ENTRIES) && KNOWLEDGE_ENTRIES.length
    ? KNOWLEDGE_ENTRIES[KNOWLEDGE_ENTRIES.length - 1]
    : null;
  const cards = [];

  if (qa) {
    cards.push(activityCard({
      eyebrow: "강의 Q&A",
      title: qa.question,
      summary: qa.answer,
      href: `${CLASSROOM_ORIGIN}/courses/${encodeURIComponent(qa.course_slug || "")}#course-qna`,
      meta: qa.lesson_title || qa.course_title || "강의에서 확인"
    }));
  }
  if (post) {
    cards.push(activityCard({
      eyebrow: post.category_name || "커뮤니티",
      title: post.title,
      summary: post.excerpt,
      href: post.url || COMMUNITY_ORIGIN,
      meta: `${post.author || "NEVER JUST SELL"} · 댓글 ${Number(post.comment_count || 0)}`
    }));
  }
  if (knowledge) {
    cards.push(activityCard({
      eyebrow: knowledge.type === "brief" ? "지식 브리핑" : "지식 허브",
      title: knowledge.title,
      summary: knowledge.summary,
      href: `/knowledge/${encodeURIComponent(knowledge.slug)}`,
      meta: `업데이트 ${knowledge.updated}`
    }));
  }
  if (!cards.length) return response;

  const totals = activity.totals || {};
  const activityLine = [
    Number(totals.course_qa || 0) > 0 ? `강의 Q&A ${Number(totals.course_qa)}개` : "",
    Number(totals.published_posts || 0) > 0 ? `커뮤니티 글 ${Number(totals.published_posts)}개` : "",
    Number(totals.published_comments || 0) > 0 ? `댓글·답변 ${Number(totals.published_comments)}개` : ""
  ].filter(Boolean).join(" · ");

  const section = `<style id="njs-live-activity-style">
.njs-live-activity{padding:76px 0;background:#f2eee8;border-block:1px solid #dfd7cd}.njs-live-head{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:22px}.njs-live-head h2{font-size:clamp(28px,4vw,42px);letter-spacing:-.04em;line-height:1.15;margin:5px 0 8px}.njs-live-head p{margin:0;color:#6f675f;font-size:14px}.njs-live-head>a{font-size:13px;font-weight:750;text-decoration:none}.njs-live-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.njs-live-card{display:flex;flex-direction:column;min-height:260px;padding:22px;background:#fff;border:1px solid #d8d0c6;text-decoration:none;color:#171512}.njs-live-card:hover{border-color:#9d8e7d}.njs-live-eyebrow{font-size:11px;font-weight:850;letter-spacing:.12em;color:#765333}.njs-live-card h3{font-size:20px;letter-spacing:-.025em;line-height:1.4;margin:14px 0 9px}.njs-live-card p{font-size:14px;line-height:1.65;color:#746c64;margin:0 0 14px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}.njs-live-meta{font-size:11px;color:#8a8178;margin-top:auto;padding-top:14px}.njs-live-card strong{font-size:12px;margin-top:8px}@media(max-width:760px){.njs-live-activity{padding:48px 0}.njs-live-head{align-items:flex-start;flex-direction:column;gap:8px}.njs-live-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:9px;padding-bottom:4px}.njs-live-card{flex:0 0 min(86vw,330px);min-height:235px;scroll-snap-align:start;padding:18px}.njs-live-card h3{font-size:18px}}
</style><section class="njs-live-activity" aria-labelledby="njs-live-title"><div class="njs-shell"><div class="njs-live-head"><div><p class="njs-section-no">NOW / NEVER JUST SELL</p><h2 id="njs-live-title">지금 이어지는 질문과 지식</h2><p>${esc(activityLine || "강의·커뮤니티·지식 허브의 최신 내용을 연결합니다.")}</p></div><a href="${COMMUNITY_ORIGIN}/">커뮤니티 전체 보기 →</a></div><div class="njs-live-grid">${cards.join("")}</div></div></section>`;

  const body = await response.text();
  const marker = '<section class="njs-content">';
  if (!body.includes(marker) || body.includes('id="njs-live-activity-style"')) {
    return new Response(body, { status: response.status, headers: response.headers });
  }
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, section + marker), { status: response.status, headers });
}

async function extendSitemap(response) {
  if (response.status !== 200) return response;
  const body = await response.text();
  if (!body.includes("</urlset>")) return new Response(body, { status: response.status, headers: response.headers });
  const additions = [
    `${CANONICAL_SITE_ORIGIN}/start`,
    ...knowledgeSitemapXml()
  ].map(url => `  <url><loc>${url}</loc></url>`).join("\n");
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace("</urlset>", `${additions}\n</urlset>`), { status: response.status, headers });
}

async function extendLlms(response) {
  if (response.status !== 200) return response;
  const body = await response.text();
  if (body.includes("Knowledge Hub:")) return new Response(body, { status: response.status, headers: response.headers });
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(`${body}\nStart: ${CANONICAL_SITE_ORIGIN}/start\nKnowledge Hub: ${CANONICAL_SITE_ORIGIN}/knowledge\n`, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.hostname === "neverjustsell.com") {
      const target = new URL(`${url.pathname}${url.search}`, CANONICAL_SITE_ORIGIN);
      return Response.redirect(target.toString(), 308);
    }

    if (url.pathname === "/auth/complete") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Cache-Control": "no-store"
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/login") {
      return loginRedirect(safeSiteReturnTo(url.searchParams.get("return_to")));
    }

    if (request.method === "GET" && (url.pathname === "/start" || url.pathname === "/start/")) {
      return html(renderStartPage());
    }

    if (request.method === "GET" && (url.pathname === "/knowledge" || url.pathname === "/knowledge/")) {
      return html(renderKnowledgeIndex());
    }

    if (request.method === "GET" && url.pathname.startsWith("/knowledge/")) {
      const slug = decodeURIComponent(url.pathname.slice("/knowledge/".length)).replace(/\/$/, "");
      const entry = findKnowledgeEntry(slug);
      if (entry) return html(renderKnowledgeEntry(entry));
      return html('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>지식을 찾을 수 없습니다 | NEVER JUST SELL</title></head><body><main style="max-width:720px;margin:80px auto;padding:20px;font-family:Arial,sans-serif"><h1>지식을 찾을 수 없습니다.</h1><p><a href="/knowledge">지식 허브로 돌아가기</a></p></main></body></html>', 404, { "Cache-Control": "no-store" });
    }

    let response = await app.fetch(request, env, ctx);
    if (url.pathname === "/sitemap.xml") return extendSitemap(response);
    if (url.pathname === "/llms.txt") return extendLlms(response);
    if (request.method === "GET" && url.pathname === "/") {
      response = await injectHomeActivity(response, env);
    }
    return injectKnowledgeNavigation(response);
  }
};

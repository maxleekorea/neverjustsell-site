import app from "./index.js";
import {
  LEGACY_KNOWLEDGE_ENTRIES,
  loadKnowledgeEntries,
  findKnowledgeEntry,
  knowledgeSitemapXml,
  renderKnowledgeEntry,
  renderKnowledgeIndex
} from "./knowledge-runtime.js";
import {
  renderSavedKnowledgePage,
  injectKnowledgeMemberIndex,
  injectMemberSaveControl
} from "./knowledge-member.js";
import { renderStartPage, safeSiteReturnTo } from "./onboarding.js";
import { renderHomeV3Page } from "./home-v3.js";

const CANONICAL_SITE_ORIGIN = "https://www.neverjustsell.com";
const CLASSROOM_ORIGIN = "https://classroom.neverjustsell.com";

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

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=120, s-maxage=600",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      ...extraHeaders
    }
  });
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

async function extendSitemap(response, entries) {
  if (response.status !== 200) return response;
  const body = await response.text();
  if (!body.includes("</urlset>")) return new Response(body, { status: response.status, headers: response.headers });
  const additions = [
    `${CANONICAL_SITE_ORIGIN}/start`,
    ...knowledgeSitemapXml(entries)
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
        headers: { Location: "/", "Cache-Control": "no-store" }
      });
    }

    if (request.method === "GET" && url.pathname === "/login") {
      return loginRedirect(safeSiteReturnTo(url.searchParams.get("return_to")));
    }

    if (request.method === "GET" && (url.pathname === "/start" || url.pathname === "/start/")) {
      return html(renderStartPage());
    }

    if (request.method === "GET" && url.pathname === "/knowledge/catalog.json") {
      return json({ ok: true, count: LEGACY_KNOWLEDGE_ENTRIES.length, items: LEGACY_KNOWLEDGE_ENTRIES });
    }

    if (request.method === "GET" && (url.pathname === "/home-v3" || url.pathname === "/home-v3/")) {
      return renderHomeV3Page({
        env,
        siteOrigin: CANONICAL_SITE_ORIGIN,
        authOrigin: CLASSROOM_ORIGIN,
        communityOrigin: "https://community.neverjustsell.com"
      });
    }

    if (request.method === "GET" && (url.pathname === "/knowledge" || url.pathname === "/knowledge/")) {
      const { entries } = await loadKnowledgeEntries(env);
      return injectKnowledgeMemberIndex(html(renderKnowledgeIndex(entries)));
    }

    if (request.method === "GET" && (url.pathname === "/knowledge/saved" || url.pathname === "/knowledge/saved/")) {
      const { entries } = await loadKnowledgeEntries(env);
      return html(renderSavedKnowledgePage(entries), 200, { "Cache-Control": "private, no-store" });
    }

    if (request.method === "GET" && url.pathname.startsWith("/knowledge/")) {
      const { entries } = await loadKnowledgeEntries(env);
      const slug = decodeURIComponent(url.pathname.slice("/knowledge/".length)).replace(/\/$/, "");
      const entry = findKnowledgeEntry(slug, entries);
      if (entry) return injectMemberSaveControl(html(renderKnowledgeEntry(entry, entries)), request);
      return html('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>지식을 찾을 수 없습니다 | NEVER JUST SELL</title></head><body><main style="max-width:720px;margin:80px auto;padding:20px;font-family:Arial,sans-serif"><h1>지식을 찾을 수 없습니다.</h1><p><a href="/knowledge">지식 허브로 돌아가기</a></p></main></body></html>', 404, { "Cache-Control": "no-store" });
    }

    const response = await app.fetch(request, env, ctx);
    if (url.pathname === "/sitemap.xml") {
      const { entries } = await loadKnowledgeEntries(env);
      return extendSitemap(response, entries);
    }
    if (url.pathname === "/llms.txt") return extendLlms(response);
    return injectKnowledgeNavigation(response);
  }
};

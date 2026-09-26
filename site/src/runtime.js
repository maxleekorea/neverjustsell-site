import app from "./index.js";
import {
  findKnowledgeEntry,
  knowledgeSitemapXml,
  renderKnowledgeEntry,
  renderKnowledgeIndex
} from "./knowledge-hub.js";

const CANONICAL_SITE_ORIGIN = "https://www.neverjustsell.com";

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

async function injectKnowledgeNavigation(response) {
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes('href="/knowledge"')) return new Response(body, { status: response.status, headers: response.headers });
  const updated = body.replaceAll('<a href="/content">콘텐츠</a>', '<a href="/content">콘텐츠</a><a href="/knowledge">지식</a>');
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(updated, { status: response.status, headers });
}

async function extendSitemap(response) {
  if (response.status !== 200) return response;
  const body = await response.text();
  if (!body.includes("</urlset>")) return new Response(body, { status: response.status, headers: response.headers });
  const additions = knowledgeSitemapXml().map(url => `  <url><loc>${url}</loc></url>`).join("\n");
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
  return new Response(`${body}\nKnowledge Hub: ${CANONICAL_SITE_ORIGIN}/knowledge\n`, { status: response.status, headers });
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

    if (request.method === "GET" && (url.pathname === "/knowledge" || url.pathname === "/knowledge/")) {
      return html(renderKnowledgeIndex());
    }

    if (request.method === "GET" && url.pathname.startsWith("/knowledge/")) {
      const slug = decodeURIComponent(url.pathname.slice("/knowledge/".length)).replace(/\/$/, "");
      const entry = findKnowledgeEntry(slug);
      if (entry) return html(renderKnowledgeEntry(entry));
      return html('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>지식을 찾을 수 없습니다 | NEVER JUST SELL</title></head><body><main style="max-width:720px;margin:80px auto;padding:20px;font-family:Arial,sans-serif"><h1>지식을 찾을 수 없습니다.</h1><p><a href="/knowledge">지식 허브로 돌아가기</a></p></main></body></html>', 404, { "Cache-Control": "no-store" });
    }

    const response = await app.fetch(request, env, ctx);
    if (url.pathname === "/sitemap.xml") return extendSitemap(response);
    if (url.pathname === "/llms.txt") return extendLlms(response);
    return injectKnowledgeNavigation(response);
  }
};

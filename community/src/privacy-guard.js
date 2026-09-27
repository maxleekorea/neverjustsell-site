function textNotFound() {
  return new Response("페이지를 찾을 수 없습니다.", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}

export async function guardRestrictedPostRequest(request, env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/p\/(\d+)(?:\/|$)/);
  if (!match || !env.DB) return null;
  const postId = Number(match[1]);
  if (!Number.isInteger(postId) || postId <= 0) return null;
  const row = await env.DB.prepare("SELECT id,visibility,space_id FROM posts WHERE id=? LIMIT 1").bind(postId).first();
  if (!row?.id) return null;
  if (String(row.visibility || "public") !== "public" || row.space_id) return textNotFound();
  return null;
}

function publicListPath(pathname) {
  return pathname === "/" || pathname.startsWith("/c/") || pathname.startsWith("/member/");
}

export async function filterRestrictedPostsFromPublicLists(response, request, env) {
  if (
    request.method !== "GET" ||
    response.status !== 200 ||
    !publicListPath(new URL(request.url).pathname) ||
    !String(response.headers.get("Content-Type") || "").includes("text/html") ||
    !env.DB
  ) return response;

  const result = await env.DB.prepare("SELECT id FROM posts WHERE status='published' AND (visibility!='public' OR space_id IS NOT NULL) LIMIT 500").all();
  const ids = (result.results || []).map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0);
  if (!ids.length) return response;

  let body = await response.text();
  for (const id of ids) {
    const rowPattern = new RegExp(`<a class="post-row" href="/p/${id}/[^"]+">[\\s\\S]*?<\\/a>`, "g");
    body = body.replace(rowPattern, "");
  }

  for (const id of ids) {
    if (body.includes(`/p/${id}/`)) {
      console.error("restricted post remained on public list", id);
      return new Response("공개 목록을 안전하게 구성하지 못했습니다.", {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive"
        }
      });
    }
  }

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body, { status: response.status, headers });
}

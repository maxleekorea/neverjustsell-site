import { getMemberSession } from "./spaces.js";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function reportForm(session, targetType, targetId, returnTo) {
  return `<details class="njs-report"><summary>신고</summary><form method="post" action="/report"><input type="hidden" name="csrf" value="${esc(session.csrf_token)}"><input type="hidden" name="target_type" value="${esc(targetType)}"><input type="hidden" name="target_id" value="${Number(targetId)}"><input type="hidden" name="return_to" value="${esc(returnTo)}"><select name="reason" required><option value="">사유 선택</option><option value="스팸 또는 광고">스팸 또는 광고</option><option value="욕설·괴롭힘">욕설·괴롭힘</option><option value="개인정보 노출">개인정보 노출</option><option value="허위·위험 정보">허위·위험 정보</option><option value="기타 운영자 검토 요청">기타</option></select><button type="submit">신고 접수</button></form></details>`;
}

export async function injectPublicOperations(response, request, env) {
  if (request.method !== "GET" || response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/p\/(\d+)(?:\/|$)/);
  if (!match || !env.DB) return response;
  const session = await getMemberSession(request, env);
  if (!session) return response;

  const postId = Number(match[1]);
  const post = await env.DB.prepare("SELECT id,visibility,space_id FROM posts WHERE id=? AND status='published' LIMIT 1").bind(postId).first();
  if (!post?.id || post.visibility !== "public" || post.space_id) return response;
  const comments = await env.DB.prepare("SELECT id FROM comments WHERE post_id=? AND status='published' ORDER BY created_at ASC,id ASC LIMIT 200").bind(postId).all();
  const ids = (comments.results || []).map((row) => Number(row.id));
  let body = await response.text();
  const style = `<style id="njs-public-ops-style">.njs-report{display:inline-block;margin-left:8px;font-size:12px;color:#75685d}.njs-report>summary{cursor:pointer;list-style:none;text-decoration:underline}.njs-report>summary::-webkit-details-marker{display:none}.njs-report form{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.njs-report select{max-width:190px;padding:7px;border:1px solid #cec4b8;background:#fff}.njs-report button{border:1px solid #bdb2a6;background:#fff;padding:7px 9px;cursor:pointer}.comment .njs-report{display:block;margin:8px 0 0}</style>`;
  if (!body.includes("njs-public-ops-style")) body = body.replace("</head>", style + "</head>");
  const returnTo = url.pathname;
  const postForm = reportForm(session,"post",postId,returnTo);
  body = body.replace(/(<div class="stats">[\s\S]*?)(<\/div><\/article><section class="comments">)/, `$1${postForm}$2`);
  let commentIndex = 0;
  body = body.replace(/<article class="comment">[\s\S]*?<\/article>/g, (chunk) => {
    const id = ids[commentIndex++];
    if (!id) return chunk;
    return chunk.replace("</article>", reportForm(session,"comment",id,returnTo) + "</article>");
  });
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body, { status: response.status, headers });
}

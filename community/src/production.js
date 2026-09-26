import community from "./index.js";
import { ensurePrelaunchSeed } from "./prelaunch-seed.js";
import { ensurePrelaunchFollowups } from "./prelaunch-followups.js";

let seedPromise = null;

async function ensureSeed(env) {
  if (!seedPromise) {
    seedPromise = (async () => {
      const base = await ensurePrelaunchSeed(env);
      const depth = await ensurePrelaunchFollowups(env);
      return { base, depth };
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
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

async function injectCourseQa(response, env) {
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const items = await getCourseQa(env, 6);
  if (!items.length) return response;

  const body = await response.text();
  const marker = '<footer class="footer">';
  if (!body.includes(marker)) return new Response(body, { status: response.status, headers: response.headers });
  const cards = items.map((item) => {
    const href = `https://classroom.neverjustsell.com/courses/${encodeURIComponent(item.course_slug || "")}#course-qna`;
    return `<article style="background:#fff;border:1px solid #ddd5cb;padding:20px"><div style="font-size:11px;color:#765333;font-weight:800;margin-bottom:7px">${esc(item.course_title || "강의 Q&A")}</div><h3 style="font-size:17px;line-height:1.45;margin:0 0 8px">${esc(item.question)}</h3><p style="font-size:13px;color:#756d65;line-height:1.65;margin:0 0 10px">${esc(item.answer || "")}</p><a href="${href}" style="font-size:12px;font-weight:700">${esc(item.lesson_title || "강의에서 확인하기")} →</a></article>`;
  }).join("");
  const section = `<section class="shell" style="margin-top:46px;margin-bottom:54px"><div class="section-head"><div><div style="font-size:11px;font-weight:800;letter-spacing:.12em;color:#77502e">COURSE Q&A</div><h2>강의에서 많이 묻는 질문</h2></div><a href="https://classroom.neverjustsell.com/courses" style="font-size:13px">강의 전체 보기</a></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">${cards}</div></section>`;
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, section + marker), { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Seed/reconcile only through the explicit diagnostic route. Never make ordinary
    // community page views pay for idempotent seed checks on a cold Worker isolate.
    if (url.pathname === "/auth/prelaunch-seed-status") {
      try {
        const seedState = await ensureSeed(env);
        const qas = await getCourseQa(env, 30);
        const base = seedState?.base || { ok: false, error: "seed_unavailable" };
        const depth = seedState?.depth || { ok: false, error: "discussion_depth_unavailable" };
        const ok = Boolean(base?.ok && depth?.ok && qas.length >= 23);
        return json({
          ...base,
          discussion_depth: depth,
          meaningful_replies: Number(depth?.meaningful_replies || 0),
          course_qa_count: qas.length,
          ok
        }, ok ? 200 : 503);
      } catch (error) {
        console.error("prelaunch community seed failed", error);
        return json({ ok: false, error: String(error?.message || error) }, 503);
      }
    }

    const response = await community.fetch(request, env, ctx);
    if (request.method === "GET" && url.pathname === "/") {
      return injectCourseQa(response, env);
    }
    return response;
  }
};

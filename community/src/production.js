import community from "./index.js";
import { ensurePrelaunchSeed } from "./prelaunch-seed.js";

let seedPromise = null;

async function ensureSeed(env) {
  if (!seedPromise) {
    seedPromise = ensurePrelaunchSeed(env).catch((error) => {
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let seedState = null;

    try {
      seedState = await ensureSeed(env);
    } catch (error) {
      console.error("prelaunch community seed failed", error);
      if (url.pathname === "/auth/prelaunch-seed-status") {
        return json({ ok: false, error: String(error?.message || error) }, 503);
      }
    }

    if (url.pathname === "/auth/prelaunch-seed-status") {
      return json(seedState || { ok: false, error: "seed_unavailable" }, seedState?.ok ? 200 : 503);
    }

    return community.fetch(request, env, ctx);
  }
};

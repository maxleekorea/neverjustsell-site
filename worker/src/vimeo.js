const VIMEO_API_ORIGIN = "https://api.vimeo.com";

const COURSE_TARGETS = [
  {
    key: "naver-search-algorithm",
    required: ["알고리즘"],
    preferred: ["네이버", "온라인", "유통", "역사"]
  },
  {
    key: "naver-keyword-strategy",
    required: ["키워드"],
    preferred: ["네이버", "쇼핑", "전략"]
  }
];

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function tokenReady(env) {
  return Boolean(String(env.VIMEO_ACCESS_TOKEN || "").trim());
}

function authHeaders(env) {
  return {
    Authorization: `Bearer ${String(env.VIMEO_ACCESS_TOKEN || "").trim()}`,
    Accept: "application/vnd.vimeo.*+json;version=3.4"
  };
}

async function vimeoGet(url, env) {
  const response = await fetch(url, { headers: authHeaders(env) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Vimeo API failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  return payload;
}

function videoId(uri) {
  const match = String(uri || "").match(/\/videos\/(\d+)/);
  return match ? match[1] : null;
}

function normalized(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function scoreVideo(video, target) {
  const name = normalized(video?.name);
  if (!target.required.every((term) => name.includes(normalized(term)))) return -1;
  return target.required.length * 10 +
    target.preferred.reduce((score, term) => score + (name.includes(normalized(term)) ? 2 : 0), 0);
}

async function listVideos(env) {
  const videos = [];
  let next = `${VIMEO_API_ORIGIN}/me/videos?per_page=100&sort=date&direction=desc`;

  for (let page = 0; page < 5 && next; page += 1) {
    const payload = await vimeoGet(next, env);
    if (Array.isArray(payload.data)) videos.push(...payload.data);

    const nextPath = payload?.paging?.next;
    next = nextPath ? new URL(nextPath, VIMEO_API_ORIGIN).toString() : null;
  }

  return videos;
}

function courseCandidates(videos) {
  return COURSE_TARGETS.map((target) => {
    const candidates = videos
      .map((video) => ({ video, score: scoreVideo(video, target) }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ video, score }) => ({
        score,
        vimeo_id: videoId(video.uri),
        name: video.name || null,
        duration: video.duration ?? null,
        privacy: video.privacy?.view || null,
        created_time: video.created_time || null,
        modified_time: video.modified_time || null
      }));

    return {
      course_key: target.key,
      candidate_count: candidates.length,
      candidates
    };
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!tokenReady(env)) {
      return json(
        { ok: false, connected: false, error: "vimeo_token_missing" },
        { status: 503 }
      );
    }

    try {
      if (url.pathname === "/vimeo/status") {
        const me = await vimeoGet(`${VIMEO_API_ORIGIN}/me`, env);
        return json({
          ok: true,
          connected: true,
          account_received: Boolean(me?.uri),
          account_name: me?.name || null
        });
      }

      if (url.pathname === "/vimeo/course-candidates") {
        const videos = await listVideos(env);
        return json({
          ok: true,
          connected: true,
          scanned_video_count: videos.length,
          targets: courseCandidates(videos)
        });
      }

      return json({ ok: false, error: "not_found" }, { status: 404 });
    } catch (error) {
      return json(
        {
          ok: false,
          connected: false,
          error: "vimeo_api_failed",
          detail: String(error?.message || error)
        },
        { status: 502 }
      );
    }
  }
};

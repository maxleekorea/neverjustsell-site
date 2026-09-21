function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/course-admin/health") {
      return json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (!env.COURSE_DB) {
      return json(
        { ok: false, connected: false, error: "course_db_missing" },
        { status: 503 }
      );
    }

    try {
      const expected = ["courses", "lessons", "video_uploads"];
      const result = await env.COURSE_DB
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('courses','lessons','video_uploads') ORDER BY name"
        )
        .all();
      const tables = Array.isArray(result?.results)
        ? result.results.map((row) => row.name).filter(Boolean)
        : [];
      const missing = expected.filter((name) => !tables.includes(name));

      return json({
        ok: missing.length === 0,
        connected: true,
        database: "neverjustsell-courses",
        tables,
        missing_tables: missing
      }, { status: missing.length === 0 ? 200 : 503 });
    } catch (error) {
      return json(
        {
          ok: false,
          connected: true,
          error: "course_db_check_failed",
          detail: String(error?.message || error)
        },
        { status: 502 }
      );
    }
  }
};

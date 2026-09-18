import app from "./index.js";

const DEFAULT_AUTH_ORIGIN = "https://neverjustsell-course-access.max-lee-korea.workers.dev";

function cleanOrigin(value, fallback) {
  try {
    return new URL(String(value || fallback)).origin;
  } catch {
    return fallback;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/login") {
      const authOrigin = cleanOrigin(env.AUTH_ORIGIN, DEFAULT_AUTH_ORIGIN);
      const target = new URL("/site-login", authOrigin);
      target.searchParams.set("return_to", `${url.origin}/`);
      return Response.redirect(target.toString(), 302);
    }

    return app.fetch(request, env, ctx);
  }
};

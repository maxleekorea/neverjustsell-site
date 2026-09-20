import app from "./index.js";

const CANONICAL_SITE_ORIGIN = "https://www.neverjustsell.com";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Public-site responsibility is intentionally small:
    // canonical host + public content/navigation only.
    // Customer authentication and purchase authorization belong to classroom/auth.
    if (url.hostname === "neverjustsell.com") {
      const target = new URL(`${url.pathname}${url.search}`, CANONICAL_SITE_ORIGIN);
      return Response.redirect(target.toString(), 308);
    }

    // Transitional compatibility for old in-flight/site-login links.
    // No site authentication cookie is created here.
    if (url.pathname === "/auth/complete") {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Cache-Control": "no-store"
        }
      });
    }

    return app.fetch(request, env, ctx);
  }
};

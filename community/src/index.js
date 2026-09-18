// Dedicated Cloudflare Worker entry for the NEVER JUST SELL community.
import { onRequest } from "../functions/[[path]].js";

export default {
  async fetch(request, env, ctx) {
    return onRequest({
      request,
      env,
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException?.bind(ctx),
      params: {},
      data: {}
    });
  }
};

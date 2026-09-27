import production from "./production.js";
import { handleSpaceRequest } from "./spaces.js";
import { handleIntentWritePost } from "./intent-write.js";

export default {
  async fetch(request, env, ctx) {
    try {
      const spaceResponse = await handleSpaceRequest(request, env);
      if (spaceResponse) return spaceResponse;
    } catch (error) {
      console.error("community space route failed", error);
      return new Response("모임을 불러오는 중 오류가 발생했습니다.", {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

    try {
      const intentResponse = await handleIntentWritePost(request, env);
      if (intentResponse) return intentResponse;
    } catch (error) {
      console.error("community intent write failed", error);
      return new Response("글을 등록하는 중 오류가 발생했습니다.", {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

    return production.fetch(request, env, ctx);
  }
};

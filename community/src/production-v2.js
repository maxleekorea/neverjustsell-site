import production from "./production.js";
import { handleSpaceRequest } from "./spaces.js";
import { handleIntentWritePost } from "./intent-write.js";
import { refreshSpaceAccess } from "./space-refresh.js";

function textError(message, status = 500) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/spaces" || url.pathname.startsWith("/spaces/")) {
      try {
        const access = await refreshSpaceAccess(request, env);
        if (!access.ok && !access.anonymous) {
          console.error("program space access refresh failed closed", access.error);
          return textError("모임 이용 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
        }
        const spaceResponse = await handleSpaceRequest(request, env);
        if (spaceResponse) return spaceResponse;
      } catch (error) {
        console.error("community space route failed", error);
        return textError("모임을 불러오는 중 오류가 발생했습니다.");
      }
    }

    try {
      const intentResponse = await handleIntentWritePost(request, env);
      if (intentResponse) return intentResponse;
    } catch (error) {
      console.error("community intent write failed", error);
      return textError("글을 등록하는 중 오류가 발생했습니다.");
    }

    return production.fetch(request, env, ctx);
  }
};

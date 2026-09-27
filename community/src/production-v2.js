import production from "./production.js";
import { handleSpaceRequest } from "./spaces.js";
import { handleIntentWritePost } from "./intent-write.js";
import { refreshSpaceAccess } from "./space-refresh.js";
import { handleCourseDiscussionRequest } from "./course-discussions.js";
import { guardRestrictedPostRequest, filterRestrictedPostsFromPublicLists } from "./privacy-guard.js";

function textError(message, status = 500) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

async function addMemberSpaceNavigation(response, request) {
  if (request.method !== "GET" || response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  let body = await response.text();
  if (body.includes('href="/spaces"')) return new Response(body, { status: response.status, headers: response.headers });
  body = body.replace('<a href="/course-questions">강의 질문</a>', '<a href="/course-questions">강의 질문</a><a href="/spaces">내 모임</a>');
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      const blocked = await guardRestrictedPostRequest(request, env);
      if (blocked) return blocked;
    } catch (error) {
      console.error("restricted post guard failed closed", error);
      return textError("게시글 공개 범위를 확인하지 못했습니다.", 503);
    }

    if (url.pathname === "/course-questions" || url.pathname.startsWith("/course-questions/")) {
      try {
        const response = await handleCourseDiscussionRequest(request, env);
        if (response) return response;
      } catch (error) {
        console.error("shared course discussion route failed", error);
        return textError("강의 질문을 불러오는 중 오류가 발생했습니다.");
      }
    }

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

    let response = await production.fetch(request, env, ctx);
    try {
      response = await filterRestrictedPostsFromPublicLists(response, request, env);
    } catch (error) {
      console.error("public restricted-post filter failed closed", error);
      return textError("공개 목록을 안전하게 구성하지 못했습니다.", 503);
    }
    return addMemberSpaceNavigation(response, request);
  }
};

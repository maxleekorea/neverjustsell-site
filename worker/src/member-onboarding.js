const SITE_ORIGIN = "https://www.neverjustsell.com";
const COMMUNITY_ORIGIN = "https://community.neverjustsell.com";

export async function injectMemberNextActions(response, request) {
  if (request.method !== "GET") return response;
  const url = new URL(request.url);
  if (url.pathname !== "/my-space") return response;
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;

  const body = await response.text();
  if (body.includes('id="member-next-actions"')) {
    return new Response(body, { status: response.status, headers: response.headers });
  }
  const marker = "</main></body>";
  if (!body.includes(marker)) return new Response(body, { status: response.status, headers: response.headers });

  const section = `<style id="member-next-actions-style">
.member-next-actions{margin-top:34px}.member-next-actions h2{font-size:22px;margin:0 0 6px}.member-next-actions>p{margin:0 0 14px;color:#888;font-size:13px;line-height:1.6}.member-next-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.member-next-card{display:block;background:#151515;border:1px solid #292929;border-radius:16px;padding:19px;text-decoration:none}.member-next-card span{font-size:10px;letter-spacing:.1em;color:#888}.member-next-card strong{display:block;margin-top:8px;font-size:17px}.member-next-card p{margin:7px 0 0;color:#8d8d8d;font-size:12px;line-height:1.55}@media(max-width:650px){.member-next-grid{grid-template-columns:1fr}.member-next-card{padding:17px}}
</style><section class="member-next-actions" id="member-next-actions"><h2>다음으로 할 수 있는 것</h2><p>새 기능을 찾아 헤매지 않아도 되도록 자주 쓰는 세 곳만 연결합니다.</p><div class="member-next-grid"><a class="member-next-card" href="${SITE_ORIGIN}/knowledge"><span>KNOWLEDGE</span><strong>무료 지식 보기</strong><p>용어·사례·브리핑을 짧게 읽고 필요한 내용을 찾아봅니다.</p></a><a class="member-next-card" href="/courses"><span>COURSES</span><strong>강의 찾기</strong><p>무료 강의를 신청하거나 준비 중인 강의의 커리큘럼과 Q&A를 확인합니다.</p></a><a class="member-next-card" href="${COMMUNITY_ORIGIN}/"><span>COMMUNITY</span><strong>질문과 사례 보기</strong><p>온라인 판매 질문, 사례와 토론을 보고 필요한 대화로 이어갑니다.</p></a></div></section>`;

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, section + marker), { status: response.status, headers });
}

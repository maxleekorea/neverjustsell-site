import { getCustomerSession } from "./session-orders.js";

const SITE_ORIGIN = "https://www.neverjustsell.com";

function num(value) {
  return Math.max(0, Number(value || 0));
}

async function memberAccumulation(env, memberId) {
  const empty = {
    knowledgeSaved: 0,
    lessonsTracked: 0,
    lessonsCompleted: 0,
    programsActive: 0,
    programsCompleted: 0
  };
  if (!env?.COURSE_DB || !memberId) return empty;

  try {
    const [knowledge, learning, programs] = await Promise.all([
      env.COURSE_DB.prepare(
        "SELECT COUNT(*) AS count FROM knowledge_saves WHERE member_id=?"
      ).bind(memberId).first(),
      env.COURSE_DB.prepare(
        "SELECT COUNT(*) AS tracked,SUM(CASE WHEN completed=1 THEN 1 ELSE 0 END) AS completed FROM lesson_progress WHERE member_id=?"
      ).bind(memberId).first(),
      env.COURSE_DB.prepare(
        "SELECT SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed FROM program_enrollments WHERE member_id=? AND status IN ('active','completed')"
      ).bind(memberId).first()
    ]);

    return {
      knowledgeSaved: num(knowledge?.count),
      lessonsTracked: num(learning?.tracked),
      lessonsCompleted: num(learning?.completed),
      programsActive: num(programs?.active),
      programsCompleted: num(programs?.completed)
    };
  } catch (error) {
    console.error("member accumulation lookup failed", error);
    return empty;
  }
}

function accumulationCards(state) {
  const cards = [];

  if (state.knowledgeSaved > 0) {
    cards.push(`<a class="member-next-card" href="${SITE_ORIGIN}/knowledge/saved"><span>KNOWLEDGE</span><strong>저장한 지식 ${state.knowledgeSaved}개</strong><p>필요해서 남겨둔 지식을 다시 찾고 이어서 읽습니다.</p></a>`);
  } else {
    cards.push(`<a class="member-next-card" href="${SITE_ORIGIN}/knowledge"><span>KNOWLEDGE</span><strong>첫 지식을 저장해 보세요</strong><p>유용한 지식을 저장하면 내 공간에서 다시 이어볼 수 있습니다.</p></a>`);
  }

  if (state.lessonsTracked > 0) {
    cards.push(`<a class="member-next-card" href="/library"><span>LEARNING</span><strong>학습 기록 ${state.lessonsTracked}개 차시</strong><p>${state.lessonsCompleted}개 차시를 완료했습니다. 마지막 학습에서 이어갑니다.</p></a>`);
  } else {
    cards.push(`<a class="member-next-card" href="/courses"><span>LEARNING</span><strong>첫 학습 기록 만들기</strong><p>강의를 시작하면 진행과 완료 기록이 이곳에 쌓입니다.</p></a>`);
  }

  const programCount = state.programsActive + state.programsCompleted;
  if (programCount > 0) {
    cards.push(`<a class="member-next-card" href="/programs"><span>PROGRAM</span><strong>참여 프로그램 ${programCount}개</strong><p>진행 중 ${state.programsActive}개 · 완료 ${state.programsCompleted}개. 지금 해야 할 활동과 남긴 기록을 이어갑니다.</p></a>`);
  }

  return cards.join("");
}

export async function injectMemberNextActions(response, request, env) {
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

  const session = await getCustomerSession(request, env);
  const memberId = String(session?.record?.member_id || "").trim();
  if (!memberId) return new Response(body, { status: response.status, headers: response.headers });

  const state = await memberAccumulation(env, memberId);
  const cards = accumulationCards(state);
  const section = `<style id="member-next-actions-style">
.member-next-actions{margin-top:34px}.member-next-actions h2{font-size:22px;margin:0 0 6px}.member-next-actions>p{margin:0 0 14px;color:#888;font-size:13px;line-height:1.6}.member-next-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.member-next-card{display:block;background:#151515;border:1px solid #292929;border-radius:16px;padding:19px;text-decoration:none}.member-next-card span{font-size:10px;letter-spacing:.1em;color:#888}.member-next-card strong{display:block;margin-top:8px;font-size:17px}.member-next-card p{margin:7px 0 0;color:#8d8d8d;font-size:12px;line-height:1.55}@media(max-width:650px){.member-next-grid{grid-template-columns:1fr}.member-next-card{padding:17px}}
</style><section class="member-next-actions" id="member-next-actions"><h2>내가 쌓아둔 것</h2><p>저장하고 배우고 참여한 기록이 한곳에 남습니다. 다음 방문은 여기에서 이어갑니다.</p><div class="member-next-grid">${cards}</div></section>`;

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, section + marker), { status: response.status, headers });
}

export { memberAccumulation, accumulationCards };

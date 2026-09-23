export const USER_ROLES = Object.freeze({
  LEARNER: "learner",
  CREATOR: "creator",
  REVIEWER: "reviewer",
  PLATFORM_ADMIN: "platform_admin"
});

export async function getActiveRoles(env, memberId) {
  if (!env.COURSE_DB || !memberId) return new Set();
  const result = await env.COURSE_DB.prepare(
    "SELECT role FROM user_roles WHERE member_id=? AND status='active' ORDER BY role"
  ).bind(String(memberId)).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return new Set(rows.map((row) => row.role).filter(Boolean));
}

export async function hasActiveRole(env, memberId, role) {
  if (!env.COURSE_DB || !memberId || !role) return false;
  const row = await env.COURSE_DB.prepare(
    "SELECT 1 AS ok FROM user_roles WHERE member_id=? AND role=? AND status='active' LIMIT 1"
  ).bind(String(memberId), String(role)).first();
  return Boolean(row?.ok);
}

export async function listActiveCreators(env) {
  if (!env.COURSE_DB) return [];
  const result = await env.COURSE_DB.prepare(
    "SELECT member_id FROM user_roles WHERE role='creator' AND status='active' ORDER BY member_id"
  ).all();
  return Array.isArray(result?.results)
    ? result.results.map((row) => String(row.member_id || "")).filter(Boolean)
    : [];
}

export async function assertActiveCreator(env, memberId) {
  if (!memberId) return;
  const active = await hasActiveRole(env, memberId, USER_ROLES.CREATOR);
  if (!active) throw new Error("승인된 콘텐츠 공급자만 강의 소유자로 지정할 수 있습니다.");
}

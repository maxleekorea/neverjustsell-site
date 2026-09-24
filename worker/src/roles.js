export const USER_ROLES = Object.freeze({
  LEARNER: "learner",
  CREATOR: "creator",
  REVIEWER: "reviewer",
  PLATFORM_ADMIN: "platform_admin"
});

export const PLATFORM_ROLES = Object.freeze({
  PLATFORM_OWNER: "platform_owner",
  STAFF_OPERATOR: "staff_operator",
  CREATOR: "creator"
});

export const SCOPED_ROLES = Object.freeze({
  PROGRAM_HOST: "program_host",
  PROGRAM_MODERATOR: "program_moderator",
  SPACE_MODERATOR: "space_moderator"
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
  const ids = new Set();
  try {
    const result = await env.COURSE_DB.prepare(
      "SELECT member_id FROM platform_role_grants WHERE role='creator' AND status='active' ORDER BY member_id"
    ).all();
    for (const row of (Array.isArray(result?.results) ? result.results : [])) {
      if (row.member_id) ids.add(String(row.member_id));
    }
  } catch {}
  try {
    const legacy = await env.COURSE_DB.prepare(
      "SELECT member_id FROM user_roles WHERE role='creator' AND status='active' ORDER BY member_id"
    ).all();
    for (const row of (Array.isArray(legacy?.results) ? legacy.results : [])) {
      if (row.member_id) ids.add(String(row.member_id));
    }
  } catch {}
  return [...ids].sort();
}

export async function assertActiveCreator(env, memberId) {
  if (!memberId) return;
  const active =
    await hasActivePlatformRole(env, memberId, PLATFORM_ROLES.CREATOR) ||
    await hasActiveRole(env, memberId, USER_ROLES.CREATOR);
  if (!active) throw new Error("승인된 콘텐츠 공급자만 강의 소유자로 지정할 수 있습니다.");
}


export async function getActivePlatformRoles(env, memberId) {
  if (!env.COURSE_DB || !memberId) return new Set();
  try {
    const result = await env.COURSE_DB.prepare(
      "SELECT role FROM platform_role_grants WHERE member_id=? AND status='active' ORDER BY role"
    ).bind(String(memberId)).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => row.role).filter(Boolean));
  } catch {
    // Backward-compatible fallback before the program/community migration is deployed.
    const legacy = await getActiveRoles(env, memberId);
    const mapped = new Set();
    if (legacy.has(USER_ROLES.PLATFORM_ADMIN)) mapped.add(PLATFORM_ROLES.PLATFORM_OWNER);
    if (legacy.has(USER_ROLES.CREATOR)) mapped.add(PLATFORM_ROLES.CREATOR);
    return mapped;
  }
}

export async function hasActivePlatformRole(env, memberId, role) {
  const roles = await getActivePlatformRoles(env, memberId);
  return roles.has(String(role));
}

export async function hasActiveScopedRole(env, memberId, role, scopeType, scopeId) {
  if (!env.COURSE_DB || !memberId || !role || !scopeType || !scopeId) return false;
  try {
    const row = await env.COURSE_DB.prepare(
      "SELECT 1 AS ok FROM scoped_role_grants WHERE member_id=? AND role=? AND scope_type=? AND scope_id=? AND status='active' LIMIT 1"
    ).bind(String(memberId), String(role), String(scopeType), String(scopeId)).first();
    return Boolean(row?.ok);
  } catch {
    return false;
  }
}

export async function listScopedRoleGrants(env, memberId) {
  if (!env.COURSE_DB || !memberId) return [];
  try {
    const result = await env.COURSE_DB.prepare(
      "SELECT role,scope_type,scope_id,status,granted_by,created_at,updated_at FROM scoped_role_grants WHERE member_id=? AND status='active' ORDER BY scope_type,scope_id,role"
    ).bind(String(memberId)).all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch {
    return [];
  }
}

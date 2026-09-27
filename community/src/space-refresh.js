import { syncMemberProgramSpaces, revokeProjectedProgramSpaces } from "./program-access.js";

const SESSION_COOKIE = "njs_community_session";

function parseCookies(request) {
  const header = String(request.headers.get("Cookie") || "");
  const result = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    const key = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    try { result[key] = decodeURIComponent(raw); } catch { result[key] = raw; }
  }
  return result;
}

export async function refreshSpaceAccess(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/spaces" && !url.pathname.startsWith("/spaces/")) {
    return { ok: true, skipped: true };
  }
  if (!env.DB || !env.AUTH_BRIDGE) return { ok: false, error: "community_binding_missing" };
  const sessionId = parseCookies(request)[SESSION_COOKIE];
  if (!sessionId) return { ok: true, anonymous: true, skipped: true };
  const row = await env.DB.prepare("SELECT member_id FROM sessions WHERE session_id=? AND expires_at>CURRENT_TIMESTAMP LIMIT 1")
    .bind(sessionId).first();
  const memberId = String(row?.member_id || "").trim();
  if (!memberId) return { ok: true, anonymous: true, skipped: true };

  try {
    const identity = await env.AUTH_BRIDGE.getCommunityIdentity(memberId);
    if (!identity?.ok || String(identity?.member_id || "") !== memberId) throw new Error("authoritative_identity_mismatch");
    const projection = await syncMemberProgramSpaces(env, memberId, identity);
    return { ok: true, member_id: memberId, projection };
  } catch (error) {
    await revokeProjectedProgramSpaces(env, memberId).catch(() => null);
    return { ok: false, member_id: memberId, fail_closed: true, error: String(error?.message || error) };
  }
}

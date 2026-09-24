import { ensureCommunityProgramSchema } from "./program-schema.js";

const RUN_SPACE_DEFS = [
  { type: "announcements", slug: "announcements", name: "공지" },
  { type: "author_qna", slug: "author-qna", name: "저자에게 묻기" },
  { type: "weekly_discussion", slug: "discussion", name: "함께 이야기하기" },
  { type: "live_events", slug: "live-events", name: "라이브·일정" }
];

function moderationLevel(identity, programId, runId) {
  if (identity?.platform_operator === true) return "host";
  let level = null;
  for (const grant of (Array.isArray(identity?.moderation) ? identity.moderation : [])) {
    const matchesProgram = grant.scope_type === "program" && grant.scope_id === programId;
    const matchesRun = grant.scope_type === "program_run" && grant.scope_id === runId;
    if (!matchesProgram && !matchesRun) continue;
    if (grant.role === "program_host") return "host";
    if (grant.role === "program_moderator") level = "moderator";
  }
  return level;
}

function runSpaceId(runId, type) {
  return `space:${runId}:${type}`;
}

function alumniSpaceId(programId) {
  return `space:${programId}:alumni`;
}

async function upsertRunProjection(env, run) {
  await env.DB.prepare(
    "INSERT INTO program_run_projections (run_id,program_id,title,lifecycle_phase,starts_at,ends_at,updated_at) " +
    "VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP) " +
    "ON CONFLICT(run_id) DO UPDATE SET program_id=excluded.program_id,title=excluded.title," +
    "lifecycle_phase=excluded.lifecycle_phase,starts_at=excluded.starts_at,ends_at=excluded.ends_at,updated_at=CURRENT_TIMESTAMP"
  ).bind(
    run.run_id,
    run.program_id,
    run.run_title || run.program_title || run.run_id,
    run.lifecycle_phase || "active",
    run.starts_at || null,
    run.ends_at || null
  ).run();
}

async function ensureRunSpaces(env, run) {
  const ids = [];
  for (const def of RUN_SPACE_DEFS) {
    const id = runSpaceId(run.run_id, def.type);
    ids.push(id);
    await env.DB.prepare(
      "INSERT INTO spaces (id,scope_type,scope_id,space_type,name,slug,visibility,access_rule,status,updated_at) " +
      "VALUES (?,'program_run',?,?,?,?, 'restricted','program_participant','active',CURRENT_TIMESTAMP) " +
      "ON CONFLICT(scope_type,scope_id,slug) DO UPDATE SET name=excluded.name,space_type=excluded.space_type," +
      "visibility='restricted',access_rule='program_participant',updated_at=CURRENT_TIMESTAMP"
    ).bind(
      id,
      run.run_id,
      def.type,
      def.name,
      def.slug
    ).run();
  }
  return ids;
}

async function ensureAlumniSpace(env, programId) {
  const id = alumniSpaceId(programId);
  await env.DB.prepare(
    "INSERT INTO spaces (id,scope_type,scope_id,space_type,name,slug,visibility,access_rule,status,updated_at) " +
    "VALUES (?,'program',?,'alumni','완독자·수료자 모임','alumni','restricted','program_completed','active',CURRENT_TIMESTAMP) " +
    "ON CONFLICT(scope_type,scope_id,slug) DO UPDATE SET visibility='restricted',access_rule='program_completed',updated_at=CURRENT_TIMESTAMP"
  ).bind(id, programId).run();
  return id;
}

async function upsertMembership(env, spaceId, memberId, accessStatus, moderationRole = null) {
  await env.DB.prepare(
    "INSERT INTO space_members (space_id,member_id,access_status,access_source,moderation_role,source_version,granted_at,revoked_at,updated_at) " +
    "VALUES (?,? ,?,'projection',?,'program-access-v1',CURRENT_TIMESTAMP,NULL,CURRENT_TIMESTAMP) " +
    "ON CONFLICT(space_id,member_id) DO UPDATE SET access_status=excluded.access_status,access_source='projection'," +
    "moderation_role=excluded.moderation_role,source_version=excluded.source_version," +
    "revoked_at=NULL,updated_at=CURRENT_TIMESTAMP"
  ).bind(spaceId, memberId, accessStatus, moderationRole).run();
}

function uniqueRuns(identity) {
  const map = new Map();
  for (const source of [
    ...(Array.isArray(identity?.program_access) ? identity.program_access : []),
    ...(Array.isArray(identity?.managed_runs) ? identity.managed_runs : [])
  ]) {
    if (!source?.run_id || !source?.program_id) continue;
    map.set(String(source.run_id), {
      run_id: String(source.run_id),
      program_id: String(source.program_id),
      program_title: String(source.program_title || ""),
      run_title: String(source.run_title || ""),
      starts_at: source.starts_at || null,
      ends_at: source.ends_at || null,
      lifecycle_phase: source.lifecycle_phase || "active"
    });
  }
  return [...map.values()];
}

function accessByRun(identity) {
  const map = new Map();
  for (const access of (Array.isArray(identity?.program_access) ? identity.program_access : [])) {
    if (access?.run_id) map.set(String(access.run_id), access);
  }
  return map;
}

async function applyDirectSpaceModeratorGrants(env, memberId, identity, desired) {
  for (const grant of (Array.isArray(identity?.moderation) ? identity.moderation : [])) {
    if (grant.role !== "space_moderator" || grant.scope_type !== "space" || !grant.scope_id) continue;
    const exists = await env.DB.prepare("SELECT id FROM spaces WHERE id=? AND status!='archived' LIMIT 1")
      .bind(String(grant.scope_id)).first();
    if (!exists?.id) continue;
    await upsertMembership(env, String(grant.scope_id), memberId, "active", "moderator");
    desired.add(String(grant.scope_id));
  }
}

async function revokeMissingProjectionMemberships(env, memberId, desired) {
  const result = await env.DB.prepare(
    "SELECT sm.space_id FROM space_members sm JOIN spaces s ON s.id=sm.space_id " +
    "WHERE sm.member_id=? AND sm.access_source='projection' AND sm.access_status!='revoked' " +
    "AND s.scope_type IN ('program','program_run')"
  ).bind(memberId).all();

  for (const row of (Array.isArray(result.results) ? result.results : [])) {
    const spaceId = String(row.space_id || "");
    if (!spaceId || desired.has(spaceId)) continue;
    await env.DB.prepare(
      "UPDATE space_members SET access_status='revoked',moderation_role=NULL,revoked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP " +
      "WHERE space_id=? AND member_id=? AND access_source='projection'"
    ).bind(spaceId, memberId).run();
  }
}

export async function syncMemberProgramSpaces(env, memberId, identity) {
  await ensureCommunityProgramSchema(env);
  if (!memberId) return { ok: false, error: "member_id_required" };

  const runs = uniqueRuns(identity);
  const accessMap = accessByRun(identity);
  const desired = new Set();
  const completedPrograms = new Set();

  for (const run of runs) {
    await upsertRunProjection(env, run);
    const ids = await ensureRunSpaces(env, run);
    const access = accessMap.get(run.run_id) || null;
    const moderation = moderationLevel(identity, run.program_id, run.run_id);

    if (access?.participant_status === "completed") {
      completedPrograms.add(run.program_id);
    }

    if (!access && !moderation) continue;
    const accessStatus = moderation
      ? "active"
      : access?.participant_status === "completed"
        ? "read_only"
        : "active";

    for (const id of ids) {
      await upsertMembership(env, id, memberId, accessStatus, moderation);
      desired.add(id);
    }
  }

  const programIds = new Set(runs.map((run) => run.program_id));
  for (const programId of programIds) {
    const alumniId = await ensureAlumniSpace(env, programId);
    const hostOrModerator = moderationLevel(identity, programId, "__any__") ||
      (identity?.platform_operator === true ? "host" : null);

    if (completedPrograms.has(programId) || hostOrModerator) {
      await upsertMembership(
        env,
        alumniId,
        memberId,
        "active",
        hostOrModerator
      );
      desired.add(alumniId);
    }
  }

  await applyDirectSpaceModeratorGrants(env, memberId, identity, desired);
  await revokeMissingProjectionMemberships(env, memberId, desired);

  return {
    ok: true,
    run_count: runs.length,
    active_space_count: desired.size,
    completed_program_count: completedPrograms.size
  };
}

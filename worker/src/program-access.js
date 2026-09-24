import { cafe24AdminGet } from "./session-orders.js";
import { findValidCoursePurchase, findRevokedCoursePurchase } from "./access.js";
import { getActivePlatformRoles, PLATFORM_ROLES } from "./roles.js";
import { ensureProgramSchema } from "./program-schema.js";

const PROGRAM_ORDER_START_DATE = "2026-01-01";
const ORDER_WINDOW_DAYS = 89;
const ORDER_PAGE_LIMIT = 1000;
const ORDER_MAX_OFFSET = 15000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function todayDate() {
  return isoDate(new Date(Date.now() + KST_OFFSET_MS));
}

function addUtcDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function buildOrderWindows(startDate, endDate) {
  const windows = [];
  let windowEnd = endDate;
  while (windowEnd >= startDate) {
    const candidateStart = addUtcDays(windowEnd, -ORDER_WINDOW_DAYS);
    const windowStart = candidateStart < startDate ? startDate : candidateStart;
    windows.push({ startDate: windowStart, endDate: windowEnd });
    if (windowStart === startDate) break;
    windowEnd = addUtcDays(windowStart, -1);
  }
  return windows;
}

async function fetchMemberOrders(env, memberId) {
  const orders = [];
  const endDate = todayDate();
  for (const window of buildOrderWindows(PROGRAM_ORDER_START_DATE, endDate)) {
    let offset = 0;
    while (offset <= ORDER_MAX_OFFSET) {
      const payload = await cafe24AdminGet("/orders", env, {
        shop_no: 1,
        start_date: window.startDate,
        end_date: window.endDate,
        date_type: "order_date",
        member_id: memberId,
        embed: "items",
        limit: ORDER_PAGE_LIMIT,
        offset
      });
      const page = Array.isArray(payload.orders) ? payload.orders : [];
      orders.push(...page);
      if (page.length < ORDER_PAGE_LIMIT) break;
      if (offset === ORDER_MAX_OFFSET) {
        throw new Error("Cafe24 program order result exceeds supported pagination range");
      }
      offset += ORDER_PAGE_LIMIT;
    }
  }
  return orders;
}

async function purchasableRuns(env) {
  const result = await env.COURSE_DB.prepare(
    "SELECT r.id AS run_id,r.program_id,r.cafe24_product_no,r.status AS run_status,p.status AS program_status " +
    "FROM program_runs r JOIN programs p ON p.id=r.program_id " +
    "WHERE r.cafe24_product_no IS NOT NULL AND r.cafe24_product_no>0 " +
    "AND r.status!='cancelled' AND p.status!='archived' ORDER BY r.created_at"
  ).all();
  return Array.isArray(result.results) ? result.results : [];
}

async function enrollmentRow(env, runId, memberId) {
  return env.COURSE_DB.prepare(
    "SELECT run_id,member_id,status,source,source_order_id,source_order_item_code,completed_at,reward_status " +
    "FROM program_enrollments WHERE run_id=? AND member_id=? LIMIT 1"
  ).bind(runId, memberId).first();
}

async function activatePurchaseEnrollment(env, run, memberId, purchase, existing) {
  const orderId = purchase?.order?.order_id || null;
  const itemCode = purchase?.item?.order_item_code || null;
  const keepCompleted = existing?.status === "completed";
  const nextStatus = keepCompleted ? "completed" : "active";

  await env.COURSE_DB.prepare(
    "INSERT INTO program_enrollments (" +
      "run_id,member_id,status,source,source_order_id,source_order_item_code,joined_at,started_at,updated_at" +
    ") VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) " +
    "ON CONFLICT(run_id,member_id) DO UPDATE SET " +
      "status=CASE WHEN program_enrollments.status='completed' THEN 'completed' ELSE excluded.status END," +
      "source='purchase',source_order_id=excluded.source_order_id," +
      "source_order_item_code=excluded.source_order_item_code," +
      "started_at=COALESCE(program_enrollments.started_at,CURRENT_TIMESTAMP)," +
      "updated_at=CURRENT_TIMESTAMP"
  ).bind(
    run.run_id,
    memberId,
    nextStatus,
    "purchase",
    orderId,
    itemCode
  ).run();
}

async function revokePurchaseEnrollment(env, runId, memberId, revokedPurchase, existing) {
  if (!existing || existing.source !== "purchase") return;
  const orderId = revokedPurchase?.order?.order_id || existing.source_order_id || null;
  const itemCode = revokedPurchase?.item?.order_item_code || existing.source_order_item_code || null;
  await env.COURSE_DB.prepare(
    "UPDATE program_enrollments SET status='withdrawn'," +
    "source_order_id=COALESCE(?,source_order_id),source_order_item_code=COALESCE(?,source_order_item_code)," +
    "updated_at=CURRENT_TIMESTAMP WHERE run_id=? AND member_id=? AND source='purchase'"
  ).bind(orderId, itemCode, runId, memberId).run();
}

export async function reconcilePurchasedProgramEnrollments(env, memberId) {
  await ensureProgramSchema(env);
  if (!memberId) return { synced: false, order_count: 0, product_count: 0 };

  const runs = await purchasableRuns(env);
  if (!runs.length) return { synced: true, order_count: 0, product_count: 0 };

  const orders = await fetchMemberOrders(env, memberId);

  for (const run of runs) {
    const existing = await enrollmentRow(env, run.run_id, memberId);
    const valid = findValidCoursePurchase(orders, Number(run.cafe24_product_no));
    if (valid) {
      await activatePurchaseEnrollment(env, run, memberId, valid, existing);
      continue;
    }

    const revoked = findRevokedCoursePurchase(orders, Number(run.cafe24_product_no));
    if (revoked || existing?.source === "purchase") {
      await revokePurchaseEnrollment(env, run.run_id, memberId, revoked, existing);
    }
  }

  return {
    synced: true,
    order_count: orders.length,
    product_count: runs.length
  };
}

async function activeProgramAccess(env, memberId) {
  const result = await env.COURSE_DB.prepare(
    "SELECT e.run_id,e.status AS participant_status,e.source,e.completed_at," +
    "r.program_id,r.title AS run_title,r.starts_at,r.ends_at,r.lifecycle_phase," +
    "p.title AS program_title,p.program_type " +
    "FROM program_enrollments e " +
    "JOIN program_runs r ON r.id=e.run_id JOIN programs p ON p.id=r.program_id " +
    "WHERE e.member_id=? AND e.status IN ('active','completed') " +
    "AND r.status!='cancelled' AND p.status!='archived' " +
    "ORDER BY COALESCE(r.starts_at,r.created_at),r.id"
  ).bind(memberId).all();

  return (Array.isArray(result.results) ? result.results : []).map((row) => ({
    run_id: String(row.run_id),
    program_id: String(row.program_id),
    program_title: String(row.program_title || ""),
    run_title: String(row.run_title || ""),
    program_type: String(row.program_type || ""),
    participant_status: String(row.participant_status || ""),
    source: String(row.source || ""),
    starts_at: row.starts_at || null,
    ends_at: row.ends_at || null,
    lifecycle_phase: row.lifecycle_phase || null,
    completed_at: row.completed_at || null
  }));
}

async function moderationGrants(env, memberId) {
  const grants = [];
  const result = await env.COURSE_DB.prepare(
    "SELECT role,scope_type,scope_id FROM scoped_role_grants " +
    "WHERE member_id=? AND status='active' AND role IN ('program_host','program_moderator','space_moderator') " +
    "ORDER BY scope_type,scope_id,role"
  ).bind(memberId).all();

  for (const row of (Array.isArray(result.results) ? result.results : [])) {
    grants.push({
      role: String(row.role),
      scope_type: String(row.scope_type),
      scope_id: String(row.scope_id)
    });
  }

  const owned = await env.COURSE_DB.prepare(
    "SELECT id FROM programs WHERE owner_member_id=? AND status!='archived' ORDER BY id"
  ).bind(memberId).all();

  const seen = new Set(grants.map((g) => `${g.role}|${g.scope_type}|${g.scope_id}`));
  for (const row of (Array.isArray(owned.results) ? owned.results : [])) {
    const key = `program_host|program|${row.id}`;
    if (!seen.has(key)) {
      grants.push({ role: "program_host", scope_type: "program", scope_id: String(row.id) });
      seen.add(key);
    }
  }

  return grants;
}

async function managedRuns(env, memberId, moderation, platformOperator) {
  if (platformOperator) {
    const result = await env.COURSE_DB.prepare(
      "SELECT r.id AS run_id,r.program_id,r.title AS run_title,r.starts_at,r.ends_at,r.lifecycle_phase,p.title AS program_title " +
      "FROM program_runs r JOIN programs p ON p.id=r.program_id " +
      "WHERE r.status!='cancelled' AND p.status!='archived' ORDER BY r.created_at"
    ).all();
    return Array.isArray(result.results) ? result.results : [];
  }

  const programIds = [...new Set(
    moderation.filter((g) => g.scope_type === "program").map((g) => g.scope_id)
  )];
  const runIds = [...new Set(
    moderation.filter((g) => g.scope_type === "program_run").map((g) => g.scope_id)
  )];

  if (!programIds.length && !runIds.length) return [];

  const clauses = [];
  const values = [];
  if (programIds.length) {
    clauses.push(`r.program_id IN (${programIds.map(() => "?").join(",")})`);
    values.push(...programIds);
  }
  if (runIds.length) {
    clauses.push(`r.id IN (${runIds.map(() => "?").join(",")})`);
    values.push(...runIds);
  }

  const result = await env.COURSE_DB.prepare(
    "SELECT r.id AS run_id,r.program_id,r.title AS run_title,r.starts_at,r.ends_at,r.lifecycle_phase,p.title AS program_title " +
    "FROM program_runs r JOIN programs p ON p.id=r.program_id " +
    "WHERE r.status!='cancelled' AND p.status!='archived' AND (" + clauses.join(" OR ") + ") ORDER BY r.created_at"
  ).bind(...values).all();
  return Array.isArray(result.results) ? result.results : [];
}

export async function getProgramCommunityProjection(env, memberId, { syncPurchases = true } = {}) {
  await ensureProgramSchema(env);

  let sync = { synced: false, skipped: true };
  let sync_error = null;
  if (syncPurchases) {
    try {
      sync = await reconcilePurchasedProgramEnrollments(env, memberId);
    } catch (error) {
      sync_error = String(error?.message || error);
    }
  }

  const [access, moderation, platformRoles] = await Promise.all([
    activeProgramAccess(env, memberId),
    moderationGrants(env, memberId),
    getActivePlatformRoles(env, memberId)
  ]);

  const platformOperator =
    platformRoles.has(PLATFORM_ROLES.PLATFORM_OWNER) ||
    platformRoles.has(PLATFORM_ROLES.STAFF_OPERATOR);

  const runs = await managedRuns(env, memberId, moderation, platformOperator);

  return {
    program_access: access,
    moderation,
    managed_runs: runs.map((row) => ({
      run_id: String(row.run_id),
      program_id: String(row.program_id),
      program_title: String(row.program_title || ""),
      run_title: String(row.run_title || ""),
      starts_at: row.starts_at || null,
      ends_at: row.ends_at || null,
      lifecycle_phase: row.lifecycle_phase || null
    })),
    platform_operator: platformOperator,
    sync,
    sync_error
  };
}

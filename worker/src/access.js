import { getCustomerSession, cafe24AdminGet } from "./session-orders.js";

const VALID_PAYMENT_STATUSES = new Set(["T", "A", "P"]);
const REVOKED_STATUS_PREFIXES = new Set(["C", "R", "E"]);
const ENTITLEMENT_START_DATE = "2026-01-01";
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

async function fetchAllOrders(env, params) {
  const orders = [];
  let offset = 0;

  while (offset <= ORDER_MAX_OFFSET) {
    const payload = await cafe24AdminGet("/orders", env, {
      ...params,
      limit: ORDER_PAGE_LIMIT,
      offset
    });
    const page = Array.isArray(payload.orders) ? payload.orders : [];
    orders.push(...page);

    if (page.length < ORDER_PAGE_LIMIT) return orders;
    if (offset === ORDER_MAX_OFFSET) {
      throw new Error("Cafe24 order result exceeds supported pagination range");
    }
    offset += ORDER_PAGE_LIMIT;
  }

  return orders;
}

export function isPaymentConfirmed(order, item) {
  if (item?.paid === "T" || item?.payment_status === "T") return true;
  if (order?.paid === "T" || order?.payment_confirmation === "T") return true;
  return VALID_PAYMENT_STATUSES.has(order?.payment_status || "");
}

export function isItemRevoked(order, item) {
  if (order?.canceled === "T") return true;
  if (order?.refund_status === "T") return true;
  const status = String(item?.order_status || order?.order_status || "");
  return status ? REVOKED_STATUS_PREFIXES.has(status.slice(0, 1)) : false;
}

export function hasValidCourseItem(order, productNo) {
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.some((item) => {
    if (Number(item?.product_no) !== Number(productNo)) return false;
    if (!isPaymentConfirmed(order, item)) return false;
    if (isItemRevoked(order, item)) return false;
    const status = String(item?.order_status || order?.order_status || "");
    return !status || status.startsWith("N");
  });
}

export function findValidCoursePurchase(orders, productNo) {
  const candidates = [];
  for (const order of orders) {
    const items = Array.isArray(order?.items) ? order.items : [];
    for (const item of items) {
      if (Number(item?.product_no) !== Number(productNo)) continue;
      if (!isPaymentConfirmed(order, item)) continue;
      if (isItemRevoked(order, item)) continue;
      const status = String(item?.order_status || order?.order_status || "");
      if (status && !status.startsWith("N")) continue;
      candidates.push({ order, item });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const ad = Date.parse(String(a?.order?.order_date || a?.order?.payment_date || ""));
    const bd = Date.parse(String(b?.order?.order_date || b?.order?.payment_date || ""));
    return (Number.isFinite(bd) ? bd : 0) - (Number.isFinite(ad) ? ad : 0);
  });
  return candidates[0];
}

export function findRevokedCoursePurchase(orders, productNo) {
  for (const order of orders) {
    const items = Array.isArray(order?.items) ? order.items : [];
    for (const item of items) {
      if (Number(item?.product_no) !== Number(productNo)) continue;
      if (isItemRevoked(order, item)) return { order, item };
    }
  }
  return null;
}

async function courseIdForProduct(env, productNo) {
  if (!env.COURSE_DB) return null;
  const row = await env.COURSE_DB.prepare(
    "SELECT id FROM courses WHERE cafe24_product_no=? AND access_type='paid' LIMIT 1"
  ).bind(Number(productNo)).first();
  return row?.id || null;
}

async function getManualEntitlement(env, memberId, courseId) {
  if (!env.COURSE_DB || !memberId || !courseId) return null;
  return env.COURSE_DB.prepare(
    "SELECT member_id,course_id,product_no,status,grant_reason,access_expires_at,granted_at,revoked_at,updated_at FROM course_entitlements WHERE member_id=? AND course_id=? AND grant_reason='manual' LIMIT 1"
  ).bind(memberId, courseId).first();
}

async function expireManualEntitlement(env, row) {
  if (!env.COURSE_DB || !row || row.status !== "active" || row.grant_reason !== "manual") return false;
  const result = await env.COURSE_DB.prepare(
    "UPDATE course_entitlements SET status='revoked',revoked_at=COALESCE(revoked_at,CURRENT_TIMESTAMP),last_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE member_id=? AND course_id=? AND grant_reason='manual' AND status='active'"
  ).bind(row.member_id, row.course_id).run();

  const changed = Number(result?.meta?.changes || 0) > 0;
  if (changed) {
    await env.COURSE_DB.prepare(
      "INSERT INTO course_entitlement_events (id,member_id,course_id,event_type,source_order_id,source_order_item_code,reason,actor_type) VALUES (?,?,?,?,NULL,NULL,?,'system')"
    ).bind(
      crypto.randomUUID(),
      row.member_id,
      row.course_id,
      "expired",
      "수강기간 만료"
    ).run();
  }
  return changed;
}

async function manualAccessDecision(env, memberId, courseId) {
  const row = await getManualEntitlement(env, memberId, courseId);
  if (!row || row.status !== "active") return { active: false, row };

  const expiry = String(row.access_expires_at || "").trim();
  if (expiry && expiry < todayDate()) {
    await expireManualEntitlement(env, row);
    return { active: false, row: { ...row, status: "revoked" }, expired: true };
  }

  return { active: true, row, expired: false };
}

async function coursePurchaseSnapshot(env, courseId) {
  if (!env.COURSE_DB || !courseId) return null;
  return env.COURSE_DB.prepare(
    "SELECT id,price_krw,access_duration_days,refund_policy_version,refund_policy_text,presale_opens_at FROM courses WHERE id=? LIMIT 1"
  ).bind(courseId).first();
}

function paidItemAmount(item) {
  const direct = Number(item?.payment_amount ?? item?.payed_amount);
  return Number.isFinite(direct) && direct >= 0 ? Math.round(direct) : null;
}

function purchaseDate(purchase) {
  const raw = String(
    purchase?.order?.order_date ||
    purchase?.order?.payment_date ||
    purchase?.order?.pay_date ||
    ""
  ).trim();
  return raw || null;
}

function purchaseAccessPeriod(purchasedAt, durationDays) {
  const raw = String(purchasedAt || "").trim();
  const days = Number(durationDays || 0);
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw) || !Number.isInteger(days) || days <= 0) {
    return { startsAt: raw || null, expiresAt: null };
  }
  const startDate = raw.slice(0, 10);
  return {
    startsAt: startDate,
    expiresAt: addUtcDays(startDate, Math.max(0, days - 1))
  };
}

async function persistEntitlement(env, memberId, courseId, productNo, purchase, active) {
  if (!env.COURSE_DB || !memberId || !courseId) return;
  const orderId = purchase?.order?.order_id || null;
  const itemCode = purchase?.item?.order_item_code || null;
  const snapshot = active ? await coursePurchaseSnapshot(env, courseId) : null;
  const purchasedAt = active ? purchaseDate(purchase) : null;
  const purchasePrice = active ? paidItemAmount(purchase?.item) : null;
  const policyVersion = active ? String(snapshot?.refund_policy_version || "").trim() || null : null;
  const policyText = active ? String(snapshot?.refund_policy_text || "").trim() || null : null;
  const durationSnapshot = active && snapshot?.access_duration_days != null
    ? Number(snapshot.access_duration_days)
    : null;
  const accessPeriod = active
    ? purchaseAccessPeriod(purchasedAt, durationSnapshot)
    : { startsAt: null, expiresAt: null };
  const existing = await env.COURSE_DB.prepare(
    "SELECT status,source_order_id,source_order_item_code,grant_reason,access_expires_at FROM course_entitlements WHERE member_id=? AND course_id=? LIMIT 1"
  ).bind(memberId, courseId).first();

  if (active) {
    await env.COURSE_DB.prepare(
      "INSERT INTO course_entitlements (member_id,course_id,product_no,source_order_id,source_order_item_code,status,grant_reason,revoked_at,last_verified_at,purchase_price_krw,purchased_at,policy_version,refund_policy_snapshot,access_duration_days_snapshot,access_starts_at,access_expires_at) " +
      "VALUES (?,?,?,?,?,'active','purchase',NULL,CURRENT_TIMESTAMP,?,?,?,?,?,?,?) " +
      "ON CONFLICT(member_id,course_id) DO UPDATE SET " +
      "product_no=excluded.product_no,source_order_id=excluded.source_order_id,source_order_item_code=excluded.source_order_item_code,status='active',grant_reason='purchase'," +
      "purchase_price_krw=CASE WHEN course_entitlements.grant_reason!='purchase' OR COALESCE(course_entitlements.source_order_id,'')<>COALESCE(excluded.source_order_id,'') THEN excluded.purchase_price_krw ELSE COALESCE(course_entitlements.purchase_price_krw,excluded.purchase_price_krw) END," +
      "purchased_at=CASE WHEN course_entitlements.grant_reason!='purchase' OR COALESCE(course_entitlements.source_order_id,'')<>COALESCE(excluded.source_order_id,'') THEN excluded.purchased_at ELSE COALESCE(course_entitlements.purchased_at,excluded.purchased_at) END," +
      "policy_version=CASE WHEN course_entitlements.grant_reason!='purchase' OR COALESCE(course_entitlements.source_order_id,'')<>COALESCE(excluded.source_order_id,'') THEN excluded.policy_version ELSE COALESCE(course_entitlements.policy_version,excluded.policy_version) END," +
      "refund_policy_snapshot=CASE WHEN course_entitlements.grant_reason!='purchase' OR COALESCE(course_entitlements.source_order_id,'')<>COALESCE(excluded.source_order_id,'') THEN excluded.refund_policy_snapshot ELSE COALESCE(course_entitlements.refund_policy_snapshot,excluded.refund_policy_snapshot) END," +
      "access_duration_days_snapshot=CASE WHEN course_entitlements.grant_reason!='purchase' OR COALESCE(course_entitlements.source_order_id,'')<>COALESCE(excluded.source_order_id,'') THEN excluded.access_duration_days_snapshot ELSE COALESCE(course_entitlements.access_duration_days_snapshot,excluded.access_duration_days_snapshot) END," +
      "access_starts_at=CASE WHEN course_entitlements.grant_reason!='purchase' OR COALESCE(course_entitlements.source_order_id,'')<>COALESCE(excluded.source_order_id,'') THEN excluded.access_starts_at ELSE COALESCE(course_entitlements.access_starts_at,excluded.access_starts_at) END," +
      "access_expires_at=CASE WHEN course_entitlements.grant_reason!='purchase' OR COALESCE(course_entitlements.source_order_id,'')<>COALESCE(excluded.source_order_id,'') THEN excluded.access_expires_at ELSE course_entitlements.access_expires_at END," +
      "revoked_at=NULL,last_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP"
    ).bind(
      memberId,
      courseId,
      Number(productNo),
      orderId,
      itemCode,
      purchasePrice,
      purchasedAt,
      policyVersion,
      policyText,
      durationSnapshot,
      accessPeriod.startsAt,
      accessPeriod.expiresAt
    ).run();

    const changed =
      !existing ||
      existing.status !== "active" ||
      String(existing.source_order_id || "") !== String(orderId || "") ||
      String(existing.source_order_item_code || "") !== String(itemCode || "");
    if (changed) {
      await env.COURSE_DB.prepare(
        "INSERT INTO course_entitlement_events (id,member_id,course_id,event_type,source_order_id,source_order_item_code,reason,actor_type) VALUES (?,?,?,?,?,?,?,'system')"
      ).bind(
        crypto.randomUUID(),
        memberId,
        courseId,
        existing && existing.status === "revoked" ? "restored" : "granted",
        orderId,
        itemCode,
        existing && existing.status === "revoked" ? "재구매 또는 유효 주문 재확인" : "Cafe24 구매 확인"
      ).run();
    }
    return;
  }

  if (!existing) return;

  await env.COURSE_DB.prepare(
    "UPDATE course_entitlements SET status='revoked',source_order_id=COALESCE(?,source_order_id),source_order_item_code=COALESCE(?,source_order_item_code),revoked_at=COALESCE(revoked_at,CURRENT_TIMESTAMP),last_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE member_id=? AND course_id=?"
  ).bind(orderId, itemCode, memberId, courseId).run();

  if (existing.status !== "revoked") {
    await env.COURSE_DB.prepare(
      "INSERT INTO course_entitlement_events (id,member_id,course_id,event_type,source_order_id,source_order_item_code,reason,actor_type) VALUES (?,?,?,?,?,?,?,'system')"
    ).bind(
      crypto.randomUUID(),
      memberId,
      courseId,
      "revoked",
      orderId || existing.source_order_id || null,
      itemCode || existing.source_order_item_code || null,
      "Cafe24 주문 취소·환불 감지"
    ).run();
  }
}

async function purchaseEntitlementState(env, memberId, courseId) {
  if (!env.COURSE_DB || !memberId || !courseId) return null;
  return env.COURSE_DB.prepare(
    "SELECT member_id,course_id,status,grant_reason,source_order_id,access_starts_at,access_expires_at FROM course_entitlements WHERE member_id=? AND course_id=? AND grant_reason='purchase' LIMIT 1"
  ).bind(memberId, courseId).first();
}

function purchaseEntitlementExpired(row) {
  if (!row || row.grant_reason !== "purchase") return false;
  const expiry = String(row.access_expires_at || "").trim();
  return Boolean(expiry && expiry < todayDate());
}

async function expirePurchaseEntitlement(env, row) {
  if (!env.COURSE_DB || !row || row.grant_reason !== "purchase" || row.status === "revoked") return;
  await env.COURSE_DB.prepare(
    "UPDATE course_entitlements SET status='revoked',revoked_at=COALESCE(revoked_at,CURRENT_TIMESTAMP),last_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE member_id=? AND course_id=? AND grant_reason='purchase'"
  ).bind(row.member_id, row.course_id).run();
  await env.COURSE_DB.prepare(
    "INSERT INTO course_entitlement_events (id,member_id,course_id,event_type,source_order_id,source_order_item_code,reason,actor_type) VALUES (?,?,?,?,?,NULL,?,'system')"
  ).bind(
    crypto.randomUUID(),
    row.member_id,
    row.course_id,
    "expired",
    row.source_order_id || null,
    "구매 수강기간 만료"
  ).run();
}

export function getValidPaidProductNos(orders, targetProductNos) {
  const targets = new Set(targetProductNos.map(Number).filter(Number.isFinite));
  const valid = new Set();

  for (const order of orders) {
    for (const productNo of targets) {
      if (hasValidCourseItem(order, productNo)) valid.add(productNo);
    }
  }

  return valid;
}

export async function getCourseAccessDecision(request, env, productNo, courseId = null) {
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) {
    return {
      status: 401,
      body: {
        ok: true,
        authenticated: false,
        access: false,
        entitlement: "course",
        reason: "login_required",
        auth_url: "/oauth/cafe24/customer/start"
      }
    };
  }

  const resolvedCourseId = courseId || await courseIdForProduct(env, productNo);
  const manual = await manualAccessDecision(
    env,
    session.record.member_id,
    resolvedCourseId
  );
  if (manual.active) {
    return {
      status: 200,
      body: {
        ok: true,
        authenticated: true,
        access: true,
        entitlement: "course",
        reason: "manual_entitlement",
        product_no: Number(productNo),
        access_expires_at: manual.row?.access_expires_at || null,
        verified_at: new Date().toISOString()
      }
    };
  }

  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
    return {
      status: 503,
      body: {
        ok: false,
        authenticated: true,
        access: false,
        entitlement: "course",
        error: "cafe24_not_configured"
      }
    };
  }

  const endDate = todayDate();
  const windows = buildOrderWindows(ENTITLEMENT_START_DATE, endDate);
  let matchingOrderCount = 0;
  let access = false;
  let validPurchase = null;
  let revokedPurchase = null;

  for (const window of windows) {
    const orders = await fetchAllOrders(env, {
      shop_no: 1,
      start_date: window.startDate,
      end_date: window.endDate,
      date_type: "order_date",
      member_id: session.record.member_id,
      product_no: productNo,
      embed: "items"
    });

    matchingOrderCount += orders.length;
    const valid = findValidCoursePurchase(orders, productNo);
    if (valid) {
      validPurchase = valid;
      access = true;
      break;
    }
    if (!revokedPurchase) revokedPurchase = findRevokedCoursePurchase(orders, productNo);
  }

  if (access && validPurchase) {
    const currentPurchase = await purchaseEntitlementState(
      env,
      session.record.member_id,
      resolvedCourseId
    );
    const sameOrder =
      currentPurchase &&
      String(currentPurchase.source_order_id || "") === String(validPurchase?.order?.order_id || "");
    if (sameOrder && purchaseEntitlementExpired(currentPurchase)) {
      await expirePurchaseEntitlement(env, currentPurchase);
      access = false;
    } else {
      await persistEntitlement(
        env,
        session.record.member_id,
        resolvedCourseId,
        productNo,
        validPurchase,
        true
      );
    }
  } else if (revokedPurchase) {
    await persistEntitlement(
      env,
      session.record.member_id,
      resolvedCourseId,
      productNo,
      revokedPurchase,
      false
    );
  }

  return {
    status: 200,
    body: {
      ok: true,
      authenticated: true,
      access,
      entitlement: "course",
      reason: access ? "paid_purchase_verified" : "no_valid_paid_purchase_or_expired",
      product_no: Number(productNo),
      matching_order_count: matchingOrderCount,
      check_range: {
        start_date: ENTITLEMENT_START_DATE,
        end_date: endDate
      },
      verified_at: new Date().toISOString()
    }
  };
}

export async function getAccessiblePaidProductNos(request, env, productNos) {
  const session = await getCustomerSession(request, env);
  if (!session?.record?.member_id) {
    return { authenticated: false, productNos: new Set() };
  }

  const targets = [...new Set(productNos.map(Number).filter(Number.isFinite))];
  const targetSet = new Set(targets);
  const accessible = new Set();
  const manualProductNos = new Set();

  if (env.COURSE_DB && targets.length > 0) {
    const manualRows = await env.COURSE_DB.prepare(
      "SELECT member_id,course_id,product_no,status,grant_reason,access_expires_at FROM course_entitlements WHERE member_id=? AND grant_reason='manual'"
    ).bind(session.record.member_id).all();
    const rows = Array.isArray(manualRows?.results) ? manualRows.results : [];
    for (const row of rows) {
      const productNo = Number(row.product_no);
      if (!targetSet.has(productNo) || row.status !== "active") continue;
      const expiry = String(row.access_expires_at || "").trim();
      if (expiry && expiry < todayDate()) {
        await expireManualEntitlement(env, row);
        continue;
      }
      manualProductNos.add(productNo);
      accessible.add(productNo);
    }
  }

  if (accessible.size === targets.length) {
    return { authenticated: true, productNos: accessible };
  }

  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
    return { authenticated: true, productNos: accessible };
  }

  const allOrders = [];
  const endDate = todayDate();
  const windows = buildOrderWindows(ENTITLEMENT_START_DATE, endDate);

  for (const window of windows) {
    const orders = await fetchAllOrders(env, {
      shop_no: 1,
      start_date: window.startDate,
      end_date: window.endDate,
      date_type: "order_date",
      member_id: session.record.member_id,
      embed: "items"
    });
    allOrders.push(...orders);
  }

  if (env.COURSE_DB) {
    for (const productNo of targets) {
      if (manualProductNos.has(productNo)) continue;
      const courseId = await courseIdForProduct(env, productNo);
      if (!courseId) continue;
      const valid = findValidCoursePurchase(allOrders, productNo);
      const revoked = valid ? null : findRevokedCoursePurchase(allOrders, productNo);
      if (valid) {
        const currentPurchase = await purchaseEntitlementState(
          env,
          session.record.member_id,
          courseId
        );
        const sameOrder =
          currentPurchase &&
          String(currentPurchase.source_order_id || "") === String(valid?.order?.order_id || "");
        if (sameOrder && purchaseEntitlementExpired(currentPurchase)) {
          await expirePurchaseEntitlement(env, currentPurchase);
          accessible.delete(productNo);
        } else {
          await persistEntitlement(env, session.record.member_id, courseId, productNo, valid, true);
          accessible.add(productNo);
        }
      } else if (revoked) {
        await persistEntitlement(env, session.record.member_id, courseId, productNo, revoked, false);
        accessible.delete(productNo);
      }
    }
  }

  return { authenticated: true, productNos: accessible };
}

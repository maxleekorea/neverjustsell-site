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
  for (const order of orders) {
    const items = Array.isArray(order?.items) ? order.items : [];
    for (const item of items) {
      if (Number(item?.product_no) !== Number(productNo)) continue;
      if (!isPaymentConfirmed(order, item)) continue;
      if (isItemRevoked(order, item)) continue;
      const status = String(item?.order_status || order?.order_status || "");
      if (status && !status.startsWith("N")) continue;
      return { order, item };
    }
  }
  return null;
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

async function persistEntitlement(env, memberId, courseId, productNo, purchase, active) {
  if (!env.COURSE_DB || !memberId || !courseId) return;
  const orderId = purchase?.order?.order_id || null;
  const itemCode = purchase?.item?.order_item_code || null;

  if (active) {
    await env.COURSE_DB.prepare(
      "INSERT INTO course_entitlements (member_id,course_id,product_no,source_order_id,source_order_item_code,status,grant_reason,revoked_at,last_verified_at) VALUES (?,?,?,?,?,'active','purchase',NULL,CURRENT_TIMESTAMP) ON CONFLICT(member_id,course_id) DO UPDATE SET product_no=excluded.product_no,source_order_id=excluded.source_order_id,source_order_item_code=excluded.source_order_item_code,status='active',grant_reason='purchase',revoked_at=NULL,last_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP"
    ).bind(memberId, courseId, Number(productNo), orderId, itemCode).run();
    return;
  }

  const existing = await env.COURSE_DB.prepare(
    "SELECT status FROM course_entitlements WHERE member_id=? AND course_id=? LIMIT 1"
  ).bind(memberId, courseId).first();

  if (!existing) return;

  await env.COURSE_DB.prepare(
    "UPDATE course_entitlements SET status='revoked',source_order_id=COALESCE(?,source_order_id),source_order_item_code=COALESCE(?,source_order_item_code),revoked_at=COALESCE(revoked_at,CURRENT_TIMESTAMP),last_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE member_id=? AND course_id=?"
  ).bind(orderId, itemCode, memberId, courseId).run();
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
  if (!env.CAFE24_CLIENT_ID || !env.CAFE24_CLIENT_SECRET || !env.CAFE24_AUTH) {
    return {
      status: 503,
      body: {
        ok: false,
        authenticated: false,
        access: false,
        entitlement: "course",
        error: "cafe24_not_configured"
      }
    };
  }

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

  const resolvedCourseId = courseId || await courseIdForProduct(env, productNo);
  if (access && validPurchase) {
    await persistEntitlement(
      env,
      session.record.member_id,
      resolvedCourseId,
      productNo,
      validPurchase,
      true
    );
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
      reason: access ? "paid_purchase_verified" : "no_valid_paid_purchase",
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
  const accessible = new Set();
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
    const validThisWindow = getValidPaidProductNos(orders, targets);
    for (const productNo of validThisWindow) accessible.add(productNo);
    if (accessible.size === targets.length) break;
  }

  if (env.COURSE_DB) {
    for (const productNo of targets) {
      const courseId = await courseIdForProduct(env, productNo);
      if (!courseId) continue;
      const valid = findValidCoursePurchase(allOrders, productNo);
      const revoked = valid ? null : findRevokedCoursePurchase(allOrders, productNo);
      if (valid) {
        await persistEntitlement(env, session.record.member_id, courseId, productNo, valid, true);
      } else if (revoked) {
        await persistEntitlement(env, session.record.member_id, courseId, productNo, revoked, false);
      }
    }
  }

  return { authenticated: true, productNos: accessible };
}

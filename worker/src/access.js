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

export async function getCourseAccessDecision(request, env, productNo) {
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
    if (orders.some((order) => hasValidCourseItem(order, productNo))) {
      access = true;
      break;
    }
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

    const validThisWindow = getValidPaidProductNos(orders, targets);
    for (const productNo of validThisWindow) accessible.add(productNo);
    if (accessible.size === targets.length) break;
  }

  return { authenticated: true, productNos: accessible };
}

import { cafe24AdminGet, cafe24AdminRequest } from "./session-orders.js";

const OPEN_E2E_OPERATION = "open_payment_e2e_product_13";

function normalizeProduct(payload) {
  return payload?.product || payload?.products?.[0] || payload?.resource || payload || {};
}

function numericPrice(value) {
  const raw = String(value ?? "").replaceAll(",", "").trim();
  if (!raw) return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

async function markRunning(db, id) {
  await db.prepare(
    "UPDATE system_operations SET status='running',attempt_count=attempt_count+1,started_at=CURRENT_TIMESTAMP,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('pending','failed')"
  ).bind(id).run();
}

async function markCompleted(db, id) {
  await db.prepare(
    "UPDATE system_operations SET status='completed',completed_at=CURRENT_TIMESTAMP,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(id).run();
}

async function markFailed(db, id, error) {
  await db.prepare(
    "UPDATE system_operations SET status='failed',last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(String(error?.message || error).slice(0, 1000), id).run();
}

async function openPaymentE2EProduct(env, row) {
  const course = await env.COURSE_DB.prepare(
    "SELECT id,cafe24_product_no,status FROM courses WHERE id='system-check-paid-course' LIMIT 1"
  ).first();

  if (!course || course.status !== "system_check") {
    throw new Error("payment E2E course fixture missing");
  }

  const productNo = Number(course.cafe24_product_no || 0);
  if (productNo !== 13) throw new Error("payment E2E product_no must be 13");

  let payload = {};
  try { payload = JSON.parse(String(row.payload_json || "{}")); } catch {}
  const price = Number(payload.price || 1000);
  if (price !== 1000) throw new Error("payment E2E price must remain 1000 KRW");
  const requireMemberOnly = payload.member_only !== false;

  if (requireMemberOnly) {
    // Configure policy while hidden, then expose the product for the real checkout test.
    await cafe24AdminRequest("/products/13", env, {
      method: "PUT",
      body: {
        shop_no: 1,
        display: "F",
        selling: "F",
        price: 1000,
        buy_limit_by_product: "T",
        buy_limit_type: "M"
      }
    });

    const policyPayload = await cafe24AdminGet("/products/13", env, { shop_no: 1 });
    const policyProduct = normalizeProduct(policyPayload);
    if (policyProduct?.buy_limit_by_product !== "T" || String(policyProduct?.buy_limit_type || "") !== "M") {
      throw new Error("Cafe24 member-only purchase policy verification failed");
    }
  }

  await cafe24AdminRequest("/products/13", env, {
    method: "PUT",
    body: {
      shop_no: 1,
      display: "T",
      selling: "T",
      price: 1000
    }
  });

  const verifyPayload = await cafe24AdminGet("/products/13", env, { shop_no: 1 });
  const product = normalizeProduct(verifyPayload);

  const display = String(product?.display || "");
  const selling = String(product?.selling || "");
  const currentPrice = numericPrice(product?.price);
  const memberOnly =
    product?.buy_limit_by_product === "T" &&
    String(product?.buy_limit_type || "") === "M";

  if (display !== "T" || selling !== "T" || currentPrice !== 1000) {
    throw new Error(
      `Cafe24 E2E product verification failed: display=${display} selling=${selling} price=${product?.price ?? ""}`
    );
  }

  if (requireMemberOnly && !memberOnly) {
    throw new Error("Cafe24 member-only purchase policy verification failed after sale activation");
  }

  await env.COURSE_DB.prepare(
    "UPDATE courses SET price_krw=1000,sales_enabled=1,cafe24_sync_status=?,updated_at=CURRENT_TIMESTAMP WHERE id='system-check-paid-course'"
  ).bind(memberOnly ? "e2e_selling_member_only" : "e2e_selling_login_required").run();

  return {
    operation: OPEN_E2E_OPERATION,
    product_no: 13,
    price_krw: 1000,
    display,
    selling,
    member_only: memberOnly,
    login_required_for_test: !memberOnly,
    purchase_url: "https://neverjustsell.cafe24.com/product/detail.html?product_no=13"
  };
}

export async function getPaymentE2EProductStatus(env) {
  const payload = await cafe24AdminGet("/products/13", env, { shop_no: 1 });
  const product = normalizeProduct(payload);
  const price = numericPrice(product?.price);
  const display = String(product?.display || "");
  const selling = String(product?.selling || "");
  const memberOnly =
    product?.buy_limit_by_product === "T" &&
    String(product?.buy_limit_type || "") === "M";

  return {
    ok: Number.isFinite(price),
    product_no: 13,
    price_krw: Number.isFinite(price) ? price : null,
    display,
    selling,
    member_only: memberOnly,
    buy_limit_by_product: String(product?.buy_limit_by_product || ""),
    buy_limit_type: String(product?.buy_limit_type || ""),
    buy_group_list: product?.buy_group_list ?? null,
    ready_for_test: price === 1000 && display === "T" && selling === "T" && memberOnly,
    purchase_url: "https://neverjustsell.cafe24.com/product/detail.html?product_no=13"
  };
}

export async function runPendingSystemOperations(env) {
  if (!env.COURSE_DB) return { ok: false, skipped: true, reason: "COURSE_DB binding missing", results: [] };

  let rows;
  try {
    const result = await env.COURSE_DB.prepare(
      "SELECT id,operation_type,status,payload_json,attempt_count,last_error FROM system_operations WHERE status IN ('pending','failed') ORDER BY requested_at,id LIMIT 10"
    ).all();
    rows = Array.isArray(result.results) ? result.results : [];
  } catch (error) {
    if (/no such table/i.test(String(error?.message || error))) {
      return { ok: true, skipped: true, reason: "system_operations table not ready", results: [] };
    }
    throw error;
  }

  const results = [];
  for (const row of rows) {
    if (row.operation_type !== OPEN_E2E_OPERATION) {
      results.push({ id: row.id, ok: false, skipped: true, reason: "unsupported_operation" });
      continue;
    }

    try {
      await markRunning(env.COURSE_DB, row.id);
      const detail = await openPaymentE2EProduct(env, row);
      await markCompleted(env.COURSE_DB, row.id);
      results.push({ id: row.id, ok: true, ...detail });
    } catch (error) {
      await markFailed(env.COURSE_DB, row.id, error);
      results.push({ id: row.id, ok: false, error: String(error?.message || error) });
    }
  }

  const pending = await env.COURSE_DB.prepare(
    "SELECT COUNT(*) AS count FROM system_operations WHERE status IN ('pending','failed')"
  ).first();

  return {
    ok: results.every((item) => item.ok || item.skipped),
    pending_count: Number(pending?.count || 0),
    results
  };
}

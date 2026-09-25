import { cafe24AdminGet, cafe24AdminRequest } from "./session-orders.js";
import { findValidCoursePurchase, findRevokedCoursePurchase, syncPaidCourseEntitlementForPurchase, revokePaidCourseEntitlementForPurchase } from "./access.js";
import { reconcilePurchasedProgramEnrollments } from "./program-access.js";
import { digitalCafe24ProductPatch, fulfillmentProfileForProductType, digitalProductDescriptionHtml, hasDigitalProductUx } from "./fulfillment.js";

const OPEN_E2E_OPERATION = "open_payment_e2e_product_13";
const RECONCILE_E2E_ORDER_OPERATION = "reconcile_latest_payment_e2e_order";
const CANCEL_E2E_ORDER_OPERATION = "cancel_payment_e2e_order";
const BOOTSTRAP_CATALOG_OPERATION = "bootstrap_cafe24_catalog";
const CLEANUP_CATALOG_DUPLICATES_OPERATION = "cleanup_cafe24_catalog_duplicates";
const SET_ALL_PRODUCTS_NO_SHIPPING_OPERATION = "set_all_current_products_no_shipping";
const RECONCILE_ALL_COURSE_FULFILLMENT_OPERATION = "reconcile_all_course_product_fulfillment";
const HIDE_DIGITAL_SHIPPING_PROPERTIES_OPERATION = "hide_digital_product_shipping_properties";
const APPLY_DIGITAL_PRODUCT_DETAIL_UX_OPERATION = "apply_digital_product_detail_ux";
const CONFIGURE_CUSTOMER_CLAIM_SETTINGS_OPERATION = "configure_customer_claim_settings";

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function normalizeProduct(payload) {
  return payload?.product || payload?.products?.[0] || payload?.resource || payload || {};
}

function numericPrice(value) {
  const raw = String(value ?? "").replaceAll(",", "").trim();
  if (!raw) return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeProductProperties(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.properties)) return payload.properties;
  if (Array.isArray(payload?.property)) return payload.property;
  if (Array.isArray(payload?.properties?.property)) return payload.properties.property;

  const candidates = [];
  const visit = (value, depth = 0) => {
    if (depth > 3 || value == null) return;
    if (Array.isArray(value)) {
      if (value.some((item) => item && typeof item === "object" && ("key" in item || "display" in item))) {
        candidates.push(value);
      }
      return;
    }
    if (typeof value === "object") {
      for (const child of Object.values(value)) visit(child, depth + 1);
    }
  };
  visit(payload);
  return candidates.sort((a, b) => b.length - a.length)[0] || [];
}

function productPropertyName(property) {
  const names = Array.isArray(property?.multishop_display_names)
    ? property.multishop_display_names
    : [];
  const primary = names.find((item) => Number(item?.shop_no || 1) === 1) || names[0] || null;
  return String(primary?.name || property?.name || "");
}

function isShippingProductProperty(property) {
  const key = String(property?.key || "").toLowerCase();
  const name = productPropertyName(property);
  return key.startsWith("shipping") ||
    key.includes("_shipping") ||
    /배송|택배|송장/.test(name);
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

async function reconcileLatestPaymentE2EOrder(env, row) {
  let payload = {};
  try { payload = JSON.parse(String(row.payload_json || "{}")); } catch {}

  const productNo = Number(payload.product_no || 13);
  const date = String(payload.date || "").trim();
  if (productNo !== 13) throw new Error("payment E2E reconciliation must target product 13");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("payment E2E reconciliation date is invalid");

  const orderPayload = await cafe24AdminGet("/orders", env, {
    shop_no: 1,
    start_date: date,
    end_date: date,
    date_type: "order_date",
    product_no: 13,
    embed: "items",
    limit: 100,
    offset: 0
  });

  const orders = Array.isArray(orderPayload?.orders) ? orderPayload.orders : [];
  const purchase = findValidCoursePurchase(orders, 13);
  if (!purchase) throw new Error("No confirmed product #13 order found for the requested date");

  const memberId = String(purchase?.order?.member_id || "").trim();
  if (!memberId) throw new Error("Latest confirmed product #13 order is not linked to a Cafe24 member");

  const entitlement = await syncPaidCourseEntitlementForPurchase(
    env,
    memberId,
    13,
    purchase
  );

  const programSync = await reconcilePurchasedProgramEnrollments(env, memberId);
  const enrollment = await env.COURSE_DB.prepare(
    "SELECT run_id,member_id,status,source,source_order_id,source_order_item_code,joined_at,started_at,updated_at " +
    "FROM program_enrollments WHERE run_id='system-check-payment-program-run' AND member_id=? LIMIT 1"
  ).bind(memberId).first();

  if (entitlement?.status !== "active") {
    throw new Error("Course entitlement did not become active");
  }
  if (enrollment?.status !== "active") {
    throw new Error("Program enrollment did not become active");
  }

  return {
    operation: RECONCILE_E2E_ORDER_OPERATION,
    order_id: String(purchase?.order?.order_id || ""),
    member_id: memberId,
    course_entitlement: entitlement?.status || null,
    program_enrollment: enrollment?.status || null,
    program_sync: programSync
  };
}

async function paymentE2EOrdersForDate(env, date) {
  const orderPayload = await cafe24AdminGet("/orders", env, {
    shop_no: 1,
    start_date: date,
    end_date: date,
    date_type: "order_date",
    product_no: 13,
    embed: "items",
    limit: 100,
    offset: 0
  });
  return Array.isArray(orderPayload?.orders) ? orderPayload.orders : [];
}

function normalizeOrder(payload) {
  return payload?.order || payload?.orders?.[0] || payload?.resource || payload || {};
}

async function paymentE2ERefundBank(env, orderId) {
  const detailPayload = await cafe24AdminGet("/orders/" + encodeURIComponent(orderId), env, {
    shop_no: 1,
    embed: "buyer,refunds,cancellation"
  });
  const order = normalizeOrder(detailPayload);
  const candidates = [
    order,
    order?.buyer,
    order?.refunds,
    Array.isArray(order?.refunds) ? order.refunds[0] : null,
    order?.cancellation,
    Array.isArray(order?.cancellation) ? order.cancellation[0] : null
  ].filter(Boolean);

  const pick = (key) => {
    for (const candidate of candidates) {
      const value = String(candidate?.[key] || "").trim();
      if (value) return value;
    }
    return "";
  };

  return {
    bankCode: pick("refund_bank_code"),
    bankName: pick("refund_bank_name"),
    accountNo: pick("refund_bank_account_no"),
    accountHolder: pick("refund_bank_account_holder")
  };
}

const PAYMENT_E2E_PG_CANCEL_METHODS = new Set(["card", "tcash", "icash", "cell", "cvs"]);

function paymentE2EPurchaseMeta(purchase) {
  const order = purchase?.order || {};
  const item = purchase?.item || {};
  const quantity = Number(item.quantity ?? item.order_quantity ?? 1);
  return {
    orderId: String(order.order_id || "").trim(),
    memberId: String(order.member_id || "").trim(),
    itemCode: String(item.order_item_code || "").trim(),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    paymentMethod: String(order.payment_method || item.payment_method || "").trim(),
    paymentGatewayNames: Array.isArray(order.payment_gateway_names)
      ? order.payment_gateway_names.map(String)
      : []
  };
}

async function reconcileRevokedPaymentE2EAccess(env, purchase) {
  const meta = paymentE2EPurchaseMeta(purchase);
  if (!meta.orderId || !meta.memberId || !meta.itemCode) {
    throw new Error("Revoked payment E2E order is missing identity or item metadata");
  }

  const entitlement = await revokePaidCourseEntitlementForPurchase(
    env,
    meta.memberId,
    13,
    purchase
  );
  const programSync = await reconcilePurchasedProgramEnrollments(env, meta.memberId);
  const enrollment = await env.COURSE_DB.prepare(
    "SELECT run_id,member_id,status,source,source_order_id,source_order_item_code,joined_at,started_at,updated_at " +
    "FROM program_enrollments WHERE run_id='system-check-payment-program-run' AND member_id=? LIMIT 1"
  ).bind(meta.memberId).first();

  if (entitlement?.status !== "revoked") {
    throw new Error("Course entitlement did not become revoked");
  }
  if (enrollment?.status !== "withdrawn") {
    throw new Error("Program enrollment did not become withdrawn");
  }

  return { meta, entitlement, enrollment, programSync };
}

async function cancelPaymentE2EOrder(env, row) {
  let payload = {};
  try { payload = JSON.parse(String(row.payload_json || "{}")); } catch {}

  const productNo = Number(payload.product_no || 13);
  const date = String(payload.date || "").trim();
  if (productNo !== 13) throw new Error("payment E2E cancellation must target product 13");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("payment E2E cancellation date is invalid");

  let orders = await paymentE2EOrdersForDate(env, date);
  let purchase = findValidCoursePurchase(orders, 13);
  let alreadyRevoked = false;

  if (!purchase) {
    purchase = findRevokedCoursePurchase(orders, 13);
    alreadyRevoked = Boolean(purchase);
  }
  if (!purchase) throw new Error("No product #13 payment E2E order found for cancellation");

  const meta = paymentE2EPurchaseMeta(purchase);
  if (!meta.orderId || !meta.memberId || !meta.itemCode) {
    throw new Error("Payment E2E order is missing identity or item metadata");
  }

  const [entitlementBefore, enrollmentBefore] = await Promise.all([
    env.COURSE_DB.prepare(
      "SELECT member_id,status,source_order_id FROM course_entitlements " +
      "WHERE course_id='system-check-paid-course' AND member_id=? LIMIT 1"
    ).bind(meta.memberId).first(),
    env.COURSE_DB.prepare(
      "SELECT member_id,status,source_order_id FROM program_enrollments " +
      "WHERE run_id='system-check-payment-program-run' AND member_id=? LIMIT 1"
    ).bind(meta.memberId).first()
  ]);

  if (String(entitlementBefore?.source_order_id || "") !== meta.orderId) {
    throw new Error("Refusing cancellation because course entitlement does not match the target order");
  }
  if (String(enrollmentBefore?.source_order_id || "") !== meta.orderId) {
    throw new Error("Refusing cancellation because program enrollment does not match the target order");
  }

  const requestPaymentGatewayCancel = PAYMENT_E2E_PG_CANCEL_METHODS.has(meta.paymentMethod);
  let cancellationRequested = false;
  if (!alreadyRevoked) {
    const cancellationBody = {
      shop_no: 1,
      status: "canceled",
      payment_gateway_cancel: requestPaymentGatewayCancel ? "T" : "F",
      recover_inventory: "F",
      recover_coupon: "T",
      add_memo_too: "T",
      claim_reason_type: "I",
      reason: "NEVER JUST SELL 결제 E2E 취소·환불 검증",
      items: [{ order_item_code: meta.itemCode, quantity: meta.quantity }]
    };
    if (!requestPaymentGatewayCancel) {
      const refundBank = await paymentE2ERefundBank(env, meta.orderId);
      if (!refundBank.bankCode || !refundBank.accountNo || !refundBank.accountHolder) {
        throw new Error("Cafe24 cash refund requires the buyer refund account; no complete refund account is stored on this order");
      }
      cancellationBody.refund_method_code = ["T"];
      cancellationBody.refund_bank_code = refundBank.bankCode;
      if (refundBank.bankName) cancellationBody.refund_bank_name = refundBank.bankName;
      cancellationBody.refund_bank_account_no = refundBank.accountNo;
      cancellationBody.refund_bank_account_holder = refundBank.accountHolder;
    }
    await cafe24AdminRequest("/orders/" + encodeURIComponent(meta.orderId) + "/cancellation", env, {
      method: "POST",
      body: cancellationBody
    });
    cancellationRequested = true;

    let revokedPurchase = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      orders = await paymentE2EOrdersForDate(env, date);
      revokedPurchase = findRevokedCoursePurchase(orders, 13);
      if (
        revokedPurchase &&
        String(revokedPurchase?.order?.order_id || "") === meta.orderId &&
        String(revokedPurchase?.item?.order_item_code || "") === meta.itemCode
      ) {
        purchase = revokedPurchase;
        break;
      }
      await sleep(1500);
    }
    if (!findRevokedCoursePurchase([purchase?.order].filter(Boolean), 13)) {
      throw new Error("Cafe24 cancellation was requested but revoked order state was not observed");
    }
  }

  const reconciled = await reconcileRevokedPaymentE2EAccess(env, purchase);

  await cafe24AdminRequest("/products/13", env, {
    method: "PUT",
    body: { shop_no: 1, display: "F", selling: "F" }
  });
  await env.COURSE_DB.prepare(
    "UPDATE courses SET sales_enabled=0,cafe24_sync_status='e2e_refund_verified_hidden',updated_at=CURRENT_TIMESTAMP " +
    "WHERE id='system-check-paid-course' AND cafe24_product_no=13"
  ).run();

  const productStatus = await getPaymentE2EProductStatus(env);
  if (productStatus.display !== "F" || productStatus.selling !== "F") {
    throw new Error("Payment E2E order was revoked but test product could not be hidden");
  }

  return {
    operation: CANCEL_E2E_ORDER_OPERATION,
    order_state: "revoked",
    cancellation_requested: cancellationRequested,
    already_revoked: alreadyRevoked,
    payment_method: meta.paymentMethod || null,
    payment_gateway_names: meta.paymentGatewayNames,
    payment_gateway_cancel_requested: cancellationRequested && requestPaymentGatewayCancel,
    product_hidden: true,
    course_entitlement: reconciled.entitlement?.status || null,
    program_enrollment: reconciled.enrollment?.status || null,
    identity_consistent:
      String(reconciled.entitlement?.member_id || "") === meta.memberId &&
      String(reconciled.enrollment?.member_id || "") === meta.memberId
  };
}

async function listAllCurrentProducts(env) {
  const products = [];
  for (let offset = 0; offset <= 5000; offset += 100) {
    const payload = await cafe24AdminGet("/products", env, {
      shop_no: 1,
      limit: 100,
      offset,
      fields: "product_no,product_name,shipping_method,shipping_fee_by_product,shipping_fee_type"
    });
    const page = Array.isArray(payload?.products) ? payload.products : [];
    products.push(...page);
    if (page.length < 100) break;
  }
  return products;
}

async function setAllCurrentProductsNoShipping(env) {
  const products = await listAllCurrentProducts(env);
  const updated = [];

  for (const product of products) {
    const productNo = Number(product?.product_no || 0);
    if (!productNo) continue;

    await cafe24AdminRequest(`/products/${productNo}`, env, {
      method: "PUT",
      body: {
        shop_no: 1,
        shipping_fee_by_product: "T",
        shipping_method: "09",
        shipping_fee_type: "T",
        shipping_scope: "A",
        shipping_period: {
          minimum: 1,
          maximum: 7
        },
        prepaid_shipping_fee: "P"
      }
    });

    const verifyPayload = await cafe24AdminGet(`/products/${productNo}`, env, {
      shop_no: 1,
      fields: "product_no,product_name,shipping_method,shipping_fee_by_product,shipping_fee_type"
    });
    const verified = normalizeProduct(verifyPayload);

    if (
      String(verified?.shipping_method || "") !== "09" ||
      String(verified?.shipping_fee_by_product || "") !== "T"
    ) {
      throw new Error(
        `Cafe24 no-shipping verification failed: product_no=${productNo} shipping_method=${verified?.shipping_method ?? ""} shipping_fee_by_product=${verified?.shipping_fee_by_product ?? ""}`
      );
    }

    updated.push({
      product_no: productNo,
      product_name: String(verified?.product_name || product?.product_name || ""),
      shipping_method: "09",
      shipping_fee_by_product: "T",
      shipping_fee_type: String(verified?.shipping_fee_type || "")
    });
  }

  return {
    operation: SET_ALL_PRODUCTS_NO_SHIPPING_OPERATION,
    product_count: products.length,
    updated_count: updated.length,
    products: updated
  };
}

export async function getAllCurrentProductsShippingStatus(env) {
  const listed = await listAllCurrentProducts(env);
  const normalized = [];

  for (const item of listed) {
    const productNo = Number(item?.product_no || 0);
    if (!productNo) continue;

    const detailPayload = await cafe24AdminGet(`/products/${productNo}`, env, {
      shop_no: 1,
      fields: "product_no,product_name,shipping_method,shipping_fee_by_product,shipping_fee_type"
    });
    const product = normalizeProduct(detailPayload);

    normalized.push({
      product_no: productNo,
      product_name: String(product?.product_name || item?.product_name || ""),
      shipping_method: String(product?.shipping_method || ""),
      shipping_fee_by_product: String(product?.shipping_fee_by_product || ""),
      shipping_fee_type: String(product?.shipping_fee_type || ""),
      no_shipping:
        String(product?.shipping_method || "") === "09" &&
        String(product?.shipping_fee_by_product || "") === "T"
    });
  }

  return {
    ok: true,
    product_count: normalized.length,
    all_no_shipping: normalized.every((product) => product.no_shipping),
    products: normalized
  };
}

async function hideDigitalProductShippingProperties(env) {
  const payload = await cafe24AdminGet("/products/properties", env, { shop_no: 1 });
  const properties = normalizeProductProperties(payload);
  if (!properties.length) throw new Error("Cafe24 product detail properties could not be retrieved");

  const existingSnapshot = await env.COURSE_DB.prepare(
    "SELECT snapshot_key FROM cafe24_setting_snapshots WHERE snapshot_key='products_properties_before_digital_shipping_hide' LIMIT 1"
  ).first();

  if (!existingSnapshot?.snapshot_key) {
    await env.COURSE_DB.prepare(
      "INSERT INTO cafe24_setting_snapshots(snapshot_key,payload_json) VALUES (?,?)"
    ).bind(
      "products_properties_before_digital_shipping_hide",
      JSON.stringify(payload)
    ).run();
  }

  const targets = properties.filter(isShippingProductProperty);
  if (!targets.length) {
    throw new Error("No shipping-related Cafe24 product detail properties were found");
  }

  const updates = targets.map((property) => ({
    key: String(property.key),
    display: "F",
    ...(property?.font_type ? { font_type: property.font_type } : {}),
    ...(property?.font_size ? { font_size: property.font_size } : {}),
    ...(property?.font_color ? { font_color: property.font_color } : {})
  }));

  await cafe24AdminRequest("/products/properties", env, {
    method: "PUT",
    body: {
      shop_no: 1,
      properties: updates
    }
  });

  await sleep(800);
  const verifyPayload = await cafe24AdminGet("/products/properties", env, { shop_no: 1 });
  const verifyProperties = normalizeProductProperties(verifyPayload);
  const verifyMap = new Map(
    verifyProperties.map((property) => [String(property?.key || ""), property])
  );

  const stillVisible = updates
    .map((update) => verifyMap.get(update.key))
    .filter((property) => property && String(property?.display || "") !== "F")
    .map((property) => String(property.key));

  if (stillVisible.length) {
    throw new Error(`Cafe24 shipping properties are still visible: ${stillVisible.join(",")}`);
  }

  return {
    operation: HIDE_DIGITAL_SHIPPING_PROPERTIES_OPERATION,
    hidden_count: updates.length,
    hidden_keys: updates.map((item) => item.key),
    snapshot_saved: !existingSnapshot?.snapshot_key
  };
}

export async function getDigitalProductPropertyVisibilityStatus(env) {
  const payload = await cafe24AdminGet("/products/properties", env, { shop_no: 1 });
  const properties = normalizeProductProperties(payload);
  const shippingProperties = properties.filter(isShippingProductProperty).map((property) => ({
    key: String(property?.key || ""),
    name: productPropertyName(property),
    display: String(property?.display || "")
  }));

  return {
    ok: properties.length > 0,
    property_count: properties.length,
    shipping_property_count: shippingProperties.length,
    all_shipping_properties_hidden:
      shippingProperties.length > 0 &&
      shippingProperties.every((property) => property.display === "F"),
    shipping_properties: shippingProperties
  };
}

async function reconcileAllCourseProductFulfillment(env) {
  const result = await env.COURSE_DB.prepare(
    "SELECT id,title,cafe24_product_no FROM courses WHERE cafe24_product_no IS NOT NULL AND cafe24_product_no>0 ORDER BY id"
  ).all();
  const courses = Array.isArray(result?.results) ? result.results : [];
  const profile = fulfillmentProfileForProductType("course");
  const patch = digitalCafe24ProductPatch("course");
  const reconciled = [];

  for (const course of courses) {
    const productNo = Number(course?.cafe24_product_no || 0);
    if (!productNo) continue;

    await cafe24AdminRequest(`/products/${productNo}`, env, {
      method: "PUT",
      body: { shop_no: 1, ...patch }
    });

    const productPayload = await cafe24AdminGet(`/products/${productNo}`, env, {
      shop_no: 1,
      fields: "product_no,product_name,shipping_method,shipping_fee_by_product"
    });
    const product = normalizeProduct(productPayload);
    if (
      Number(product?.product_no || 0) !== productNo ||
      String(product?.shipping_method || "") !== "09" ||
      String(product?.shipping_fee_by_product || "") !== "T"
    ) {
      throw new Error(`Course fulfillment verification failed for product ${productNo}`);
    }

    const categoryPayload = await cafe24AdminGet(`/categories/${profile.categoryNo}/products`, env, {
      shop_no: 1,
      display_group: 1,
      limit: 50000
    });
    const categoryProducts = Array.isArray(categoryPayload?.products) ? categoryPayload.products : [];
    if (!categoryProducts.some((item) => Number(item?.product_no || 0) === productNo)) {
      throw new Error(`Course category verification failed for product ${productNo}`);
    }

    reconciled.push({
      course_id: String(course.id),
      product_no: productNo,
      shipping_method: "09",
      category_no: profile.categoryNo
    });
  }

  return {
    operation: RECONCILE_ALL_COURSE_FULFILLMENT_OPERATION,
    course_product_count: reconciled.length,
    reconciled
  };
}

export async function getPaymentE2EFlowStatus(env) {
  const date = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const orderPayload = await cafe24AdminGet("/orders", env, {
    shop_no: 1,
    start_date: date,
    end_date: date,
    date_type: "order_date",
    product_no: 13,
    embed: "items",
    limit: 100,
    offset: 0
  });
  const orders = Array.isArray(orderPayload?.orders) ? orderPayload.orders : [];
  const validPurchase = findValidCoursePurchase(orders, 13);
  const revokedPurchase = validPurchase ? null : findRevokedCoursePurchase(orders, 13);
  const purchase = validPurchase || revokedPurchase;
  if (!purchase) {
    return {
      ok: true,
      order_detected: false,
      order_state: null,
      course_entitlement: null,
      program_enrollment: null
    };
  }

  const orderId = String(purchase?.order?.order_id || "");
  const memberId = String(purchase?.order?.member_id || "");
  const orderState = validPurchase ? "active" : "revoked";
  const paymentMethod = String(purchase?.order?.payment_method || purchase?.item?.payment_method || "").trim();
  const [entitlement, enrollment] = await Promise.all([
    env.COURSE_DB.prepare(
      "SELECT status,member_id FROM course_entitlements WHERE course_id='system-check-paid-course' AND source_order_id=? ORDER BY updated_at DESC LIMIT 1"
    ).bind(orderId).first(),
    env.COURSE_DB.prepare(
      "SELECT status,member_id FROM program_enrollments WHERE run_id='system-check-payment-program-run' AND source_order_id=? ORDER BY updated_at DESC LIMIT 1"
    ).bind(orderId).first()
  ]);

  const identityConsistent =
    Boolean(memberId) &&
    String(entitlement?.member_id || "") === memberId &&
    String(enrollment?.member_id || "") === memberId;

  return {
    ok: true,
    order_detected: true,
    order_state: orderState,
    paid_member_order: Boolean(memberId),
    payment_method: paymentMethod || null,
    course_entitlement: entitlement?.status || null,
    program_enrollment: enrollment?.status || null,
    identity_consistent: identityConsistent,
    access_state_consistent:
      identityConsistent &&
      (orderState === "active"
        ? entitlement?.status === "active" && enrollment?.status === "active"
        : entitlement?.status === "revoked" && enrollment?.status === "withdrawn")
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

async function applyDigitalProductDetailUx(env) {
  const listed = await listAllCurrentProducts(env);
  const updated = [];
  const skipped = [];

  for (const item of listed) {
    const productNo = Number(item?.product_no || 0);
    if (!productNo) continue;

    const detailPayload = await cafe24AdminGet(`/products/${productNo}`, env, {
      shop_no: 1,
      fields: "product_no,product_name,description,mobile_description,separated_mobile_description,shipping_method,shipping_fee_by_product"
    });
    const product = normalizeProduct(detailPayload);

    if (
      String(product?.shipping_method || "") !== "09" ||
      String(product?.shipping_fee_by_product || "") !== "T"
    ) {
      skipped.push({ product_no: productNo, reason: "requires_shipping" });
      continue;
    }

    const description = String(product?.description || "");
    const mobileDescription = String(product?.mobile_description || "");
    const separatedMobile = String(product?.separated_mobile_description || "") === "T";

    if (!hasDigitalProductUx(description)) {
      const snapshotKey = `product_description_before_digital_ux_${productNo}`;
      const snapshot = await env.COURSE_DB.prepare(
        "SELECT snapshot_key FROM cafe24_setting_snapshots WHERE snapshot_key=? LIMIT 1"
      ).bind(snapshotKey).first();

      if (!snapshot?.snapshot_key) {
        await env.COURSE_DB.prepare(
          "INSERT INTO cafe24_setting_snapshots(snapshot_key,payload_json) VALUES (?,?)"
        ).bind(
          snapshotKey,
          JSON.stringify({
            product_no: productNo,
            product_name: String(product?.product_name || ""),
            description,
            mobile_description: mobileDescription,
            separated_mobile_description: separatedMobile ? "T" : "F"
          })
        ).run();
      }

      const body = {
        shop_no: 1,
        description: digitalProductDescriptionHtml(description)
      };
      if (separatedMobile) {
        body.mobile_description = digitalProductDescriptionHtml(mobileDescription);
      }

      await cafe24AdminRequest(`/products/${productNo}`, env, {
        method: "PUT",
        body
      });
    }

    const verifyPayload = await cafe24AdminGet(`/products/${productNo}`, env, {
      shop_no: 1,
      fields: "product_no,description"
    });
    const verify = normalizeProduct(verifyPayload);
    if (!hasDigitalProductUx(verify?.description)) {
      throw new Error(`Digital product UX verification failed for product ${productNo}`);
    }

    updated.push({
      product_no: productNo,
      product_name: String(product?.product_name || ""),
      digital_ux: true
    });
  }

  return {
    operation: APPLY_DIGITAL_PRODUCT_DETAIL_UX_OPERATION,
    updated_count: updated.length,
    skipped_count: skipped.length,
    updated,
    skipped
  };
}


function findObjectWithKey(value, key, depth = 0) {
  if (depth > 5 || value == null) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findObjectWithKey(item, key, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(value, key)) return value;
  for (const child of Object.values(value)) {
    const found = findObjectWithKey(child, key, depth + 1);
    if (found) return found;
  }
  return null;
}

function normalizeOrderSetting(payload) {
  return (
    payload?.setting ||
    payload?.settings?.[0] ||
    payload?.order_setting ||
    payload?.orders_setting ||
    payload?.resource ||
    findObjectWithKey(payload, "claim_request") ||
    {}
  );
}

function claimExposureCodes(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return [...new Set(text.match(/(?:cancel|exchange|return)_N\d+/g) || [])];
}

function customerClaimSettingsSummary(setting) {
  const exposure = claimExposureCodes(setting?.claim_request_button_exposure);
  return {
    claim_request: String(setting?.claim_request || ""),
    claim_request_type: String(setting?.claim_request_type || ""),
    claim_request_button_exposure: exposure,
    claim_request_button_date_type: String(setting?.claim_request_button_date_type || ""),
    claim_request_button_period: Number(setting?.claim_request_button_period || 0),
    claim_request_auto_accept: String(setting?.claim_request_auto_accept || ""),
    refund_bank_account_required: String(setting?.refund_bank_account_required || "")
  };
}

function customerClaimSettingsConfigured(setting) {
  const summary = customerClaimSettingsSummary(setting);
  const expectedExposure = ["cancel_N10", "cancel_N20", "cancel_N22", "cancel_N21"];
  const exposure = new Set(summary.claim_request_button_exposure);
  return (
    summary.claim_request === "T" &&
    summary.claim_request_type === "S" &&
    summary.claim_request_button_date_type === "order_date" &&
    summary.claim_request_button_period === 7 &&
    summary.claim_request_auto_accept === "F" &&
    summary.refund_bank_account_required === "T" &&
    expectedExposure.every((code) => exposure.has(code)) &&
    !summary.claim_request_button_exposure.some((code) => code.startsWith("exchange_") || code.startsWith("return_"))
  );
}

async function configureCustomerClaimSettings(env, row) {
  let payload = {};
  try { payload = JSON.parse(String(row.payload_json || "{}")); } catch {}

  const periodDays = Number(payload.period_days || 7);
  if (periodDays !== 7) {
    throw new Error("Customer claim period must remain the approved 7-day default");
  }

  const beforePayload = await cafe24AdminGet("/orders/setting", env, { shop_no: 1 });
  const before = normalizeOrderSetting(beforePayload);
  if (!before || typeof before !== "object" || !Object.keys(before).length) {
    throw new Error("Cafe24 order settings could not be normalized");
  }

  const snapshotKey = "orders_setting_before_customer_claim_v1";
  const existingSnapshot = await env.COURSE_DB.prepare(
    "SELECT snapshot_key FROM cafe24_setting_snapshots WHERE snapshot_key=? LIMIT 1"
  ).bind(snapshotKey).first();

  if (!existingSnapshot?.snapshot_key) {
    await env.COURSE_DB.prepare(
      "INSERT INTO cafe24_setting_snapshots(snapshot_key,payload_json) VALUES (?,?)"
    ).bind(
      snapshotKey,
      JSON.stringify({
        raw: beforePayload,
        normalized: customerClaimSettingsSummary(before)
      })
    ).run();
  }

  const cancelExposure = ["cancel_N10", "cancel_N20", "cancel_N22", "cancel_N21"];
  const currentExposure = before?.claim_request_button_exposure;
  const exposureRequest = typeof currentExposure === "string"
    ? cancelExposure.join(",")
    : cancelExposure;

  await cafe24AdminRequest("/orders/setting", env, {
    method: "PUT",
    body: {
      shop_no: 1,
      claim_request: "T",
      claim_request_type: "S",
      claim_request_button_exposure: exposureRequest,
      claim_request_button_date_type: "order_date",
      claim_request_button_period: 7,
      claim_request_auto_accept: "F",
      refund_bank_account_required: "T"
    }
  });

  const afterPayload = await cafe24AdminGet("/orders/setting", env, { shop_no: 1 });
  const after = normalizeOrderSetting(afterPayload);
  if (!customerClaimSettingsConfigured(after)) {
    throw new Error(
      "Cafe24 customer cancellation settings verification failed: " +
      JSON.stringify(customerClaimSettingsSummary(after))
    );
  }

  // The dedicated product #13 has already served its purchase purpose.
  // Keep it closed while the existing order is used for customer-initiated cancellation testing.
  await cafe24AdminRequest("/products/13", env, {
    method: "PUT",
    body: { shop_no: 1, display: "F", selling: "F" }
  });

  const closedPayload = await cafe24AdminGet("/products/13", env, {
    shop_no: 1,
    fields: "product_no,display,selling"
  });
  const closed = normalizeProduct(closedPayload);
  if (String(closed?.display || "") !== "F" || String(closed?.selling || "") !== "F") {
    throw new Error("Payment E2E product #13 did not close after customer claim configuration");
  }

  return {
    operation: CONFIGURE_CUSTOMER_CLAIM_SETTINGS_OPERATION,
    snapshot_key: snapshotKey,
    before: customerClaimSettingsSummary(before),
    after: customerClaimSettingsSummary(after),
    product_13_closed: true
  };
}

export async function getCustomerClaimSettingsStatus(env) {
  const payload = await cafe24AdminGet("/orders/setting", env, { shop_no: 1 });
  const setting = normalizeOrderSetting(payload);
  const summary = customerClaimSettingsSummary(setting);
  return {
    ok: true,
    configured: customerClaimSettingsConfigured(setting),
    ...summary
  };
}

export async function getDigitalProductDetailUxStatus(env) {
  const listed = await listAllCurrentProducts(env);
  const products = [];

  for (const item of listed) {
    const productNo = Number(item?.product_no || 0);
    if (!productNo) continue;
    const payload = await cafe24AdminGet(`/products/${productNo}`, env, {
      shop_no: 1,
      fields: "product_no,product_name,description,shipping_method,shipping_fee_by_product"
    });
    const product = normalizeProduct(payload);
    const digital =
      String(product?.shipping_method || "") === "09" &&
      String(product?.shipping_fee_by_product || "") === "T";

    products.push({
      product_no: productNo,
      product_name: String(product?.product_name || ""),
      digital,
      ux_applied: digital ? hasDigitalProductUx(product?.description) : null
    });
  }

  const digitalProducts = products.filter((product) => product.digital);
  return {
    ok: true,
    digital_product_count: digitalProducts.length,
    all_digital_ux_applied:
      digitalProducts.length > 0 &&
      digitalProducts.every((product) => product.ux_applied === true),
    products
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
    if (![OPEN_E2E_OPERATION, RECONCILE_E2E_ORDER_OPERATION, CANCEL_E2E_ORDER_OPERATION, BOOTSTRAP_CATALOG_OPERATION, CLEANUP_CATALOG_DUPLICATES_OPERATION, SET_ALL_PRODUCTS_NO_SHIPPING_OPERATION, RECONCILE_ALL_COURSE_FULFILLMENT_OPERATION, HIDE_DIGITAL_SHIPPING_PROPERTIES_OPERATION, APPLY_DIGITAL_PRODUCT_DETAIL_UX_OPERATION, CONFIGURE_CUSTOMER_CLAIM_SETTINGS_OPERATION].includes(row.operation_type)) {
      results.push({ id: row.id, ok: false, skipped: true, reason: "unsupported_operation" });
      continue;
    }

    try {
      await markRunning(env.COURSE_DB, row.id);
      const detail = row.operation_type === OPEN_E2E_OPERATION
        ? await openPaymentE2EProduct(env, row)
        : row.operation_type === RECONCILE_E2E_ORDER_OPERATION
          ? await reconcileLatestPaymentE2EOrder(env, row)
          : row.operation_type === CANCEL_E2E_ORDER_OPERATION
            ? await cancelPaymentE2EOrder(env, row)
          : row.operation_type === BOOTSTRAP_CATALOG_OPERATION
            ? await bootstrapCafe24Catalog(env)
            : row.operation_type === CLEANUP_CATALOG_DUPLICATES_OPERATION
              ? { operation: CLEANUP_CATALOG_DUPLICATES_OPERATION, ...(await cleanupAutomationDuplicateCategories(env)) }
              : row.operation_type === SET_ALL_PRODUCTS_NO_SHIPPING_OPERATION
                ? await setAllCurrentProductsNoShipping(env)
                : row.operation_type === RECONCILE_ALL_COURSE_FULFILLMENT_OPERATION
                  ? await reconcileAllCourseProductFulfillment(env)
                  : row.operation_type === HIDE_DIGITAL_SHIPPING_PROPERTIES_OPERATION
                    ? await hideDigitalProductShippingProperties(env)
                    : row.operation_type === APPLY_DIGITAL_PRODUCT_DETAIL_UX_OPERATION
                      ? await applyDigitalProductDetailUx(env)
                      : await configureCustomerClaimSettings(env, row);
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


const CATALOG_CATEGORY_NAMES = ["강의", "전자책", "프로그램", "일반상품"];

function categoryList(payload) {
  return Array.isArray(payload?.categories) ? payload.categories : [];
}

async function listRootCategories(env) {
  const payload = await cafe24AdminGet("/categories", env, {
    shop_no: 1,
    parent_category_no: 1,
    limit: 100,
    offset: 0
  });
  return categoryList(payload);
}

async function findOrCreateRootCategory(env, categoryName) {
  let categories = await listRootCategories(env);
  let found = categories.find((category) =>
    String(category?.category_name || "").trim() === categoryName &&
    Number(category?.parent_category_no || 1) === 1
  );
  if (found?.category_no) return found;

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const createdPayload = await cafe24AdminRequest("/categories", env, {
        method: "POST",
        body: {
          shop_no: 1,
          parent_category_no: 1,
          category_name: categoryName,
          display_type: "A",
          use_main: "F",
          use_display: "T"
        }
      });

      const created =
        createdPayload?.category ||
        (Array.isArray(createdPayload?.categories) ? createdPayload.categories[0] : null) ||
        createdPayload?.resource ||
        null;

      if (created?.category_no) {
        return created;
      }

      // Cafe24 category list can lag immediately after a successful create.
      for (let verifyAttempt = 1; verifyAttempt <= 5; verifyAttempt += 1) {
        await sleep(1000);
        categories = await listRootCategories(env);
        found = categories.find((category) =>
          String(category?.category_name || "").trim() === categoryName &&
          Number(category?.parent_category_no || 1) === 1
        );
        if (found?.category_no) return found;
      }

      lastError = new Error(`Cafe24 category creation could not be verified: ${categoryName}`);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(1200 * attempt);
    }
  }
  throw lastError || new Error(`Cafe24 category creation failed: ${categoryName}`);
}

async function ensureProductInCategory(env, categoryNo, productNo) {
  const current = await cafe24AdminGet(`/categories/${categoryNo}/products`, env, {
    shop_no: 1,
    display_group: 1,
    limit: 50000
  });
  const products = Array.isArray(current?.products) ? current.products : [];
  if (products.some((product) => Number(product?.product_no || 0) === Number(productNo))) {
    return { added: false };
  }

  // Cafe24 Products API officially supports add_category_no when updating
  // an existing product. This is more stable than the category relation POST
  // across API versions.
  await cafe24AdminRequest(`/products/${productNo}`, env, {
    method: "PUT",
    body: {
      shop_no: 1,
      add_category_no: [
        {
          category_no: Number(categoryNo),
          recommend: "F",
          new: "F"
        }
      ]
    }
  });

  for (let verifyAttempt = 1; verifyAttempt <= 5; verifyAttempt += 1) {
    await sleep(1000);
    const verify = await cafe24AdminGet(`/categories/${categoryNo}/products`, env, {
      shop_no: 1,
      display_group: 1,
      limit: 50000
    });
    const verifiedProducts = Array.isArray(verify?.products) ? verify.products : [];
    if (verifiedProducts.some((product) => Number(product?.product_no || 0) === Number(productNo))) {
      return { added: true };
    }
  }
  throw new Error(`Cafe24 product category assignment could not be verified: category=${categoryNo} product=${productNo}`);
}

const AUTOMATION_DUPLICATE_CATEGORY_IDS = new Map([
  [44, "전자책"], [45, "전자책"], [46, "전자책"], [47, "전자책"],
  [49, "프로그램"], [50, "프로그램"], [51, "프로그램"], [52, "프로그램"],
  [54, "일반상품"], [55, "일반상품"], [56, "일반상품"], [57, "일반상품"],
  [58, "일반상품"], [59, "일반상품"], [60, "일반상품"], [61, "일반상품"]
]);

async function categoryHasProducts(env, categoryNo) {
  for (const displayGroup of [1, 2, 3]) {
    const payload = await cafe24AdminGet(`/categories/${categoryNo}/products/count`, env, {
      shop_no: 1,
      display_group: displayGroup
    });
    const count = Number(
      payload?.count ??
      payload?.products_count ??
      payload?.product_count ??
      0
    );
    if (Number.isFinite(count) && count > 0) return true;
  }
  return false;
}

async function cleanupAutomationDuplicateCategories(env) {
  const roots = await listRootCategories(env);
  const removed = [];
  const skipped = [];

  for (const [categoryNo, expectedName] of AUTOMATION_DUPLICATE_CATEGORY_IDS.entries()) {
    const category = roots.find((item) => Number(item?.category_no || 0) === categoryNo);
    if (!category) continue;

    const actualName = String(category?.category_name || "").trim();
    if (actualName !== expectedName || Number(category?.parent_category_no || 1) !== 1) {
      skipped.push({ category_no: categoryNo, reason: "identity_mismatch" });
      continue;
    }

    if (await categoryHasProducts(env, categoryNo)) {
      skipped.push({ category_no: categoryNo, reason: "contains_products" });
      continue;
    }

    await cafe24AdminRequest(`/categories/${categoryNo}`, env, {
      method: "DELETE"
    });
    removed.push(categoryNo);
    await sleep(250);
  }

  return { removed, skipped };
}

export async function bootstrapCafe24Catalog(env) {
  const categories = {};
  for (const categoryName of CATALOG_CATEGORY_NAMES) {
    const category = await findOrCreateRootCategory(env, categoryName);
    categories[categoryName] = Number(category.category_no);
  }

  const courseCategoryNo = categories["강의"];
  const productAssignment = await ensureProductInCategory(env, courseCategoryNo, 13);
  const duplicateCleanup = await cleanupAutomationDuplicateCategories(env);

  return {
    ok: true,
    categories,
    product_13: {
      category: "강의",
      category_no: courseCategoryNo,
      assigned: true,
      added_now: productAssignment.added
    },
    duplicate_cleanup: duplicateCleanup
  };
}


export async function getCafe24CatalogStatus(env) {
  const categories = await listRootCategories(env);
  const wanted = {};
  const duplicate_counts = {};
  const category_matches = {};
  for (const name of CATALOG_CATEGORY_NAMES) {
    const matches = categories.filter((category) =>
      String(category?.category_name || "").trim() === name &&
      Number(category?.parent_category_no || 1) === 1
    );
    const match = matches[0] || null;
    wanted[name] = match?.category_no ? Number(match.category_no) : null;
    duplicate_counts[name] = Math.max(0, matches.length - 1);
    category_matches[name] = matches.map((category) => Number(category.category_no)).filter(Boolean);
  }

  let product13InCourse = false;
  const courseCategoryNo = wanted["강의"];
  if (courseCategoryNo) {
    const current = await cafe24AdminGet(`/categories/${courseCategoryNo}/products`, env, {
      shop_no: 1,
      display_group: 1,
      limit: 50000
    });
    const products = Array.isArray(current?.products) ? current.products : [];
    product13InCourse = products.some((product) => Number(product?.product_no || 0) === 13);
  }

  return {
    ok: true,
    categories: wanted,
    category_matches,
    duplicate_counts,
    duplicates_present: Object.values(duplicate_counts).some((count) => Number(count) > 0),
    all_categories_present: CATALOG_CATEGORY_NAMES.every((name) => Number(wanted[name] || 0) > 0),
    product_13_in_course: product13InCourse
  };
}

import {
  isPaymentConfirmed,
  isItemRevoked,
  hasValidCourseItem,
  getValidPaidProductNos
} from "../worker/src/access.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const paidCourseOrder = {
  paid: "T",
  canceled: "F",
  items: [{ product_no: 13, order_status: "N20" }]
};

const refundedCourseOrder = {
  paid: "T",
  canceled: "F",
  refund_status: "T",
  items: [{ product_no: 13, order_status: "N20" }]
};

const canceledItemOrder = {
  paid: "T",
  canceled: "F",
  items: [{ product_no: 13, order_status: "C34" }]
};

const unrelatedPaidOrder = {
  paid: "T",
  canceled: "F",
  items: [{ product_no: 11, order_status: "N20" }]
};

assert(isPaymentConfirmed(paidCourseOrder, paidCourseOrder.items[0]), "paid order must be payment-confirmed");
assert(!isItemRevoked(paidCourseOrder, paidCourseOrder.items[0]), "normal paid item must not be revoked");
assert(hasValidCourseItem(paidCourseOrder, 13), "paid active course item must grant course access");
assert(!hasValidCourseItem(refundedCourseOrder, 13), "refunded course must not grant access");
assert(!hasValidCourseItem(canceledItemOrder, 13), "cancelled course item must not grant access");
assert(!hasValidCourseItem(unrelatedPaidOrder, 13), "other product purchase must not grant course access");

const valid = getValidPaidProductNos(
  [paidCourseOrder, unrelatedPaidOrder, canceledItemOrder],
  [11, 13]
);
assert(valid.has(11), "valid physical/other paid product can be detected as purchased");
assert(valid.has(13), "valid course purchase must be detected");
assert(valid.size === 2, "cancelled duplicate must not remove an independent valid purchase");

const onlyCancelled = getValidPaidProductNos([canceledItemOrder], [13]);
assert(!onlyCancelled.has(13), "cancelled-only history must not produce entitlement");

console.log("PASS: purchase facts are separated from course entitlement decisions");

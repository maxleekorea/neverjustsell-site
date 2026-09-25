export const PRODUCT_TYPES = Object.freeze({
  COURSE: "course",
  EBOOK: "ebook",
  PROGRAM: "program",
  PHYSICAL: "physical"
});

export const FULFILLMENT_TYPES = Object.freeze({
  ENTITLEMENT: "entitlement",
  SHIPMENT: "shipment"
});

export const CAFE24_CATEGORY_PROFILES = Object.freeze({
  42: Object.freeze({
    categoryNo: 42,
    categoryName: "강의",
    productType: PRODUCT_TYPES.COURSE,
    fulfillmentType: FULFILLMENT_TYPES.ENTITLEMENT,
    requiresShipping: false,
    postPurchasePath: "/my-space"
  }),
  43: Object.freeze({
    categoryNo: 43,
    categoryName: "전자책",
    productType: PRODUCT_TYPES.EBOOK,
    fulfillmentType: FULFILLMENT_TYPES.ENTITLEMENT,
    requiresShipping: false,
    postPurchasePath: "/my-space"
  }),
  48: Object.freeze({
    categoryNo: 48,
    categoryName: "프로그램",
    productType: PRODUCT_TYPES.PROGRAM,
    fulfillmentType: FULFILLMENT_TYPES.ENTITLEMENT,
    requiresShipping: false,
    postPurchasePath: "/my-space"
  }),
  53: Object.freeze({
    categoryNo: 53,
    categoryName: "일반상품",
    productType: PRODUCT_TYPES.PHYSICAL,
    fulfillmentType: FULFILLMENT_TYPES.SHIPMENT,
    requiresShipping: true,
    postPurchasePath: null
  })
});

export const CATEGORY_BY_PRODUCT_TYPE = Object.freeze(
  Object.fromEntries(
    Object.values(CAFE24_CATEGORY_PROFILES).map((profile) => [profile.productType, profile.categoryNo])
  )
);

export function fulfillmentProfileForCategory(categoryNo) {
  return CAFE24_CATEGORY_PROFILES[Number(categoryNo)] || null;
}

export function fulfillmentProfileForProductType(productType) {
  const categoryNo = CATEGORY_BY_PRODUCT_TYPE[String(productType || "")];
  return categoryNo ? fulfillmentProfileForCategory(categoryNo) : null;
}

export function digitalCafe24ProductPatch(productType) {
  const profile = fulfillmentProfileForProductType(productType);
  if (!profile || profile.fulfillmentType !== FULFILLMENT_TYPES.ENTITLEMENT) {
    throw new Error("digital_fulfillment_profile_required");
  }

  return {
    shipping_fee_by_product: "T",
    shipping_method: "09",
    shipping_fee_type: "T",
    shipping_scope: "A",
    shipping_period: {
      minimum: 1,
      maximum: 7
    },
    prepaid_shipping_fee: "P",
    add_category_no: [
      {
        category_no: profile.categoryNo,
        recommend: "F",
        new: "F"
      }
    ]
  };
}

export function fulfillmentTypeForProductType(productType) {
  return fulfillmentProfileForProductType(productType)?.fulfillmentType || null;
}

export function isDigitalProductType(productType) {
  return fulfillmentTypeForProductType(productType) === FULFILLMENT_TYPES.ENTITLEMENT;
}


export function classifyFulfillmentCategories(categoryNos) {
  const profiles = [...new Set(
    (Array.isArray(categoryNos) ? categoryNos : [])
      .map((categoryNo) => fulfillmentProfileForCategory(categoryNo))
      .filter(Boolean)
  )];

  if (profiles.length === 0) {
    return { ok: false, reason: "unmapped_category", profile: null };
  }

  const fulfillmentTypes = new Set(profiles.map((profile) => profile.fulfillmentType));
  if (fulfillmentTypes.size > 1) {
    return { ok: false, reason: "mixed_fulfillment_categories", profile: null, profiles };
  }

  if (profiles.length > 1) {
    return { ok: false, reason: "multiple_primary_product_categories", profile: null, profiles };
  }

  return { ok: true, reason: "classified", profile: profiles[0] };
}

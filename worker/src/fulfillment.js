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


export const DIGITAL_PRODUCT_UX_MARKER = "njs-digital-product-ux-v1";

export function digitalProductDescriptionHtml(existingDescription = "") {
  const source = String(existingDescription || "");
  if (source.includes(DIGITAL_PRODUCT_UX_MARKER)) return source;

  const digitalUx = `
<style id="${DIGITAL_PRODUCT_UX_MARKER}">
.headingArea .delivery,
.regularDelivery,
.detail_tab .title_detail li:last-child,
#prdInfo,
#guide {
  display: none !important;
}
.njs-digital-access-guide {
  margin: 24px 0 32px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  color: #18181b;
  font-family: Arial, "Noto Sans KR", sans-serif;
  line-height: 1.65;
}
.njs-digital-access-guide strong {
  display: block;
  margin-bottom: 5px;
  font-size: 15px;
}
.njs-digital-access-guide p {
  margin: 0;
  font-size: 14px;
  color: #52525b;
}
</style>
<div class="njs-digital-access-guide">
  <strong>결제 후 바로 이용할 수 있습니다.</strong>
  <p>구매한 콘텐츠와 참여 중인 프로그램은 NEVER JUST SELL의 내 공간에서 확인합니다.</p>
</div>`.trim();

  return `${digitalUx}\n${source}`;
}

export function hasDigitalProductUx(description) {
  return String(description || "").includes(DIGITAL_PRODUCT_UX_MARKER);
}

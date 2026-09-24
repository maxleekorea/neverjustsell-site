import { listActiveCreators, assertActiveCreator } from "./roles.js";
import { cafe24AdminGet, cafe24AdminRequest } from "./session-orders.js";
import { isPaymentConfirmed, isItemRevoked } from "./access.js";
import { COMMERCE_ORIGIN, CAFE24_ADMIN_SCOPES } from "./config.js";

const ADMIN_COOKIE = "njs_course_admin";
const DEFAULT_PAID_ACCESS_DAYS = 180;
const DEFAULT_REFUND_POLICY_VERSION = "fair-trust-v1.0";
const DEFAULT_PAID_ACCESS_INFO = "수강기간은 결제일 기준 180일입니다.";
const DEFAULT_REFUND_POLICY_TEXT = "첫 번째 본강의 차시는 구매 전 무료로 공개합니다. 결제 후 7일 이내 유료 차시를 이용하지 않았다면 전액 환불합니다. 유료 차시를 이용한 경우와 7일 경과 후의 중도해지는 실제 유료 콘텐츠 이용분과 적용 법령을 기준으로 환불합니다. 무료 미리보기 시청분은 유료 이용량에 포함하지 않습니다.";

const ADMIN_TTL_SECONDS = 60 * 60 * 12;
const VIMEO_API_ORIGIN = "https://api.vimeo.com";
const TUS_VERSION = "1.0.0";
const CAFE24_ADMIN_TOKEN_KEY = "cafe24:admin-token";

const ONLINE_COMMERCE_BASICS = {
  slug: "online-commerce-basics",
  summary: "온라인 유통을 단순히 상품을 등록하고 판매하는 일로만 이해하면 오래 버티기 어렵습니다. 스마트스토어와 온라인 커머스는 상품, 고객, 콘텐츠, 검색 알고리즘, 플랫폼 정책, 데이터, 재고 흐름이 함께 맞물려 움직이는 사업입니다. 이 클래스는 스마트스토어를 처음 시작하는 셀러가 온라인 유통업의 본질을 이해하고, 네이버 쇼핑이라는 플랫폼 안에서 어떤 방식으로 상품을 기획하고 노출시키며 고객을 설득해야 하는지 체계적으로 배우는 온라인 유통 실전 강의입니다. 첫 강의에서는 온라인 유통을 유통업, 서비스업, 콘텐츠업이라는 세 가지 관점으로 나누어 설명합니다. 이어지는 강의에서는 대한민국 온라인 커머스의 역사, 네이버 검색 알고리즘의 변화, 스마트스토어가 성장한 배경, 키워드 전략, 상세페이지, 상품 소싱, 콘텐츠 마케팅, 퍼스널 브랜딩, 리뷰 전략, 데이터 분석, AI 활용 전략까지 온라인 셀러가 반드시 알아야 할 핵심 주제를 단계적으로 다룹니다. 이 클래스의 목적은 단순한 판매 요령을 알려주는 것이 아닙니다. 플랫폼이 왜 그렇게 작동하는지, 고객은 왜 특정 상품을 선택하는지, 네이버는 어떤 셀러를 선호하는지, 상품과 콘텐츠가 어떻게 검색과 구매로 연결되는지를 이해하도록 돕는 것입니다. 스마트스토어를 부업 수준의 단기 시도로 끝내지 않고 지속 가능한 온라인 유통 사업으로 키우고 싶은 분들을 위한 클래스입니다.",
  lessons: [
    {
      number: 1,
      title: "강사 소개와 온라인 유통을 보는 관점",
      description: "강사의 유통·제조·스마트스토어 경험을 바탕으로, 재고와 데이터가 왜 유통 사업의 핵심인지 살펴봅니다. 이 강의가 단기 판매 요령보다 온라인 유통의 구조와 판단 기준을 먼저 다루는 이유를 설명합니다."
    },
    {
      number: 2,
      title: "유통업의 본질: 통하게 하고 흐르게 만드는 일",
      description: "제1원칙 사고법으로 온라인 유통을 유통업·서비스업·콘텐츠업으로 나누어 봅니다. 유통의 핵심인 ‘통하게 하는 일’과 ‘흐르게 하는 일’을 통해 소싱, 상품 기획, 상세페이지가 어떤 역할을 하는지 이해합니다."
    },
    {
      number: 3,
      title: "서비스업의 본질 ① 제조사의 문제를 해결하는 셀러",
      description: "온라인 셀러를 단순 판매자가 아니라 다른 주체의 문제를 해결하는 서비스 사업자로 바라봅니다. 제조사의 제품 개발, 판로, 판촉과 재고 문제를 이해하고, 신뢰와 협업을 통해 장기적인 판매 관계를 만드는 방법을 살펴봅니다."
    },
    {
      number: 4,
      title: "서비스업의 본질 ② 도매업자와 함께 흐름 만들기",
      description: "도매업자가 담당하는 재고, 물류, 정보, 거래처 네트워크의 가치를 이해합니다. 판매력을 바탕으로 도매 파트너와 관계를 만들고, 공급 조건·여신·제조사 연결 등 사업 인프라를 확장하는 관점을 다룹니다."
    },
    {
      number: 5,
      title: "서비스업의 본질 ③ 고객의 불안과 신뢰",
      description: "고객의 수요를 읽고 적합한 상품을 연결하는 것이 셀러의 핵심 역할임을 살펴봅니다. 단순 소싱을 넘어 구매 실패에 대한 불안을 낮추고, 직접 검증한 정보와 솔직한 설명으로 신뢰를 만드는 방법을 이해합니다."
    },
    {
      number: 6,
      title: "플랫폼의 문제를 이해해야 노출 구조가 보인다",
      description: "검색 알고리즘과 노출 정책을 플랫폼의 사업 목표와 문제 해결 방식이라는 관점에서 해석합니다. 공지, 정책 변화, 검색 구조를 관찰해 플랫폼이 원하는 판매자와 콘텐츠의 방향을 읽는 방법을 설명합니다."
    },
    {
      number: 7,
      title: "콘텐츠업의 본질: 미디어와 이야기의 힘",
      description: "온라인 유통에서는 상품명, 썸네일, 상세페이지, 영상, 후기까지 모두 콘텐츠가 됩니다. 고객의 문제를 고객의 언어로 표현하고, 여러 미디어를 활용해 상품의 가치와 선택 이유를 전달하는 역량을 다룹니다."
    },
    {
      number: 8,
      title: "온라인 유통은 ‘업’이다: 핵심 정리",
      description: "온라인 유통의 세 가지 본질인 유통업·서비스업·콘텐츠업을 다시 연결해 정리합니다. 단기적인 요령보다 기본 구조를 이해하고, 문제를 읽고 흐름을 만들며 신뢰를 쌓는 사업가의 관점을 강조합니다."
    }
  ]
};


function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function html(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  return new Response(body, { ...init, headers });
}

function parseCookies(request) {
  const result = {};
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

function b64urlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function b64urlDecode(text) {
  const normalized = text.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, function (ch) { return ch.charCodeAt(0); });
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function makeAdminToken(secret) {
  const payloadObject = {
    v: 1,
    exp: Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS
  };
  const encoded = b64urlEncode(new TextEncoder().encode(JSON.stringify(payloadObject)));
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(encoded))
  );
  return encoded + "." + b64urlEncode(signature);
}

async function verifyAdminToken(token, secret) {
  if (!token || !secret) return false;
  const parts = String(token).split(".");
  if (parts.length !== 2) return false;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      b64urlDecode(parts[1]),
      new TextEncoder().encode(parts[0])
    );
    if (!ok) return false;
    const decoded = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
    return decoded && decoded.v === 1 && Number(decoded.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

async function passwordMatches(provided, expected) {
  if (!expected) return false;
  const encoder = new TextEncoder();
  const digests = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(String(provided || ""))),
    crypto.subtle.digest("SHA-256", encoder.encode(String(expected)))
  ]);
  const a = new Uint8Array(digests[0]);
  const b = new Uint8Array(digests[1]);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function adminCookie(value) {
  return ADMIN_COOKIE + "=" + encodeURIComponent(value) +
    "; Path=/course-admin; Max-Age=" + ADMIN_TTL_SECONDS +
    "; HttpOnly; Secure; SameSite=Strict";
}

function expiredAdminCookie() {
  return ADMIN_COOKIE + "=; Path=/course-admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict";
}

async function isAdmin(request, env) {
  return verifyAdminToken(parseCookies(request)[ADMIN_COOKIE], env.COURSE_ADMIN_PASSWORD);
}

function redirect(location, cookie) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shell(title, body) {
  return "<!doctype html><html lang=\"ko\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>" + escapeHtml(title) + " | NEVER JUST SELL</title>" +
    "<style>" +
    "*{box-sizing:border-box}body{margin:0;background:#0a0a0a;color:#f5f5f5;font-family:Arial,'Noto Sans KR',sans-serif}" +
    "a{color:inherit}.wrap{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:36px 0 70px}" +
    ".top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:28px}" +
    ".brand{font-size:12px;font-weight:800;letter-spacing:.16em}.grid{display:grid;grid-template-columns:320px 1fr;gap:18px}.sectionhead{display:flex;justify-content:space-between;align-items:end;gap:12px;margin:22px 0 10px}.sectionhead h3{margin:0}.hint{font-size:12px;color:#888;margin:4px 0 0}" +
    ".card{background:#151515;border:1px solid #292929;border-radius:16px;padding:20px;margin-bottom:14px}" +
    "h1{font-size:30px;margin:0 0 8px}h2{font-size:18px;margin:0 0 14px}h3{margin:0 0 8px}" +
    "p{line-height:1.6}.muted{color:#999}.pill{display:inline-block;border:1px solid #333;border-radius:999px;padding:4px 8px;font-size:11px;color:#aaa;margin-right:5px}" +
    "label{display:block;font-size:12px;color:#aaa;margin:11px 0 6px}input,textarea,select,button{font:inherit;border-radius:9px}" +
    "input,textarea,select{width:100%;padding:11px 12px;background:#0d0d0d;border:1px solid #333;color:#fff}" +
    "textarea{min-height:86px;resize:vertical}button{padding:10px 14px;border:1px solid #333;background:#fff;color:#111;font-weight:800;cursor:pointer}" +
    "button.secondary{background:#181818;color:#ddd}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lesson{padding:12px 0;border-top:1px solid #262626}" +
    ".error{color:#ff9696}.ok{color:#a8e6a8}.course-settings{padding:14px;background:#101010;border:1px solid #262626;border-radius:12px;margin:12px 0 18px}.lessoncard{border:1px solid #2a2a2a;border-radius:12px;margin:10px 0;background:#101010;overflow:hidden}.lessoncard summary{cursor:pointer;padding:13px 14px;display:flex;justify-content:space-between;gap:12px;align-items:center}.lessoncard summary::-webkit-details-marker{display:none}.lessonbody{padding:0 14px 14px;border-top:1px solid #242424}.lessonmeta{font-size:11px;color:#777}.fieldgrid{display:grid;grid-template-columns:1fr 180px;gap:10px}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.toolbar form{margin:0}.toolbar button{padding:8px 10px}.upload{margin-top:12px;padding:12px;border:1px solid #2b2b2b;border-radius:12px;background:#101010}.uploadbar{height:8px;background:#262626;border-radius:999px;overflow:hidden;margin-top:9px}.uploadbar span{display:block;height:100%;width:0;background:#eee;transition:width .15s}.uploadstatus{font-size:12px;color:#aaa;margin-top:7px}.upload button{margin-top:8px}.upload input{margin-top:6px}.library{margin-top:12px;padding:12px;border:1px dashed #353535;border-radius:12px}.librarylist{display:grid;gap:7px;margin-top:10px}.libraryitem{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;padding:9px;background:#0d0d0d;border:1px solid #272727;border-radius:9px}.libraryitem input{width:auto;margin:0}.librarymeta{font-size:11px;color:#777}.libraryactions{display:flex;gap:8px;margin-top:10px}.editor{margin-top:14px;border-top:1px solid #292929;padding-top:14px}.preview{display:flex;align-items:center;gap:6px;font-size:12px;color:#aaa;margin-top:10px}.preview input{width:auto}.moduleform{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}@media(max-width:800px){.grid{grid-template-columns:1fr}.row,.fieldgrid{grid-template-columns:1fr}}" +
    "body{background:#f6f7f9;color:#18181b}.wrap{width:min(1280px,calc(100% - 40px));padding:28px 0 64px}.brand{color:#71717a}.card{background:#fff;border-color:#e4e4e7;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.03)}.muted,.hint{color:#71717a}.pill{border-color:#e4e4e7;color:#52525b;background:#fafafa}label{color:#52525b}input,textarea,select{background:#fff;border-color:#d4d4d8;color:#18181b}button{background:#18181b;color:#fff;border-color:#18181b}button.secondary{background:#fff;color:#27272a;border-color:#d4d4d8}.course-settings,.lessoncard,.upload,.library,.libraryitem{background:#fff;border-color:#e4e4e7}.lessonbody{border-color:#e4e4e7}.lessonmeta{color:#71717a}.error{color:#b91c1c;overflow-wrap:anywhere}.ok{color:#166534}.top{margin-bottom:20px}.top h1{font-size:24px}.course-list{width:100%;border-collapse:collapse}.course-list th{font-size:12px;text-align:left;color:#71717a;font-weight:600;padding:12px;border-bottom:1px solid #e4e4e7}.course-list td{padding:14px 12px;border-bottom:1px solid #f0f0f2;vertical-align:middle}.course-list tr:last-child td{border-bottom:0}.course-list a{text-decoration:none;font-weight:700}.course-list .sub{font-size:12px;color:#71717a;margin-top:4px}.admin-tabs{display:flex;gap:26px;border-bottom:1px solid #e4e4e7;margin:18px 0 22px}.admin-tabs a{padding:12px 2px;text-decoration:none;color:#71717a;font-size:14px;font-weight:700;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}.admin-tabs a.active{color:#18181b;border-bottom-color:#18181b}.editor-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.editor-head h2{font-size:22px;margin:4px 0 8px}.backlink{font-size:13px;color:#71717a;text-decoration:none}.panel{max-width:920px}.panel.narrow{max-width:760px}.list-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:14px}.new-course{margin-bottom:18px}.new-course summary{cursor:pointer;font-weight:800;list-style:none}.new-course summary::-webkit-details-marker{display:none}.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#a1a1aa;margin-right:6px}.status-dot.live{background:#16a34a}.course-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.editor{border-top:0;padding-top:0;margin-top:0}.lessoncard{box-shadow:none}.lessoncard summary{padding:12px 14px}.course-settings{padding:18px;border-radius:10px}.grid{grid-template-columns:1fr}.content-shell{max-width:960px;margin:0 auto}.sales-summary{display:grid;grid-template-columns:1fr 220px;gap:16px}.sales-preview{border:1px solid #e4e4e7;border-radius:12px;padding:16px;background:#fff;height:max-content}.sales-preview strong{font-size:20px}.advanced-note{padding:14px;border-radius:10px;background:#fafafa;border:1px solid #e4e4e7}.readiness{display:grid;gap:8px;margin:14px 0;padding:12px;border:1px solid #e4e4e7;border-radius:10px;background:#fafafa}.ready-row{display:flex;justify-content:space-between;gap:12px;font-size:13px}.ready-ok{color:#166534;font-weight:700}.ready-wait{color:#a16207;font-weight:700}.action-link{display:inline-block;padding:9px 12px;border:1px solid #d4d4d8;border-radius:9px;text-decoration:none;font-size:13px;font-weight:700;background:#fff;color:#27272a}.student-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 16px}.student-metric{padding:14px;border:1px solid #e4e4e7;border-radius:10px;background:#fff}.student-metric .value{font-size:22px;font-weight:800;margin-top:4px}.student-table-wrap{overflow:auto;border:1px solid #e4e4e7;border-radius:10px;background:#fff}.student-table{width:100%;border-collapse:collapse;min-width:900px}.student-table th{font-size:12px;text-align:left;color:#71717a;font-weight:700;padding:11px 12px;border-bottom:1px solid #e4e4e7;background:#fafafa}.student-table td{padding:12px;border-bottom:1px solid #f1f1f3;font-size:13px;vertical-align:middle}.student-table tr:last-child td{border-bottom:0}.status-active{color:#166534;font-weight:800}.status-revoked{color:#b91c1c;font-weight:800}.status-neutral{color:#71717a;font-weight:700}.student-search{display:grid;grid-template-columns:1fr auto;gap:8px;margin:0 0 14px}.progress-mini{display:flex;align-items:center;gap:8px}.progress-mini-track{width:84px;height:6px;background:#e4e4e7;border-radius:999px;overflow:hidden}.progress-mini-track span{display:block;height:100%;background:#18181b}.nowrap{white-space:nowrap}.curriculum{display:grid;gap:12px}.curriculum-group{border:1px solid #e4e4e7;border-radius:12px;background:#fafafa;overflow:hidden}.curriculum-group.dragging,.curriculum-lesson.dragging{opacity:.45}.curriculum-group.drop-target,.lesson-dropzone.drop-target{outline:2px solid #18181b;outline-offset:-2px}.curriculum-group-head{display:flex;align-items:center;gap:10px;padding:11px 12px;border-bottom:1px solid #e4e4e7;background:#f4f4f5}.curriculum-group-head strong{flex:1}.curriculum-count{font-size:11px;color:#71717a}.drag-handle{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;color:#71717a;cursor:grab;user-select:none;border-radius:6px}.drag-handle:active{cursor:grabbing;background:#e4e4e7}.lesson-dropzone{min-height:10px;padding:6px}.lessoncard.curriculum-lesson{margin:6px 0;background:#fff}.lessoncard.curriculum-lesson summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:9px}.lesson-summary-main{min-width:0}.lesson-summary-title{display:flex;gap:6px;align-items:center;min-width:0}.lesson-summary-title strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lesson-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}.mini-badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:700;background:#f4f4f5;color:#52525b}.mini-badge.ok{background:#ecfdf3;color:#166534}.mini-badge.warn{background:#fff7ed;color:#9a3412}.mini-badge.preview-badge{background:#eff6ff;color:#1d4ed8}.curriculum-save{font-size:12px;color:#71717a;margin-left:auto}.curriculum-save.saving{color:#a16207}.curriculum-save.saved{color:#166534}.curriculum-save.error{color:#b91c1c}.content-tools{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}.content-tools .hint{margin:0}.student-detail-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px}.student-detail-card{padding:14px;border:1px solid #e4e4e7;border-radius:10px;background:#fff}.student-detail-card strong{display:block;margin-top:4px;font-size:15px}.timeline{display:grid;gap:10px;margin:10px 0 18px}.timeline-item{display:grid;grid-template-columns:120px 1fr;gap:14px;padding:12px 0;border-bottom:1px solid #f0f0f2}.timeline-item:last-child{border-bottom:0}.timeline-time{font-size:12px;color:#71717a}.timeline-title{font-weight:800}.timeline-sub{font-size:12px;color:#71717a;margin-top:3px}.student-section{margin:20px 0}.student-section h3{margin-bottom:10px}button:disabled{cursor:not-allowed;opacity:.45}@media(max-width:800px){.wrap{width:min(100% - 24px,1280px)}.admin-tabs{overflow:auto;gap:18px}.course-list th:nth-child(3),.course-list td:nth-child(3){display:none}.editor-head{display:block}.sales-summary{grid-template-columns:1fr}}" +
    "</style></head><body><main class=\"wrap\">" + body + "</main></body></html>";
}

function loginPage(message) {
  const note = message ? "<p class=\"error\">" + escapeHtml(message) + "</p>" : "";
  return shell(
    "강의 관리자",
    "<div style=\"width:min(440px,100%);margin:7vh auto 0\" class=\"card\">" +
      "<div class=\"brand\">NEVER JUST SELL</div><h1>강의 관리자</h1>" +
      "<p class=\"muted\">관리자 비밀번호로 로그인하세요.</p>" + note +
      "<form method=\"post\" action=\"/course-admin/login\">" +
      "<label>관리자 비밀번호</label><input type=\"password\" name=\"password\" autocomplete=\"current-password\" required autofocus>" +
      "<button type=\"submit\" style=\"width:100%;margin-top:12px\">로그인</button></form></div>"
  );
}


async function listAllVimeoVideos(env) {
  if (!env.VIMEO_ACCESS_TOKEN) return [];
  const videos = [];
  for (let page = 1; page <= 5; page += 1) {
    const payload = await vimeoRequest(
      "/me/videos?per_page=100&page=" + page + "&sort=date&direction=desc&fields=uri,name,duration,created_time,transcode.status",
      env,
      { method: "GET" }
    );
    const pageVideos = Array.isArray(payload && payload.data) ? payload.data : [];
    videos.push(...pageVideos);
    if (pageVideos.length < 100) break;
  }
  return videos.map((video) => ({
    vimeo_id: vimeoVideoId(video.uri),
    name: video.name || "",
    duration_seconds: Number(video.duration || 0) || 0,
    created_time: video.created_time || null,
    status: video.transcode && video.transcode.status || null
  })).filter((video) => video.vimeo_id);
}

async function syncCourseVimeoMetadata(env, courseId) {
  if (!env.VIMEO_ACCESS_TOKEN || !courseId) return { synced: 0, missing: [] };
  const result = await env.COURSE_DB.prepare(
    "SELECT id,vimeo_id,status FROM lessons WHERE course_id=? AND status!='archived' AND vimeo_id IS NOT NULL"
  ).bind(courseId).all();
  const lessons = Array.isArray(result.results) ? result.results : [];
  if (!lessons.length) return { synced: 0, missing: [] };

  const library = await listAllVimeoVideos(env);
  const byId = new Map(library.map((video) => [String(video.vimeo_id), video]));
  const statements = [];
  const missing = [];
  for (const lesson of lessons) {
    const video = byId.get(String(lesson.vimeo_id));
    if (!video) {
      missing.push(String(lesson.vimeo_id));
      continue;
    }
    const status = video.status === "complete"
      ? (String(lesson.status) === "published" ? "published" : "ready")
      : "processing";
    statements.push(
      env.COURSE_DB.prepare(
        "UPDATE lessons SET duration_seconds=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(video.duration_seconds || null, status, lesson.id)
    );
  }
  if (statements.length) await env.COURSE_DB.batch(statements);
  return { synced: statements.length, missing };
}

function basicVideoNumber(name) {
  const match = String(name || "").match(/^유통기본_(\d{2})_/);
  return match ? Number(match[1]) : null;
}

async function syncOnlineCommerceBasics(env) {
  const course = await env.COURSE_DB.prepare(
    "SELECT id,summary,status FROM courses WHERE slug=? LIMIT 1"
  ).bind(ONLINE_COMMERCE_BASICS.slug).first();
  if (!course || course.status === "published") return;

  const current = await env.COURSE_DB.prepare(
    "SELECT id,title,description,vimeo_id,sort_order FROM lessons WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
  ).bind(course.id).all();
  const rows = Array.isArray(current.results) ? current.results : [];
  const needsSeed = !course.summary || rows.length < ONLINE_COMMERCE_BASICS.lessons.length ||
    rows.some((lesson) => !String(lesson.description || "").trim());
  if (!needsSeed) return;

  let videos = [];
  try {
    videos = (await listAllVimeoVideos(env))
      .map((video) => ({ ...video, number: basicVideoNumber(video.name) }))
      .filter((video) => Number.isInteger(video.number) && video.number >= 1 && video.number <= 8);
  } catch {
    videos = [];
  }

  const lessonByVimeo = new Map(rows.filter((row) => row.vimeo_id).map((row) => [String(row.vimeo_id), row]));

  // The lessons table enforces UNIQUE(course_id, sort_order). Move existing draft
  // rows out of the final 0..7 range before applying Vimeo filename numbering.
  if (rows.length > 0) {
    await env.COURSE_DB.prepare(
      "UPDATE lessons SET sort_order=sort_order+1000,updated_at=CURRENT_TIMESTAMP WHERE course_id=? AND status!='archived'"
    ).bind(course.id).run();
  }

  videos.sort((a, b) => a.number - b.number);
  for (const video of videos) {
    const meta = ONLINE_COMMERCE_BASICS.lessons.find((item) => item.number === video.number);
    if (!meta) continue;
    const existing = lessonByVimeo.get(String(video.vimeo_id));
    if (existing) {
      await env.COURSE_DB.prepare(
        "UPDATE lessons SET title=?,description=COALESCE(NULLIF(description,''),?),duration_seconds=?,sort_order=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
      ).bind(
        meta.title,
        meta.description,
        video.duration_seconds || null,
        video.number - 1,
        video.status === "complete" ? "ready" : "processing",
        existing.id
      ).run();
    } else {
      const id = crypto.randomUUID();
      await env.COURSE_DB.prepare(
        "INSERT INTO lessons (id,course_id,title,description,vimeo_id,duration_seconds,sort_order,status,is_preview) VALUES (?,?,?,?,?,?,?,?,0)"
      ).bind(
        id,
        course.id,
        meta.title,
        meta.description,
        video.vimeo_id,
        video.duration_seconds || null,
        video.number - 1,
        video.status === "complete" ? "ready" : "processing"
      ).run();
    }
  }

  await env.COURSE_DB.prepare(
    "UPDATE courses SET summary=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(ONLINE_COMMERCE_BASICS.summary, course.id).run();
}

async function listCourses(env) {
  const courseRows = await env.COURSE_DB.prepare(
    "SELECT id,slug,title,summary,access_type,cafe24_product_no,sales_enabled,sales_state,access_duration_days,refund_policy_version,visible,catalog_visible,sort_order,status,price_krw,cafe24_sync_status,login_required,owner_member_id,instructor_name,instructor_bio,target_audience,learning_outcomes,access_info,refund_policy_text,created_at,updated_at FROM courses ORDER BY sort_order,created_at"
  ).all();
  const [lessonRows, moduleRows] = await Promise.all([
    env.COURSE_DB.prepare(
      "SELECT id,course_id,module_id,title,description,vimeo_id,duration_seconds,sort_order,status,is_preview,created_at,updated_at FROM lessons ORDER BY course_id,sort_order,created_at"
    ).all(),
    env.COURSE_DB.prepare(
      "SELECT id,course_id,title,description,sort_order,status,created_at,updated_at FROM course_modules WHERE status!='archived' ORDER BY course_id,sort_order,created_at"
    ).all()
  ]);
  const courses = Array.isArray(courseRows.results) ? courseRows.results : [];
  const lessons = Array.isArray(lessonRows.results) ? lessonRows.results : [];
  const modules = Array.isArray(moduleRows.results) ? moduleRows.results : [];
  const grouped = new Map();
  const groupedModules = new Map();
  for (const lesson of lessons) {
    if (!grouped.has(lesson.course_id)) grouped.set(lesson.course_id, []);
    grouped.get(lesson.course_id).push(lesson);
  }
  for (const module of modules) {
    if (!groupedModules.has(module.course_id)) groupedModules.set(module.course_id, []);
    groupedModules.get(module.course_id).push(module);
  }
  return courses.map(function (course) {
    return {
      ...course,
      lessons: grouped.get(course.id) || [],
      modules: groupedModules.get(course.id) || []
    };
  });
}

function creatorOptions(creators, selectedMemberId = "") {
  const base = ['<option value="">소유자 미지정</option>'];
  return base.concat(creators.map((memberId) =>
    '<option value="' + escapeHtml(memberId) + '"' +
    (memberId === selectedMemberId ? ' selected' : '') +
    '>' + escapeHtml(memberId) + '</option>'
  )).join("");
}

function cafe24ProductDetailUrl(productNo) {
  return `${COMMERCE_ORIGIN}/product/detail.html?product_no=${encodeURIComponent(productNo)}`;
}

async function cafe24AdminConnectionState(env) {
  if (!env.CAFE24_AUTH) {
    return { connected: false, scopes: [], missing_scopes: [...CAFE24_ADMIN_SCOPES] };
  }
  try {
    const raw = await env.CAFE24_AUTH.get(CAFE24_ADMIN_TOKEN_KEY);
    if (!raw) return { connected: false, scopes: [], missing_scopes: [...CAFE24_ADMIN_SCOPES] };
    const token = JSON.parse(raw);
    const scopes = Array.isArray(token && token.scopes) ? token.scopes : [];
    return {
      connected: Boolean(token && token.access_token),
      scopes,
      missing_scopes: CAFE24_ADMIN_SCOPES.filter((scope) => !scopes.includes(scope))
    };
  } catch {
    return { connected: false, scopes: [], missing_scopes: [...CAFE24_ADMIN_SCOPES] };
  }
}

function cafe24ConnectionNotice(state) {
  if (state && state.connected && (!state.missing_scopes || state.missing_scopes.length === 0)) return "";
  const missing = state && Array.isArray(state.missing_scopes) ? state.missing_scopes : [];
  const detail = missing.length
    ? "현재 토큰에 필요한 권한이 없습니다: " + missing.join(", ")
    : "Cafe24 Admin API 연결이 필요합니다.";
  return "<div class=\"card\"><p class=\"error\"><strong>Cafe24 관리자 권한 재연결이 필요합니다.</strong></p>" +
    "<p class=\"muted\">" + escapeHtml(detail) + "</p>" +
    "<a href=\"/oauth/cafe24/start\">Cafe24 권한 다시 연결 →</a></div>";
}

function friendlyCafe24Error(error) {
  const message = String(error && error.message ? error.message : error);
  if (/Customer level/i.test(message)) {
    return "Cafe24 회원등급을 요구하는 구매제한 설정 때문에 상품 생성이 중단됐습니다. 테스트 상품 생성 단계에서는 구매제한을 강제로 넣지 않도록 수정했습니다. 다시 시도해 주세요.";
  }
  if (/NAVER Pay/i.test(message)) {
    return "Cafe24 상점에서 네이버페이 기능을 사용할 수 없어 상품 생성이 중단됐습니다. 강의 상품에서는 네이버페이 설정을 별도로 보내지 않도록 수정했습니다. 다시 시도해 주세요.";
  }
  if (message.includes("(403)")) {
    return "Cafe24 상품 쓰기 권한이 없습니다. 화면 상단의 ‘Cafe24 권한 다시 연결’을 눌러 관리자 권한을 갱신해 주세요.";
  }
  if (message.includes("access token is not connected")) {
    return "Cafe24 Admin API 연결이 필요합니다. 화면 상단의 ‘Cafe24 권한 다시 연결’을 눌러 주세요.";
  }
  const parsed = message.match(/"message"\s*:\s*"([^"]+)"/);
  if (parsed && parsed[1]) {
    return "Cafe24 상품 처리 실패: " + parsed[1];
  }
  return message.length > 500 ? message.slice(0, 500) + "…" : message;
}

function normalizedSalesState(course) {
  const state = String(course?.sales_state || "").trim();
  if (["preparing","presale","selling","paused"].includes(state)) return state;
  return Number(course?.sales_enabled) === 1 ? "selling" : "preparing";
}

function salesStateLabel(value) {
  const labels = {
    preparing: "준비 중",
    presale: "사전판매",
    selling: "판매 중",
    paused: "판매 중단"
  };
  return labels[String(value || "")] || "준비 중";
}

function courseReadiness(course) {
  const lessons = Array.isArray(course?.lessons) ? course.lessons : [];
  const paid = course?.access_type === "paid";
  const paidLessons = lessons.filter((lesson, index) => index > 0 && Number(lesson.is_preview || 0) !== 1);
  const allVideosLinked = lessons.length > 0 && lessons.every((lesson) => Boolean(lesson.vimeo_id));
  const allVideosReady = allVideosLinked && lessons.every((lesson) =>
    ["ready", "published"].includes(String(lesson.status || ""))
  );
  const allDurationsKnown = allVideosLinked && lessons.every((lesson) => Number(lesson.duration_seconds || 0) > 0);
  const basicReady = Boolean(String(course?.title || "").trim()) &&
    Boolean(String(course?.summary || "").trim()) &&
    Boolean(String(course?.owner_member_id || "").trim());
  const priceReady = !paid || Number(course?.price_krw || 0) > 0;
  const salesPageReady = !paid || [
    course?.instructor_name,
    course?.instructor_bio,
    course?.target_audience,
    course?.learning_outcomes
  ].every((value) => Boolean(String(value || "").trim()));
  const policyReady = !paid || (
    Number(course?.access_duration_days || 0) > 0 &&
    Boolean(String(course?.refund_policy_version || "").trim()) &&
    Boolean(String(course?.access_info || "").trim()) &&
    Boolean(String(course?.refund_policy_text || "").trim())
  );
  const cafe24Ready = !paid || Number(course?.cafe24_product_no || 0) > 0;
  const curriculumReady = lessons.length > 0 && (!paid || paidLessons.length > 0);
  const previewReady = !paid || (
    lessons.length > 0 &&
    Boolean(lessons[0]?.vimeo_id) &&
    ["ready", "published"].includes(String(lessons[0]?.status || ""))
  );

  const items = [
    { key: "basic", label: "기본 정보", ok: basicReady, required: true, tab: "basic" },
    { key: "price", label: "판매가", ok: priceReady, required: paid, tab: "basic" },
    { key: "curriculum", label: paid ? "무료 1차시 + 유료 차시" : "커리큘럼", ok: curriculumReady, required: true, tab: "content" },
    { key: "videos", label: "모든 차시 영상 연결", ok: allVideosLinked, required: true, tab: "content" },
    { key: "processing", label: "Vimeo 처리 완료", ok: allVideosReady, required: true, tab: "content" },
    { key: "duration", label: "영상 길이 확인", ok: allDurationsKnown, required: paid, tab: "content" },
    { key: "preview", label: "첫 차시 무료 미리보기 준비", ok: previewReady, required: paid, tab: "content" },
    { key: "landing", label: "판매 페이지", ok: salesPageReady, required: paid, tab: "landing" },
    { key: "policy", label: "수강·환불 안내", ok: policyReady, required: paid, tab: "sales" },
    { key: "cafe24", label: "Cafe24 상품 연결", ok: cafe24Ready, required: paid, tab: "sales" }
  ];

  const publishBlockers = items.filter((item) => item.required && !item.ok);
  const presaleBlockers = items.filter((item) =>
    item.required &&
    !item.ok &&
    ["basic", "price", "landing", "policy", "cafe24"].includes(item.key)
  );
  return { items, publishBlockers, presaleBlockers };
}

function renderCourseReadiness(course) {
  const readiness = courseReadiness(course);
  const base = "/course-admin?course=" + encodeURIComponent(course.id);
  const rows = readiness.items
    .filter((item) => item.required)
    .map((item) =>
      "<div class=\"ready-row\"><span>" + escapeHtml(item.label) + "</span>" +
      (item.ok
        ? "<span class=\"ready-ok\">완료</span>"
        : "<a class=\"ready-wait\" href=\"" + base + "&tab=" + item.tab + "\">확인 필요 →</a>") +
      "</div>"
    ).join("");
  const summary = readiness.publishBlockers.length === 0
    ? "<p class=\"ok\"><strong>게시 준비 완료</strong> · 정식 판매 전 수강생 관점 미리보기만 확인하면 됩니다.</p>"
    : "<p class=\"hint\"><strong>게시 전 점검</strong> · 아래 " + readiness.publishBlockers.length + "개 항목을 완료하면 게시할 수 있습니다.</p>";
  return "<div class=\"course-settings\"><h3>출시 점검</h3>" + summary +
    "<div class=\"readiness\">" + rows + "</div></div>";
}

async function loadCourseForReadiness(env, courseId) {
  const course = await env.COURSE_DB.prepare(
    "SELECT id,slug,title,summary,access_type,price_krw,owner_member_id,cafe24_product_no,access_duration_days,refund_policy_version,access_info,refund_policy_text,instructor_name,instructor_bio,target_audience,learning_outcomes,status FROM courses WHERE id=? LIMIT 1"
  ).bind(courseId).first();
  if (!course) throw new Error("강의를 찾을 수 없습니다.");
  const result = await env.COURSE_DB.prepare(
    "SELECT id,vimeo_id,duration_seconds,status,is_preview,sort_order FROM lessons WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
  ).bind(courseId).all();
  return { ...course, lessons: Array.isArray(result.results) ? result.results : [] };
}

function commercePanel(course) {
  if (course.access_type !== "paid") return "";

  const productNo = Number(course.cafe24_product_no || 0);
  const price = Number(course.price_krw || 1000);
  const state = normalizedSalesState(course);

  if (!productNo) {
    const create = price > 0
      ? "<form method=\"post\" action=\"/course-admin/cafe24-product-create\">" +
        "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
        "<button type=\"submit\">Cafe24 상품 생성 · 연결</button></form>"
      : "<p class=\"hint\">판매가를 먼저 확정해 저장하면 Cafe24 상품을 생성할 수 있습니다.</p>";

    return "<div class=\"course-settings\"><strong>Cafe24 판매 연결</strong>" +
      "<p><span class=\"pill\">준비 중</span></p>" +
      "<p class=\"hint\">상품은 처음에는 진열안함·판매안함으로 생성됩니다. 연결 후 사전판매 또는 정식 판매로 전환할 수 있습니다.</p>" +
      create +
      "<details style=\"margin-top:14px\"><summary class=\"hint\" style=\"cursor:pointer\">고급 · 기존 Cafe24 상품 연결</summary>" +
      "<form method=\"post\" action=\"/course-admin/cafe24-product-link\" style=\"margin-top:10px\">" +
      "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
      "<label>기존 Cafe24 상품번호</label><div class=\"row\"><input name=\"product_no\" type=\"number\" min=\"1\" placeholder=\"상품번호\">" +
      "<button class=\"secondary\" type=\"submit\">연결</button></div></form></details></div>";
  }

  const publishedReady = course.status === "published";
  const stateDescription = {
    preparing: "신규 구매를 받지 않습니다. 판매 준비 단계입니다.",
    presale: "결제는 받지만 강의가 게시되기 전에는 구매자에게 ‘수강 준비 중’으로 표시됩니다.",
    selling: "신규 구매와 게시된 강의 수강이 모두 가능합니다.",
    paused: "신규 구매만 중단합니다. 기존 구매자의 수강권은 유지됩니다."
  }[state];

  const readiness =
    "<div class=\"readiness\">" +
    "<div class=\"ready-row\"><span>Cafe24 상품 연결</span><span class=\"ready-ok\">완료</span></div>" +
    "<div class=\"ready-row\"><span>강의 게시</span><span class=\"" + (publishedReady ? "ready-ok" : "ready-wait") + "\">" +
      (publishedReady ? "완료 · 정식 판매 가능" : "대기 · 사전판매만 가능") + "</span></div>" +
    "<div class=\"ready-row\"><span>회원 전용 구매</span><span class=\"ready-ok\">구매 가능 전환 시 자동 검증</span></div>" +
    "<div class=\"ready-row\"><span>기존 수강권</span><span class=\"ready-ok\">판매 중단과 무관하게 유지</span></div>" +
    "</div>";

  const stateButton = function (desired, label, disabled = false) {
    const current = state === desired;
    return "<button class=\"" + (desired === "presale" || desired === "selling" ? "" : "secondary") +
      "\" type=\"submit\" name=\"desired_state\" value=\"" + desired + "\"" +
      (current || disabled ? " disabled" : "") + ">" +
      (current ? "현재 · " : "") + label + "</button>";
  };

  return "<div class=\"course-settings\"><strong>판매 상태</strong>" +
    "<p><span class=\"pill\">" + escapeHtml(salesStateLabel(state)) + "</span><span class=\"pill\">상품 #" + productNo + "</span></p>" +
    "<p class=\"hint\">" + escapeHtml(stateDescription) + "</p>" +
    "<a href=\"" + escapeHtml(cafe24ProductDetailUrl(productNo)) + "\" target=\"_blank\" rel=\"noreferrer\">Cafe24 상품 확인 →</a>" +
    readiness +
    "<form method=\"post\" action=\"/course-admin/cafe24-product-sales\" style=\"margin-top:14px\">" +
    "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
    "<div class=\"toolbar\">" +
    stateButton("preparing", "준비 중") +
    stateButton("presale", "사전판매") +
    stateButton("selling", "판매 중", !publishedReady) +
    stateButton("paused", "판매 중단") +
    "</div></form>" +
    (!publishedReady ? "<p class=\"hint\">정식 판매는 강의를 게시한 뒤 선택할 수 있습니다. 짧은 사전판매가 필요하면 ‘사전판매’를 선택하고, 게시 후 ‘판매 중’으로 바꾸면 됩니다.</p>" : "") +
    "</div>";
}

async function listCourseStudents(env, course, query = "") {
  const q = String(query || "").trim().toLowerCase();
  const totalLessons = Array.isArray(course.lessons) ? course.lessons.length : 0;

  let result;
  if (course.access_type === "paid") {
    result = await env.COURSE_DB.prepare(
      "SELECT e.member_id,e.status AS access_status,e.grant_reason,e.access_expires_at,e.source_order_id,e.granted_at AS started_at,e.revoked_at,e.updated_at," +
      "COUNT(lp.lesson_id) AS touched_count,SUM(CASE WHEN lp.completed=1 THEN 1 ELSE 0 END) AS completed_count,MAX(lp.updated_at) AS last_activity " +
      "FROM course_entitlements e LEFT JOIN lesson_progress lp ON lp.member_id=e.member_id AND lp.course_id=e.course_id " +
      "WHERE e.course_id=? GROUP BY e.member_id,e.status,e.source_order_id,e.granted_at,e.revoked_at,e.updated_at " +
      "ORDER BY COALESCE(MAX(lp.updated_at),e.updated_at) DESC"
    ).bind(course.id).all();
  } else {
    result = await env.COURSE_DB.prepare(
      "SELECT e.member_id,e.status AS enrollment_status,e.enrolled_at AS started_at,e.updated_at," +
      "COUNT(lp.lesson_id) AS touched_count,SUM(CASE WHEN lp.completed=1 THEN 1 ELSE 0 END) AS completed_count,MAX(lp.updated_at) AS last_activity " +
      "FROM course_enrollments e LEFT JOIN lesson_progress lp ON lp.member_id=e.member_id AND lp.course_id=e.course_id " +
      "WHERE e.course_id=? GROUP BY e.member_id,e.status,e.enrolled_at,e.updated_at " +
      "ORDER BY COALESCE(MAX(lp.updated_at),e.updated_at) DESC"
    ).bind(course.id).all();
  }

  let rows = Array.isArray(result?.results) ? result.results : [];
  rows = rows.map((row) => {
    const completed = Number(row.completed_count || 0);
    const percent = totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;
    const status = course.access_type === "paid"
      ? String(row.access_status || "")
      : (row.enrollment_status === "enrolled" ? "active" : "revoked");
    return {
      ...row,
      access_status: status,
      completed_count: completed,
      total_lessons: totalLessons,
      progress_percent: percent,
      access_period: course.access_type === "paid" && row.access_expires_at
        ? "~ " + String(row.access_expires_at)
        : "무기한",
      access_source: course.access_type === "paid"
        ? (row.grant_reason === "manual" ? "관리자 부여" : "Cafe24 구매")
        : "무료 신청",
      refund_state: course.access_type === "paid"
        ? (row.grant_reason === "manual"
            ? (status === "revoked" ? "관리자 회수/만료" : "해당 없음")
            : (status === "revoked" ? "취소·환불 감지" : "없음"))
        : "해당 없음"
    };
  });

  if (q) {
    rows = rows.filter((row) =>
      String(row.member_id || "").toLowerCase().includes(q) ||
      String(row.source_order_id || "").toLowerCase().includes(q) ||
      String(row.access_status || "").toLowerCase().includes(q)
    );
  }
  return rows.slice(0, 200);
}

function formatAdminDate(value) {
  if (!value) return "-";
  const text = String(value);
  return text.replace("T", " ").replace(/\.\d+Z?$/, "").replace(/Z$/, "");
}

async function loadCourseStudentDetail(env, course, memberId) {
  const normalized = String(memberId || "").trim();
  if (!normalized) return null;

  let access = null;
  let events = [];
  let adminLogs = [];
  if (course.access_type === "paid") {
    access = await env.COURSE_DB.prepare(
      "SELECT member_id,status,source_order_id,source_order_item_code,grant_reason,access_expires_at,access_starts_at,access_duration_days_snapshot,purchase_price_krw,purchased_at,policy_version,refund_policy_snapshot,granted_at,revoked_at,last_verified_at,updated_at FROM course_entitlements WHERE member_id=? AND course_id=? LIMIT 1"
    ).bind(normalized, course.id).first();

    const eventRows = await env.COURSE_DB.prepare(
      "SELECT event_type,source_order_id,source_order_item_code,reason,actor_type,occurred_at FROM course_entitlement_events WHERE member_id=? AND course_id=? ORDER BY occurred_at DESC,created_at DESC LIMIT 100"
    ).bind(normalized, course.id).all();
    events = Array.isArray(eventRows?.results) ? eventRows.results : [];
  } else {
    access = await env.COURSE_DB.prepare(
      "SELECT member_id,status,enrollment_type,enrolled_at AS granted_at,updated_at FROM course_enrollments WHERE member_id=? AND course_id=? LIMIT 1"
    ).bind(normalized, course.id).first();
  }

  if (!access) return null;

  if (course.access_type === "paid") {
    const adminLogRows = await env.COURSE_DB.prepare(
      "SELECT action_type,reason,previous_status,new_status,previous_expires_at,new_expires_at,created_at FROM course_access_admin_log WHERE member_id=? AND course_id=? ORDER BY created_at DESC LIMIT 100"
    ).bind(normalized, course.id).all();
    adminLogs = Array.isArray(adminLogRows?.results) ? adminLogRows.results : [];
  }

  const progressRows = await env.COURSE_DB.prepare(
    "SELECT l.id,l.title,l.sort_order,l.duration_seconds,l.is_preview,COALESCE(lp.completed,0) AS completed,COALESCE(lp.last_position_seconds,0) AS last_position_seconds,COALESCE(lp.watched_seconds,0) AS watched_seconds,lp.first_started_at,lp.completed_at,lp.updated_at " +
    "FROM lessons l LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.member_id=? AND lp.course_id=l.course_id " +
    "WHERE l.course_id=? AND l.status!='archived' ORDER BY l.sort_order,l.created_at"
  ).bind(normalized, course.id).all();
  const progress = Array.isArray(progressRows?.results) ? progressRows.results : [];

  let order = null;
  let orderError = "";
  if (course.access_type === "paid" && access.source_order_id) {
    try {
      const payload = await cafe24AdminGet("/orders", env, {
        shop_no: 1,
        order_id: access.source_order_id,
        embed: "items"
      });
      const orders = Array.isArray(payload?.orders) ? payload.orders : [];
      const source = orders.find((item) => String(item?.order_id || "") === String(access.source_order_id)) || orders[0] || null;
      if (source) {
        const items = Array.isArray(source.items) ? source.items : [];
        const item = items.find((entry) => Number(entry?.product_no) === Number(course.cafe24_product_no)) || null;
        order = {
          order_id: source.order_id || access.source_order_id,
          paid: isPaymentConfirmed(source, item),
          revoked: isItemRevoked(source, item),
          order_status: item?.order_status || source.order_status || "",
          payment_status: item?.payment_status || source.payment_status || "",
          canceled: source.canceled || "",
          refund_status: source.refund_status || "",
          order_date: source.order_date || source.created_date || "",
          payment_amount: item?.payment_amount ?? item?.payed_amount ?? null
        };
      }
    } catch (error) {
      orderError = friendlyCafe24Error(error);
    }
  }

  const completed = progress.filter((row) => Number(row.completed) === 1).length;
  const started = progress.filter((row) => row.first_started_at).length;
  const lastActivity = progress
    .map((row) => row.updated_at)
    .filter(Boolean)
    .sort()
    .reverse()[0] || null;
  const total = progress.length;
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const watchedSeconds = progress.reduce((sum, row) => sum + Number(row.watched_seconds || 0), 0);

  const paidLessonRows = progress.filter((row, index) =>
    index > 0 && Number(row.is_preview || 0) !== 1
  );
  const refundEvidenceComplete = paidLessonRows.length > 0 &&
    paidLessonRows.every((row) => Number(row.duration_seconds || 0) > 0);
  const paidContentSeconds = refundEvidenceComplete
    ? paidLessonRows.reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0)
    : 0;
  const paidConsumedSeconds = refundEvidenceComplete
    ? paidLessonRows.reduce((sum, row) => {
        const duration = Number(row.duration_seconds || 0);
        const watched = Number(row.watched_seconds || 0);
        return sum + (Number(row.completed) === 1 ? duration : Math.min(duration, watched));
      }, 0)
    : 0;
  const paidUsageRatio = paidContentSeconds > 0
    ? Math.min(1, paidConsumedSeconds / paidContentSeconds)
    : null;
  const snapshotPrice = access.purchase_price_krw != null
    ? Number(access.purchase_price_krw)
    : (order?.payment_amount != null ? Number(order.payment_amount) : null);
  const suggestedRefund = snapshotPrice != null && Number.isFinite(snapshotPrice) && paidUsageRatio != null
    ? Math.max(0, Math.round(snapshotPrice * (1 - paidUsageRatio)))
    : null;

  return {
    member_id: normalized,
    access,
    events,
    admin_logs: adminLogs,
    progress,
    order,
    order_error: orderError,
    metrics: {
      total_lessons: total,
      started_lessons: started,
      completed_lessons: completed,
      progress_percent: percent,
      watched_seconds: watchedSeconds,
      paid_content_seconds: paidContentSeconds,
      paid_consumed_seconds: paidConsumedSeconds,
      paid_usage_ratio: paidUsageRatio,
      refund_evidence_complete: refundEvidenceComplete,
      suggested_refund_krw: suggestedRefund,
      last_activity: lastActivity
    }
  };
}

function formatWatchDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return hours + "시간 " + minutes + "분";
  if (minutes > 0) return minutes + "분 " + secs + "초";
  return secs + "초";
}

function entitlementEventLabel(type) {
  const labels = {
    granted: "수강권 부여",
    restored: "수강권 복구",
    revoked: "수강권 회수",
    manual_grant: "관리자 수강권 부여",
    manual_revoke: "관리자 수강권 회수",
    expired: "수강기간 만료"
  };
  return labels[type] || type || "상태 변경";
}

function studentDetailPanel(course, detail) {
  if (!detail) {
    return "<div class=\"panel\"><p class=\"error\">수강생 정보를 찾을 수 없습니다.</p></div>";
  }

  const accessStatus = course.access_type === "paid"
    ? String(detail.access.status || "")
    : (detail.access.status === "enrolled" ? "active" : "revoked");
  const active = accessStatus === "active";
  const back = "/course-admin?course=" + encodeURIComponent(course.id) + "&tab=students";

  const refundEstimate = course.access_type === "paid"
    ? "<div class=\"student-section\"><h3>환불 참고 계산</h3>" +
      "<div class=\"readiness\">" +
      "<div class=\"ready-row\"><span>유료 콘텐츠 기준 길이</span><strong>" + escapeHtml(formatWatchDuration(detail.metrics.paid_content_seconds)) + "</strong></div>" +
      "<div class=\"ready-row\"><span>인정 이용량</span><strong>" + escapeHtml(formatWatchDuration(detail.metrics.paid_consumed_seconds)) + "</strong></div>" +
      "<div class=\"ready-row\"><span>유료 이용률</span><strong>" + (detail.metrics.paid_usage_ratio == null ? "계산 불가" : (detail.metrics.paid_usage_ratio * 100).toFixed(1) + "%") + "</strong></div>" +
      "<div class=\"ready-row\"><span>권장 환불 참고액</span><strong>" + (detail.metrics.suggested_refund_krw == null ? "관리자 확인 필요" : Number(detail.metrics.suggested_refund_krw).toLocaleString("ko-KR") + "원") + "</strong></div>" +
      "</div>" +
      "<p class=\"hint\">첫 차시와 추가 무료 미리보기는 계산에서 제외합니다. 완료한 유료 차시는 전체 길이, 미완료 차시는 실제 누적 시청시간만 반영하며 차시 길이를 초과해 차감하지 않습니다.</p>" +
      (!detail.metrics.refund_evidence_complete ? "<p class=\"error\">영상 길이 또는 재생 기록이 불완전해 자동 확정하지 않습니다.</p>" : "") +
      "<p class=\"hint\">이 값은 관리자 판단용 참고액입니다. Cafe24 환불을 자동 실행하지 않으며 적용 법령과 환불 사유를 확인한 뒤 최종 처리합니다.</p></div>"
    : "";

  const orderSection = course.access_type === "paid"
    ? "<div class=\"student-section\"><h3>Cafe24 주문</h3>" +
      (detail.order_error ? "<p class=\"error\">" + escapeHtml(detail.order_error) + "</p>" : "") +
      (detail.order
        ? "<div class=\"readiness\">" +
          "<div class=\"ready-row\"><span>주문번호</span><strong>" + escapeHtml(detail.order.order_id || "-") + "</strong></div>" +
          "<div class=\"ready-row\"><span>결제 확인</span><span class=\"" + (detail.order.paid ? "ready-ok" : "ready-wait") + "\">" + (detail.order.paid ? "완료" : "미확인") + "</span></div>" +
          "<div class=\"ready-row\"><span>취소·환불</span><span class=\"" + (detail.order.revoked ? "ready-wait" : "ready-ok") + "\">" + (detail.order.revoked ? "감지됨" : "없음") + "</span></div>" +
          "<div class=\"ready-row\"><span>주문 상태</span><span>" + escapeHtml(detail.order.order_status || "-") + "</span></div>" +
          "<div class=\"ready-row\"><span>결제 상태</span><span>" + escapeHtml(detail.order.payment_status || "-") + "</span></div>" +
          "</div>"
        : "<p class=\"muted\">연결된 Cafe24 주문을 확인하지 못했습니다.</p>") +
      "</div>"
    : "";

  const history = course.access_type === "paid"
    ? "<div class=\"student-section\"><h3>수강권 변경 이력</h3>" +
      (detail.events.length
        ? "<div class=\"timeline\">" + detail.events.map((event) =>
            "<div class=\"timeline-item\"><div class=\"timeline-time\">" + escapeHtml(formatAdminDate(event.occurred_at)) + "</div>" +
            "<div><div class=\"timeline-title\">" + escapeHtml(entitlementEventLabel(event.event_type)) + "</div>" +
            "<div class=\"timeline-sub\">" +
            escapeHtml(event.reason || "-") +
            (event.source_order_id ? " · 주문 " + escapeHtml(event.source_order_id) : "") +
            " · " + escapeHtml(event.actor_type === "admin" ? "관리자" : "시스템") +
            "</div></div></div>"
          ).join("") + "</div>"
        : "<p class=\"muted\">기록된 수강권 변경 이력이 없습니다.</p>") +
      "</div>"
    : "";

  const manual = course.access_type === "paid" && detail.access.grant_reason === "manual";
  const manualControls = course.access_type !== "paid"
    ? ""
    : manual
      ? "<div class=\"student-section\"><h3>관리자 수강권 관리</h3>" +
        (active
          ? "<div class=\"course-settings\"><form method=\"post\" action=\"/course-admin/student-access\">" +
            "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
            "<input type=\"hidden\" name=\"member_id\" value=\"" + escapeHtml(detail.member_id) + "\">" +
            "<input type=\"hidden\" name=\"action\" value=\"expiry\">" +
            "<label>수강 만료일</label><input type=\"date\" name=\"expires_at\" value=\"" + escapeHtml(detail.access.access_expires_at || "") + "\">" +
            "<div class=\"hint\">비워두면 무기한으로 변경합니다.</div>" +
            "<label>변경 사유</label><input name=\"reason\" required maxlength=\"200\" placeholder=\"예: 요청에 따라 30일 연장\">" +
            "<button class=\"secondary\" type=\"submit\" style=\"margin-top:10px\">수강기간 저장</button></form></div>" +
            "<div class=\"course-settings\"><form method=\"post\" action=\"/course-admin/student-access\">" +
            "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
            "<input type=\"hidden\" name=\"member_id\" value=\"" + escapeHtml(detail.member_id) + "\">" +
            "<input type=\"hidden\" name=\"action\" value=\"revoke\">" +
            "<label>회수 사유</label><input name=\"reason\" required maxlength=\"200\" placeholder=\"수동 수강권 회수 사유\">" +
            "<button class=\"secondary\" type=\"submit\" style=\"margin-top:10px\">수동 수강권 회수</button></form></div>"
          : "<div class=\"course-settings\"><form method=\"post\" action=\"/course-admin/student-access\">" +
            "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
            "<input type=\"hidden\" name=\"member_id\" value=\"" + escapeHtml(detail.member_id) + "\">" +
            "<input type=\"hidden\" name=\"action\" value=\"grant\">" +
            "<label>복구 후 만료일</label><input type=\"date\" name=\"expires_at\" value=\"" + escapeHtml(detail.access.access_expires_at || "") + "\">" +
            "<label>복구 사유</label><input name=\"reason\" required maxlength=\"200\" placeholder=\"수강권 복구 사유\">" +
            "<button type=\"submit\" style=\"margin-top:10px\">수동 수강권 복구</button></form></div>") +
        "</div>"
      : "<div class=\"student-section\"><h3>수강권 관리</h3><div class=\"advanced-note\">이 수강권은 Cafe24 구매로 생성됐습니다. 취소·환불 및 권한 회수는 Cafe24 주문에서 처리합니다.</div></div>";

  const adminHistory = course.access_type === "paid"
    ? "<div class=\"student-section\"><h3>관리자 변경 이력</h3>" +
      (detail.admin_logs && detail.admin_logs.length
        ? "<div class=\"timeline\">" + detail.admin_logs.map((log) =>
            "<div class=\"timeline-item\"><div class=\"timeline-time\">" + escapeHtml(formatAdminDate(log.created_at)) + "</div>" +
            "<div><div class=\"timeline-title\">" + escapeHtml(log.action_type || "변경") + "</div>" +
            "<div class=\"timeline-sub\">" + escapeHtml(log.reason || "-") +
            (log.previous_expires_at !== log.new_expires_at
              ? " · 만료일 " + escapeHtml(log.previous_expires_at || "무기한") + " → " + escapeHtml(log.new_expires_at || "무기한")
              : "") +
            "</div></div></div>"
          ).join("") + "</div>"
        : "<p class=\"muted\">관리자 변경 이력이 없습니다.</p>") +
      "</div>"
    : "";

  const progressRows = detail.progress.length
    ? detail.progress.map((row, index) => {
        const state = Number(row.completed) === 1 ? "완료" : row.first_started_at ? "학습 중" : "미수강";
        const cls = Number(row.completed) === 1 ? "status-active" : row.first_started_at ? "status-neutral" : "muted";
        return "<tr>" +
          "<td>" + (index + 1) + ". " + escapeHtml(row.title) + "</td>" +
          "<td><span class=\"" + cls + "\">" + state + "</span></td>" +
          "<td>" + Number(row.last_position_seconds || 0) + "초</td>" +
          "<td>" + escapeHtml(formatWatchDuration(row.watched_seconds)) + "</td>" +
          "<td class=\"nowrap\">" + escapeHtml(formatAdminDate(row.first_started_at)) + "</td>" +
          "<td class=\"nowrap\">" + escapeHtml(formatAdminDate(row.completed_at)) + "</td>" +
          "<td class=\"nowrap\">" + escapeHtml(formatAdminDate(row.updated_at)) + "</td>" +
          "</tr>";
      }).join("")
    : "<tr><td colspan=\"7\" class=\"muted\">등록된 차시가 없습니다.</td></tr>";

  return "<div class=\"panel\"><a class=\"backlink\" href=\"" + back + "\">← 수강생 목록</a>" +
    "<div class=\"sectionhead\"><div><h3>" + escapeHtml(detail.member_id) + "</h3><p class=\"hint\">회원의 주문·수강권·학습 진행 상태를 확인합니다.</p></div>" +
    "<span class=\"" + (active ? "status-active" : "status-revoked") + "\">" + (active ? "수강 가능" : "수강 회수") + "</span></div>" +
    "<div class=\"student-detail-grid\">" +
    "<div class=\"student-detail-card\"><div class=\"hint\">진도율</div><strong>" + Number(detail.metrics.progress_percent || 0) + "%</strong></div>" +
    "<div class=\"student-detail-card\"><div class=\"hint\">완료 차시</div><strong>" + Number(detail.metrics.completed_lessons || 0) + " / " + Number(detail.metrics.total_lessons || 0) + "</strong></div>" +
    "<div class=\"student-detail-card\"><div class=\"hint\">누적 시청</div><strong>" + escapeHtml(formatWatchDuration(detail.metrics.watched_seconds)) + "</strong></div>" +
    "<div class=\"student-detail-card\"><div class=\"hint\">수강권 출처</div><strong>" + escapeHtml(course.access_type === "paid" ? (detail.access.grant_reason === "manual" ? "관리자 부여" : "Cafe24 구매") : "무료 신청") + "</strong></div>" +
    "<div class=\"student-detail-card\"><div class=\"hint\">수강기간</div><strong>" + escapeHtml(detail.access.access_expires_at ? "~ " + detail.access.access_expires_at : "무기한") + "</strong></div>" +
    "<div class=\"student-detail-card\"><div class=\"hint\">마지막 학습</div><strong>" + escapeHtml(formatAdminDate(detail.metrics.last_activity)) + "</strong></div>" +
    "<div class=\"student-detail-card\"><div class=\"hint\">수강 시작</div><strong>" + escapeHtml(formatAdminDate(detail.access.granted_at || detail.access.enrolled_at)) + "</strong></div>" +
    "</div>" +
    (course.access_type === "paid" && detail.access.grant_reason === "purchase"
      ? "<div class=\"student-section\"><h3>구매 당시 조건</h3><div class=\"readiness\">" +
        "<div class=\"ready-row\"><span>실결제액 스냅샷</span><strong>" + (detail.access.purchase_price_krw != null ? Number(detail.access.purchase_price_krw).toLocaleString("ko-KR") + "원" : "확인 불가") + "</strong></div>" +
        "<div class=\"ready-row\"><span>구매일</span><strong>" + escapeHtml(formatAdminDate(detail.access.purchased_at)) + "</strong></div>" +
        "<div class=\"ready-row\"><span>구매 당시 수강기간</span><strong>" + (detail.access.access_duration_days_snapshot ? Number(detail.access.access_duration_days_snapshot) + "일" : "무기한") + "</strong></div>" +
        "<div class=\"ready-row\"><span>환불정책 버전</span><strong>" + escapeHtml(detail.access.policy_version || "-") + "</strong></div>" +
        "</div></div>"
      : "") +
    refundEstimate + orderSection + history + manualControls + adminHistory +
    "<div class=\"student-section\"><h3>차시별 학습 진도</h3><div class=\"student-table-wrap\"><table class=\"student-table\"><thead><tr>" +
    "<th>차시</th><th>상태</th><th>마지막 위치</th><th>시청 누적</th><th>첫 학습</th><th>완료</th><th>최근 변경</th>" +
    "</tr></thead><tbody>" + progressRows + "</tbody></table></div></div>" +
    "</div>";
}

function studentManagementPanel(course, rows, query = "") {
  const total = rows.length;
  const active = rows.filter((row) => row.access_status === "active").length;
  const revoked = rows.filter((row) => row.access_status === "revoked").length;
  const learning = rows.filter((row) => Number(row.progress_percent || 0) > 0 && Number(row.progress_percent || 0) < 100).length;

  const summary =
    "<div class=\"student-summary\">" +
    "<div class=\"student-metric\"><div class=\"hint\">조회 인원</div><div class=\"value\">" + total + "</div></div>" +
    "<div class=\"student-metric\"><div class=\"hint\">수강 가능</div><div class=\"value\">" + active + "</div></div>" +
    "<div class=\"student-metric\"><div class=\"hint\">취소·회수</div><div class=\"value\">" + revoked + "</div></div>" +
    "<div class=\"student-metric\"><div class=\"hint\">학습 중</div><div class=\"value\">" + learning + "</div></div>" +
    "</div>";

  const manualGrant = course.access_type === "paid"
    ? "<details class=\"course-settings\" style=\"margin-bottom:14px\"><summary style=\"cursor:pointer;font-weight:800\">+ 수동 수강권 부여</summary>" +
      "<form method=\"post\" action=\"/course-admin/student-access\" style=\"margin-top:12px\">" +
      "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
      "<input type=\"hidden\" name=\"action\" value=\"grant\">" +
      "<label>Cafe24 회원 ID</label><input name=\"member_id\" required placeholder=\"회원 아이디\">" +
      "<div class=\"row\"><div><label>만료일</label><input type=\"date\" name=\"expires_at\"><div class=\"hint\">비워두면 무기한입니다.</div></div>" +
      "<div><label>사유</label><input name=\"reason\" required maxlength=\"200\" placeholder=\"예: 저자 초청, 이벤트 제공\"></div></div>" +
      "<button type=\"submit\" style=\"margin-top:12px\">수동 수강권 부여</button></form></details>"
    : "";

  const search =
    "<form class=\"student-search\" method=\"get\" action=\"/course-admin\">" +
    "<input type=\"hidden\" name=\"course\" value=\"" + escapeHtml(course.id) + "\">" +
    "<input type=\"hidden\" name=\"tab\" value=\"students\">" +
    "<input name=\"student_q\" value=\"" + escapeHtml(query || "") + "\" placeholder=\"회원 ID 또는 주문번호 검색\">" +
    "<button class=\"secondary\" type=\"submit\">검색</button></form>";

  const body = rows.length
    ? rows.map((row) => {
        const statusClass = row.access_status === "active" ? "status-active" : "status-revoked";
        const statusLabel = row.access_status === "active" ? "수강 가능" : "수강 회수";
        return "<tr>" +
          "<td><a href=\"/course-admin?course=" + encodeURIComponent(course.id) + "&tab=students&student=" + encodeURIComponent(row.member_id || "") + "\"><strong>" + escapeHtml(row.member_id || "-") + "</strong></a></td>" +
          "<td class=\"nowrap\">" + escapeHtml(row.source_order_id || "-") + "</td>" +
          "<td>" + escapeHtml(row.access_source || "-") + "</td>" +
          "<td><span class=\"" + statusClass + "\">" + statusLabel + "</span></td>" +
          "<td>" + escapeHtml(row.refund_state) + "</td>" +
          "<td><div class=\"progress-mini\"><div class=\"progress-mini-track\"><span style=\"width:" + Number(row.progress_percent || 0) + "%\"></span></div><span>" + Number(row.progress_percent || 0) + "%</span></div>" +
          "<div class=\"hint\">" + Number(row.completed_count || 0) + "/" + Number(row.total_lessons || 0) + " 완료</div></td>" +
          "<td class=\"nowrap\">" + escapeHtml(row.access_period) + "</td>" +
          "<td class=\"nowrap\">" + escapeHtml(formatAdminDate(row.last_activity)) + "</td>" +
          "<td class=\"nowrap\">" + escapeHtml(formatAdminDate(row.started_at)) + "</td>" +
          "</tr>";
      }).join("")
    : "<tr><td colspan=\"9\" class=\"muted\">조건에 맞는 수강생이 없습니다.</td></tr>";

  return "<div class=\"panel\"><div class=\"sectionhead\"><div><h3>수강생 관리</h3>" +
    "<p class=\"hint\">D1 수강권/수강신청과 학습 진도를 기준으로 최대 200명까지 표시합니다.</p></div></div>" +
    summary + manualGrant + search +
    "<div class=\"student-table-wrap\"><table class=\"student-table\"><thead><tr>" +
    "<th>회원</th><th>주문번호</th><th>출처</th><th>수강권</th><th>취소·환불</th><th>진도</th><th>수강기간</th><th>마지막 학습</th><th>수강 시작</th>" +
    "</tr></thead><tbody>" + body + "</tbody></table></div>" +
    "<p class=\"hint\" style=\"margin-top:10px\">Cafe24 구매 수강권은 주문에서 관리하고, 관리자 부여 수강권은 회원 상세에서 회수·기간 변경할 수 있습니다.</p></div>";
}

function courseCard(course, creators, activeTab = "basic", studentRows = [], studentQuery = "", studentDetail = null, studentMemberId = "") {
  const access = course.access_type === "paid" ? "유료" : "무료 · 로그인 필요";
  const price = Number(course.price_krw || 0);
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const moduleOptions = ['<option value="">섹션 없음</option>']
    .concat(modules.map(function (module) {
      return '<option value="' + escapeHtml(module.id) + '">' + escapeHtml(module.title) + '</option>';
    }));
  const lessonOrder = new Map(lessons.map(function (lesson, index) {
    return [String(lesson.id), index];
  }));

  function renderLesson(lesson) {
    const index = Number(lessonOrder.get(String(lesson.id)) || 0);
    const mandatoryPreview = course.access_type === "paid" && index === 0;
    const hasVideo = Boolean(lesson.vimeo_id);
    const vimeo = hasVideo ? "Vimeo " + escapeHtml(lesson.vimeo_id) : "영상 미등록";
    const processing = ["uploading","processing"].includes(String(lesson.status || ""));
    const videoBadge = hasVideo
      ? "<span class=\"mini-badge " + (processing ? "warn" : "ok") + "\">" + (processing ? "영상 처리 중" : "영상 연결됨") + "</span>"
      : "<span class=\"mini-badge warn\">영상 없음</span>";
    const previewBadge = course.access_type === "paid"
      ? "<span class=\"mini-badge preview-badge mandatory-preview-badge\" style=\"" + (mandatoryPreview ? "" : "display:none") + "\">1차시 무료</span>" +
        "<span class=\"mini-badge preview-badge additional-preview-badge\" style=\"" + (!mandatoryPreview && Number(lesson.is_preview) === 1 ? "" : "display:none") + "\">추가 미리보기</span>"
      : "";
    const statusBadge = "<span class=\"mini-badge\">" + escapeHtml(lesson.status || "draft") + "</span>";
    const upload = hasVideo ? "" :
      "<div class=\"upload\" data-vimeo-upload data-course-id=\"" + escapeHtml(course.id) + "\" data-lesson-id=\"" + escapeHtml(lesson.id) + "\" data-lesson-title=\"" + escapeHtml(lesson.title) + "\">" +
      "<div data-vimeo-link data-course-id=\"" + escapeHtml(course.id) + "\" data-lesson-id=\"" + escapeHtml(lesson.id) + "\">" +
      "<button class=\"secondary existingvideoload\" type=\"button\">기존 Vimeo 영상 연결</button>" +
      "<div class=\"existingvideolist\" style=\"margin-top:8px\"></div><div class=\"uploadstatus existingvideostatus\"></div></div>" +
      "<div style=\"margin:14px 0;border-top:1px solid #e4e4e7\"></div>" +
      "<label>새 영상 파일</label><input class=\"uploadfile\" type=\"file\" accept=\"video/*\">" +
      "<button class=\"uploadbutton\" type=\"button\">새 영상 Vimeo 업로드</button>" +
      "<div class=\"uploadbar\"><span></span></div><div class=\"uploadstatus\">영상 파일을 선택하세요.</div></div>";
    const selectedOptions = moduleOptions.map(function (option) {
      if (!lesson.module_id) return option;
      return option.replace('value="' + escapeHtml(lesson.module_id) + '"', 'value="' + escapeHtml(lesson.module_id) + '" selected');
    }).join("");
    const preview = course.access_type === "paid"
      ? "<label class=\"preview mandatory-preview-control\" style=\"" + (mandatoryPreview ? "" : "display:none") + "\"><input type=\"checkbox\" checked disabled>1차시는 의무 무료 미리보기</label>" +
        "<label class=\"preview additional-preview-control\" style=\"" + (mandatoryPreview ? "display:none" : "") + "\"><input class=\"additional-preview-toggle\" type=\"checkbox\" name=\"is_preview\" value=\"1\"" + (Number(lesson.is_preview) === 1 ? " checked" : "") + (mandatoryPreview ? " disabled" : "") + ">이 차시도 추가 무료 미리보기로 공개</label>" +
        "<div class=\"hint preview-rule-hint\">" + (mandatoryPreview ? "1차시는 자동 공개됩니다. OT·소개가 아니라 실제 강의 품질을 판단할 수 있는 본강의를 배치하세요." : "강의가 게시된 상태에서만 공개 재생됩니다.") + "</div>"
      : "";
    const up = index > 0
      ? "<form method=\"post\" action=\"/course-admin/lesson-move\"><input type=\"hidden\" name=\"lesson_id\" value=\"" + escapeHtml(lesson.id) + "\"><input type=\"hidden\" name=\"direction\" value=\"up\"><button class=\"secondary\" type=\"submit\">위로</button></form>"
      : "";
    const down = index < lessons.length - 1
      ? "<form method=\"post\" action=\"/course-admin/lesson-move\"><input type=\"hidden\" name=\"lesson_id\" value=\"" + escapeHtml(lesson.id) + "\"><input type=\"hidden\" name=\"direction\" value=\"down\"><button class=\"secondary\" type=\"submit\">아래로</button></form>"
      : "";
    return "<details class=\"lessoncard curriculum-lesson\" data-lesson-id=\"" + escapeHtml(lesson.id) + "\">" +
      "<summary><span class=\"drag-handle lesson-drag\" draggable=\"true\" title=\"끌어서 순서 또는 섹션 변경\">⋮⋮</span>" +
      "<span class=\"lesson-summary-main\"><span class=\"lesson-summary-title\"><span class=\"lesson-number\">" + (index + 1) + ".</span><strong>" + escapeHtml(lesson.title) + "</strong></span>" +
      "<span class=\"lesson-badges\">" + videoBadge + previewBadge + statusBadge + "</span></span>" +
      "<span class=\"pill\">편집</span></summary>" +
      "<div class=\"lessonbody\"><form method=\"post\" action=\"/course-admin/lesson-update\">" +
      "<input type=\"hidden\" name=\"lesson_id\" value=\"" + escapeHtml(lesson.id) + "\">" +
      "<label>차시 제목</label><input name=\"title\" value=\"" + escapeHtml(lesson.title) + "\" required>" +
      "<label>차시 설명 · 학습 포인트</label><textarea name=\"description\" placeholder=\"수강생에게 이 차시에서 무엇을 배우는지 설명하세요.\">" + escapeHtml(lesson.description || "") + "</textarea>" +
      "<div class=\"fieldgrid\"><div><label>소속 섹션</label><select name=\"module_id\">" + selectedOptions + "</select><div class=\"hint\">드래그로 다른 섹션에 옮겨도 자동 저장됩니다.</div></div><div><label>영상 상태</label><div class=\"lessonmeta\" style=\"padding:12px 0\">" + vimeo + "</div></div></div>" +
      preview +
      "<button type=\"submit\" style=\"margin-top:12px\">차시 저장</button></form>" +
      "<div class=\"toolbar\">" + up + down + "</div>" + upload + "</div></details>";
  }

  const groupedLessons = new Map();
  groupedLessons.set("", []);
  modules.forEach(function (module) { groupedLessons.set(String(module.id), []); });
  lessons.forEach(function (lesson) {
    const key = lesson.module_id && groupedLessons.has(String(lesson.module_id)) ? String(lesson.module_id) : "";
    groupedLessons.get(key).push(lesson);
  });

  function renderGroup(module) {
    const moduleId = module ? String(module.id) : "";
    const title = module ? module.title : "섹션 없음";
    const rows = groupedLessons.get(moduleId) || [];
    const handle = module
      ? "<span class=\"drag-handle module-drag\" draggable=\"true\" title=\"끌어서 섹션 순서 변경\">☰</span>"
      : "<span class=\"drag-handle\" aria-hidden=\"true\">·</span>";
    return "<section class=\"curriculum-group\" data-module-id=\"" + escapeHtml(moduleId) + "\">" +
      "<div class=\"curriculum-group-head\">" + handle + "<strong>" + escapeHtml(title) + "</strong><span class=\"curriculum-count\">" + rows.length + "개 차시</span></div>" +
      "<div class=\"lesson-dropzone\">" + rows.map(renderLesson).join("") + "</div></section>";
  }

  const curriculumHtml =
    renderGroup(null) +
    modules.map(renderGroup).join("");

  const published = course.status === "published" && Number(course.visible) === 1;
  const readiness = courseReadiness(course);
  const statusForm =
    "<form method=\"post\" action=\"/course-admin/course-status\" style=\"margin:0\">" +
    "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
    "<input type=\"hidden\" name=\"action\" value=\"" + (published ? "unpublish" : "publish") + "\">" +
    "<button class=\"secondary\" type=\"submit\"" + (!published && readiness.publishBlockers.length ? " disabled title=\"출시 점검 항목을 먼저 완료하세요.\"" : "") + ">" +
    (published ? "게시 중지" : "강의 게시") + "</button></form>";

  const tab = ["basic", "content", "landing", "sales", "students", "advanced"].includes(activeTab) ? activeTab : "basic";
  const base = "/course-admin?course=" + encodeURIComponent(course.id);
  const tabLink = function (key, label) {
    return "<a class=\"" + (tab === key ? "active" : "") + "\" href=\"" + base + "&tab=" + key + "\">" + label + "</a>";
  };

  const missingVideo = lessons.some((lesson) => !lesson.vimeo_id);
  const basicReady = readiness.items.find((item) => item.key === "basic")?.ok &&
    readiness.items.find((item) => item.key === "price")?.ok;
  const salesPageReady = readiness.items.find((item) => item.key === "landing")?.ok !== false;
  const videoProcessingReady = readiness.items.find((item) => item.key === "processing")?.ok !== false;
  const durationReady = readiness.items.find((item) => item.key === "duration")?.ok !== false;
  const salesState = normalizedSalesState(course);
  let nextTab = "basic";
  let nextLabel = "기본 정보를 확인하세요";
  if (!basicReady) {
    nextTab = "basic";
    nextLabel = course.access_type === "paid" && price <= 0
      ? "판매가를 입력하고 기본 정보를 확인하세요"
      : "기본 정보를 완성하세요";
  } else if (lessons.length === 0) {
    nextTab = "content";
    nextLabel = "첫 차시와 강의 영상을 등록하세요";
  } else if (missingVideo) {
    nextTab = "content";
    nextLabel = "영상이 없는 차시를 연결하세요";
  } else if (!videoProcessingReady) {
    nextTab = "content";
    nextLabel = "Vimeo 영상 처리가 끝났는지 확인하세요";
  } else if (course.access_type === "paid" && !durationReady) {
    nextTab = "content";
    nextLabel = "영상 길이 정보를 확인하세요";
  } else if (course.access_type === "paid" && !salesPageReady) {
    nextTab = "landing";
    nextLabel = "판매 페이지를 작성하세요";
  } else if (course.access_type === "paid" && !(Number(course.cafe24_product_no) > 0)) {
    nextTab = "sales";
    nextLabel = "Cafe24 상품 연결을 확인하세요";
  } else if (!published) {
    nextTab = "content";
    nextLabel = "준비가 끝났으면 강의를 게시하세요";
  } else if (course.access_type === "paid" && salesState === "preparing") {
    nextTab = "sales";
    nextLabel = "사전판매 또는 판매를 시작하세요";
  } else if (course.access_type === "paid" && salesState === "presale") {
    nextTab = "sales";
    nextLabel = "사전판매 중 · 준비되면 판매 중으로 전환하세요";
  } else if (course.access_type === "paid" && salesState === "paused") {
    nextTab = "sales";
    nextLabel = "판매 중단 상태입니다";
  } else {
    nextTab = "students";
    nextLabel = "운영 중 · 수강생 현황을 확인하세요";
  }
  const nextAction =
    "<div class=\"readiness\" style=\"margin:14px 0 0\"><div class=\"ready-row\"><span><strong>다음 할 일</strong></span>" +
    "<a class=\"action-link\" href=\"" + base + "&tab=" + nextTab + "\">" + escapeHtml(nextLabel) + " →</a></div></div>";

  const header =
    "<div class=\"editor-head\"><div><a class=\"backlink\" href=\"/course-admin\">← 강의 목록</a>" +
    "<h2>" + escapeHtml(course.title) + "</h2><div class=\"course-meta\">" +
    "<span class=\"pill\">" + access + "</span><span class=\"pill\">" + escapeHtml(course.status) + "</span>" +
    (course.access_type === "paid" ? "<span class=\"pill\">" + (price > 0 ? price.toLocaleString("ko-KR") + "원" : "가격 미정") + "</span>" : "") +
    "</div></div>" + statusForm + "</div>" +
    "<nav class=\"admin-tabs\">" +
    tabLink("basic", "기본 정보") +
    tabLink("content", "콘텐츠") +
    tabLink("landing", "판매 페이지") +
    tabLink("sales", "판매 설정") +
    tabLink("students", "수강생") +
    tabLink("advanced", "고급 설정") +
    "</nav>" + nextAction;

  let panel = "";

  if (tab === "basic") {
    panel =
      "<div class=\"panel narrow\"><div class=\"course-settings\"><h3>기본 정보</h3>" +
      "<form method=\"post\" action=\"/course-admin/course-update\">" +
      "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
      "<label>강의명</label><input name=\"title\" value=\"" + escapeHtml(course.title) + "\" required>" +
      "<label>강의 소개</label><textarea name=\"summary\" placeholder=\"누구를 위한 강의인지, 무엇을 배우는지 간단히 입력하세요.\">" + escapeHtml(course.summary || "") + "</textarea>" +
      "<label>콘텐츠 공급자</label><select name=\"owner_member_id\">" + creatorOptions(creators, course.owner_member_id || "") + "</select>" +
      "<div class=\"fieldgrid\"><div><label>수강 방식</label><select name=\"access_type\">" +
      "<option value=\"public\"" + (course.access_type === "public" ? " selected" : "") + ">무료 · 회원 로그인 필요</option>" +
      "<option value=\"paid\"" + (course.access_type === "paid" ? " selected" : "") + ">유료 · 구매 확인 필요</option></select></div>" +
      "<div><label>기준 가격(원)</label><input name=\"price_krw\" type=\"number\" min=\"0\" step=\"1000\" value=\"" + Number(course.price_krw || 0) + "\"></div></div>" +
      "<label class=\"preview\" style=\"margin-top:14px\"><input type=\"checkbox\" name=\"catalog_visible\" value=\"1\"" + (Number(course.catalog_visible) === 1 ? " checked" : "") + ">강의 찾기에 표시</label>" +
      "<div class=\"hint\">콘텐츠 게시 여부와 별개입니다. 체크하면 수강권이 없는 사용자도 강의 소개를 볼 수 있습니다.</div>" +
      "<button type=\"submit\" style=\"margin-top:14px\">저장</button></form></div></div>";
  } else if (tab === "landing") {
    panel =
      "<div class=\"panel narrow\"><div class=\"course-settings\"><div class=\"sectionhead\"><div><h3>판매 페이지</h3>" +
      "<p class=\"hint\">강의 상세 페이지에서 구매 전 고객에게 보여줄 내용을 관리합니다. 비어 있는 항목은 공개 페이지에서 숨깁니다.</p></div>" +
      "<a class=\"action-link\" target=\"_blank\" rel=\"noreferrer\" href=\"/courses/" + encodeURIComponent(course.slug) + "\">상세 페이지 보기 →</a></div>" +
      "<form method=\"post\" action=\"/course-admin/course-sales-page\">" +
      "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
      "<label>강사명</label><input name=\"instructor_name\" maxlength=\"120\" value=\"" + escapeHtml(course.instructor_name || "") + "\" placeholder=\"예: 맥작가\">" +
      "<label>강사 소개</label><textarea name=\"instructor_bio\" placeholder=\"강사의 경력과 이 강의를 가르칠 이유를 간결하게 입력하세요.\">" + escapeHtml(course.instructor_bio || "") + "</textarea>" +
      "<label>이런 분께 추천합니다</label><textarea name=\"target_audience\" placeholder=\"한 줄에 한 항목씩 입력하세요.\">" + escapeHtml(course.target_audience || "") + "</textarea>" +
      "<div class=\"hint\">한 줄에 한 항목씩 입력하면 판매 페이지에서 목록으로 표시됩니다.</div>" +
      "<label>이 강의에서 배우는 내용</label><textarea name=\"learning_outcomes\" placeholder=\"한 줄에 한 항목씩 입력하세요.\">" + escapeHtml(course.learning_outcomes || "") + "</textarea>" +
      "<div class=\"advanced-note\" style=\"margin-top:16px\"><strong>이용·환불 안내는 자동 적용</strong>" +
      "<p class=\"hint\">일반 유료 VOD는 결제일 기준 180일, 첫 본강의 1차시 무료, Fair-trust v1.0 정책을 사용합니다. 판매 페이지에는 시스템에 저장된 안내가 자동 표시됩니다.</p></div>" +
      "<button type=\"submit\" style=\"margin-top:14px\">판매 페이지 저장</button></form></div></div>";
  } else if (tab === "sales") {
    panel =
      "<div class=\"sales-summary\"><div class=\"panel\"><div class=\"sectionhead\"><div><h3>판매 설정</h3>" +
      "<p class=\"hint\">강의와 Cafe24 상품의 연결 및 판매 상태만 관리합니다.</p></div></div>" +
      renderCourseReadiness(course) +
      (course.access_type === "paid"
        ? "<div class=\"course-settings\"><strong>기본 수강 정책</strong><div class=\"readiness\">" +
          "<div class=\"ready-row\"><span>수강기간</span><strong>결제일 기준 180일</strong></div>" +
          "<div class=\"ready-row\"><span>무료 미리보기</span><strong>첫 본강의 1차시</strong></div>" +
          "<div class=\"ready-row\"><span>환불정책</span><strong>Fair-trust v1.0</strong></div>" +
          "</div><p class=\"hint\">일반 유료 VOD는 별도 설정 없이 이 정책을 자동 적용합니다.</p></div>"
        : "") +
      commercePanel(course) + "</div>" +
      "<aside class=\"sales-preview\"><div class=\"hint\">판매 정보 미리보기</div><p><strong>" +
      (price > 0 ? price.toLocaleString("ko-KR") + "원" : "무료") + "</strong></p><p class=\"muted\">" +
      (Number(course.cafe24_product_no || 0) > 0 ? "Cafe24 상품 #" + Number(course.cafe24_product_no) : "Cafe24 상품 미연결") +
      "</p><span class=\"pill\">" + escapeHtml(salesStateLabel(normalizedSalesState(course))) + "</span></aside></div>";
  } else if (tab === "students") {
    panel = studentMemberId
      ? studentDetailPanel(course, studentDetail)
      : studentManagementPanel(course, studentRows, studentQuery);
  } else if (tab === "advanced") {
    panel =
      "<div class=\"panel narrow\"><div class=\"course-settings\"><h3>고급 설정</h3>" +
      "<div class=\"advanced-note\"><p><strong>Course ID</strong><br><span class=\"muted\">" + escapeHtml(course.id) + "</span></p>" +
      "<p><strong>URL slug</strong><br><span class=\"muted\">" + escapeHtml(course.slug) + "</span></p>" +
      "<p><strong>Cafe24 sync</strong><br><span class=\"muted\">" + escapeHtml(course.cafe24_sync_status || "not_linked") + "</span></p>" +
      "<p class=\"hint\">일반적인 강의 등록·수정에서는 이 화면을 사용할 필요가 없습니다.</p></div></div></div>";
  } else {
    panel =
      "<div class=\"panel\"><div class=\"sectionhead\"><div><h3>콘텐츠</h3>" +
      "<p class=\"hint\">섹션과 차시를 끌어서 순서와 소속을 바꿀 수 있습니다. 변경한 순서는 자동 저장됩니다.</p>" +
      (course.access_type === "paid" ? "<p class=\"hint\"><strong>유료 강의 운영 기준:</strong> 1차시는 자동으로 무료 공개됩니다. 실제 내용을 판단할 수 있는 본강의를 1차시에 배치하세요.</p>" : "") +
      "</div></div>" +
      "<div class=\"content-tools\"><span class=\"hint\">차시를 클릭하면 제목·설명·영상·미리보기를 편집합니다.</span><span class=\"curriculum-save\" data-curriculum-status>순서 자동 저장</span></div>" +
      "<div class=\"editor curriculum\" data-curriculum data-course-id=\"" + escapeHtml(course.id) + "\">" + curriculumHtml + "</div>" +
      "<div class=\"sectionhead\"><div><h3>콘텐츠 추가</h3><p class=\"hint\">섹션이나 차시를 추가한 뒤 위 목록에서 배치하세요.</p></div></div>" +
      "<form class=\"moduleform\" method=\"post\" action=\"/course-admin/modules\">" +
      "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
      "<input name=\"title\" placeholder=\"예: 1부. 온라인 유통의 구조\"><button class=\"secondary\" type=\"submit\">섹션 추가</button></form>" +
      "<form method=\"post\" action=\"/course-admin/lessons\" style=\"margin-top:10px\">" +
      "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
      "<div class=\"row\"><input name=\"title\" required placeholder=\"새 차시명\"><button type=\"submit\">차시 추가</button></div></form>" +
      "<div class=\"library\" data-vimeo-library data-course-id=\"" + escapeHtml(course.id) + "\">" +
      "<button class=\"secondary libraryload\" type=\"button\">Vimeo 기존 영상 불러오기</button>" +
      "<div class=\"librarylist\"></div><div class=\"libraryactions\"></div><div class=\"uploadstatus\"></div></div></div>";
  }

  return "<section class=\"content-shell\">" + header + panel + "</section>";
}

function courseListTable(courses) {
  if (!courses.length) {
    return "<section class=\"card\"><p class=\"muted\">아직 등록된 강의가 없습니다.</p></section>";
  }
  const rows = courses.map(function (course) {
    const price = Number(course.price_krw || 0);
    const productNo = Number(course.cafe24_product_no || 0);
    const lessons = Array.isArray(course.lessons) ? course.lessons.length : 0;
    const live = course.status === "published" && Number(course.visible) === 1;
    return "<tr>" +
      "<td><a href=\"/course-admin?course=" + encodeURIComponent(course.id) + "&tab=basic\">" + escapeHtml(course.title) + "</a>" +
      "<div class=\"sub\">" + escapeHtml(course.slug) + "</div></td>" +
      "<td>" + (course.access_type === "paid" ? (price > 0 ? price.toLocaleString("ko-KR") + "원" : "가격 미정") : "무료") + "</td>" +
      "<td>" + lessons + "개</td>" +
      "<td><span class=\"status-dot" + (live ? " live" : "") + "\"></span>" + (live ? "게시 중" : "초안") + "</td>" +
      "<td>" + (productNo ? "상품 #" + productNo : "미연결") +
      "<div class=\"sub\">" + escapeHtml(salesStateLabel(normalizedSalesState(course))) + " · " + escapeHtml(course.cafe24_sync_status || "not_linked") + "</div></td>" +
      "<td><a href=\"/course-admin?course=" + encodeURIComponent(course.id) + "&tab=basic\">관리 →</a></td></tr>";
  }).join("");
  return "<section class=\"card\"><table class=\"course-list\"><thead><tr>" +
    "<th>강의</th><th>가격</th><th>콘텐츠</th><th>공개 상태</th><th>Cafe24</th><th></th>" +
    "</tr></thead><tbody>" + rows + "</tbody></table></section>";
}

async function inspectPaymentE2EOrder(orderId, env) {
  const normalized = String(orderId || "").trim();
  if (!/^\d{8}-\d{7}$/.test(normalized)) {
    throw new Error("주문번호 형식이 올바르지 않습니다.");
  }

  const payload = await cafe24AdminGet("/orders", env, {
    shop_no: 1,
    order_id: normalized,
    embed: "items"
  });
  const orders = Array.isArray(payload?.orders) ? payload.orders : [];
  const order = orders.find((item) => String(item?.order_id || "") === normalized) || orders[0] || null;
  if (!order) throw new Error("Cafe24에서 주문을 찾을 수 없습니다.");

  const items = Array.isArray(order.items) ? order.items : [];
  const item = items.find((entry) => Number(entry?.product_no) === 13) || null;
  if (!item) throw new Error("이 주문에는 결제 E2E 상품 #13이 없습니다.");

  const paid = isPaymentConfirmed(order, item);
  const revoked = isItemRevoked(order, item);
  const entitlement = await env.COURSE_DB.prepare(
    "SELECT member_id,status,source_order_id,source_order_item_code,granted_at,revoked_at,last_verified_at,updated_at FROM course_entitlements WHERE course_id='system-check-paid-course' AND product_no=13 AND source_order_id=? ORDER BY updated_at DESC LIMIT 1"
  ).bind(normalized).first();

  return {
    order_id: normalized,
    member_id: order.member_id || null,
    paid,
    revoked,
    order_status: item.order_status || order.order_status || "",
    payment_status: item.payment_status || order.payment_status || "",
    canceled: order.canceled || "",
    refund_status: order.refund_status || "",
    entitlement: entitlement || null
  };
}

function paymentE2EPanel(course, inspection = null, orderId = "") {
  if (!course) {
    return "<section class=\"card\"><h2>결제 E2E 테스트</h2><p class=\"muted\">테스트 fixture 준비 중입니다. 최신 배포 후 다시 확인하세요.</p></section>";
  }

  const active = Number(course.sales_enabled) === 1;
  const productNo = Number(course.cafe24_product_no || 13);
  const price = Number(course.price_krw || 0);
  const action = active ? "stop" : "start";
  const buttonLabel = active ? "테스트 판매 종료" : "테스트 판매 시작";
  const actionClass = active ? "secondary" : "";
  const state = active
    ? "<span class=\"pill\">테스트 판매 중</span>"
    : "<span class=\"pill\">테스트 대기</span>";

  return "<section class=\"card\"><div class=\"sectionhead\"><div><h2>결제 E2E 테스트</h2>" +
    "<p class=\"hint\">실제 강의와 분리된 product_no=13 테스트 fixture입니다. 테스트 주문 금액은 " + price.toLocaleString("ko-KR") + "원입니다.</p></div>" +
    state + "</div>" +
    "<div class=\"readiness\">" +
    "<div class=\"ready-row\"><span>Cafe24 테스트 상품</span><span class=\"ready-ok\">#" + productNo + "</span></div>" +
    "<div class=\"ready-row\"><span>Vimeo 테스트 영상</span><span class=\"ready-ok\">2개 연결</span></div>" +
    "<div class=\"ready-row\"><span>D1 수강권 기록</span><span class=\"ready-ok\">active / revoked 검증</span></div>" +
    "</div>" +
    (active
      ? "<div class=\"toolbar\"><a class=\"action-link\" href=\"" + escapeHtml(cafe24ProductDetailUrl(productNo)) + "\" target=\"_blank\" rel=\"noreferrer\">테스트 상품 열기 →</a>" +
        "<a class=\"action-link\" href=\"/system-check\" target=\"_blank\">시스템 점검 →</a>" +
        "<a class=\"action-link\" href=\"/classroom?course=paid-course\" target=\"_blank\">테스트 강의 열기 →</a></div>"
      : "<p class=\"hint\">시작하면 테스트 상품만 1,000원 무통장입금 테스트 상태가 됩니다. 실강의 상품에는 영향을 주지 않습니다.</p>") +
    "<form method=\"post\" action=\"/course-admin/e2e-test\" style=\"margin-top:12px\">" +
    "<input type=\"hidden\" name=\"action\" value=\"" + action + "\">" +
    "<button class=\"" + actionClass + "\" type=\"submit\">" + buttonLabel + "</button></form>" +
    "<hr style=\"border:0;border-top:1px solid #e4e4e7;margin:18px 0\">" +
    "<h3 style=\"margin:0 0 8px\">주문번호 검증</h3>" +
    "<form method=\"get\" action=\"/course-admin\"><div class=\"row\">" +
    "<input name=\"e2e_order\" value=\"" + escapeHtml(orderId || "") + "\" placeholder=\"예: 20260923-0000010\">" +
    "<button class=\"secondary\" type=\"submit\">상태 확인</button></div></form>" +
    (inspection
      ? "<div class=\"readiness\">" +
        "<div class=\"ready-row\"><span>주문번호</span><strong>" + escapeHtml(inspection.order_id) + "</strong></div>" +
        "<div class=\"ready-row\"><span>결제 확인</span><span class=\"" + (inspection.paid ? "ready-ok" : "ready-wait") + "\">" + (inspection.paid ? "완료" : "미확인") + "</span></div>" +
        "<div class=\"ready-row\"><span>취소·환불</span><span class=\"" + (inspection.revoked ? "ready-wait" : "ready-ok") + "\">" + (inspection.revoked ? "감지됨" : "없음") + "</span></div>" +
        "<div class=\"ready-row\"><span>D1 수강권</span><span class=\"" + (inspection.entitlement?.status === "active" ? "ready-ok" : inspection.entitlement?.status === "revoked" ? "ready-wait" : "") + "\">" + escapeHtml(inspection.entitlement?.status || "기록 없음") + "</span></div>" +
        "<div class=\"ready-row\"><span>주문 상태</span><span>" + escapeHtml(inspection.order_status || "-") + "</span></div>" +
        "<div class=\"ready-row\"><span>결제 상태</span><span>" + escapeHtml(inspection.payment_status || "-") + "</span></div>" +
        "</div>"
      : "") +
    "</section>";
}

async function dashboardPage(env, message, errorMessage, selectedCourseId, selectedTab, e2eOrderId, studentQuery, studentMemberId) {
  let syncWarning = "";
  try {
    await syncOnlineCommerceBasics(env);
  } catch (error) {
    syncWarning = "강의 정보 자동 동기화 중 오류가 발생했습니다: " +
      String(error && error.message ? error.message : error);
  }

  if (selectedCourseId) {
    try {
      await syncCourseVimeoMetadata(env, selectedCourseId);
    } catch (error) {
      syncWarning += (syncWarning ? " " : "") +
        "Vimeo 메타데이터 확인 중 오류가 발생했습니다: " +
        String(error && error.message ? error.message : error);
    }
  }

  const [courses, creators, cafe24State] = await Promise.all([
    listCourses(env),
    listActiveCreators(env),
    cafe24AdminConnectionState(env)
  ]);

  const e2eCourse = courses.find((course) => course.status === "system_check" && Number(course.cafe24_product_no) === 13) || null;
  const normalCourses = courses.filter((course) => course.status !== "system_check");
  const selectedCourse = selectedCourseId
    ? normalCourses.find((course) => String(course.id) === String(selectedCourseId))
    : null;
  const note = message ? "<p class=\"ok\">" + escapeHtml(message) + "</p>" : "";
  const errorNote = errorMessage ? "<p class=\"error\">" + escapeHtml(errorMessage) + "</p>" : "";
  const warning = syncWarning ? "<p class=\"error\">" + escapeHtml(syncWarning) + "</p>" : "";
  const cafe24Notice = cafe24ConnectionNotice(cafe24State);
  let studentRows = [];
  let studentDetail = null;
  if (selectedCourse && selectedTab === "students") {
    if (studentMemberId) {
      studentDetail = await loadCourseStudentDetail(env, selectedCourse, studentMemberId);
    } else {
      studentRows = await listCourseStudents(env, selectedCourse, studentQuery || "");
    }
  }
  let e2eInspection = null;
  let e2eInspectError = "";
  if (e2eOrderId) {
    try {
      e2eInspection = await inspectPaymentE2EOrder(e2eOrderId, env);
    } catch (error) {
      e2eInspectError = friendlyCafe24Error(error);
    }
  }

  const newCourse =
    "<details class=\"card new-course\"><summary>+ 새 강의 만들기</summary>" +
    "<form method=\"post\" action=\"/course-admin/courses\" style=\"margin-top:14px\">" +
    "<label>강의명</label><input name=\"title\" required placeholder=\"네이버 쇼핑 - 키워드 전략\">" +
    "<label>URL 슬러그</label><input name=\"slug\" required placeholder=\"naver-keyword-strategy\">" +
    "<label>강의 소개</label><textarea name=\"summary\" placeholder=\"누구를 위한 강의인지, 무엇을 배우는지 간단히 입력하세요.\"></textarea>" +
    "<label>콘텐츠 공급자</label><select name=\"owner_member_id\">" + creatorOptions(creators) + "</select>" +
    "<div class=\"row\"><div><label>수강 방식</label><select name=\"access_type\">" +
    "<option value=\"public\">무료 · 회원 로그인 필요</option><option value=\"paid\">유료 · 구매 확인 필요</option></select></div>" +
    "<div><label>가격(원)</label><input name=\"price_krw\" type=\"number\" min=\"0\" step=\"1000\" value=\"0\"></div></div>" +
    "<label class=\"preview\" style=\"margin-top:14px\"><input type=\"checkbox\" name=\"catalog_visible\" value=\"1\" checked>강의 찾기에 표시</label>" +
    "<button type=\"submit\" style=\"margin-top:14px\">강의 만들기</button></form></details>";

  const content = selectedCourse
    ? courseCard(selectedCourse, creators, selectedTab || "basic", studentRows, studentQuery || "", studentDetail, studentMemberId || "")
    : (e2eInspectError ? "<p class=\"error\">" + escapeHtml(e2eInspectError) + "</p>" : "") + paymentE2EPanel(e2eCourse, e2eInspection, e2eOrderId) + newCourse +
      "<div class=\"list-toolbar\"><div><h2 style=\"margin:0\">등록 강의</h2>" +
      "<p class=\"hint\">강의를 선택하면 기본 정보·콘텐츠·판매 설정을 분리해서 편집합니다.</p></div></div>" +
      courseListTable(normalCourses);

  return shell(
    "강의 관리자",
    "<div class=\"top\"><div><div class=\"brand\">NEVER JUST SELL · COURSE ADMIN</div><h1>강의 관리</h1></div>" +
      "<form method=\"post\" action=\"/course-admin/logout\"><button class=\"secondary\" type=\"submit\">로그아웃</button></form></div>" +
      note + errorNote + warning + cafe24Notice + content +
      "<script src=\"/course-admin/app.js\" defer></script>"
  );
}

async function health(env) {
  if (!env.COURSE_DB) {
    return json({ ok: false, connected: false, error: "course_db_missing" }, { status: 503 });
  }
  try {
    const expected = ["course_access_admin_log", "course_entitlement_events", "course_entitlements", "course_enrollments", "course_modules", "courses", "lesson_progress", "lessons", "user_roles", "video_uploads"];
    const result = await env.COURSE_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('course_access_admin_log','course_entitlement_events','course_entitlements','course_enrollments','course_modules','courses','lesson_progress','lessons','user_roles','video_uploads') ORDER BY name"
    ).all();
    const tables = Array.isArray(result.results)
      ? result.results.map(function (row) { return row.name; }).filter(Boolean)
      : [];
    const missing = expected.filter(function (name) { return !tables.includes(name); });
    return json({
      ok: missing.length === 0,
      connected: true,
      database: "neverjustsell-courses",
      tables: tables,
      missing_tables: missing,
      admin_secret_configured: Boolean(env.COURSE_ADMIN_PASSWORD),
      vimeo_configured: Boolean(env.VIMEO_ACCESS_TOKEN)
    }, { status: missing.length === 0 ? 200 : 503 });
  } catch (error) {
    return json({
      ok: false,
      connected: true,
      error: "course_db_check_failed",
      detail: String(error && error.message ? error.message : error)
    }, { status: 502 });
  }
}

async function createCourse(form, env) {
  const title = String(form.get("title") || "").trim();
  const slug = slugify(form.get("slug"));
  const summary = String(form.get("summary") || "").trim();
  const accessType = form.get("access_type") === "paid" ? "paid" : "public";
  const priceKrw = Math.max(0, Number(form.get("price_krw") || 0) || 0);
  const ownerMemberId = String(form.get("owner_member_id") || "").trim() || null;
  const catalogVisible = form.get("catalog_visible") === "1" ? 1 : 0;
  if (!title) throw new Error("강의명이 필요합니다.");
  if (!slug || !/^[a-z0-9가-힣][a-z0-9가-힣-]*$/.test(slug)) throw new Error("URL 슬러그가 올바르지 않습니다.");
  if (accessType === "paid" && priceKrw <= 0) throw new Error("유료 강의는 가격을 입력해야 합니다.");
  await assertActiveCreator(env, ownerMemberId);
  const id = crypto.randomUUID();
  await env.COURSE_DB.prepare(
    "INSERT INTO courses (id,slug,title,summary,access_type,price_krw,owner_member_id,login_required,status,visible,catalog_visible,sales_enabled,cafe24_sync_status,access_duration_days,refund_policy_version,access_info,refund_policy_text) " +
    "VALUES (?,?,?,?,?,?,?,1,'draft',0,?,0,'not_linked',?,?,?,?)"
  ).bind(
    id,
    slug,
    title,
    summary || null,
    accessType,
    Math.trunc(priceKrw),
    ownerMemberId,
    catalogVisible,
    accessType === "paid" ? DEFAULT_PAID_ACCESS_DAYS : null,
    accessType === "paid" ? DEFAULT_REFUND_POLICY_VERSION : "fair-trust-v0.3",
    accessType === "paid" ? DEFAULT_PAID_ACCESS_INFO : null,
    accessType === "paid" ? DEFAULT_REFUND_POLICY_TEXT : null
  ).run();

  if (accessType !== "paid") {
    return { course_id: id, product_no: null, cafe24_error: null };
  }

  try {
    const productNo = await createCafe24CourseProductById(id, env);
    return { course_id: id, product_no: productNo, cafe24_error: null };
  } catch (error) {
    return { course_id: id, product_no: null, cafe24_error: friendlyCafe24Error(error) };
  }
}

function cafe24ProductNumber(payload) {
  return Number(
    payload?.product?.product_no ||
    payload?.products?.[0]?.product_no ||
    payload?.resource?.product_no ||
    payload?.product_no ||
    0
  );
}

async function getAdminCourse(env, courseId) {
  return env.COURSE_DB.prepare(
    "SELECT id,slug,title,summary,access_type,price_krw,cafe24_product_no,sales_enabled,sales_state,status FROM courses WHERE id=? LIMIT 1"
  ).bind(courseId).first();
}

async function createCafe24CourseProductById(courseId, env) {
  const course = await getAdminCourse(env, courseId);
  if (!course) throw new Error("강의를 찾을 수 없습니다.");
  if (course.access_type !== "paid") throw new Error("유료 강의만 Cafe24 상품으로 만들 수 있습니다.");
  if (Number(course.cafe24_product_no) > 0) throw new Error("이미 Cafe24 상품이 연결되어 있습니다.");

  const price = Number(course.price_krw || 0);
  if (!Number.isFinite(price) || price <= 0) throw new Error("판매가를 먼저 확정해 주세요.");

  const summary = String(course.summary || "").trim();
  const payload = await cafe24AdminRequest("/products", env, {
    method: "POST",
    body: {
      shop_no: 1,
      display: "F",
      selling: "F",
      product_condition: "N",
      product_name: course.title,
      internal_product_name: ("NJS 강의 " + course.slug).slice(0, 50),
      price: Math.trunc(price),
      supply_price: Math.trunc(price),
      has_option: "F",
      summary_description: summary.slice(0, 255),
      description: summary,
      shipping_fee_by_product: "T",
      shipping_method: "09",
      shipping_fee_type: "T",
    }
  });

  const productNo = cafe24ProductNumber(payload);
  if (!Number.isInteger(productNo) || productNo <= 0) {
    throw new Error("Cafe24 상품번호를 응답에서 확인하지 못했습니다.");
  }

  const salesUrl = cafe24ProductDetailUrl(productNo);
  await env.COURSE_DB.prepare(
    "UPDATE courses SET cafe24_product_no=?,sales_url=?,sales_enabled=0,sales_state='preparing',cafe24_sync_status='linked_hidden',updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(productNo, salesUrl, course.id).run();

  return productNo;
}

async function createCafe24CourseProduct(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  return createCafe24CourseProductById(courseId, env);
}

async function linkExistingCafe24CourseProduct(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const productNo = Number(form.get("product_no") || 0);
  if (!Number.isInteger(productNo) || productNo <= 0) throw new Error("올바른 Cafe24 상품번호를 입력해 주세요.");

  const course = await getAdminCourse(env, courseId);
  if (!course) throw new Error("강의를 찾을 수 없습니다.");
  if (course.access_type !== "paid") throw new Error("유료 강의만 Cafe24 상품과 연결할 수 있습니다.");

  const payload = await cafe24AdminGet("/products/" + productNo, env, { shop_no: 1 });
  const remote = payload?.product || payload?.products?.[0] || payload?.resource || payload;
  if (Number(remote?.product_no || 0) !== productNo) throw new Error("Cafe24 상품을 확인하지 못했습니다.");

  const remoteSelling = remote?.selling === "T";
  const initialSalesState = remoteSelling
    ? (course.status === "published" ? "selling" : "presale")
    : "preparing";
  await env.COURSE_DB.prepare(
    "UPDATE courses SET cafe24_product_no=?,sales_url=?,sales_enabled=?,sales_state=?,cafe24_sync_status='linked_existing',updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(
    productNo,
    cafe24ProductDetailUrl(productNo),
    remoteSelling ? 1 : 0,
    initialSalesState,
    course.id
  ).run();
}

async function updateCafe24CourseSales(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const legacyAction = String(form.get("action") || "").trim();
  const requested = String(form.get("desired_state") || "").trim();
  const desiredState = requested || (legacyAction === "start" ? "selling" : legacyAction === "pause" ? "paused" : "");
  if (!["preparing","presale","selling","paused"].includes(desiredState)) {
    throw new Error("잘못된 판매 상태 요청입니다.");
  }

  const course = await getAdminCourse(env, courseId);
  if (!course) throw new Error("강의를 찾을 수 없습니다.");
  if (course.access_type !== "paid") throw new Error("유료 강의만 판매 상태를 변경할 수 있습니다.");

  const productNo = Number(course.cafe24_product_no || 0);
  if (!Number.isInteger(productNo) || productNo <= 0) throw new Error("Cafe24 상품 연결이 필요합니다.");

  if (["presale","selling"].includes(desiredState)) {
    const price = Number(course.price_krw || 0);
    if (!Number.isFinite(price) || price <= 0) throw new Error("판매가가 올바르지 않습니다.");

    if (desiredState === "selling") await syncCourseVimeoMetadata(env, courseId);
    const fullCourse = await loadCourseForReadiness(env, courseId);
    const readiness = courseReadiness(fullCourse);
    const blockers = desiredState === "presale" ? readiness.presaleBlockers : readiness.publishBlockers;
    if (blockers.length) {
      throw new Error((desiredState === "presale" ? "사전판매" : "정식 판매") +
        " 전 확인이 필요합니다: " + blockers.map((item) => item.label).join(", "));
    }
    if (desiredState === "selling" && course.status !== "published") {
      throw new Error("정식 판매는 강의를 먼저 게시한 뒤 시작할 수 있습니다.");
    }

    // Never expose the product until member-only purchase policy has been applied and verified.
    await cafe24AdminRequest("/products/" + productNo, env, {
      method: "PUT",
      body: {
        shop_no: 1,
        display: "F",
        selling: "F",
        buy_limit_by_product: "T",
        buy_limit_type: "M"
      }
    });

    const policyPayload = await cafe24AdminGet("/products/" + productNo, env, { shop_no: 1 });
    const policyProduct =
      policyPayload?.product ||
      policyPayload?.products?.[0] ||
      policyPayload?.resource ||
      policyPayload;
    if (
      policyProduct?.buy_limit_by_product !== "T" ||
      !["M", "N"].includes(String(policyProduct?.buy_limit_type || ""))
    ) {
      throw new Error("Cafe24 회원 전용 구매 설정을 확인하지 못해 판매 상태를 변경하지 않았습니다.");
    }

    await cafe24AdminRequest("/products/" + productNo, env, {
      method: "PUT",
      body: { shop_no: 1, display: "T", selling: "T" }
    });

    const syncStatus = desiredState === "presale" ? "presale_member_only" : "selling_member_only";
    await env.COURSE_DB.prepare(
      "UPDATE courses SET sales_enabled=1,sales_state=?,cafe24_sync_status=?,sales_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(desiredState, syncStatus, cafe24ProductDetailUrl(productNo), course.id).run();
    return salesStateLabel(desiredState);
  }

  await cafe24AdminRequest("/products/" + productNo, env, {
    method: "PUT",
    body: { shop_no: 1, display: "F", selling: "F" }
  });
  const syncStatus = desiredState === "paused" ? "paused_hidden" : "preparing_hidden";
  await env.COURSE_DB.prepare(
    "UPDATE courses SET sales_enabled=0,sales_state=?,cafe24_sync_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(desiredState, syncStatus, course.id).run();
  return salesStateLabel(desiredState);
}

function kstToday() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function normalizeManualExpiry(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("만료일 형식이 올바르지 않습니다.");
  if (raw < kstToday()) throw new Error("만료일은 오늘 이후 날짜여야 합니다.");
  return raw;
}

async function logCourseAccessAdminAction(env, data) {
  await env.COURSE_DB.prepare(
    "INSERT INTO course_access_admin_log (id,member_id,course_id,action_type,reason,previous_status,new_status,previous_expires_at,new_expires_at) VALUES (?,?,?,?,?,?,?,?,?)"
  ).bind(
    crypto.randomUUID(),
    data.memberId,
    data.courseId,
    data.actionType,
    data.reason,
    data.previousStatus || null,
    data.newStatus || null,
    data.previousExpiry || null,
    data.newExpiry || null
  ).run();
}

async function updateManualCourseAccess(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const memberId = String(form.get("member_id") || "").trim();
  const action = String(form.get("action") || "").trim();
  const reason = String(form.get("reason") || "").trim();
  const expiry = normalizeManualExpiry(form.get("expires_at"));

  if (!courseId || !memberId) throw new Error("강의와 회원 ID가 필요합니다.");
  if (memberId.length > 255) throw new Error("회원 ID가 너무 깁니다.");
  if (!reason) throw new Error("관리자 변경 사유를 입력해 주세요.");

  const course = await env.COURSE_DB.prepare(
    "SELECT id,title,access_type,cafe24_product_no FROM courses WHERE id=? LIMIT 1"
  ).bind(courseId).first();
  if (!course) throw new Error("강의를 찾을 수 없습니다.");
  if (course.access_type !== "paid") throw new Error("수동 수강권 관리는 유료 강의에서만 사용합니다.");

  const existing = await env.COURSE_DB.prepare(
    "SELECT member_id,status,grant_reason,access_expires_at,source_order_id FROM course_entitlements WHERE member_id=? AND course_id=? LIMIT 1"
  ).bind(memberId, courseId).first();

  if (action === "grant") {
    if (existing?.grant_reason === "purchase" && existing?.status === "active") {
      throw new Error("이미 Cafe24 구매 수강권이 활성화된 회원입니다.");
    }
    if (existing?.grant_reason === "manual" && existing?.status === "active") {
      throw new Error("이미 수동 수강권이 활성화된 회원입니다. 수강기간 변경 기능을 사용해 주세요.");
    }

    const productNo = Number(course.cafe24_product_no || 0);
    await env.COURSE_DB.prepare(
      "INSERT INTO course_entitlements (member_id,course_id,product_no,status,grant_reason,access_expires_at,granted_at,revoked_at,last_verified_at,updated_at) VALUES (?,?,?,'active','manual',?,CURRENT_TIMESTAMP,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) " +
      "ON CONFLICT(member_id,course_id) DO UPDATE SET product_no=excluded.product_no,status='active',grant_reason='manual',access_expires_at=excluded.access_expires_at,granted_at=CURRENT_TIMESTAMP,revoked_at=NULL,last_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP"
    ).bind(memberId, courseId, productNo, expiry).run();

    await env.COURSE_DB.prepare(
      "INSERT INTO course_entitlement_events (id,member_id,course_id,event_type,source_order_id,source_order_item_code,reason,actor_type) VALUES (?,?,?,'manual_grant',NULL,NULL,?,'admin')"
    ).bind(crypto.randomUUID(), memberId, courseId, reason).run();

    await logCourseAccessAdminAction(env, {
      memberId,
      courseId,
      actionType: existing ? "수동 수강권 복구" : "수동 수강권 부여",
      reason,
      previousStatus: existing?.status || null,
      newStatus: "active",
      previousExpiry: existing?.access_expires_at || null,
      newExpiry: expiry
    });
    return { courseId, memberId, message: "수동 수강권을 부여했습니다." };
  }

  if (!existing) throw new Error("수강권 정보를 찾을 수 없습니다.");
  if (existing.grant_reason !== "manual") {
    throw new Error("Cafe24 구매 수강권은 주문 취소·환불로 관리해 주세요.");
  }

  if (action === "revoke") {
    if (existing.status !== "active") throw new Error("이미 회수된 수동 수강권입니다.");
    await env.COURSE_DB.prepare(
      "UPDATE course_entitlements SET status='revoked',revoked_at=CURRENT_TIMESTAMP,last_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE member_id=? AND course_id=? AND grant_reason='manual'"
    ).bind(memberId, courseId).run();

    await env.COURSE_DB.prepare(
      "INSERT INTO course_entitlement_events (id,member_id,course_id,event_type,source_order_id,source_order_item_code,reason,actor_type) VALUES (?,?,?,'manual_revoke',NULL,NULL,?,'admin')"
    ).bind(crypto.randomUUID(), memberId, courseId, reason).run();

    await logCourseAccessAdminAction(env, {
      memberId,
      courseId,
      actionType: "수동 수강권 회수",
      reason,
      previousStatus: existing.status,
      newStatus: "revoked",
      previousExpiry: existing.access_expires_at || null,
      newExpiry: existing.access_expires_at || null
    });
    return { courseId, memberId, message: "수동 수강권을 회수했습니다." };
  }

  if (action === "expiry") {
    await env.COURSE_DB.prepare(
      "UPDATE course_entitlements SET access_expires_at=?,updated_at=CURRENT_TIMESTAMP WHERE member_id=? AND course_id=? AND grant_reason='manual'"
    ).bind(expiry, memberId, courseId).run();

    await logCourseAccessAdminAction(env, {
      memberId,
      courseId,
      actionType: expiry ? "수강기간 설정·연장" : "수강기간 무기한 전환",
      reason,
      previousStatus: existing.status,
      newStatus: existing.status,
      previousExpiry: existing.access_expires_at || null,
      newExpiry: expiry
    });
    return { courseId, memberId, message: expiry ? "수강기간을 저장했습니다." : "수강기간을 무기한으로 변경했습니다." };
  }

  throw new Error("잘못된 수강권 관리 요청입니다.");
}

async function updatePaymentE2ETest(form, env) {
  const action = String(form.get("action") || "").trim();
  const course = await env.COURSE_DB.prepare(
    "SELECT id,cafe24_product_no,status FROM courses WHERE id='system-check-paid-course' LIMIT 1"
  ).first();
  if (!course || course.status !== "system_check") {
    throw new Error("결제 테스트 fixture를 찾을 수 없습니다.");
  }

  const productNo = Number(course.cafe24_product_no || 13);
  if (productNo !== 13) throw new Error("결제 테스트 상품번호가 올바르지 않습니다.");

  if (action === "start") {
    // Apply the test price and member-only purchase policy while the product is still hidden.
    await cafe24AdminRequest("/products/" + productNo, env, {
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

    const policyPayload = await cafe24AdminGet("/products/" + productNo, env, { shop_no: 1 });
    const product = policyPayload?.product || policyPayload?.products?.[0] || policyPayload?.resource || policyPayload;
    if (product?.buy_limit_by_product !== "T" || String(product?.buy_limit_type || "") !== "M") {
      throw new Error("Cafe24 회원 전용 구매 설정을 확인하지 못해 테스트 판매를 시작하지 않았습니다.");
    }

    await cafe24AdminRequest("/products/" + productNo, env, {
      method: "PUT",
      body: {
        shop_no: 1,
        display: "T",
        selling: "T",
        price: 1000
      }
    });

    await env.COURSE_DB.prepare(
      "UPDATE courses SET price_krw=1000,sales_enabled=1,cafe24_sync_status='e2e_selling_member_only',updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(course.id).run();
    return "테스트 상품 #13을 1,000원 회원 전용 판매 상태로 열었습니다.";
  }

  if (action === "stop") {
    await cafe24AdminRequest("/products/" + productNo, env, {
      method: "PUT",
      body: { shop_no: 1, display: "F", selling: "F" }
    });
    await env.COURSE_DB.prepare(
      "UPDATE courses SET sales_enabled=0,cafe24_sync_status='e2e_hidden',updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(course.id).run();
    return "결제 테스트 상품을 다시 숨기고 판매 중지했습니다.";
  }

  throw new Error("잘못된 결제 테스트 요청입니다.");
}

async function createLesson(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const title = String(form.get("title") || "").trim();
  if (!courseId || !title) throw new Error("강의와 차시명이 필요합니다.");
  const course = await env.COURSE_DB.prepare("SELECT id FROM courses WHERE id=?").bind(courseId).first();
  if (!course) throw new Error("강의를 찾을 수 없습니다.");
  const orderRow = await env.COURSE_DB.prepare(
    "SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM lessons WHERE course_id=?"
  ).bind(courseId).first();
  const sortOrder = Number(orderRow && orderRow.next_order != null ? orderRow.next_order : 0);
  await env.COURSE_DB.prepare(
    "INSERT INTO lessons (id,course_id,title,sort_order,status) VALUES (?,?,?,?, 'draft')"
  ).bind(crypto.randomUUID(), courseId, title, sortOrder).run();
}




async function updateCourse(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const title = String(form.get("title") || "").trim();
  const summary = String(form.get("summary") || "").trim();
  const accessType = form.get("access_type") === "paid" ? "paid" : "public";
  const priceKrw = Math.max(0, Number(form.get("price_krw") || 0) || 0);
  const ownerMemberId = String(form.get("owner_member_id") || "").trim() || null;
  const catalogVisible = form.get("catalog_visible") === "1" ? 1 : 0;
  if (!courseId || !title) throw new Error("강의 정보가 올바르지 않습니다.");
  if (accessType === "paid" && priceKrw <= 0) throw new Error("유료 강의는 가격을 입력해야 합니다.");
  await assertActiveCreator(env, ownerMemberId);
  await env.COURSE_DB.prepare(
    "UPDATE courses SET title=?,summary=?,access_type=?,price_krw=?,owner_member_id=?,catalog_visible=?," +
    "access_duration_days=CASE WHEN ?='paid' THEN ? ELSE access_duration_days END," +
    "refund_policy_version=CASE WHEN ?='paid' THEN ? ELSE refund_policy_version END," +
    "access_info=CASE WHEN ?='paid' THEN ? ELSE access_info END," +
    "refund_policy_text=CASE WHEN ?='paid' THEN ? ELSE refund_policy_text END," +
    "updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(
    title,
    summary || null,
    accessType,
    Math.trunc(priceKrw),
    ownerMemberId,
    catalogVisible,
    accessType,
    DEFAULT_PAID_ACCESS_DAYS,
    accessType,
    DEFAULT_REFUND_POLICY_VERSION,
    accessType,
    DEFAULT_PAID_ACCESS_INFO,
    accessType,
    DEFAULT_REFUND_POLICY_TEXT,
    courseId
  ).run();
}

async function updateCourseSalesPage(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  if (!courseId) throw new Error("강의 정보가 올바르지 않습니다.");

  const instructorName = String(form.get("instructor_name") || "").trim();
  const instructorBio = String(form.get("instructor_bio") || "").trim();
  const targetAudience = String(form.get("target_audience") || "").trim();
  const learningOutcomes = String(form.get("learning_outcomes") || "").trim();

  if (instructorName.length > 120) throw new Error("강사명은 120자 이내로 입력해 주세요.");

  await env.COURSE_DB.prepare(
    "UPDATE courses SET instructor_name=?,instructor_bio=?,target_audience=?,learning_outcomes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(
    instructorName || null,
    instructorBio || null,
    targetAudience || null,
    learningOutcomes || null,
    courseId
  ).run();
}


async function createModule(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const title = String(form.get("title") || "").trim();
  if (!courseId || !title) throw new Error("강의와 모듈명이 필요합니다.");
  const course = await env.COURSE_DB.prepare("SELECT id FROM courses WHERE id=?").bind(courseId).first();
  if (!course) throw new Error("강의를 찾을 수 없습니다.");
  const row = await env.COURSE_DB.prepare(
    "SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM course_modules WHERE course_id=? AND status!='archived'"
  ).bind(courseId).first();
  await env.COURSE_DB.prepare(
    "INSERT INTO course_modules (id,course_id,title,sort_order,status) VALUES (?,?,?,?, 'published')"
  ).bind(crypto.randomUUID(), courseId, title, Number(row?.next_order || 0)).run();
}

async function updateLesson(form, env) {
  const lessonId = String(form.get("lesson_id") || "").trim();
  const title = String(form.get("title") || "").trim();
  const moduleId = String(form.get("module_id") || "").trim() || null;
  const description = String(form.get("description") || "").trim();
  const isPreview = form.get("is_preview") === "1" ? 1 : 0;
  if (!lessonId || !title) throw new Error("차시명과 차시 ID가 필요합니다.");
  const lesson = await env.COURSE_DB.prepare(
    "SELECT id,course_id FROM lessons WHERE id=?"
  ).bind(lessonId).first();
  if (!lesson) throw new Error("차시를 찾을 수 없습니다.");
  if (moduleId) {
    const module = await env.COURSE_DB.prepare(
      "SELECT id FROM course_modules WHERE id=? AND course_id=? AND status!='archived'"
    ).bind(moduleId, lesson.course_id).first();
    if (!module) throw new Error("모듈 정보가 올바르지 않습니다.");
  }
  await env.COURSE_DB.prepare(
    "UPDATE lessons SET title=?,description=?,module_id=?,is_preview=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(title, description || null, moduleId, isPreview, lessonId).run();
}

async function moveLesson(form, env) {
  const lessonId = String(form.get("lesson_id") || "").trim();
  const direction = String(form.get("direction") || "").trim();
  if (!lessonId || !["up","down"].includes(direction)) throw new Error("차시 이동 요청이 올바르지 않습니다.");
  const current = await env.COURSE_DB.prepare(
    "SELECT id,course_id,sort_order FROM lessons WHERE id=?"
  ).bind(lessonId).first();
  if (!current) throw new Error("차시를 찾을 수 없습니다.");
  const comparator = direction === "up" ? "<" : ">";
  const order = direction === "up" ? "DESC" : "ASC";
  const other = await env.COURSE_DB.prepare(
    "SELECT id,sort_order FROM lessons WHERE course_id=? AND sort_order " + comparator + " ? ORDER BY sort_order " + order + " LIMIT 1"
  ).bind(current.course_id, current.sort_order).first();
  if (!other) return;
  await env.COURSE_DB.batch([
    env.COURSE_DB.prepare("UPDATE lessons SET sort_order=-999999,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(current.id),
    env.COURSE_DB.prepare("UPDATE lessons SET sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(current.sort_order, other.id),
    env.COURSE_DB.prepare("UPDATE lessons SET sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(other.sort_order, current.id)
  ]);
}

async function reorderCurriculum(body, env) {
  const courseId = String(body && body.course_id || "").trim();
  const moduleIds = Array.isArray(body && body.modules)
    ? body.modules.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  const lessonItems = Array.isArray(body && body.lessons) ? body.lessons : [];
  if (!courseId) throw new Error("강의 정보가 필요합니다.");

  const [moduleRows, lessonRows] = await Promise.all([
    env.COURSE_DB.prepare(
      "SELECT id FROM course_modules WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
    ).bind(courseId).all(),
    env.COURSE_DB.prepare(
      "SELECT id FROM lessons WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
    ).bind(courseId).all()
  ]);

  const currentModules = (Array.isArray(moduleRows?.results) ? moduleRows.results : []).map((row) => String(row.id));
  const currentLessons = (Array.isArray(lessonRows?.results) ? lessonRows.results : []).map((row) => String(row.id));
  if (moduleIds.length !== currentModules.length || new Set(moduleIds).size !== currentModules.length ||
      currentModules.some((id) => !moduleIds.includes(id))) {
    throw new Error("섹션 목록이 최신 상태와 다릅니다. 화면을 새로고침한 뒤 다시 시도해 주세요.");
  }

  const normalizedLessons = lessonItems.map((item) => ({
    id: String(item && item.id || "").trim(),
    module_id: String(item && item.module_id || "").trim() || null
  })).filter((item) => item.id);
  const lessonIds = normalizedLessons.map((item) => item.id);
  if (lessonIds.length !== currentLessons.length || new Set(lessonIds).size !== currentLessons.length ||
      currentLessons.some((id) => !lessonIds.includes(id))) {
    throw new Error("차시 목록이 최신 상태와 다릅니다. 화면을 새로고침한 뒤 다시 시도해 주세요.");
  }

  const allowedModules = new Set(moduleIds);
  if (normalizedLessons.some((item) => item.module_id && !allowedModules.has(item.module_id))) {
    throw new Error("차시의 섹션 정보가 올바르지 않습니다.");
  }

  const statements = [
    env.COURSE_DB.prepare(
      "UPDATE lessons SET sort_order=sort_order+1000000,updated_at=CURRENT_TIMESTAMP WHERE course_id=? AND status!='archived'"
    ).bind(courseId),
    env.COURSE_DB.prepare(
      "UPDATE course_modules SET sort_order=sort_order+1000000,updated_at=CURRENT_TIMESTAMP WHERE course_id=? AND status!='archived'"
    ).bind(courseId)
  ];
  moduleIds.forEach((id, index) => {
    statements.push(
      env.COURSE_DB.prepare(
        "UPDATE course_modules SET sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND course_id=?"
      ).bind(index, id, courseId)
    );
  });
  normalizedLessons.forEach((item, index) => {
    statements.push(
      env.COURSE_DB.prepare(
        "UPDATE lessons SET sort_order=?,module_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND course_id=?"
      ).bind(index, item.module_id, item.id, courseId)
    );
  });
  await env.COURSE_DB.batch(statements);
  return { module_count: moduleIds.length, lesson_count: normalizedLessons.length };
}

async function setCourseStatus(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const action = String(form.get("action") || "").trim();
  const existing = await env.COURSE_DB.prepare("SELECT id FROM courses WHERE id=?").bind(courseId).first();
  if (!existing) throw new Error("강의를 찾을 수 없습니다.");

  if (action === "unpublish") {
    await env.COURSE_DB.prepare(
      "UPDATE courses SET visible=0,status='ready',updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(courseId).run();
    return "강의 게시를 중지했습니다.";
  }

  if (action !== "publish") throw new Error("잘못된 게시 요청입니다.");

  await syncCourseVimeoMetadata(env, courseId);
  const course = await loadCourseForReadiness(env, courseId);
  const readiness = courseReadiness(course);
  if (readiness.publishBlockers.length) {
    throw new Error("게시 전 확인이 필요합니다: " + readiness.publishBlockers.map((item) => item.label).join(", "));
  }

  await env.COURSE_DB.prepare(
    "UPDATE courses SET visible=1,status='published',updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(courseId).run();
  return "강의를 게시했습니다.";
}

function javascript(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/javascript; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(body, { ...init, headers });
}

function adminClientScript() {
  return [
    "(function(){",
    "\"use strict\";",
    "const TUS_VERSION='1.0.0';",
    "const CHUNK_SIZE=8*1024*1024;",
    "async function api(path,options){",
    "  const response=await fetch(path,Object.assign({},options||{}, {headers:Object.assign({'Content-Type':'application/json'},(options&&options.headers)||{})}));",
    "  const body=await response.json().catch(function(){return {};});",
    "  if(!response.ok) throw new Error(body.detail||body.error||('HTTP '+response.status));",
    "  return body;",
    "}",
    "async function getOffset(url){",
    "  const response=await fetch(url,{method:'HEAD',headers:{'Tus-Resumable':TUS_VERSION}});",
    "  if(!response.ok) throw new Error('Vimeo 업로드 위치 확인 실패 ('+response.status+')');",
    "  return Number(response.headers.get('Upload-Offset')||0);",
    "}",
    "function patchChunk(url,blob,offset,onProgress){",
    "  return new Promise(function(resolve,reject){",
    "    const xhr=new XMLHttpRequest();",
    "    xhr.open('PATCH',url);",
    "    xhr.setRequestHeader('Tus-Resumable',TUS_VERSION);",
    "    xhr.setRequestHeader('Upload-Offset',String(offset));",
    "    xhr.setRequestHeader('Content-Type','application/offset+octet-stream');",
    "    xhr.upload.onprogress=function(event){if(event.lengthComputable) onProgress(offset+event.loaded);};",
    "    xhr.onload=function(){",
    "      if(xhr.status>=200&&xhr.status<300){resolve(Number(xhr.getResponseHeader('Upload-Offset')||offset+blob.size));}",
    "      else reject(new Error('Vimeo 업로드 실패 ('+xhr.status+')'));",
    "    };",
    "    xhr.onerror=function(){reject(new Error('Vimeo 업로드 네트워크 오류'));};",
    "    xhr.send(blob);",
    "  });",
    "}",
    "async function uploadTus(url,file,onProgress){",
    "  let offset=0;",
    "  try{offset=await getOffset(url);}catch(_){offset=0;}",
    "  while(offset<file.size){",
    "    const end=Math.min(offset+CHUNK_SIZE,file.size);",
    "    offset=await patchChunk(url,file.slice(offset,end),offset,onProgress);",
    "  }",
    "}",
    "async function startUpload(box){",
    "  const input=box.querySelector('.uploadfile');",
    "  const button=box.querySelector('.uploadbutton');",
    "  const status=box.querySelector('.uploadstatus');",
    "  const bar=box.querySelector('.uploadbar span');",
    "  const file=input&&input.files&&input.files[0];",
    "  if(!file){status.textContent='영상 파일을 먼저 선택하세요.';return;}",
    "  button.disabled=true;input.disabled=true;",
    "  try{",
    "    status.textContent='Vimeo 업로드 세션 생성 중…';",
    "    const started=await api('/course-admin/api/vimeo/start',{method:'POST',body:JSON.stringify({course_id:box.dataset.courseId,lesson_id:box.dataset.lessonId,file_name:file.name,file_size:file.size,name:box.dataset.lessonTitle})});",
    "    status.textContent='Vimeo 업로드 0%';",
    "    await uploadTus(started.upload_link,file,function(done){",
    "      const pct=Math.max(0,Math.min(100,Math.round(done/file.size*100)));",
    "      bar.style.width=pct+'%';status.textContent='Vimeo 업로드 '+pct+'%';",
    "    });",
    "    status.textContent='업로드 완료 · Vimeo 처리 상태 확인 중…';",
    "    const completed=await api('/course-admin/api/vimeo/complete',{method:'POST',body:JSON.stringify({upload_id:started.upload_id})});",
    "    bar.style.width='100%';",
    "    status.textContent=completed.status==='ready'?'영상 등록 완료':'업로드 완료 · Vimeo 인코딩 처리 중';",
    "    setTimeout(function(){location.reload();},900);",
    "  }catch(error){",
    "    status.textContent=error&&error.message?error.message:String(error);",
    "    status.classList.add('error');button.disabled=false;input.disabled=false;",
    "  }",
    "}",
    "function formatDuration(seconds){const s=Number(seconds||0);const m=Math.floor(s/60);const r=s%60;return m+':'+String(r).padStart(2,'0');}",
    "async function loadLibrary(box){",
    "  const list=box.querySelector('.librarylist');const actions=box.querySelector('.libraryactions');const status=box.querySelector('.uploadstatus');",
    "  list.textContent='Vimeo 영상 목록을 불러오는 중…';actions.innerHTML='';status.textContent='';",
    "  try{",
    "    const data=await api('/course-admin/api/vimeo/library');",
    "    if(!data.videos.length){list.textContent='Vimeo에 등록된 영상이 없습니다.';return;}",
    "    list.innerHTML=data.videos.map(function(v){const uses=(v.linked_to||[]).length;return '<label class=\"libraryitem\"><input type=\"checkbox\" value=\"'+v.vimeo_id+'\"><span><strong>'+escapeHtmlClient(v.name||('Vimeo '+v.vimeo_id))+'</strong><div class=\"librarymeta\">'+formatDuration(v.duration_seconds)+' · '+escapeHtmlClient(v.status||'unknown')+(uses?' · 기존 '+uses+'곳 사용 중':'')+'</div></span><span class=\"librarymeta\">'+v.vimeo_id+'</span></label>';}).join('');",
    "    actions.innerHTML='<button class=\"libraryimport\" type=\"button\">선택 영상 차시로 연결</button>';",
    "  }catch(error){list.textContent='';status.textContent=error.message;status.classList.add('error');}",
    "}",
    "function escapeHtmlClient(value){return String(value==null?'':value).replace(/[&<>\"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch];});}",
    "async function loadExistingVideos(box){",
    "  const list=box.querySelector('.existingvideolist');const status=box.querySelector('.existingvideostatus');list.textContent='Vimeo 영상 목록을 불러오는 중…';status.textContent='';",
    "  try{const data=await api('/course-admin/api/vimeo/library');if(!data.videos.length){list.textContent='Vimeo에 등록된 영상이 없습니다.';return;}",
    "    list.innerHTML='<div class=\"row\"><select class=\"existingvideoselect\">'+data.videos.map(function(v){const uses=(v.linked_to||[]).length;return '<option value=\"'+v.vimeo_id+'\">'+escapeHtmlClient(v.name||('Vimeo '+v.vimeo_id))+' · '+formatDuration(v.duration_seconds)+(uses?' · 재사용':'')+'</option>';}).join('')+'</select><button class=\"existingvideolink\" type=\"button\">이 차시에 연결</button></div>';",
    "  }catch(error){list.textContent='';status.textContent=error.message;status.classList.add('error');}",
    "}",
    "async function linkExistingVideo(box){",
    "  const select=box.querySelector('.existingvideoselect');const status=box.querySelector('.existingvideostatus');if(!select)return;status.textContent='기존 Vimeo 영상을 연결하는 중…';",
    "  try{await api('/course-admin/api/vimeo/link',{method:'POST',body:JSON.stringify({course_id:box.dataset.courseId,lesson_id:box.dataset.lessonId,vimeo_id:select.value})});status.textContent='연결 완료';setTimeout(function(){location.reload();},500);}catch(error){status.textContent=error.message;status.classList.add('error');}",
    "}",
    "async function importLibrary(box){",
    "  const selected=Array.from(box.querySelectorAll('.librarylist input[type=checkbox]:checked')).map(function(input){return input.value;});",
    "  const status=box.querySelector('.uploadstatus');",
    "  if(!selected.length){status.textContent='연결할 영상을 선택하세요.';return;}",
    "  status.textContent='선택 영상을 차시로 연결하는 중…';",
    "  try{const result=await api('/course-admin/api/vimeo/import',{method:'POST',body:JSON.stringify({course_id:box.dataset.courseId,video_ids:selected})});status.textContent=result.imported_count+'개 영상을 연결했습니다.';setTimeout(function(){location.reload();},700);}catch(error){status.textContent=error.message;status.classList.add('error');}",
    "}",
    "function curriculumPayload(root){",
    "  const modules=Array.from(root.querySelectorAll('.curriculum-group[data-module-id]')).map(function(group){return group.dataset.moduleId||'';}).filter(Boolean);",
    "  const lessons=[];",
    "  root.querySelectorAll('.curriculum-group[data-module-id]').forEach(function(group){const moduleId=group.dataset.moduleId||'';group.querySelectorAll(':scope > .lesson-dropzone > .curriculum-lesson').forEach(function(row){lessons.push({id:row.dataset.lessonId,module_id:moduleId||null});});});",
    "  return {course_id:root.dataset.courseId,modules:modules,lessons:lessons};",
    "}",
    "async function saveCurriculum(root){",
    "  const status=document.querySelector('[data-curriculum-status]');",
    "  if(status){status.textContent='저장 중…';status.className='curriculum-save saving';}",
    "  try{await api('/course-admin/api/curriculum/reorder',{method:'POST',body:JSON.stringify(curriculumPayload(root))});if(status){status.textContent='저장됨';status.className='curriculum-save saved';setTimeout(function(){status.textContent='순서 자동 저장';status.className='curriculum-save';},1300);}}",
    "  catch(error){if(status){status.textContent=error.message||'저장 실패';status.className='curriculum-save error';}setTimeout(function(){location.reload();},1600);}",
    "}",
    "function beforeNode(container,y,selector){const rows=Array.from(container.querySelectorAll(selector)).filter(function(el){return !el.classList.contains('dragging');});let best=null,bestOffset=Number.NEGATIVE_INFINITY;rows.forEach(function(el){const box=el.getBoundingClientRect();const offset=y-box.top-box.height/2;if(offset<0&&offset>bestOffset){bestOffset=offset;best=el;}});return best;}",
    "let draggingLesson=null;let draggingModule=null;",
    "document.addEventListener('dragstart',function(event){",
    "  const lessonHandle=event.target.closest('.lesson-drag');",
    "  if(lessonHandle){draggingLesson=lessonHandle.closest('.curriculum-lesson');if(draggingLesson){draggingLesson.classList.add('dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',draggingLesson.dataset.lessonId||'lesson');}return;}",
    "  const moduleHandle=event.target.closest('.module-drag');",
    "  if(moduleHandle){draggingModule=moduleHandle.closest('.curriculum-group');if(draggingModule){draggingModule.classList.add('dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',draggingModule.dataset.moduleId||'module');}}",
    "});",
    "document.addEventListener('dragover',function(event){",
    "  if(draggingLesson){const zone=event.target.closest('.lesson-dropzone');if(!zone)return;event.preventDefault();const before=beforeNode(zone,event.clientY,':scope > .curriculum-lesson');if(before)zone.insertBefore(draggingLesson,before);else zone.appendChild(draggingLesson);zone.classList.add('drop-target');return;}",
    "  if(draggingModule){const root=event.target.closest('[data-curriculum]');const target=event.target.closest('.curriculum-group[data-module-id]');if(!root||!target||!target.dataset.moduleId)return;event.preventDefault();const groups=Array.from(root.querySelectorAll(':scope > .curriculum-group[data-module-id]')).filter(function(g){return g.dataset.moduleId&&g!==draggingModule;});let before=null,best=Number.NEGATIVE_INFINITY;groups.forEach(function(g){const box=g.getBoundingClientRect();const off=event.clientY-box.top-box.height/2;if(off<0&&off>best){best=off;before=g;}});if(before)root.insertBefore(draggingModule,before);else root.appendChild(draggingModule);}",
    "});",
    "document.addEventListener('dragleave',function(event){const zone=event.target.closest&&event.target.closest('.lesson-dropzone');if(zone)zone.classList.remove('drop-target');});",
    "function refreshCurriculumDisplay(root){",
    "  let number=1;",
    "  root.querySelectorAll('.curriculum-group[data-module-id]').forEach(function(group){",
    "    const moduleId=group.dataset.moduleId||'';const rows=Array.from(group.querySelectorAll(':scope > .lesson-dropzone > .curriculum-lesson'));",
    "    const count=group.querySelector('.curriculum-count');if(count)count.textContent=rows.length+'개 차시';",
    "    rows.forEach(function(row){const current=number++;const n=row.querySelector('.lesson-number');if(n)n.textContent=current+'.';const select=row.querySelector('select[name=module_id]');if(select)select.value=moduleId;",
    "      const mandatory=row.querySelector('.mandatory-preview-badge');const additional=row.querySelector('.additional-preview-badge');const toggle=row.querySelector('.additional-preview-toggle');const mandatoryControl=row.querySelector('.mandatory-preview-control');const additionalControl=row.querySelector('.additional-preview-control');const hint=row.querySelector('.preview-rule-hint');",
    "      if(current===1){if(mandatory)mandatory.style.display='inline-flex';if(additional)additional.style.display='none';if(mandatoryControl)mandatoryControl.style.display='';if(additionalControl)additionalControl.style.display='none';if(toggle)toggle.disabled=true;if(hint)hint.textContent='1차시는 자동 공개됩니다. OT·소개가 아니라 실제 강의 품질을 판단할 수 있는 본강의를 배치하세요.';}",
    "      else{if(mandatory)mandatory.style.display='none';if(additional)additional.style.display=toggle&&toggle.checked?'inline-flex':'none';if(mandatoryControl)mandatoryControl.style.display='none';if(additionalControl)additionalControl.style.display='';if(toggle)toggle.disabled=false;if(hint)hint.textContent='강의가 게시된 상태에서만 공개 재생됩니다.';}",
    "    });",
    "  });",
    "}",
    "document.addEventListener('dragend',function(){",
    "  const root=(draggingLesson||draggingModule)&&((draggingLesson||draggingModule).closest('[data-curriculum]'));",
    "  document.querySelectorAll('.dragging,.drop-target').forEach(function(el){el.classList.remove('dragging','drop-target');});",
    "  draggingLesson=null;draggingModule=null;if(root){refreshCurriculumDisplay(root);saveCurriculum(root);}",
    "});",
    "document.addEventListener('click',function(event){if(event.target.closest('.drag-handle'))event.preventDefault();});",
    "document.addEventListener('click',function(event){",
    "  const uploadButton=event.target.closest('.uploadbutton');",
    "  if(uploadButton){const box=uploadButton.closest('[data-vimeo-upload]');if(box) startUpload(box);return;}",
    "  const existingLoad=event.target.closest('.existingvideoload');",
    "  if(existingLoad){const box=existingLoad.closest('[data-vimeo-link]');if(box) loadExistingVideos(box);return;}",
    "  const existingLink=event.target.closest('.existingvideolink');",
    "  if(existingLink){const box=existingLink.closest('[data-vimeo-link]');if(box) linkExistingVideo(box);return;}",
    "  const loadButton=event.target.closest('.libraryload');",
    "  if(loadButton){const box=loadButton.closest('[data-vimeo-library]');if(box) loadLibrary(box);return;}",
    "  const importButton=event.target.closest('.libraryimport');",
    "  if(importButton){const box=importButton.closest('[data-vimeo-library]');if(box) importLibrary(box);return;}",
    "});",
    "})();"
  ].join("\n");
}

function vimeoHeaders(env, hasBody) {
  const headers = {
    Authorization: "Bearer " + String(env.VIMEO_ACCESS_TOKEN || "").trim(),
    Accept: "application/vnd.vimeo.*+json;version=3.4"
  };
  if (hasBody) headers["Content-Type"] = "application/json";
  return headers;
}

async function vimeoRequest(path, env, init = {}) {
  const response = await fetch(VIMEO_API_ORIGIN + path, {
    ...init,
    headers: { ...vimeoHeaders(env, Boolean(init.body)), ...(init.headers || {}) }
  });
  const payload = await response.json().catch(function () { return {}; });
  if (!response.ok) {
    throw new Error("Vimeo API failed (" + response.status + "): " + JSON.stringify(payload));
  }
  return payload;
}

function vimeoVideoId(uri) {
  const match = String(uri || "").match(/\/videos\/(\d+)/);
  return match ? match[1] : null;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}


async function listVimeoLibrary(env) {
  if (!env.VIMEO_ACCESS_TOKEN) throw new Error("Vimeo 연결이 필요합니다.");
  const videos = await listAllVimeoVideos(env);
  const linked = await env.COURSE_DB.prepare(
    "SELECT l.vimeo_id,l.id AS lesson_id,l.title AS lesson_title,c.title AS course_title " +
    "FROM lessons l JOIN courses c ON c.id=l.course_id WHERE l.vimeo_id IS NOT NULL AND l.status!='archived'"
  ).all();
  const usage = new Map();
  for (const row of (Array.isArray(linked.results) ? linked.results : [])) {
    const id = String(row.vimeo_id || "");
    if (!id) continue;
    if (!usage.has(id)) usage.set(id, []);
    usage.get(id).push({
      lesson_id: row.lesson_id,
      lesson_title: row.lesson_title,
      course_title: row.course_title
    });
  }

  return videos
    .filter((video) => video.vimeo_id)
    .map((video) => ({ ...video, linked_to: usage.get(String(video.vimeo_id)) || [] }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "ko", { numeric: true, sensitivity: "base" }));
}

async function linkExistingVimeoVideo(body, env) {
  const courseId = String(body && body.course_id || "").trim();
  const lessonId = String(body && body.lesson_id || "").trim();
  const vimeoId = String(body && body.vimeo_id || "").trim();
  if (!courseId || !lessonId || !/^\d+$/.test(vimeoId)) {
    throw new Error("강의, 차시, Vimeo 영상 정보가 필요합니다.");
  }

  const lesson = await env.COURSE_DB.prepare(
    "SELECT id,course_id FROM lessons WHERE id=? AND status!='archived'"
  ).bind(lessonId).first();
  if (!lesson || String(lesson.course_id) !== courseId) throw new Error("차시 정보가 일치하지 않습니다.");

  const videos = await listAllVimeoVideos(env);
  const video = videos.find((item) => String(item.vimeo_id || "") === vimeoId);
  if (!video) throw new Error("현재 Vimeo 계정에서 영상을 찾을 수 없습니다.");

  const status = video.status === "complete" ? "ready" : "processing";
  await env.COURSE_DB.prepare(
    "UPDATE lessons SET vimeo_id=?,duration_seconds=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(vimeoId, video.duration_seconds || null, status, lessonId).run();

  return {
    lesson_id: lessonId,
    vimeo_id: vimeoId,
    status,
    duration_seconds: video.duration_seconds || null,
    reused: true
  };
}

async function importVimeoLibrary(body, env) {
  const courseId = String(body && body.course_id || "").trim();
  const requestedIds = Array.isArray(body && body.video_ids)
    ? body.video_ids.map((id) => String(id || "").trim()).filter((id) => /^\d+$/.test(id))
    : [];
  if (!courseId || requestedIds.length === 0) throw new Error("강의와 Vimeo 영상을 선택해야 합니다.");

  const course = await env.COURSE_DB.prepare("SELECT id FROM courses WHERE id=?").bind(courseId).first();
  if (!course) throw new Error("강의를 찾을 수 없습니다.");

  const library = await listVimeoLibrary(env);
  const byId = new Map(library.map((video) => [video.vimeo_id, video]));
  const selected = requestedIds.map((id) => byId.get(id)).filter(Boolean);
  if (selected.length !== requestedIds.length) {
    throw new Error("선택한 영상 중 현재 Vimeo 계정에서 확인할 수 없는 영상이 있습니다.");
  }

  const orderRow = await env.COURSE_DB.prepare(
    "SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM lessons WHERE course_id=?"
  ).bind(courseId).first();
  let sortOrder = Number(orderRow && orderRow.next_order != null ? orderRow.next_order : 0);

  for (const video of selected) {
    await env.COURSE_DB.prepare(
      "INSERT INTO lessons (id,course_id,title,vimeo_id,duration_seconds,sort_order,status,is_preview) VALUES (?,?,?,?,?,?,?,0)"
    ).bind(
      crypto.randomUUID(),
      courseId,
      video.name || ("Vimeo " + video.vimeo_id),
      video.vimeo_id,
      video.duration_seconds || null,
      sortOrder,
      video.status === "complete" ? "ready" : "processing"
    ).run();
    sortOrder += 1;
  }

  return { imported_count: selected.length };
}

async function startVimeoUpload(body, env) {
  if (!env.VIMEO_ACCESS_TOKEN) throw new Error("Vimeo 연결이 필요합니다.");

  const courseId = String(body && body.course_id || "").trim();
  const lessonId = String(body && body.lesson_id || "").trim();
  const fileName = String(body && body.file_name || "").trim();
  const fileSize = Number(body && body.file_size || 0);
  const videoName = String(body && body.name || fileName || "강의 영상").trim();

  if (!courseId || !lessonId || !fileName || !Number.isFinite(fileSize) || fileSize <= 0) {
    throw new Error("업로드 정보가 부족합니다.");
  }

  const lesson = await env.COURSE_DB
    .prepare("SELECT id,course_id,vimeo_id FROM lessons WHERE id=?")
    .bind(lessonId)
    .first();

  if (!lesson || lesson.course_id !== courseId) throw new Error("차시 정보가 일치하지 않습니다.");
  if (lesson.vimeo_id) throw new Error("이미 Vimeo 영상이 연결된 차시입니다.");

  const video = await vimeoRequest("/me/videos", env, {
    method: "POST",
    body: JSON.stringify({
      name: videoName,
      privacy: { view: "disable" },
      upload: { approach: "tus", size: Math.trunc(fileSize) }
    })
  });

  const vimeoId = vimeoVideoId(video && video.uri);
  const uploadLink = video && video.upload && video.upload.upload_link;
  if (!vimeoId || !uploadLink) throw new Error("Vimeo 업로드 세션 생성에 실패했습니다.");

  const uploadId = crypto.randomUUID();
  await env.COURSE_DB.prepare(
    "INSERT INTO video_uploads (id,course_id,lesson_id,file_name,file_size,vimeo_id,vimeo_uri,upload_status) VALUES (?,?,?,?,?,?,?, 'uploading')"
  ).bind(uploadId, courseId, lessonId, fileName, Math.trunc(fileSize), vimeoId, video.uri).run();

  await env.COURSE_DB.prepare(
    "UPDATE lessons SET vimeo_id=?,status='uploading',updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(vimeoId, lessonId).run();

  return {
    upload_id: uploadId,
    upload_link: uploadLink,
    vimeo_id: vimeoId,
    tus_version: TUS_VERSION
  };
}

async function completeVimeoUpload(body, env) {
  const uploadId = String(body && body.upload_id || "").trim();
  if (!uploadId) throw new Error("업로드 ID가 필요합니다.");

  const upload = await env.COURSE_DB.prepare(
    "SELECT id,lesson_id,vimeo_id FROM video_uploads WHERE id=?"
  ).bind(uploadId).first();

  if (!upload) throw new Error("업로드 기록을 찾을 수 없습니다.");

  const video = await vimeoRequest("/videos/" + encodeURIComponent(upload.vimeo_id), env, { method: "GET" });
  const duration = Number(video && video.duration || 0) || null;
  const transcodeStatus = video && video.transcode && video.transcode.status || null;
  const ready = transcodeStatus === "complete";
  const status = ready ? "ready" : "processing";

  await env.COURSE_DB.prepare(
    "UPDATE video_uploads SET upload_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(status, uploadId).run();

  await env.COURSE_DB.prepare(
    "UPDATE lessons SET duration_seconds=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(duration, status, upload.lesson_id).run();

  return {
    upload_id: uploadId,
    vimeo_id: upload.vimeo_id,
    status,
    transcode_status: transcodeStatus,
    duration_seconds: duration
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/course-admin/health") return health(env);

    if (!env.COURSE_ADMIN_PASSWORD) {
      return json({ ok: false, error: "course_admin_secret_missing" }, { status: 503 });
    }

    if (url.pathname === "/course-admin/login" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      const form = await request.formData().catch(function () { return null; });
      const password = form ? form.get("password") : "";
      if (!await passwordMatches(password, env.COURSE_ADMIN_PASSWORD)) {
        return html(loginPage("비밀번호가 올바르지 않습니다."), { status: 401 });
      }
      return redirect("/course-admin", adminCookie(await makeAdminToken(env.COURSE_ADMIN_PASSWORD)));
    }

    if (url.pathname === "/course-admin/logout" && request.method === "POST") {
      return redirect("/course-admin", expiredAdminCookie());
    }

    const authenticated = await isAdmin(request, env);

    if (url.pathname === "/course-admin" && request.method === "GET") {
      if (!authenticated) return html(loginPage(""));
      if (!env.COURSE_DB) return json({ ok: false, error: "course_db_missing" }, { status: 503 });
      return html(await dashboardPage(
        env,
        url.searchParams.get("message") || "",
        url.searchParams.get("error") || "",
        url.searchParams.get("course") || "",
        url.searchParams.get("tab") || "basic",
        url.searchParams.get("e2e_order") || "",
        url.searchParams.get("student_q") || "",
        url.searchParams.get("student") || ""
      ));
    }

    if (url.pathname === "/course-admin/app.js" && request.method === "GET") {
      if (!authenticated) return javascript("/* admin auth required */", { status: 401 });
      return javascript(adminClientScript());
    }

    if (!authenticated) {
      return json({ ok: false, error: "admin_auth_required" }, { status: 401 });
    }

    if (!env.COURSE_DB) {
      return json({ ok: false, error: "course_db_missing" }, { status: 503 });
    }

    if (url.pathname === "/course-admin/courses" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        const result = await createCourse(await request.formData(), env);
        const message = result && result.product_no
          ? "강의를 만들고 Cafe24 숨김 상품 #" + result.product_no + "을 자동 생성·연결했습니다."
          : "강의를 만들었습니다.";
        let target = "/course-admin?course=" + encodeURIComponent(result.course_id) + "&tab=content&message=" + encodeURIComponent(message);
        if (result && result.cafe24_error) {
          target += "&error=" + encodeURIComponent("Cafe24 자동 상품 등록 실패: " + result.cafe24_error);
        }
        return redirect(target);
      } catch (error) {
        return html(loginPage(String(error && error.message ? error.message : error)), { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/course-status" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      const form = await request.formData();
      const courseId = String(form.get("course_id") || "").trim();
      const base = "/course-admin?course=" + encodeURIComponent(courseId) + "&tab=sales";
      try {
        const message = await setCourseStatus(form, env);
        return redirect(base + "&message=" + encodeURIComponent(message));
      } catch (error) {
        return redirect(base + "&error=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/course-update" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      const form = await request.formData();
      const courseId = String(form.get("course_id") || "").trim();
      const base = "/course-admin?course=" + encodeURIComponent(courseId) + "&tab=basic";
      try {
        await updateCourse(form, env);
        return redirect(base + "&message=" + encodeURIComponent("강의 기본정보를 저장했습니다."));
      } catch (error) {
        return redirect(base + "&error=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/course-sales-page" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      const form = await request.formData();
      const courseId = String(form.get("course_id") || "").trim();
      const base = "/course-admin?course=" + encodeURIComponent(courseId) + "&tab=landing";
      try {
        await updateCourseSalesPage(form, env);
        return redirect(base + "&message=" + encodeURIComponent("판매 페이지를 저장했습니다."));
      } catch (error) {
        return redirect(base + "&error=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/cafe24-product-create" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      const form = await request.formData();
      const courseId = String(form.get("course_id") || "").trim();
      const base = "/course-admin?course=" + encodeURIComponent(courseId) + "&tab=sales";
      try {
        const productNo = await createCafe24CourseProduct(form, env);
        return redirect(base + "&message=" + encodeURIComponent("Cafe24 상품 #" + productNo + "을 생성하고 연결했습니다. 현재는 진열·판매 중지 상태입니다."));
      } catch (error) {
        return redirect(base + "&error=" + encodeURIComponent(friendlyCafe24Error(error)));
      }
    }

    if (url.pathname === "/course-admin/cafe24-product-link" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        await linkExistingCafe24CourseProduct(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent("기존 Cafe24 상품을 강의와 연결했습니다."));
      } catch (error) {
        return redirect("/course-admin?message=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/cafe24-product-sales" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      const form = await request.formData();
      const courseId = String(form.get("course_id") || "").trim();
      const base = "/course-admin?course=" + encodeURIComponent(courseId) + "&tab=sales";
      try {
        const stateLabel = await updateCafe24CourseSales(form, env);
        return redirect(base + "&message=" + encodeURIComponent("판매 상태를 ‘" + stateLabel + "’으로 변경했습니다."));
      } catch (error) {
        return redirect(base + "&error=" + encodeURIComponent(friendlyCafe24Error(error)));
      }
    }

    if (url.pathname === "/course-admin/student-access" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      const form = await request.formData();
      const courseId = String(form.get("course_id") || "").trim();
      const memberId = String(form.get("member_id") || "").trim();
      const base = "/course-admin?course=" + encodeURIComponent(courseId) + "&tab=students" +
        (memberId ? "&student=" + encodeURIComponent(memberId) : "");
      try {
        const result = await updateManualCourseAccess(form, env);
        return redirect(base + "&message=" + encodeURIComponent(result.message));
      } catch (error) {
        return redirect(base + "&error=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/e2e-test" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        const message = await updatePaymentE2ETest(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent(message));
      } catch (error) {
        return redirect("/course-admin?error=" + encodeURIComponent(friendlyCafe24Error(error)));
      }
    }

    if (url.pathname === "/course-admin/modules" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        await createModule(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent("모듈을 추가했습니다."));
      } catch (error) {
        return redirect("/course-admin?message=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/lesson-update" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        await updateLesson(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent("차시를 저장했습니다."));
      } catch (error) {
        return redirect("/course-admin?message=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/lesson-move" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        await moveLesson(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent("차시 순서를 변경했습니다."));
      } catch (error) {
        return redirect("/course-admin?message=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/lessons" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        await createLesson(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent("차시를 추가했습니다."));
      } catch (error) {
        return json({ ok: false, error: "course_admin_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/api/curriculum/reorder" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        return json({ ok: true, ...(await reorderCurriculum(await readJson(request), env)) });
      } catch (error) {
        return json({ ok: false, error: "curriculum_reorder_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/api/vimeo/library" && request.method === "GET") {
      try {
        return json({ ok: true, videos: await listVimeoLibrary(env) });
      } catch (error) {
        return json({ ok: false, error: "vimeo_library_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/api/vimeo/link" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        return json({ ok: true, ...(await linkExistingVimeoVideo(await readJson(request), env)) });
      } catch (error) {
        return json({ ok: false, error: "vimeo_link_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/api/vimeo/import" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        return json({ ok: true, ...(await importVimeoLibrary(await readJson(request), env)) });
      } catch (error) {
        return json({ ok: false, error: "vimeo_import_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/api/vimeo/start" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        return json({ ok: true, ...(await startVimeoUpload(await readJson(request), env)) }, { status: 201 });
      } catch (error) {
        return json({ ok: false, error: "vimeo_upload_start_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/api/vimeo/complete" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        return json({ ok: true, ...(await completeVimeoUpload(await readJson(request), env)) });
      } catch (error) {
        return json({ ok: false, error: "vimeo_upload_complete_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    return json({ ok: false, error: "not_found" }, { status: 404 });
  }
};

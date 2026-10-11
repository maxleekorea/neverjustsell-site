/*
 * NJS visitor login context, Cafe24 Smart Design optional skin enhancement.
 * Does not submit, intercept, replace, or edit Cafe24 login forms or OAuth URLs.
 * Works only for the OAuth login path launched by NJS courses/community.
 */
(function (root) {
  "use strict";

  const CAFE24_ORIGIN = "https://neverjustsell.cafe24.com";
  const MEMBER_LOGIN_PATH = "/member/login.html";

  function isNjsLearningLogin(href) {
    try {
      const url = new URL(String(href));
      if (url.origin !== CAFE24_ORIGIN || url.pathname !== MEMBER_LOGIN_PATH) return false;
      const raw = url.searchParams.get("returnUrl");
      if (!raw) return false;
      const destination = new URL(raw, url.origin);
      return destination.origin === CAFE24_ORIGIN &&
        destination.pathname === "/api/v2/oauth/authorize" &&
        destination.searchParams.get("response_type") === "code" &&
        Boolean(destination.searchParams.get("state")) &&
        Boolean(destination.searchParams.get("client_id"));
    } catch (_) {
      return false;
    }
  }

  function appendText(parent, tag, className, text, doc) {
    const node = doc.createElement(tag);
    node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function install(doc, href) {
    if (!doc || !isNjsLearningLogin(href)) return false;
    if (doc.getElementById("njs-visitor-login-guide")) return true;
    // The stock Cafe24 member_login module owns all credentials and actions.
    const login = doc.querySelector(".xans-member-login") ||
      doc.querySelector(".xans-member-loginPackage") ||
      (doc.querySelector('input[type="password"]') &&
       doc.querySelector('input[type="password"]').closest("form"));
    if (!login || !login.parentElement) return false;

    doc.documentElement.classList.add("njs-visitor-login");
    const panel = doc.createElement("section");
    panel.id = "njs-visitor-login-guide";
    panel.className = "njs-visitor-login-guide";
    panel.setAttribute("aria-label", "NJS 회원 로그인 안내");
    appendText(panel, "span", "njs-visitor-login-overline", "NEVER JUST SELL", doc);
    appendText(panel, "h2", "njs-visitor-login-title", "로그인하고 이어서 이용하세요", doc);
    appendText(panel, "p", "njs-visitor-login-copy", "강의를 이어 듣거나 커뮤니티에 질문을 남기려면 회원 로그인이 필요합니다. 기존 NJS 회원 계정으로 로그인해 주세요.", doc);
    const link = doc.createElement("a");
    link.href = "https://www.neverjustsell.com/";
    link.className = "njs-visitor-login-back";
    link.textContent = "NJS 홈으로 돌아가기";
    panel.appendChild(link);
    login.parentElement.insertBefore(panel, login);

    // Hide only explicitly tagged sales promotions in an OAuth login context.
    if (typeof doc.title === "string") doc.title = "NJS 회원 로그인 | NEVER JUST SELL";
    return true;
  }

  const api = { isNjsLearningLogin, install };
  root.NJSVisitorLoginUX = api;
  if (root.document && root.location) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", function () {
        install(root.document, root.location.href);
      }, { once: true });
    } else {
      install(root.document, root.location.href);
    }
  }
})(typeof window !== "undefined" ? window : globalThis);

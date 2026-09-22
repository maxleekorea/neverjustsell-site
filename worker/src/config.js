export const SITE_ORIGIN = "https://www.neverjustsell.com";
export const APEX_ORIGIN = "https://neverjustsell.com";
export const CLASSROOM_ORIGIN = "https://classroom.neverjustsell.com";
export const COMMUNITY_ORIGIN = "https://community.neverjustsell.com";
export const COMMERCE_ORIGIN = "https://neverjustsell.cafe24.com";
export const CAFE24_ADMIN_ORIGIN = "https://neverjustsell.cafe24api.com";
export const LEGACY_CLASSROOM_HOST = "neverjustsell-course-access.max-lee-korea.workers.dev";

export const CAFE24_CUSTOMER_SCOPE = "mall.read_customer_identifier";
export const CAFE24_ADMIN_SCOPES = ["mall.read_product", "mall.write_product", "mall.read_order", "mall.write_order"];

export function cafe24RedirectUri(env) {
  const fallback = `${CLASSROOM_ORIGIN}/oauth/cafe24/callback`;
  try {
    const url = new URL(String(env.CAFE24_REDIRECT_URI || fallback));
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function allowedCommunityOrigins(env) {
  const configured = String(env.COMMUNITY_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([COMMUNITY_ORIGIN, ...configured]);
}

export function validCustomerReturn(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:") return null;

    if (url.origin === SITE_ORIGIN) {
      if (url.pathname !== "/") return null;
      return url.toString();
    }

    if (url.origin === CLASSROOM_ORIGIN) {
      const allowed =
        url.pathname === "/classroom" ||
        url.pathname === "/courses" ||
        url.pathname.startsWith("/courses/");
      return allowed ? url.toString() : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function validCommunityReturn(value, env) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:") return null;
    if (!allowedCommunityOrigins(env).has(url.origin)) return null;
    if (url.pathname !== "/auth/callback") return null;
    return url.toString();
  } catch {
    return null;
  }
}

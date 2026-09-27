from __future__ import annotations

import re
from typing import Any, Dict, Mapping
from urllib.parse import urlparse


class ShadowAdapterError(Exception):
    pass


def _require_bool_flag(value: Any, field: str) -> str:
    if value not in {"T", "F"}:
        raise ShadowAdapterError(f"{field.upper()}_INVALID")
    return str(value)


def _env_ref(name: Any, field: str) -> str:
    value = str(name or "")
    if not re.fullmatch(r"[A-Z][A-Z0-9_]{2,63}", value):
        raise ShadowAdapterError(f"{field.upper()}_REF_INVALID")
    return value


def _safe_njs_url(value: Any) -> str:
    url = str(value or "")
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ShadowAdapterError("CLOUDFLARE_URL_INVALID")
    host = parsed.hostname.lower().rstrip(".")
    if host != "neverjustsell.com" and not host.endswith(".neverjustsell.com"):
        raise ShadowAdapterError("CLOUDFLARE_HOST_NOT_ALLOWED")
    if parsed.username or parsed.password:
        raise ShadowAdapterError("CLOUDFLARE_URL_USERINFO_FORBIDDEN")
    return url


def cloudflare_cache_purge_plan(command: Mapping[str, Any]) -> Dict[str, Any]:
    payload = dict(command.get("payload_json") or {})
    allowed = {"files", "zone_id_ref"}
    if set(payload) - allowed:
        raise ShadowAdapterError("CLOUDFLARE_PAYLOAD_FIELDS_INVALID")
    zone_ref = _env_ref(payload.get("zone_id_ref", "CLOUDFLARE_ZONE_ID"), "zone_id")
    files = payload.get("files")
    if not isinstance(files, list) or not files or len(files) > 30:
        raise ShadowAdapterError("CLOUDFLARE_FILES_INVALID")
    safe_files = [_safe_njs_url(v) for v in files]
    if len(set(safe_files)) != len(safe_files):
        raise ShadowAdapterError("CLOUDFLARE_FILES_DUPLICATE")
    return {
        "shadow_execution": True,
        "transport_state": "NOT_SENT",
        "provider": "CLOUDFLARE",
        "request": {
            "method": "POST",
            "url_template": f"https://api.cloudflare.com/client/v4/zones/${{{zone_ref}}}/purge_cache",
            "headers_template": {
                "Authorization": "Bearer ${CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/json",
            },
            "body": {"files": safe_files},
        },
        "required_secret_refs": ["CLOUDFLARE_API_TOKEN", zone_ref],
        "required_permission": "Cache Purge",
        "network_call_performed": False,
    }


def cafe24_product_status_plan(command: Mapping[str, Any]) -> Dict[str, Any]:
    payload = dict(command.get("payload_json") or {})
    allowed = {"shop_no", "display", "selling", "mall_id_ref", "product_no_ref", "api_version"}
    if set(payload) - allowed:
        raise ShadowAdapterError("CAFE24_PAYLOAD_FIELDS_INVALID")
    mall_ref = _env_ref(payload.get("mall_id_ref", "CAFE24_MALL_ID"), "mall_id")
    product_ref = _env_ref(payload.get("product_no_ref", "CAFE24_SHADOW_PRODUCT_NO"), "product_no")
    version = str(payload.get("api_version", "2026-09-01"))
    if not re.fullmatch(r"20\d{2}-\d{2}-\d{2}", version):
        raise ShadowAdapterError("CAFE24_API_VERSION_INVALID")
    shop_no = payload.get("shop_no", 1)
    if not isinstance(shop_no, int) or shop_no < 1:
        raise ShadowAdapterError("CAFE24_SHOP_NO_INVALID")
    request: Dict[str, Any] = {}
    if "display" in payload:
        request["display"] = _require_bool_flag(payload.get("display"), "display")
    if "selling" in payload:
        request["selling"] = _require_bool_flag(payload.get("selling"), "selling")
    if not request:
        raise ShadowAdapterError("CAFE24_STATUS_CHANGE_REQUIRED")
    return {
        "shadow_execution": True,
        "transport_state": "NOT_SENT",
        "provider": "CAFE24",
        "request": {
            "method": "PUT",
            "url_template": f"https://${{{mall_ref}}}.cafe24api.com/api/v2/admin/products/${{{product_ref}}}",
            "headers_template": {
                "Authorization": "Bearer ${CAFE24_ACCESS_TOKEN}",
                "X-Cafe24-Api-Version": version,
                "Content-Type": "application/json",
            },
            "body": {"shop_no": shop_no, "request": request},
        },
        "required_secret_refs": ["CAFE24_ACCESS_TOKEN", mall_ref, product_ref],
        "required_scope": "mall.write_product",
        "network_call_performed": False,
    }


def build_shadow_request_plan(command: Mapping[str, Any], action_row: Mapping[str, Any]) -> Dict[str, Any]:
    action = str(command.get("action"))
    if action == "CLOUDFLARE.CACHE.PURGE_URLS":
        return cloudflare_cache_purge_plan(command)
    if action == "CAFE24.PRODUCT_STATUS.UPDATE":
        return cafe24_product_status_plan(command)
    raise ShadowAdapterError("NO_SHADOW_ADAPTER")

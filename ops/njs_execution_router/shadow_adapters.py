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


def _bearer_headers(secret_ref: str, *, api_version: str | None = None) -> Dict[str, str]:
    headers = {
        "Authorization": f"Bearer ${{{secret_ref}}}",
        "Content-Type": "application/json",
    }
    if api_version:
        headers["X-Cafe24-Api-Version"] = api_version
    return headers


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

    headers = _bearer_headers("CLOUDFLARE_API_TOKEN")
    zone_url = f"https://api.cloudflare.com/client/v4/zones/${{{zone_ref}}}"
    purge_url = f"https://api.cloudflare.com/client/v4/zones/${{{zone_ref}}}/purge_cache"

    return {
        "shadow_execution": True,
        "transport_state": "NOT_SENT",
        "provider": "CLOUDFLARE",
        "mutability_semantics": "WRITE_IRREVERSIBLE",
        "preflight": {
            "request": {
                "method": "GET",
                "url_template": zone_url,
                "headers_template": headers,
            },
            "required_assertions": [
                {"path": "success", "op": "EQ", "value": True},
                {"path": "result.id", "op": "EQ_SECRET_REF", "value_ref": zone_ref},
                {"path": "result.name", "op": "EQ", "value": "neverjustsell.com"},
                {"path": "result.status", "op": "EQ", "value": "active"},
            ],
            "failure_state": "BLOCKED",
        },
        "request": {
            "method": "POST",
            "url_template": purge_url,
            "headers_template": headers,
            "body": {"files": safe_files},
        },
        "provider_ack": {
            "required_http_status": 200,
            "required_assertions": [
                {"path": "success", "op": "EQ", "value": True},
                {"path": "result.id", "op": "NON_EMPTY"},
            ],
            "meaning": "REQUEST_ACCEPTED_NOT_EVICTION_PROOF",
        },
        "postcondition": {
            "verification_strength": "EDGE_PROBE_NOT_GLOBAL_PROOF",
            "probe_requests": [
                {
                    "method": "GET",
                    "url": url,
                    "headers_template": {"User-Agent": "njs-execution-router/0.1"},
                    "capture_headers": ["CF-Cache-Status", "CF-Ray", "Age"],
                }
                for url in safe_files
            ],
            "required_assertion": {
                "header": "CF-Cache-Status",
                "op": "NEQ_CASE_INSENSITIVE",
                "value": "HIT",
            },
            "max_attempts_per_url": 3,
            "retry_delay_seconds": 2,
            "success_rule": "PROVIDER_ACK_AND_EACH_URL_OBSERVED_NON_HIT",
            "inconclusive_state": "UNVERIFIED",
            "global_eviction_proof": False,
        },
        "rollback": {
            "supported": False,
            "reason": "CACHE_PURGE_CANNOT_RESTORE_EVICTED_EDGE_ENTRIES",
            "recovery": "ORIGIN_REFILL_OR_CONTROLLED_REWARM_ONLY",
        },
        "credential_contract": {
            "required_secret_refs": ["CLOUDFLARE_API_TOKEN", zone_ref],
            "minimum_permission": "Cache Purge",
            "zone_scope": "neverjustsell.com only",
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

    requested_change: Dict[str, Any] = {}
    if "display" in payload:
        requested_change["display"] = _require_bool_flag(payload.get("display"), "display")
    if "selling" in payload:
        requested_change["selling"] = _require_bool_flag(payload.get("selling"), "selling")
    if not requested_change:
        raise ShadowAdapterError("CAFE24_STATUS_CHANGE_REQUIRED")

    headers = _bearer_headers("CAFE24_ACCESS_TOKEN", api_version=version)
    product_url = f"https://${{{mall_ref}}}.cafe24api.com/api/v2/admin/products/${{{product_ref}}}"
    read_url = f"{product_url}?shop_no={shop_no}"

    rollback_fields = {
        field: f"${{BEFORE_STATE.{field}}}"
        for field in requested_change
    }

    return {
        "shadow_execution": True,
        "transport_state": "NOT_SENT",
        "provider": "CAFE24",
        "mutability_semantics": "WRITE_REVERSIBLE",
        "before_state": {
            "request": {
                "method": "GET",
                "url_template": read_url,
                "headers_template": headers,
            },
            "snapshot_fields": ["product_no", *requested_change.keys()],
            "required_assertions": [
                {"path": "product.product_no", "op": "EQ_SECRET_REF", "value_ref": product_ref},
                *[
                    {"path": f"product.{field}", "op": "IN", "values": ["T", "F"]}
                    for field in requested_change
                ],
            ],
            "failure_state": "BLOCKED",
        },
        "request": {
            "method": "PUT",
            "url_template": product_url,
            "headers_template": headers,
            "body": {"shop_no": shop_no, "request": requested_change},
        },
        "postcondition": {
            "request": {
                "method": "GET",
                "url_template": read_url,
                "headers_template": headers,
            },
            "expected_fields": {
                f"product.{field}": value for field, value in requested_change.items()
            },
            "success_rule": "ALL_EXPECTED_FIELDS_EXACT_MATCH",
            "failure_state": "UNVERIFIED",
        },
        "rollback": {
            "supported": True,
            "source": "BEFORE_STATE_SNAPSHOT",
            "request": {
                "method": "PUT",
                "url_template": product_url,
                "headers_template": headers,
                "body": {"shop_no": shop_no, "request": rollback_fields},
            },
            "verification": {
                "method": "GET",
                "url_template": read_url,
                "headers_template": headers,
                "expected": "MATCH_BEFORE_STATE_SNAPSHOT",
            },
        },
        "credential_contract": {
            "required_secret_refs": ["CAFE24_ACCESS_TOKEN", mall_ref, product_ref],
            "required_scopes": ["mall.read_product", "mall.write_product"],
            "shop_no": shop_no,
        },
        "required_secret_refs": ["CAFE24_ACCESS_TOKEN", mall_ref, product_ref],
        "required_scopes": ["mall.read_product", "mall.write_product"],
        "network_call_performed": False,
    }


def build_shadow_request_plan(command: Mapping[str, Any], action_row: Mapping[str, Any]) -> Dict[str, Any]:
    action = str(command.get("action"))
    if action == "CLOUDFLARE.CACHE.PURGE_URLS":
        return cloudflare_cache_purge_plan(command)
    if action == "CAFE24.PRODUCT_STATUS.UPDATE":
        return cafe24_product_status_plan(command)
    raise ShadowAdapterError("NO_SHADOW_ADAPTER")

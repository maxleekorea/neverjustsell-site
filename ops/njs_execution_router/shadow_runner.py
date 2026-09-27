#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping

import router
from shadow_adapters import ShadowAdapterError, build_shadow_request_plan


SHADOW_MUTABILITIES = {"WRITE_REVERSIBLE", "WRITE_IRREVERSIBLE"}


def validate_shadow_action(command: Mapping[str, Any], registry: Iterable[Mapping[str, Any]], current_phase: str) -> Dict[str, Any]:
    rows = [dict(r) for r in registry if r.get("action") == command["action"]]
    if not rows:
        raise router.Reject("UNKNOWN_ACTION")
    r = rows[0]
    if r.get("status") not in {"PILOT", "ACTIVE"}:
        raise router.Reject("ACTION_DISABLED")
    if r.get("mutability") not in SHADOW_MUTABILITIES:
        raise router.Block("SHADOW_WRITE_ACTION_REQUIRED")
    if current_phase != "SHADOW_EXECUTION" or command.get("mode") != "SHADOW_EXECUTION":
        raise router.Block("SHADOW_PHASE_REQUIRED")
    if router.PHASE_RANK[current_phase] < router.PHASE_RANK.get(str(r.get("enabled_phase")), 999):
        raise router.Block("PHASE_NOT_ENABLED")
    if router.APPROVAL_RANK[command["approval_level"]] < router.APPROVAL_RANK.get(r.get("approval_floor", "A3"), 3):
        raise router.Block("APPROVAL_TOO_LOW")
    allow = str(r.get("target_allowlist", ""))
    if allow and allow != "*" and command["target_ref"] not in {x.strip() for x in allow.split("|")}:
        raise router.Reject("TARGET_NOT_ALLOWED")
    if str(r.get("idempotency_required", "")).upper() == "TRUE" and not command.get("idempotency_key"):
        raise router.Reject("IDEMPOTENCY_REQUIRED")
    if str(r.get("precondition_required", "")).upper() == "TRUE" and not command.get("precondition_json"):
        raise router.Block("PRECONDITION_REQUIRED")
    return r


def validate_shadow_plan(plan: Mapping[str, Any], action_row: Mapping[str, Any]) -> None:
    if plan.get("network_call_performed") is not False or plan.get("transport_state") != "NOT_SENT":
        raise router.Reject("SHADOW_TRANSPORT_GUARD_FAILED")
    if plan.get("mutability_semantics") != action_row.get("mutability"):
        raise router.Reject("SHADOW_MUTABILITY_MISMATCH")
    if str(action_row.get("postcondition_required", "")).upper() == "TRUE" and not plan.get("postcondition"):
        raise router.Reject("SHADOW_POSTCONDITION_CONTRACT_REQUIRED")
    if str(action_row.get("readback_required", "")).upper() == "TRUE" and not (
        plan.get("postcondition") or plan.get("provider_ack")
    ):
        raise router.Reject("SHADOW_READBACK_CONTRACT_REQUIRED")
    if action_row.get("mutability") == "WRITE_REVERSIBLE":
        rollback = plan.get("rollback") or {}
        if rollback.get("supported") is not True:
            raise router.Reject("REVERSIBLE_ACTION_ROLLBACK_REQUIRED")
    if action_row.get("mutability") == "WRITE_IRREVERSIBLE":
        rollback = plan.get("rollback") or {}
        if rollback.get("supported") is not False:
            raise router.Reject("IRREVERSIBLE_ACTION_ROLLBACK_MUST_BE_FALSE")


def plan_hash(plan: Mapping[str, Any]) -> str:
    return hashlib.sha256(router.canonical_json(plan).encode("utf-8")).hexdigest()


def run_shadow(command: Mapping[str, Any], registry: Iterable[Mapping[str, Any]], worker_id: str = "NJS-SHADOW-PILOT") -> Dict[str, Any]:
    started = router.now_iso()
    base = {
        "job_id": command.get("job_id", "UNKNOWN"),
        "started_at": started,
        "adapter": "SHADOW",
        "worker_id": worker_id,
        "attempt": 1,
        "changed_objects_json": [],
        "canonical_effect": "NONE",
        "notes": "Network transport intentionally disabled",
    }
    try:
        c = router.validate_schema(command)
        action_row = validate_shadow_action(c, registry, "SHADOW_EXECUTION")
        plan = build_shadow_request_plan(c, action_row)
        validate_shadow_plan(plan, action_row)
        output = {
            "shadow_execution": True,
            "request_plan_hash": plan_hash(plan),
            "request_plan": plan,
        }
        result = {
            **base,
            "adapter": str(action_row.get("adapter") or "SHADOW"),
            "status": "SUCCEEDED",
            "finished_at": router.now_iso(),
            "result_ref": "INLINE",
            "validation_state": "PASS",
            "error_code": "",
            "error_detail": "",
            "readback_json": output,
        }
    except router.Block as exc:
        result = {
            **base,
            "status": "BLOCKED",
            "finished_at": router.now_iso(),
            "result_ref": "",
            "validation_state": "NOT_RUN",
            "error_code": str(exc).split()[0],
            "error_detail": str(exc),
            "readback_json": {},
        }
    except (router.Reject, ShadowAdapterError) as exc:
        result = {
            **base,
            "status": "REJECTED",
            "finished_at": router.now_iso(),
            "result_ref": "",
            "validation_state": "NOT_RUN",
            "error_code": str(exc).split()[0],
            "error_detail": str(exc),
            "readback_json": {},
        }
    except Exception as exc:
        result = {
            **base,
            "status": "FAILED",
            "finished_at": router.now_iso(),
            "result_ref": "",
            "validation_state": "FAIL",
            "error_code": type(exc).__name__,
            "error_detail": str(exc)[:1000],
            "readback_json": {},
        }
    result["result_hash"] = router.result_hash(result)
    return result


def load_json(path: str) -> Any:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--command", required=True)
    p.add_argument("--registry", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    result = run_shadow(load_json(args.command), load_json(args.registry))
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if result["status"] == "SUCCEEDED" else 2


if __name__ == "__main__":
    raise SystemExit(main())

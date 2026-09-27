#!/usr/bin/env python3
"""
NJS Execution Router v0.1

Safety properties:
- read-only actions only in pilot
- fail closed on schema/hash/action gate mismatch
- no arbitrary shell/SQL/URL from command payload
- NJS-IR is shadow metadata only; never executable authority
- NJS-IR N1 is a reference IR: exact semantics come from full command-hash dereference
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping, Optional, Sequence

PROTOCOL_VERSION = "NJS-CMD-0.1"
IR_VERSION = "NJS-IR-0.2-REF"
IMMUTABLE_HASH_FIELDS = (
    "job_id","protocol_version","created_at","project_id","action","target_type",
    "target_ref","refs_json","approval_level","requested_by","idempotency_key",
    "expected_state","precondition_json","payload_json","mode",
)
CRITICAL_ROUNDTRIP_FIELDS = (
    "project_id","action","target_ref","refs_json","approval_level",
    "idempotency_key","precondition_json",
)
REQUIRED_FIELDS = IMMUTABLE_HASH_FIELDS + ("status","command_hash","shadow_ir")
APPROVAL_RANK = {"A0":0,"A1":1,"A2":2,"A3":3}
PHASE_RANK = {
    "BASELINE":0, "SHADOW_ENCODE":1, "ROUND_TRIP":2,
    "SHADOW_EXECUTION":3, "DUAL_RUN":4, "LIMITED_AUTHORITY":5,
}
ALLOWED_MUTABILITY = {"READ","WRITE_REVERSIBLE","WRITE_IRREVERSIBLE"}
ACTION_CODE = {
    "P30.SYSTEM_STATUS.GET":"01",
    "P30.DEPLOY_STATUS.GET":"02",
    "GITHUB.WORKFLOW_STATUS.GET":"03",
}
MODE_CODE = {
    "BASELINE":"0","SHADOW_ENCODE":"1","ROUND_TRIP":"2",
    "SHADOW_EXECUTION":"3","DUAL_RUN":"4","LIMITED_AUTHORITY":"5",
}
APPROVAL_CODE = {"A0":"0","A1":"1","A2":"2","A3":"3"}

class RouterError(Exception):
    pass
class Reject(RouterError):
    pass
class Block(RouterError):
    pass

def parse_json_field(value: Any, expected_type: type) -> Any:
    if isinstance(value, expected_type):
        return value
    if not isinstance(value, str):
        raise Reject(f"expected {expected_type.__name__}, got {type(value).__name__}")
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise Reject(f"invalid JSON field: {exc}") from exc
    if not isinstance(parsed, expected_type):
        raise Reject(f"expected {expected_type.__name__} JSON")
    return parsed

def normalize_command(command: Mapping[str, Any]) -> Dict[str, Any]:
    c=dict(command)
    c["refs_json"] = parse_json_field(c.get("refs_json", []), list)
    c["precondition_json"] = parse_json_field(c.get("precondition_json", {}), dict)
    c["payload_json"] = parse_json_field(c.get("payload_json", {}), dict)
    return c

def canonical_hash_payload(command: Mapping[str, Any]) -> Dict[str, Any]:
    c=normalize_command(command)
    return {k:c.get(k) for k in IMMUTABLE_HASH_FIELDS}

def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",",":"))

def command_hash(command: Mapping[str, Any]) -> str:
    raw=canonical_json(canonical_hash_payload(command)).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def result_hash(result: Mapping[str, Any]) -> str:
    obj={k:v for k,v in result.items() if k not in {"result_hash","notes"}}
    raw=canonical_json(obj).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def shadow_ir(command: Mapping[str, Any], digest: Optional[str]=None) -> str:
    """Build N1 Reference IR. Full hash is the canonical address; other fields are sanity checks."""
    digest=digest or command_hash(command)
    action_code=ACTION_CODE.get(str(command.get("action")))
    mode_code=MODE_CODE.get(str(command.get("mode")))
    level_code=APPROVAL_CODE.get(str(command.get("approval_level")))
    if not action_code or mode_code is None or level_code is None:
        raise Reject("IR_CODE_UNDEFINED")
    return (
        f"N1|C:{digest}|P:{command['project_id']}|A:{action_code}|"
        f"L:{level_code}|M:{mode_code}"
    )

def parse_reference_ir(ir: str) -> Dict[str,str]:
    parts=str(ir).split("|")
    if not parts or parts[0] != "N1":
        raise Reject("IR_VERSION_UNSUPPORTED")
    parsed={}
    for token in parts[1:]:
        if ":" not in token:
            raise Reject("IR_TOKEN_INVALID")
        key,value=token.split(":",1)
        if key in parsed or not key or not value:
            raise Reject("IR_TOKEN_INVALID")
        parsed[key]=value
    required={"C","P","A","L","M"}
    if set(parsed) != required:
        raise Reject("IR_FIELDS_INVALID")
    if not re.fullmatch(r"[0-9a-f]{64}", parsed["C"]):
        raise Reject("IR_HASH_INVALID")
    return parsed

def resolve_reference_ir(ir: str, canonical_commands: Sequence[Mapping[str,Any]]) -> Dict[str,Any]:
    """Resolve Reference IR through full command hash and verify redundant routing fields."""
    ref=parse_reference_ir(ir)
    matches=[]
    for raw in canonical_commands:
        try:
            c=validate_schema(raw)
        except RouterError:
            continue
        if c["command_hash"] == ref["C"]:
            matches.append(c)
    if len(matches) != 1:
        raise Reject("IR_CANONICAL_LOOKUP_FAILED")
    c=matches[0]
    expected=shadow_ir(c,c["command_hash"])
    if expected != ir:
        raise Reject("IR_SANITY_MISMATCH")
    return c

def roundtrip_critical_view(command: Mapping[str,Any], canonical_commands: Sequence[Mapping[str,Any]]) -> Dict[str,Any]:
    resolved=resolve_reference_ir(str(command["shadow_ir"]), canonical_commands)
    src=normalize_command(command)
    for field in CRITICAL_ROUNDTRIP_FIELDS:
        if resolved.get(field) != src.get(field):
            raise Reject(f"ROUNDTRIP_MISMATCH:{field}")
    return {field:resolved.get(field) for field in CRITICAL_ROUNDTRIP_FIELDS}

def validate_schema(command: Mapping[str, Any]) -> Dict[str, Any]:
    missing=[k for k in REQUIRED_FIELDS if k not in command or command[k] in (None,"")]
    if missing:
        raise Reject("missing fields: "+",".join(missing))
    c=normalize_command(command)
    if c["protocol_version"] != PROTOCOL_VERSION:
        raise Reject("unsupported protocol_version")
    if c["approval_level"] not in APPROVAL_RANK:
        raise Reject("invalid approval_level")
    if c["mode"] not in PHASE_RANK:
        raise Reject("invalid mode")
    if not str(c["job_id"]).startswith("JOB-"):
        raise Reject("invalid job_id")
    actual=command_hash(c)
    if c["command_hash"] != actual:
        raise Reject(f"HASH_MISMATCH expected={actual} got={c['command_hash']}")
    expected_ir=shadow_ir(c, actual)
    if c["shadow_ir"] != expected_ir:
        raise Reject(f"IR_MISMATCH expected={expected_ir} got={c['shadow_ir']}")
    return c

def validate_action(command: Mapping[str, Any], registry: Iterable[Mapping[str, Any]], current_phase: str) -> Dict[str, Any]:
    rows=[dict(r) for r in registry if r.get("action")==command["action"]]
    if not rows:
        raise Reject("UNKNOWN_ACTION")
    r=rows[0]
    if r.get("status") not in {"PILOT","ACTIVE"}:
        raise Reject("ACTION_DISABLED")
    if r.get("mutability") not in ALLOWED_MUTABILITY:
        raise Reject("INVALID_MUTABILITY")
    if PHASE_RANK.get(current_phase,-1) < PHASE_RANK.get(r.get("enabled_phase",""),999):
        raise Block("PHASE_NOT_ENABLED")
    if APPROVAL_RANK[command["approval_level"]] < APPROVAL_RANK.get(r.get("approval_floor","A3"),3):
        raise Block("APPROVAL_TOO_LOW")
    allow=str(r.get("target_allowlist",""))
    if allow and allow != "*" and command["target_ref"] not in {x.strip() for x in allow.split("|")}:
        raise Reject("TARGET_NOT_ALLOWED")
    if r.get("mutability") != "READ":
        raise Block("PILOT_READ_ONLY")
    if str(r.get("idempotency_required","")).upper()=="TRUE" and not command.get("idempotency_key"):
        raise Reject("IDEMPOTENCY_REQUIRED")
    return r

def github_json(url: str, token: Optional[str]=None) -> Any:
    headers={"Accept":"application/vnd.github+json","User-Agent":"njs-execution-router/0.1"}
    if token:
        headers["Authorization"]=f"Bearer {token}"
    req=urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body=exc.read().decode("utf-8", errors="replace")
        raise RouterError(f"GITHUB_HTTP_{exc.code}: {body[:300]}") from exc

def execute_read_action(command: Mapping[str, Any], action_row: Mapping[str, Any]) -> Dict[str, Any]:
    action=command["action"]
    token=os.getenv("GITHUB_TOKEN")
    repo=os.getenv("NJS_P30_REPO","maxleekorea/neverjustsell-site")
    if action=="P30.SYSTEM_STATUS.GET":
        meta=github_json(f"https://api.github.com/repos/{repo}", token)
        branch=meta.get("default_branch","main")
        b=github_json(f"https://api.github.com/repos/{repo}/branches/{branch}", token)
        return {
            "project_id":"P30", "repository":repo, "visibility":meta.get("visibility"),
            "default_branch":branch, "head_sha":(b.get("commit") or {}).get("sha"),
            "archived":meta.get("archived"), "read_only":True,
        }
    if action=="P30.DEPLOY_STATUS.GET":
        meta=github_json(f"https://api.github.com/repos/{repo}", token)
        runs=github_json(f"https://api.github.com/repos/{repo}/actions/runs?per_page=1", token)
        latest=(runs.get("workflow_runs") or [None])[0]
        return {
            "project_id":"P30","repository":repo,"default_branch":meta.get("default_branch"),
            "latest_workflow": None if not latest else {
                "id":latest.get("id"),"name":latest.get("name"),"status":latest.get("status"),
                "conclusion":latest.get("conclusion"),"head_sha":latest.get("head_sha"),
            },"read_only":True,
        }
    if action=="GITHUB.WORKFLOW_STATUS.GET":
        runs=github_json(f"https://api.github.com/repos/{repo}/actions/runs?per_page=5", token)
        return {"repository":repo,"runs":[
            {"id":r.get("id"),"name":r.get("name"),"status":r.get("status"),
             "conclusion":r.get("conclusion"),"head_sha":r.get("head_sha")}
            for r in (runs.get("workflow_runs") or [])],"read_only":True}
    raise Reject("NO_ADAPTER")

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00","Z")

def run_one(command: Mapping[str, Any], registry: Iterable[Mapping[str, Any]], current_phase: str, worker_id="NJS-ROUTER-PILOT") -> Dict[str, Any]:
    started=now_iso()
    base={"job_id":command.get("job_id","UNKNOWN"),"started_at":started,"adapter":"NJS_STATUS",
          "worker_id":worker_id,"attempt":1,"changed_objects_json":[],"canonical_effect":"NONE","notes":""}
    try:
        c=validate_schema(command)
        action_row=validate_action(c, registry, current_phase)
        output=execute_read_action(c, action_row)
        result={**base,"status":"SUCCEEDED","finished_at":now_iso(),"result_ref":"INLINE",
                "validation_state":"PASS","error_code":"","error_detail":"","readback_json":output}
    except Block as exc:
        result={**base,"status":"BLOCKED","finished_at":now_iso(),"result_ref":"",
                "validation_state":"NOT_RUN","error_code":str(exc).split()[0],"error_detail":str(exc),"readback_json":{}}
    except Reject as exc:
        result={**base,"status":"REJECTED","finished_at":now_iso(),"result_ref":"",
                "validation_state":"NOT_RUN","error_code":str(exc).split()[0],"error_detail":str(exc),"readback_json":{}}
    except Exception as exc:
        result={**base,"status":"FAILED","finished_at":now_iso(),"result_ref":"",
                "validation_state":"FAIL","error_code":type(exc).__name__,"error_detail":str(exc)[:1000],"readback_json":{}}
    result["result_hash"]=result_hash(result)
    return result

def load_json(path: str) -> Any:
    return json.loads(Path(path).read_text(encoding="utf-8"))

def main() -> int:
    p=argparse.ArgumentParser()
    p.add_argument("--command", required=True)
    p.add_argument("--registry", required=True)
    p.add_argument("--phase", default="SHADOW_ENCODE")
    p.add_argument("--output", required=True)
    args=p.parse_args()
    result=run_one(load_json(args.command), load_json(args.registry), args.phase)
    Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2,sort_keys=True),encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,sort_keys=True))
    return 0 if result["status"]=="SUCCEEDED" else 2

if __name__=="__main__":
    raise SystemExit(main())

"""
Google Sheets transport for NJS Execution Router v0.1.

Credential boundary:
- NJS_GOOGLE_SERVICE_ACCOUNT_JSON: service-account JSON string
- NJS_CONTROL_SHEET_ID: exact pilot spreadsheet ID
Only that spreadsheet should be shared with the service-account email.
"""
from __future__ import annotations
import json, os, urllib.parse, urllib.request
from typing import Any, Dict, List, Mapping, Sequence

try:
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
except ImportError:
    Request = None
    service_account = None

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
RESULT_HEADERS = [
    "job_id","status","started_at","finished_at","adapter","worker_id","attempt",
    "result_ref","changed_objects_json","validation_state","error_code","error_detail",
    "readback_json","result_hash","canonical_effect","notes",
]

class SheetsTransportError(RuntimeError):
    pass

def _credentials():
    if service_account is None:
        raise SheetsTransportError("google-auth is not installed")
    raw=os.getenv("NJS_GOOGLE_SERVICE_ACCOUNT_JSON","")
    if not raw:
        raise SheetsTransportError("NJS_GOOGLE_SERVICE_ACCOUNT_JSON is missing")
    try:
        info=json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SheetsTransportError("invalid service account JSON") from exc
    creds=service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    creds.refresh(Request())
    return creds

def _request(method: str, url: str, body: Any=None) -> Any:
    creds=_credentials()
    headers={"Authorization":f"Bearer {creds.token}","Content-Type":"application/json"}
    data=None if body is None else json.dumps(body,ensure_ascii=False).encode("utf-8")
    req=urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload=resp.read().decode("utf-8")
        return json.loads(payload) if payload else {}

def sheet_id() -> str:
    sid=os.getenv("NJS_CONTROL_SHEET_ID","").strip()
    if not sid:
        raise SheetsTransportError("NJS_CONTROL_SHEET_ID is missing")
    return sid

def get_values(a1_range: str) -> List[List[Any]]:
    sid=sheet_id()
    q=urllib.parse.quote(a1_range, safe="")
    url=f"https://sheets.googleapis.com/v4/spreadsheets/{sid}/values/{q}?majorDimension=ROWS"
    return _request("GET",url).get("values",[])

def update_values(a1_range: str, rows: Sequence[Sequence[Any]]) -> None:
    sid=sheet_id()
    q=urllib.parse.quote(a1_range, safe="")
    url=f"https://sheets.googleapis.com/v4/spreadsheets/{sid}/values/{q}?valueInputOption=RAW"
    _request("PUT",url,{"range":a1_range,"majorDimension":"ROWS","values":list(rows)})

def append_values(a1_range: str, rows: Sequence[Sequence[Any]]) -> None:
    sid=sheet_id()
    q=urllib.parse.quote(a1_range, safe="")
    url=(f"https://sheets.googleapis.com/v4/spreadsheets/{sid}/values/{q}:append"
         "?valueInputOption=RAW&insertDataOption=INSERT_ROWS")
    _request("POST",url,{"majorDimension":"ROWS","values":list(rows)})

def _rows_as_dicts(values: List[List[Any]]) -> List[Dict[str,Any]]:
    if not values:
        return []
    headers=[str(x) for x in values[0]]
    out=[]
    for row in values[1:]:
        padded=list(row)+[""]*(len(headers)-len(row))
        out.append(dict(zip(headers,padded)))
    return out

def read_protocol() -> Dict[str,str]:
    rows=_rows_as_dicts(get_values("Protocol!A1:C100"))
    return {str(r.get("key","")):str(r.get("value","")) for r in rows if r.get("key")}

def read_action_registry() -> List[Dict[str,Any]]:
    return _rows_as_dicts(get_values("ActionRegistry!A1:M1000"))

def read_commands() -> List[Dict[str,Any]]:
    return _rows_as_dicts(get_values("Commands!A1:S1000"))

def read_results() -> List[Dict[str,Any]]:
    return _rows_as_dicts(get_values("Results!A1:P1000"))

def claimable_commands() -> List[Dict[str,Any]]:
    done={(r.get("job_id"),r.get("status")) for r in read_results()}
    out=[]
    for row in read_commands():
        if row.get("status") not in {"RECEIVED","VALIDATED"}:
            continue
        if (row.get("job_id"),"SUCCEEDED") in done:
            continue
        out.append(row)
    return out

def update_command_status(row_number: int, status: str) -> None:
    update_values(f"Commands!P{row_number}:P{row_number}", [[status]])

def append_result(result: Mapping[str,Any], note: str="") -> None:
    row=[]
    for h in RESULT_HEADERS:
        v=result.get(h,"")
        if h in {"changed_objects_json","readback_json"} and not isinstance(v,str):
            v=json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(",",":"))
        if h=="notes" and note:
            v=note
        row.append(v)
    append_values("Results!A:P",[row])

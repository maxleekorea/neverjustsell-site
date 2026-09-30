#!/usr/bin/env python3
"""One-shot Drive Sheet worker. No daemon/scheduler is created here."""
from __future__ import annotations
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import router
import sheets_transport as st

def main() -> int:
    protocol=st.read_protocol()
    phase=protocol.get("current_phase","")
    registry=st.read_action_registry()
    commands=st.claimable_commands()
    if not commands:
        print("NO_CLAIMABLE_COMMAND")
        return 0
    command=commands[0]
    all_commands=st.read_commands()
    row_number=next(i+2 for i,r in enumerate(all_commands) if r.get("job_id")==command.get("job_id"))
    st.update_command_status(row_number,"RUNNING")
    result=router.run_one(command,registry,phase,worker_id="NJS-SHEET-WORKER-PILOT")
    st.append_result(result,note="Direct Drive Sheet transport")
    st.update_command_status(row_number,result["status"])
    print(result["status"],result["job_id"],result.get("result_hash",""))
    return 0 if result["status"]=="SUCCEEDED" else 2

if __name__=="__main__":
    raise SystemExit(main())

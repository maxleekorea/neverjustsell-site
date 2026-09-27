# NJS Execution Router v0.1

Pilot-only read-only router for the NJS AI-NATIVE Execution Fabric.

## Scope
- Validates Canonical Command schema, immutable command hash, Shadow NJS-IR, and Action Registry gates.
- Executes only registered `READ` actions.
- Current live adapter reads public GitHub state for P30.
- `WRITE_REVERSIBLE` and `WRITE_IRREVERSIBLE` are fail-closed.
- NJS-IR is never execution authority.

## Transport status
The core router is transport-independent. `fixtures/` is used for CI validation.
The canonical pilot transport remains the private Google Sheet `NJS_EXECUTION_CONTROL_PLANE_v0.1`.
A cloud worker will need a Google service account or equivalent OAuth credential with minimum access to that one spreadsheet before live Sheet polling can be enabled.

## Hash contract
`command_hash = SHA256(canonical JSON)` over immutable input fields only:
`job_id, protocol_version, created_at, project_id, action, target_type, target_ref, refs_json, approval_level, requested_by, idempotency_key, expected_state, precondition_json, payload_json, mode`.

`status, command_hash, shadow_ir, notes` are excluded.

## Safety
No Cloudflare write, Cafe24 write, deployment, arbitrary shell, SQL, arbitrary URL, or production write is enabled in this branch.

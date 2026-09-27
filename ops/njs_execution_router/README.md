# NJS Execution Router v0.1

Pilot-only read-only router for the NJS AI-NATIVE Execution Fabric.

## Scope
- Validates Canonical Command schema, immutable command hash, NJS-IR reference integrity, round-trip critical fields, and Action Registry gates.
- Executes only registered `READ` actions.
- Current live adapter reads public GitHub state for P30.
- `WRITE_REVERSIBLE` and `WRITE_IRREVERSIBLE` are fail-closed.
- NJS-IR is never execution authority.

## NJS-IR shadow contract
Current shadow format is `NJS-IR-0.2-REF` (`N1`). It contains the full 64-character `command_hash` as a canonical address plus redundant routing/sanity fields.

Exact semantics are recovered by full-hash lookup of the Canonical Command. The following critical fields must match 100% after lookup: `project_id, action, target_ref, refs_json, approval_level, idempotency_key, precondition_json`.

A self-contained/offline Packet IR is not implemented yet.

## Transport modes
### Interactive Relay
During an active ChatGPT Plus session:
`Drive Canonical Command → ChatGPT relay → immutable GitHub inbox object → GitHub Actions Router → ChatGPT readback → Drive Result`.

Execution Relay runs only when a **new inbox JSON file is added**. Modifying an existing inbox object does not execute it. Router/source changes run CI only.

### Direct Drive transport
Prepared but not enabled. A cloud worker needs a Google service account or equivalent OAuth credential with minimum access to the single `NJS_EXECUTION_CONTROL_PLANE_v0.1` spreadsheet. This path is for unattended operation later.

## Hash contract
`command_hash = SHA256(canonical JSON)` over immutable input fields only:
`job_id, protocol_version, created_at, project_id, action, target_type, target_ref, refs_json, approval_level, requested_by, idempotency_key, expected_state, precondition_json, payload_json, mode`.

`status, command_hash, shadow_ir, notes` are excluded.

## Safety
No Cloudflare write, Cafe24 write, deployment, arbitrary shell, SQL, arbitrary URL, or production write is enabled in this branch.

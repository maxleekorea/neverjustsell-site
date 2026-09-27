# NJS Execution Router v0.1

Pilot router for the NJS AI-NATIVE Execution Fabric. Current migration phase: `SHADOW_EXECUTION`.

## Scope
- Validates Canonical Command schema, immutable command hash, NJS-IR reference integrity, round-trip critical fields, and Action Registry gates.
- Base Router executes only registered `READ` actions.
- Provider Shadow Runner may accept explicitly registered `WRITE_REVERSIBLE` semantics only to construct an exact HTTP request plan. It has no provider transport/send capability.
- Current live read adapter reads public GitHub state for P30.
- Current shadow adapters are `CLOUDFLARE.CACHE.PURGE_URLS` and `CAFE24.PRODUCT_STATUS.UPDATE`.
- `WRITE_IRREVERSIBLE` and all production mutation remain fail-closed.
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

### Shadow Execution Relay
For provider request-plan validation:
`Drive Canonical Shadow Command → ChatGPT relay → immutable shadow_inbox object → Shadow Runner → request plan artifact → ChatGPT readback → Drive Result`.

A successful Shadow Result must have all of the following:
- `transport_state = NOT_SENT`
- `network_call_performed = false`
- `canonical_effect = NONE`
- no changed objects

Provider credentials and identifiers are represented only as Secret/Env references. No actual token value is stored in Command payloads.

### Direct Drive transport
Prepared but not enabled. A cloud worker needs a Google service account or equivalent OAuth credential with minimum access to the single `NJS_EXECUTION_CONTROL_PLANE_v0.1` spreadsheet. This path is for unattended operation later.

## Hash contract
`command_hash = SHA256(canonical JSON)` over immutable input fields only:
`job_id, protocol_version, created_at, project_id, action, target_type, target_ref, refs_json, approval_level, requested_by, idempotency_key, expected_state, precondition_json, payload_json, mode`.

`status, command_hash, shadow_ir, notes` are excluded.

## Current provider pilots
### Cloudflare
Shadow action: `CLOUDFLARE.CACHE.PURGE_URLS`

The planner only permits HTTPS URLs on `neverjustsell.com` or its subdomains and only generates a scoped `/purge_cache` request using a `files` list. `purge_everything` and arbitrary hosts are rejected.

### Cafe24
Shadow action: `CAFE24.PRODUCT_STATUS.UPDATE`

The planner only accepts `display` / `selling` status flags (`T` or `F`) with a required precondition marker and generates a version-pinned Admin API product update request. Mall ID, product number and access token remain Secret/Env references.

## Safety
No Cloudflare request, Cafe24 request, deployment, arbitrary shell, SQL, arbitrary URL, or production write is enabled in this branch. `SHADOW_EXECUTION` means request-plan generation, not live write authority.

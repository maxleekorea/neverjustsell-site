# NJS Execution Router v0.1

Pilot router for the NJS AI-NATIVE Execution Fabric. Current migration phase: `SHADOW_EXECUTION`.

## Scope
- Validates Canonical Command schema, immutable command hash, NJS-IR reference integrity, round-trip critical fields, Action Registry gates, provider preflight/readback, and rollback semantics.
- Base Router executes only registered `READ` actions.
- Provider Shadow Runner may accept explicitly registered `WRITE_REVERSIBLE` or `WRITE_IRREVERSIBLE` semantics only to construct an exact request/verification plan. It has no provider transport/send capability.
- Current live read adapter reads public GitHub state for P30.
- Current shadow adapters are `CLOUDFLARE.CACHE.PURGE_URLS` and `CAFE24.PRODUCT_STATUS.UPDATE`.
- All production mutation remains fail-closed.
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
`Drive Canonical Shadow Command → ChatGPT relay → immutable shadow_inbox object → Shadow Runner → request/verification plan artifact → ChatGPT readback → Drive Result`.

A successful Shadow Result must have all of the following:
- `transport_state = NOT_SENT`
- `network_call_performed = false`
- `canonical_effect = NONE`
- no changed provider objects

Provider credentials and identifiers are represented only as Secret/Env references. No actual token value is stored in Command payloads.

### Direct Drive transport
Prepared but not enabled. A cloud worker would need a Google service account or equivalent OAuth credential with minimum access to the single `NJS_EXECUTION_CONTROL_PLANE_v0.1` spreadsheet. This path is not a prerequisite for the current interactive pilot.

## Hash contract
`command_hash = SHA256(canonical JSON)` over immutable input fields only:
`job_id, protocol_version, created_at, project_id, action, target_type, target_ref, refs_json, approval_level, requested_by, idempotency_key, expected_state, precondition_json, payload_json, mode`.

`status, command_hash, shadow_ir, notes` are excluded.

## Provider verification contracts
### Cloudflare
Shadow action: `CLOUDFLARE.CACHE.PURGE_URLS`

Classification: `WRITE_IRREVERSIBLE`, future live approval floor `A3`.

The planner:
1. preflights the configured zone and requires the zone ID/name/status to match `neverjustsell.com`;
2. constructs only a scoped `/purge_cache` request using a `files` list;
3. treats HTTP 200 + provider `success=true` as request acceptance, not eviction proof;
4. plans a GET probe for every target URL and requires observed `CF-Cache-Status` to be non-`HIT`;
5. returns `UNVERIFIED` if evidence is inconclusive;
6. explicitly declares rollback unsupported because evicted edge-cache entries cannot be restored to their previous state.

Only HTTPS URLs on `neverjustsell.com` or its subdomains are accepted. `purge_everything` and arbitrary hosts are rejected.

Verification pilot: `JOB-20260927-0006`, GitHub Actions run `36314207781` — `SUCCEEDED/PASS`, request plan only, `NOT_SENT`.

### Cafe24
Shadow action: `CAFE24.PRODUCT_STATUS.UPDATE`

Classification: `WRITE_REVERSIBLE`, approval floor `A2` for the planned reversible operation.

The planner:
1. reads the exact product before mutation and snapshots `product_no` plus every changed field;
2. constructs only `display` / `selling` changes with `T` or `F`;
3. reads the same product again and requires all expected fields to match exactly;
4. treats readback mismatch as `UNVERIFIED`;
5. builds rollback from the before-state snapshot and requires a final rollback readback;
6. requires both `mall.read_product` and `mall.write_product` in the credential contract.

Mall ID, product number and access token remain Secret/Env references.

Verification pilot: `JOB-20260927-0007`, GitHub Actions run `36314377221` — `SUCCEEDED/PASS`, request plan only, `NOT_SENT`.

## Regression status
The current head passes 24 Router/Shadow safety tests, covering immutable hash/IR behavior, fail-closed action gates, Cloudflare irreversible/A3 classification, provider ACK versus eviction proof, Cafe24 before-state/readback/rollback contracts, and mutability mismatch rejection.

## Deployment isolation gate
This code currently lives temporarily inside the P30 production repository. Commits on `ops/njs-execution-router-v0` are also observed by the repository's connected Cloudflare Workers Builds integration and can trigger non-production branch build/preview checks.

That activity is separate from the NJS Shadow Adapter. `network_call_performed=false` refers specifically to provider transport initiated by the NJS Shadow Runner; it does not claim that committing to this Git repository has no external CI/preview side effects.

Credential connection or `DUAL_RUN` promotion is blocked until one of the following is proven:
- ops-branch builds are isolated previews with no production route/binding mutation for every connected Worker; or
- the Execution Fabric is moved to a dedicated ops repository/backend that is not connected to P30 deployment automation.

## Safety
The NJS Router has no Cloudflare/Cafe24 provider credential and no live provider-send capability. `SHADOW_EXECUTION` means request and verification-plan generation, not live write authority. The current repository can still have independent CI/preview side effects from its existing Git/Cloudflare integration, which is why deployment isolation is now a blocking promotion gate.

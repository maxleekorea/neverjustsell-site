# NJS / P30: AI development rules (non-production)

This is a short routing note, not the canonical source of requirements. Before any
work, consult the currently approved Google Drive PROJECT_REGISTRY,
AI_NATIVE_RUNTIME_SPEC, PROJECT_RUNTIME_INSTRUCTION, DECISION_LOG, P30 Charter,
P30_CURRENT_STATE_HANDOFF_latest and the actual GitHub branch/PR state.
If these conflict with this file, verified canonical decisions take precedence.

## Product identity and protected assets
- NJS is Macjagga's personal creator/author channel (D-099), not a multitenant
  platform or P00 operations console.
- Preserve the approved homepage and eight subpages (PR #100), existing copy
  integration (PR #101), visitor intent/return-to rules (PR #102), and the
  integrated candidate (PR #103). Review HEAD and open PRs before changing code.
- Preserve Cafe24 shop login, classroom/community auth and data ownership,
  course entitlement, orders, refunds, and program state. No fabricated examples
  or unverified product availability.
- Work in an isolated P30 branch/worktree. Never force-reset dirty changes.
- Never merge to main, deploy production, modify Cafe24 skins, DNS, secrets,
  Cloudflare routes, or shared P00/P20/P50 runtime without the proper A2/A3 gate.
- Do NOT build another MCP, Runner, database, tunnel, orchestration platform,
  test harness, or screenshot engine. Reuse what already exists.

## Small, end-to-end work unit
1. Read Canonical and git status/PR SHA, then make only the bounded non-prod change.
2. Verify site tests and relevant existing contract tests. Test count must come
   from executable inventory, never from a manually copied PASS total:
   - node site/scripts/p30-qa-summary.mjs --inventory
   - node site/scripts/p30-qa-summary.mjs --run  (only in isolated QA worktree)
   - This runs only unconditional PR-style Node tests; never run the conditional
     live production smoke/crawl/Cafe24 audits from local QA.
   Use existing site/package.json and .github/workflows/production-smoke.yml;
   do not duplicate or replace those tests.
3. For site/UX changes, reuse site/scripts/njs-typography-audit.mjs, approved
   screenshots and existing GitHub Actions visual artifacts. Include 1440,
   390, 360, 320 CSS-pixel review as relevant. Browser font zoom is not the
   same as CSS root-font-size adjustment.
4. Use the already available Antigravity browser, if actually available on
   the running host, to inspect (a) homepage > content > class entry,
   (b) guest question/case intent, (c) guest program entry and safe return.
   Restrict interactive checks to local preview/mock endpoints; record actual
   click/navigation/console outcomes. NEVER execute real login, customer
   writes, checkout or live production actions without a separate safe gate.
5. Return exact git SHA, changed paths, actual executed/failed test counts,
   screenshots/browser evidence paths and PASS/PARTIAL/FAIL/BLOCKED.
   Fixture tests do not prove real Cafe24 OAuth, payments, accessibility,
   customer conversion or deployed-site behavior.
6. Record findings only in the existing P30 Handoff and applicable evidence
   index after actual host or CI readback. A GitHub candidate is not deployed.


## P30 evidence schema and harness routing
- Source of truth for QA fields and approvals:
  https://docs.google.com/document/d/13htGaua3Ls_kF0JoF8_ibOp9MmvombRVam0DuBYPrag/edit
  (section 14, P30_QA_EVIDENCE_v0.1); workflow/eval evidence:
  https://docs.google.com/document/d/15ZkxQqGykC7Rf9LxprOqThfUlngzQQ5d-ZuzPdKCeOM/edit
  (WF-08, 2026-10-20). Current Handoff sections 25.25-25.26
  supersede older broad "ALL PASS" claims when scopes differ.
- Label evidence by actual proof: CODE_CI_CONTRACT, BROWSER_LAYOUT,
  BROWSER_CLICK_FLOW, ROUTER_REDIRECT_CONTRACT, REAL_MEMBER_E2E,
  PRODUCTION_DEPLOYED. A direct URL load or screenshot is not proof
  of clicking a CTA; mocked OAuth routing is not real Cafe24 login.
- Read the actual test workflow before interpreting the output.
  Local QA uses only unconditional Node steps of smoke job plus site
  npm tests. Three conditional post-release production probes are
  NOT local test failures or local test obligations.
- Preserve history: the earlier 27-run/1-failure report stays FAIL
  with a documented scope error, not retroactive PASS. CI inventory
  7+17=24 is manifest evidence, not automatic proof of a later host
  --run or new Antigravity browser E2E.
- Capture PR/commit SHA, execution actor, passed/failed test paths,
  source manifest hash, artifact SHA/readback, approval gate and all
  unverified stages. Route evidence into existing P30 Handoff, not
  a new database or generic P00 Command/Result action.

## Safe local reference
- PR #103: https://github.com/maxleekorea/neverjustsell-site/pull/103
- Local fixture preview: site/v33-release-preview-server.mjs,
  default 127.0.0.1:8790. First check the actual interface/port owner;
  another project may already be bound on a different interface.
- Existing visual QA: .github/workflows/v33-release-visual-qa.yml
- Existing contract checks: .github/workflows/production-smoke.yml

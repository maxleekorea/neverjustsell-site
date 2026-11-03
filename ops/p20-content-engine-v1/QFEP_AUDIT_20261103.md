# QFEP v1.0 / P20 Content Engine V1 — Evidence-based audit and pilot patch (2026-11-03)

Status: AUDIT_CANDIDATE / NOT_PRODUCTION_APPROVED. Basis: QFEP v1.0, P20 content_eval_v2, workflow_learning_v1, requirement_lock_v1, EXP-200-X1X4-01, D-056 and PR #84. No paid API/model call performed. Only this isolated audit branch changed; legacy runtime remains disabled.

## The three distinct questions
1. Is a gate structurally satisfied (files, hashes, state transitions)?
2. Does the actual manuscript obey author's instructions, substantiated claims, causal structure, unique episode insight and natural Korean?
3. Has a trusted author A2 approval occurred?

A structural CI pass is NOT manuscript quality pass or author approval. The pre-patch CI only ran dry_run, schema import, and shallow gate tests.

## Confirmed weaknesses and traceable failure cases
- **CONTENT_INSPECTION_MISSING**: gate_state._require_artifacts verifies only file existence for most stages; a file with 'ok' can pass. P20 000202 had extensive source and multiple drafts but author rejected irrelevant exhibition analogies, unsourced author experience and research-as-decoration (WL-000027~029).
- **LENGTH_PROXY**: draft_level_b/c demanded character-count growth, contradicting QFEP's explicit rejection of length as a quality surrogate. 000198 and 000202 were harmed by repetitive content, defensive caveats and examples that did not change the judgment. Pilot patch removes growth requirement; preserves changed-file requirement.
- **FREEZE_MALLEABILITY**: source_freeze initially checks current source against adjacent .sha256 once. If both were rewritten together later, it had no immutable state digest for continued verification. Pilot patch anchors the digest in 00_run_state.json and validates it on packet_validate. Still requires tamper-proof execution record to defend against malicious state-file rewrite.
- **POST_QA_EDIT**: independent_evaluation and korean_quality checked draft digests at approval time, but later packet_validate did not consistently recheck manuscript immutability. Pilot patch rejects drift after Korean QA. Any legitimate post-QA edit should reopen QA and independent evaluation with fresh digest.
- **SELF_ASSERTED_INDEPENDENCE**: independent_evaluation checks JSON claims writer_context_shared=false, writer_process_visible=false but no verified process trace or evaluator session identity. User complaint of false PASS after CNT-000198 and independent QA NOT_RUN in 000203/206 show why this must remain unverified.
- **A2_MARKER_NOT_AUTHORIZATION**: 'A2_STATUS: APPROVED' inside a text file can be forged. A2 needs a trusted user approval event, explicitly bound to approved manuscript hash. This audit does not change the authorization layer before its provenance contract is verified.
- **SCRIPT_ONLY_NO_CANONICAL_DIFF**: live canonical requirement_lock rows are not loaded or diffed by PR84's pipeline.py. Explicit LR-204-08 excludes 2006 eBay experiment in 000204, but it still appeared in the manuscript. A requirement-regression gate must read exact locked requirements and cite text spans.
- **PREPARATION_NOT_EXECUTION**: pipeline.py's executable modes are dry_run, research_only and packet_validate; full raises ONE_SHOT_FULL_DISABLED. There is no demonstrated live complete QFEP S0–S8 production flow from this scaffold. A dry-run success never proves source retrieval, drafting, blind review or A2.
- **OVER-SERIALIZATION**: QFEP is editorially concise but the V1 scaffold sets 20 ordered gates and many mandatory intermediate files regardless of actual content type. WL-000019/022 already record excessive round-trips and schema-first work delaying writing. Safely combine prewrite research into one packet and only preserve independently meaningful gate boundaries.
- **CROSS_EPISODE_HOMOGENIZATION**: 000202–000206 repeatedly converge on generic customer value/branding lessons. Distinct primary payoffs must be locked before drafting (000202 genuine vs manipulated social proof; 000203 platform survival divergence; 000204 commoditization/copycat incentives; 000205 mindset changes tactical search; 000206 intangible entertainment freshness). Use thematic novelty/overlap review, NOT a ban on the actual author's recurring philosophy.

## Externally observed failure/success mechanisms, with bounded transfer
- Anthropic (2026), Demystifying evals for AI agents: Claude Code's growing use of regression suites and Descript's separate quality and regression suites; model graders calibrated against human product judgment. Transfer: two suites and A2 disagreements as evidence; not an automatic model self-PASS. https://www.anthropic.com/research/demystifying-evals-for-ai-agents
- Google Research (2026), scaling agent systems, controlled 180 configurations: parallel research can improve, sequential reasoning can worsen with agent coordination. Transfer: parallel source collection, centralized synthesis, single manuscript owner, isolated eval. Not direct evidence of spoken-script performance. https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/
- Huang et al. (ICLR 2024), LLM intrinsic self-correction on reasoning sometimes degrades without external feedback. Transfer: no self-certified PASS; specific evidence and human outcome calibration. Not a general proof that all external LLM evaluation fails. https://proceedings.iclr.cc/paper_files/paper/2024/hash/8b4add8b0aa8749d80a34ca5d941c355-Abstract-Conference.html
- Liu et al. (TACL 2024), Lost in the Middle: long-context retrieval varies with relevant position. Transfer: short frozen author thesis plus latest correction locks, supporting sources on demand, and explicit coverage checks instead of dumping all P20 sheets into one writer context. https://aclanthology.org/2024.tacl-1.9/
- Doshi & Hauser (Science Advances 2024), AI-assisted short stories improved individual ratings but reduced collective diversity. Transfer: test cross-video semantic sameness; this study does not establish P20 audience behavior. https://doi.org/10.1126/sciadv.adn5290
- P20 own EXP-200-X1X4-01: voice-first X2 53/60 vs research-first X3 47/60 and retention-first X4 50/60, single-topic internal AI scoring only. Controlled design still insufficient to declare a universal writing method. Do not silently activate suspended HYBRID_V1.

## Proposed test portfolio (not yet implemented as end-to-end)
Structural negative fixtures: no file; empty 'ok' file; same content; shorter but improved draft; frozen source mutation incl sidecar; post-QA manuscript mutation; altered reviewer trace; forged A2; changed user exclusions.
Quality/capability fixtures: CNT-000198 false author experience and inaccurate catalog causality, 000200 approved gold, CNT-000202 irrelevant case and diluted author insight, CNT-000203 defensive financial fact-dump, CNT-000204 forbidden 2006 eBay example, CNT-000205 generic motivational copy instead of point-of-view reversal, CNT-000206 hypothesized humor preparation incorrectly asserted as observed fact.
Labels from actual author correction are ground truth. Human-like oral delivery and novel perspective require blind author comparison, not regex counts or a model's uncalibrated numerical score.

## Pilot change log (this audit branch only)
- Remove length-growth requirement for draft B/C and fixed 5–8-scene instruction; retain version changes and minimum semantic evidence as unresolved requirement.
- Pin frozen source digest to persistent state, reject modified source in packet_validate even if sidecar was regenerated.
- Reject post-QA manuscript changes on packet_validate.
- Replace execution manifest 'PASS' on dry_run/packet_validate with explicitly structural results; no misleading quality claim.
- Add regression tests for shorter corrected drafts, drifted frozen source and revised draft after QA.
- Enable existing CI workflow for this isolated branch. The workflow still verifies infrastructure only.

## Unresolved before any merge
1. Verified separate evaluator call trace and provenance.
2. Exact canonical requirement/user correction coverage vs final manuscript.
3. A2 trusted approval event linked to a reviewed manuscript SHA.
4. Evidence-backed editorial criteria with 20–50 red/gold preference examples and holdout episodes; quality not a code-only PASS.
5. Actual non-API execution adapter suitable for user's paid ChatGPT subscription and existing local infrastructure; the existing REST adapter is optional and not assumed usable.
6. CI and human A2 pilot outcomes.

Decision: **PILOT_ONLY; no production merge, no QFEP Canonical rule promotion, no 'quality proven' claim.**

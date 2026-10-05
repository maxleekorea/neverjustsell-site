# P20 Content Engine V1

Status: PILOT / isolated branch only

Goal: enforce the existing P20 production manual as an executable workflow instead of relying on an LLM to remember prose instructions.

- Legacy writer runtimes V3/V4/V5/D-055 remain `RUNTIME_DISABLED`.
- `HYBRID_V1` is `SUSPENDED_REFERENCE`; X2+X4 was an unexecuted hypothesis, not an approved method.
- One-shot `research -> full draft -> self evaluation` is disabled.
- One machine state file unlocks only the first incomplete gate.
- Draft Levels A-D mutate the same `14_script.md`.
- Author interview/source-complete evidence, KS01-KS09, and independent evaluation are hard gates.
- A2 is never auto-generated.

Packet order:
`production_type -> state_overlap -> audience_reality -> case_reaction -> evidence_author -> external_benchmark -> problem_synthesis -> author_gap_interview -> research_delta -> central_question_thesis -> source_freeze -> narrative_strategy -> segment_blueprint -> draft_level_a -> draft_level_b -> draft_level_c -> draft_level_d -> korean_quality -> independent_evaluation -> a2_approval`.

Pipeline modes:
- `dry_run`: initialize and validate a locked packet.
- `research_only`: research candidate only; does not unlock drafting.
- `packet_validate`: validate an existing packet.
- `full`: fail closed with `ONE_SHOT_FULL_DISABLED`.

Promotion to main/Production remains prohibited until pilot success and required user approval.

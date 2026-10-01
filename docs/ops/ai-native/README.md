# AI Native Runtime v1

This directory contains machine-readable policy and validation artifacts for the integrated operating system.

It is intentionally separated from product runtime code. Nothing under this directory changes production behavior by itself.

## Canonical human-readable sources

- Google Drive `AI_NATIVE_RUNTIME_SPEC`
- Google Drive `PROJECT_RUNTIME_INSTRUCTION`
- Google Drive `PROJECT_REGISTRY`
- Google Drive `DECISION_LOG` D-037

## Files

- `runtime-policy.json`: deterministic-first execution, retention, AI boundary, project isolation and human-gate policy.
- `ai-decision.schema.json`: schema for AI decisions that may influence canonical state.

## Operating rule

Deterministic processing comes first. AI is used only for bounded semantic or generative steps. Raw evidence is immutable, canonical writes require validation and readback, and reproducible intermediate outputs are not persisted by default.

## Repository placement

This repository is currently the only connected GitHub repository. These files are stored here for version control only and should move unchanged to a dedicated operations repository if one is created later.

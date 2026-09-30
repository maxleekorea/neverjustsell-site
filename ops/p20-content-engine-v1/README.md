# P20 Content Engine V1

Status: PILOT / isolated branch only

Goal: reproduce the validated Work execution pattern without relying on Work quota.

Flow:
1. collect/retrieve sources
2. build one Master Source Pack
3. freeze + SHA-256
4. run an isolated production worker
5. run a separate blind evaluator
6. persist reproducible run artifacts

Runtime boundary:
- Source/evidence assets remain reusable.
- Legacy writer runtimes V3/V4/V5/D-055 are RUNTIME_DISABLED for production.
- Legacy methods may be inspected only for method research/postmortem.

Modes:
- dry_run: no external API calls
- research_only: source research + frozen pack
- full: research -> frozen pack -> isolated production -> isolated evaluation

Required live secret:
- OPENAI_API_KEY
Optional:
- NAVER_CLIENT_ID
- NAVER_CLIENT_SECRET

Google Drive machine transport is intentionally separate until a GitHub-usable Google credential is verified.

Promotion gate:
- dry-run pass
- API quota/billing confirmed
- research_only pass
- full candidate pass
- user A2 review
- dedicated ops repository or explicitly approved repository boundary

# P30 Program Participant V1

Status: implementation slice for the retention-first product model.

## User journey

1. Member enters My Space.
2. Program card opens `/programs`, not a generic community index.
3. Participant sees the single most relevant next action first.
4. Participant records a check-in/reflection for the mission.
5. Self-verified missions count immediately; host-review missions wait for approval.
6. Host reviews from `/program-host/review` and can approve, request revision, or reject.
7. Accepted required mission weights update enrollment completion.
8. The run's existing `completion_policy_snapshot.threshold` determines completion.
9. Completed enrollment is projected to the existing community access model, where completed members receive alumni-space access on the next access sync.

## Guardrails

- No streaks, points, badges, or leaderboard mechanics.
- No duplicate program data model; reuse existing program/run/mission/submission/completion tables.
- No duplicate community membership model; reuse existing projection.
- A submitted host-review mission does not count as completed until accepted.
- My Space remains the continuity hub; Community remains the conversation layer.
- Paid enrollment continues to derive from Cafe24 purchase reconciliation.

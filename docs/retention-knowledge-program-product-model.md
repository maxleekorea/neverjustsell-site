# P30 Retention / Knowledge / Program Product Model

Status: approved product direction (D-036)

## Product outcome

NJS does not optimize for universal daily visits. It optimizes for repeated value at the natural frequency of each use case and for accumulated value that makes returning useful.

Core loop:

1. discover useful knowledge
2. save / learn / join a program
3. make progress or contribute experience
4. receive contextual response, event, or next action
5. curate strong contributions back into durable knowledge
6. improve future discovery and repeat the loop

Q&A is one discussion type, not the center of the product.

## Primary product metric

Weekly Value-Active Members (WVAM): distinct authenticated members who perform at least one qualifying value action within 7 days.

Initial qualifying events:
- knowledge_save
- knowledge_revisit (only after a meaningful revisit rule is defined)
- course_enroll
- lesson_progress (only after minimum progress threshold is defined)
- lesson_complete
- program_checkin
- program_reflection
- program_milestone_complete
- community_contribution
- knowledge_promotion

Do not count raw page views, login events, notification opens, likes, or other low-signal clicks as value activity by default.

Secondary metrics:
- 30-day value-active members
- cohort retention after sufficient history exists
- course resume / completion
- program check-in / completion
- knowledge save / revisit
- meaningful contribution and response coverage
- contribution -> published knowledge conversion
- recurring event participation -> subsequent return

## Development priority

### Now
1. Value-event instrumentation and retention measurement foundation.
2. Knowledge Operating System: structured D1 source, operator board/CMS workflow, owner, draft/review/published/archive, version and review due dates.
3. Program V1: program run/cohort, milestone, check-in/reflection, event, completion/alumni; reuse current program spaces and roles.
4. Unified taxonomy/search/deep links across Knowledge, Community, Course, Program.
5. Minimal notifications: replies to own contribution, program schedule/deadline, optional weekly digest.
6. Contextual next action instead of a large feature dashboard.

### After system/mobile QA
- Founding/beta group of 10-20 real users.
- Operate one recurring ritual/event consistently.
- Observe 30/60-day retention and identify the contributor/facilitator hard side.

### Later if data supports it
- personalized recommendations
- topic/person follow
- semantic search
- AI recap/curation
- mentor/curator roles
- more sophisticated recurring challenges

### Defer
- streaks
- leaderboards
- points/badge-led gamification
- broad real-time chat/DM
- mass push notifications
- complex onboarding automation
- full Directus/Discourse migration
- mass seeding

## Guardrails

- Do not optimize a weekly/monthly use case into artificial DAU.
- Do not treat reading-only members as failed participants.
- Do not ship feature count as success; measure customer/business outcome.
- Do not duplicate existing space/role/moderation/notification/Q&A foundations.
- Do not infer 30-day retention before enough event history exists.
- Prefer accumulated user value (saved knowledge, progress, program history, relationships, contribution archive) over dark-pattern lock-in.

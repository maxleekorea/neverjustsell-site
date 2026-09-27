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

## User journey ladder

NJS should become more useful as the member moves up the commitment curve. Do not force high-commitment actions before the member has received value.

1. Anonymous value: search/discovery -> read useful public knowledge/community/course preview without forced signup.
2. First commitment: save knowledge, enroll in a free course, or join a program. Authentication exists to preserve continuity, not to block discovery.
3. Personal continuity: My Space shows the member's saved knowledge, learning history, program participation, and later contextual responses/next actions.
4. Progress accumulation: course progress, completion, program milestones, reflections, and attendance build durable personal history.
5. Social accountability: questions, cases, discussion, host/peer responses, events, and cohort spaces create relationship-based reasons to return.
6. Contribution identity: strong member experience can become a reusable case, answer, or knowledge candidate with explicit moderation/consent.
7. Long-term role: only after real behavior supports it, recurring contributors may become curator/mentor/moderator-level participants.

The desired switching cost is accumulated utility: saved knowledge, progress, program history, relationships, and contribution archive. Do not create artificial friction that makes leaving difficult.

## Journey activation criteria

Do not treat account creation itself as activation. Initial activation is the first preserved value action, such as:

- first knowledge save
- first meaningful lesson progress or lesson completion
- first program participation/check-in
- first meaningful community contribution that receives contextual follow-up

The first-session UX should minimize time-to-value. Registration, onboarding questions, notifications, or profile setup must not interrupt public value discovery unless they are required to preserve a user-requested action.

The first contribution experience has an operating requirement as well as a technical one: founding/beta users who make a meaningful first contribution should receive a useful human response quickly enough that they learn the community is responsive. Do not replace this with generic automated replies.

## Continuity rule

My Space is the continuity layer, not another feature directory. Its job is to answer three questions with as little UI as possible:

- What have I accumulated here?
- Where did I stop?
- What is the next useful action, if any?

Generic feature cards must not dominate My Space once member-specific state exists. Prefer actual saved/progress/program state over links that merely advertise Knowledge, Courses, or Community.

## Primary product metric

Weekly Value-Active Members (WVAM): distinct authenticated members who perform at least one qualifying value action within 7 days.

Initial qualifying events:
- knowledge_save
- knowledge_revisit (only after a meaningful revisit rule is defined)
- course_enroll
- lesson_progress (minimum meaningful progress threshold required)
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
2. My Space continuity layer: accumulated member state and contextual next action, not a feature directory.
3. Knowledge Operating System: structured D1 source, operator board/CMS workflow, owner, draft/review/published/archive, version and review due dates.
4. Program V1: program run/cohort, milestone, check-in/reflection, event, completion/alumni; reuse current program spaces and roles.
5. Unified taxonomy/search/deep links across Knowledge, Community, Course, Program.
6. Minimal notifications: replies to own contribution, program schedule/deadline, optional weekly digest.

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
- Do not force signup before the user has received public value.
- Do not ship feature count as success; measure customer/business outcome.
- Do not duplicate existing space/role/moderation/notification/Q&A foundations.
- Do not infer 30-day retention before enough event history exists.
- Prefer accumulated user value (saved knowledge, progress, program history, relationships, contribution archive) over dark-pattern lock-in.
- Every major feature must connect to the journey ladder and either shorten time-to-value, improve continuity, deepen progress, or increase useful contribution. Otherwise defer it.

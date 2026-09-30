# NJS UI Component System v1

Status: DESIGN SPEC / non-production
Base: 12e7dfe291d9096d154512bcef840eb15cc703ba
Purpose: Mobile-first NJS product UI system for Home, Knowledge, My Space, Community, Course, Program, and contextual monetization.

## 1. Product-wide principles

1. Value before monetization.
   - Paid offers appear after a meaningful value moment or when a user reaches a relevant limit/need.
   - Never interrupt reading, answering, saving, or completing an active task with an unrelated paywall.
   - Price, renewal, scope, and cancellation terms must be explicit.

2. One primary action per view.
   - Secondary actions remain visually quieter.
   - Avoid multiple same-weight CTAs.

3. Progressive disclosure.
   - Default screen shows the next useful action and essential context.
   - Full business map, full collections, advanced filters, reward detail, and expert controls are secondary views.

4. Mobile member experience behaves like an app.
   - Persistent top-level navigation.
   - Large touch targets.
   - Lists and single-column flows preferred to dense desktop grids.

5. Public and member surfaces share brand tokens but not identical layout behavior.
   - Public: discovery, trust, explanation.
   - Member: continuation, action, state, feedback.

6. Cards are semantic units, not decoration.
   - A card represents one item: knowledge, action, program, question, or result.
   - Avoid wrapping every section in a card.

7. Color carries emphasis, never meaning alone.
   - State uses text/icon/shape plus color.

8. Private by default for business data.
   - Sharing is explicit and reversible.

## 2. Monetization nudge policy

Monetization is contextual, not banner-driven.

Allowed trigger examples:
- User finishes a free lesson and asks for a structured continuation.
- User repeatedly uses a premium analysis capability.
- User reaches a point where a Program provides human feedback that the current free flow cannot.
- User opens a paid course/program detail intentionally.
- User has enough NJS Point to unlock a reward.

Avoid:
- paywall before first value,
- repeated modal interruption,
- forced urgency,
- false scarcity,
- hiding cancellation,
- visually suppressing free/decline choices.

Future native app note:
- Digital content and feature unlocks must be designed with applicable App Store purchase rules in mind.

## 3. Layout system

Desktop:
- 12-column grid.
- Max content width: 1200-1240px.
- 24px or 32px gutters depending on breakpoint.
- Hierarchical grid: primary content may span 7-8 columns, supporting content 4-5.

Tablet:
- 8 columns.

Mobile:
- 4 columns.
- 16px side margin baseline.
- 16px primary spacing; 8px micro spacing.
- 44px minimum intended touch target for primary controls.

Do not preserve desktop grid card density on mobile.

## 4. Header

Public desktop:
- Brand left.
- Primary nav: 지식 / 배우기 / 프로그램 / 커뮤니티 / 맥작가.
- Search visible as icon/control.
- Utility right: 로그인 or 내 공간.

Member desktop:
- Brand + global context.
- My Space entry always visible.
- Current section visibly selected.

Mobile public:
- Compact brand + Search + Menu.
- Main discovery paths also exposed in-page; do not rely only on hamburger.

Mobile member:
- Top bar contains page title/context and local actions.
- Top-level navigation moves to bottom navigation.

## 5. Mobile bottom navigation

Default candidate:
- 오늘
- 지식
- 실행
- 커뮤니티
- 나

Rules:
- Navigation only, never a central action button disguised as a tab.
- Five or fewer items.
- Icon + one-word Korean label.
- Persistent across member top-level sections.
- Preserve navigation state per tab where feasible.
- Active state must be unmistakable.

'실행' maps to current business/action work, not a compose button.

## 6. Hero

Purpose: explain transformation, not list assets.

Required:
- one clear headline,
- one explanatory statement,
- one primary CTA,
- one quiet secondary route.

Avoid:
- profile image taking 50% of first viewport,
- BOOK / COURSE equal-weight CTAs,
- multiple eyebrow taxonomies,
- abstract SaaS language.

Hero visual, if present, should show product value: knowledge/action/business output, not generic decoration.

## 7. Problem selector

Purpose: route by current job-to-be-done.

Initial choices: 4-6 maximum.
Examples:
- 브랜드가 애매하다
- 콘텐츠가 어렵다
- 고객에게 발견되지 않는다
- 판매·전환이 막힌다
- 고객관계를 쌓고 싶다
- 플랫폼 의존이 불안하다

Interaction:
- single tap enters a curated problem page or filtered discovery view.
- no long questionnaire.
- allow “전체 보기”.
- after selection, retain context in session/member state only with clear user control.

## 8. Knowledge card

Card represents one knowledge object.

Required fields:
- type/category as secondary metadata,
- title,
- one-sentence relevance summary,
- freshness/update cue when meaningful,
- saved/acquired state when authenticated.

Primary interaction:
- tapping card opens detail.

Avoid:
- several CTA buttons inside every card,
- excessive tags,
- large decorative imagery unless it carries information.

Mobile:
- list-first or one-column card.
Desktop:
- 2-3 column grid where scanning benefits.

## 9. Knowledge Sticker

Sticker is a compact representation of acquired knowledge, not a replacement for the Knowledge Card.

States (public vocabulary may be simplified):
- acquired
- used
- helped
- applied
- curated contribution

Rules:
- sticker is never consumed by use.
- state change requires meaningful evidence.
- attaching sticker itself gives no economic reward.
- color is not the sole state indicator.
- sticker tap opens knowledge summary/detail.
- limited/seasonal appearance may be cosmetic/history only; no functional advantage.

Sticker attachment in replies:
- optional.
- recent stickers first; search available.
- maximum visible stickers per reply should be constrained for readability.
- irrelevant attachment has no reward consequence.

## 10. Action card

Purpose: turn knowledge into a real business task.

Required:
- action title,
- why now / expected outcome,
- estimated effort only when credible,
- one primary start/resume action,
- current status.

Completion output:
- must save a business result, reflection, artifact, or explicit decision where relevant.
- “watched/read” is not equivalent to action completed.

Avoid:
- task lists with ten equal priorities,
- fake precision in time estimates,
- streak pressure.

## 11. Community question/reply

Question detail:
- clear question title,
- context,
- what was already tried when supplied,
- reply count,
- follow/watch controls as secondary.

Reply:
- author identity/context,
- response body is primary,
- attached stickers are supporting evidence,
- “도움됐어요” visible,
- asker-only stronger acknowledgement can exist,
- report/menu is secondary.

Do not equate asker acceptance with universal correctness.

Mobile composer:
- reply field,
- “지식 붙이기” as optional attachment,
- attachment picker as sheet/drawer rather than navigating away.

## 12. Program card

Public program card:
- title,
- outcome,
- format,
- schedule window,
- who it is for,
- price/status when on sales surface.

Member program card:
- progress only when there is a valid completion model,
- current next action,
- next event/date,
- status.

Reading Program:
- book is separately purchased/owned.
- program product contains author notes, added text, discussion, events, reading checkpoints.
- stickers can originate from NJS program content, not from book purchase itself.

## 13. My Space / Today

This is the member home, not a feature directory.

Priority order:
1. one next useful action,
2. meaningful changes since last visit,
3. current business focus,
4. saved/used knowledge,
5. learning/program continuation,
6. reward status only when relevant.

Avoid dashboard metric walls.

Reward block should remain quiet unless:
- a reward has unlocked,
- point balance is close to a meaningful reward,
- user explicitly opens rewards.

## 14. Search

Knowledge discovery requires a primary search entry.

Search behavior:
- one global entry point for knowledge/content discovery.
- recent and suggested terms may appear.
- show scope clearly.
- allow lightweight filtering by content type/problem.
- no-results state explains what happened and offers alternatives.

Mobile:
- Search can be a dedicated top-level entry or immediately reachable toolbar control; validate with actual IA.

## 15. Nudge components

Three allowed visual forms:
1. Inline continuation card: “이 지식을 실제로 적용해 보려면…”
2. Contextual locked capability: show value and reason it is paid without blocking unrelated work.
3. Reward unlock: explicit earned benefit.

Never use:
- exit-intent overlays,
- countdown without real deadline,
- preselected subscription,
- confusing button hierarchy,
- repeated full-screen upsell.

## 16. Visual system

Base:
- neutral platform shell: near-black + white/off-white.
- one NJS accent color chosen after contrast and brand testing.
- semantic status colors separate from brand accent.
- Sticker collections may use richer palettes.

Typography:
- reduce heading scale count.
- use strong hierarchy through size, weight, spacing, not repeated giant headings.
- Korean body text optimized for scan and long reading.

Surface:
- avoid card-on-card.
- borders used for grouping only.
- shadows sparse.
- radius system limited to 2-3 values.

Motion:
- only for state change, save, sticker evolution, navigation continuity.
- respect reduced-motion preference.

## 17. Component harmony rules

- Same object = same visual grammar everywhere.
- Knowledge Card does not become a different design in Home vs My Space.
- Sticker keeps its core shape and semantics across Knowledge, Course, Ebook, Program, and Community.
- CTA hierarchy uses one shared Primary / Secondary / Text-action system.
- Status chips, badges, and metadata share one density/typography system.
- Public pages can be more editorial; member surfaces use denser app-like layouts.
- Mobile and desktop share semantics, not identical compositions.

## 18. Implementation order

1. Design tokens + responsive grid + button hierarchy.
2. Public header and member bottom navigation.
3. Home VNext.
4. Knowledge Card + Knowledge Detail.
5. My Space Today + Action Card.
6. Community reply + Sticker attachment.
7. Program card/detail.
8. Reward/nudge components.
9. Cross-domain shared visual shell.
10. Real-device mobile QA and accessibility pass.

## 19. Research basis

- Nielsen Norman Group: Progressive Disclosure; Cards; Using Grids; Aesthetic and Minimalist Design.
- Apple Human Interface Guidelines: Tab Bars, Buttons, Searching, Onboarding, Progress Indicators.
- Baymard Institute: Homepage & Category Navigation 2025; Mobile Ecommerce UX; Mobile App UX.
- Apple subscription guidance: contextual subscription prompts after sampling/value.
- FTC dark-pattern guidance: avoid false hierarchy, pressured upselling, hidden subscriptions, intermediate-currency confusion.
- Pinterest boards: save -> organize -> discover related ideas.

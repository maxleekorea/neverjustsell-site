# Home v4.1 Expert Review

Status: INTERNAL / USER REVIEW NOT YET REQUESTED
Date: 2026-09-27

## Verdict
v4.1 is a meaningful improvement over the structure-only prototype, but it is not yet the user-review candidate. The remaining issues should be fixed by expert review first rather than pushed to the user.

## S3 candidates

### M1 — Mobile time-to-value is still too long
Current order on mobile is Hero copy → large author image → bridge statement → problem entrances → actual Knowledge.

Risk: the visitor may scroll several viewports before seeing a useful piece of content. This conflicts with the Public Home job: first value before deeper explanation.

Fix for v4.2:
- keep Hero CTA in first viewport.
- shrink author visual on mobile rather than letting it dominate the second viewport.
- remove the separate explanatory bridge; absorb its useful idea into Hero/problem copy.
- let the problem entrances or actual Knowledge appear immediately after Hero.

### A1 — Guest/Member utility state is wrong in default prototype
The prototype shows `내 공간` by default even though Public Home should be reviewed first as a new visitor.

Fix:
- Guest default = `로그인`.
- Member variant = `내 공간`.
- test returning-user tasks only in Member state.

### F1 — Proof copy defensively reactivates commerce framing
`온라인 판매만 오래 들여다본 사람이 아니라...` makes online selling the mental anchor even while denying that frame.

Fix:
Start positively with breadth of experience: product/brand/manufacturing/distribution/online sales/business operation. Explain commerce as one field where principles were tested, not the category being escaped from.

## S2 issues

### C1 — Some copy still talks about the site rather than the user
Examples such as `설명보다 먼저, 실제로 읽을 만한 생각을 보여줍니다` describe the designer’s intent.

Fix:
Use the actual question/problem as the content heading. Let the screen demonstrate that value instead of explaining that it is demonstrating value.

### P1 — Third problem entrance is abstract
`마케팅을 광고와 노출 기술보다 크게 보고 싶다` sounds like an intellectual preference, not a felt business problem.

Fix candidate:
`광고·검색·콘텐츠가 따로 놀고 있다` → marketing structure / customer / channel / brand.

### N1 — `배우기` is still unapproved for Global Nav
v4.1 used `배우기` for visual simplicity, but earlier expert IA favored concrete destination nouns and flagged the boundary with Program.

Fix:
Use `책·강의` as default review condition. Keep `배우기` only as a test variant until user evidence exists.

### V1 — Repeated author image weakens editorial rhythm
Using the same profile image in Hero and Proof looks like a template reuse and does not add new evidence.

Fix:
Use the profile only once. Proof can be text/evidence-led until a different real work/business image is available. Lecture image stays in B2B where it proves the claim.

## S1 / production-stage issues
- mobile menu needs Escape/focus handling.
- 44px minimum touch target should be enforced for menu utility.
- current-location/aria-current semantics are required in production.
- search is a prototype destination, not yet functional input.
- exact career titles/numbers remain Fact Verification items.

## What already works
- Home is no longer a sequence of equal module cards.
- real book/lecture/profile assets are used as evidence, not decoration.
- representative Knowledge appears before paid learning.
- POV is downstream of actual problems/content instead of opening with philosophy.
- book and course are framed as deeper learning methods.
- Program and Community are differentiated by behavior.
- B2B is discoverable but late.
- independent hash destinations and browser Back are enough for first-click/prototype testing.

## v4.2 gate
Do not request user review until M1, A1, F1, C1, P1, N1 and V1 are corrected. Then review Desktop and Mobile again against:
1. five-second comprehension,
2. time to first useful content,
3. copy continuity,
4. visual purpose,
5. next-action clarity.

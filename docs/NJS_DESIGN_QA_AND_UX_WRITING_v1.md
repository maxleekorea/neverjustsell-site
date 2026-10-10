# NJS Design QA & UX Writing v1

Status: P30 review standard
Baseline: Home V3.3 Korean Editorial
Purpose: Keep NJS visual/copy decisions consistent without forcing the user to act as a professional UI reviewer.

## 1. Four review dimensions
1. Message: first-time visitors can identify what NJS is, why it matters, and the next action.
2. Information hierarchy: scale, spacing, contrast, grouping, and content priority are coherent.
3. Usability/accessibility: Desktop/Mobile readability, responsive behavior, navigation, contrast, overflow, and action visibility pass.
4. Brand character: the page feels like NJS rather than generic SaaS, marketplace, course platform, or static magazine.

## 2. Current NJS visual baseline
- Warm Paper / Deep Ink / restrained Terracotta.
- Serif-led editorial display + Sans body/operational text.
- Hairline separation over card walls, pills, shadows, and feature grids.
- Publication/knowledge-institution credibility while retaining visible current activity, learning, and community.
- Real author and operating assets outrank fabricated decorative content.

## 3. Korean UX writing
- Write for Korean small-business owners, sellers, and brand operators.
- Do not explain internal product architecture in public copy.
- Prefer the user's problem, benefit, judgment, and next action.
- Avoid translated-SaaS and planning-document language.

### Expert authority
Assertive language is an NJS brand asset when it is:
- an approved NJS/author principle,
- grounded in verified professional experience,
- a supported factual conclusion,
- or an intentional expert judgment.

Do not weaken a valid expert thesis into vague hedging merely to sound neutral.
Strong tone does not permit invented facts, universal laws without basis, fake results, or nonexistent product states.

## 4. Home Hero message pattern
Use this order:
1. recognizable market/customer change,
2. authoritative NJS thesis,
3. concrete scope,
4. clear next action.

Current candidate:
- Context: 고객의 구매 여정은 갈수록 다양해지고 있습니다.
- Thesis: 정해진 공식을 따라가기보다, 내 사업의 기준을 세워야 합니다.
- Scope: 상품·유통·검색·브랜드·AI를 사업 전체의 흐름 안에서 본다.
- Actions: 지금 읽을 것 보기 / 배우기 시작하기.
- Existing brand thesis “팔기 전에, 왜 사는지를 봅니다.” remains as a secondary brand statement.

## 5. Multi-AI review
- ChatGPT: product journey, real operating state, GitHub/Cloudflare/Cafe24/Classroom/Knowledge contracts, regression/release.
- Gemini: independent visual/editorial critique and Korean naturalness.
- Figma Agent/Skills when available: token, spacing, typography, component, frame-level consistency.
- Do not let multiple AIs mutate the same production code in parallel.
- Two reviewers identifying the same issue raises priority but does not override verified product truth.

For external suggestions classify:
- 수용
- 부분 수용
- 폐기

## 6. Automated review gate
Before release:
- Desktop 1440 full-page render
- Mobile 390 full-page render
- responsive overflow/clipping check
- text scale and image ratio review
- first viewport content/action review
- cross-domain/regression tests
- route/member/commerce/Knowledge continuity
- no fabricated states
- public Korean copy pass

## 7. User review boundary
Do not ask the user to diagnose professional UI defects that can be detected by rules, tools, or independent AI review.
After objective and expert QA, ask only for final brand preference or business judgment when genuinely necessary.

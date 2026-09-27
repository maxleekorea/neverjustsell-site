# Home v4 — current Home component migration map

Status: UX Gate 3 working decision. Production code must not be changed from this document until Hero/Nav A2 approval.

Applies: D-048 / SD-005 / TH-0022

## Why a structural rewrite is required

The current public Home begins with `ONLINE COMMERCE · BUSINESS · BRAND`, `온라인 판매를 사업의 관점에서 설명합니다`, and `온라인 커머스 작가 · 사업가 맥작가`. It then moves immediately through credentials and the SmartStore book before broader point-of-view and learning sections.

This order makes online commerce the category and branding/business the supporting topics. D-048 requires the inverse: branding-centered marketing/business is the category; online commerce is field evidence and a still-valid subtopic.

## Component decisions

| Current component | Decision | Home v4 destination | Reason |
|---|---|---|---|
| Header nav: 맥작가 / 책 / 강의 / 콘텐츠 / 스토어 / 강연 / 커뮤니티 | REPLACE | N1: 지식 / 책·강의 / 프로그램 / 커뮤니티 / 맥작가 + utility 내 공간 | Current nav is an asset/category inventory and overweights commerce/transactions. |
| Hero eyebrow `ONLINE COMMERCE · BUSINESS · BRAND` | REMOVE | `BRANDING · MARKETING · BUSINESS` range signal | Commerce must not remain the top category. |
| Hero `그냥 팔지 말라` | HOLD AS BRAND DEVICE | Brand mark/name, not the entire value proposition | Strong brand equity, but alone it does not explain the broadened category. |
| Hero lead `온라인 판매를 사업의 관점에서 설명합니다` | REPLACE | Hero H1/H2 test copy + broad subcopy | Directly conflicts with D-048 positioning. |
| Hero identity `온라인 커머스 작가 · 사업가 맥작가` | REPLACE | Proof layer: branding-centered marketing expert / operator / author, with verified career evidence | Expert identity should not be constrained to commerce. |
| Hero CTA `책 보기 / 온라인 강의` | REPLACE | Primary `지금 필요한 지식 찾기`; secondary author/about link | First value before selling. |
| Hero profile image | DEFER | Potential proof/about visual, not required in low-fi | Avoid making the first screen an author bio before value is understood. |
| Credentials strip | MOVE + REWRITE | TRUST / PROOF after Free Value + POV | Career works as evidence, not as the second thing users see. |
| Standalone SmartStore book section | MOVE + SHRINK | DEEPER LEARNING: Book + Course | One existing book should not define the whole site category. |
| `01 / POINT OF VIEW` | KEEP + BROADEN | POINT OF VIEW | Good product logic; copy must expand beyond online selling. |
| `02 / CLASS` course module grid | KEEP AS DESTINATION, REDUCE ON HOME | DEEPER LEARNING | Home should explain why/how to learn, not duplicate a course catalog. |
| `03 / CONTENT` | MERGE INTO KNOWLEDGE | FREE VALUE / Knowledge | `콘텐츠` is an internal format label; user should enter through problems/topics. |
| Existing YouTube/Writing cards | SELECTIVE KEEP | Representative Knowledge/media examples lower in the hierarchy | Keep only items that demonstrate breadth; avoid a commerce-only sample set. |
| Lecture section | MOVE LOWER | PROFESSIONAL / B2B | Important revenue path, but not the default first-visit journey. |
| Community section | KEEP + REFRAME | RELATIONSHIP | Explain purpose/experience/case relationships, not generic Q&A or feed. |
| Store as top-level navigation | REMOVE FROM PRIMARY NAV | Secondary/More + contextual commerce | Prevent Home from reading like a shop. |
| Login / My Space | KEEP AS UTILITY | Guest=로그인, member=내 공간 | My Space remains returning-user continuity hub. |
| Footer `온라인 판매를 사업의 관점에서 설명합니다` | REPLACE LATER | Branding/marketing/business scope statement | Same legacy framing as Hero. |
| Support / privacy / sitemap | KEEP | RECOVERY footer | Low-frequency but necessary. |

## New sections that current Home does not adequately contain

1. Immediate relevance / Start Path: `문제의 답 찾기`, `체계적으로 배우기`, `실제로 적용하기`.
2. Free Value / Knowledge search and representative topic samples.
3. Application / Program as a distinct job from course consumption.
4. Explicit customer-relationship / business-asset point of view.
5. B2B CTA for speaking, corporate education, collaboration without putting it in primary nav.
6. Recovery contract that makes support/order/cancel/refund findable without polluting primary navigation.

## Route-level copy debt to update only after A2

The current `pageData()` metadata still describes `/`, `/about`, `/class`, `/content`, and `/lecture` primarily through online commerce/online sales language. These are known D-048 copy debts. Do not patch them one by one before Home/Global IA is approved; update metadata, on-page copy, schema/OG, and navigation together so search snippets and UI do not contradict each other.

## Gate

This document authorizes no production code change. Use it as the migration checklist after actual 5-second/first-click testing validates Hero and Global Nav.

# NJS Home v4.2 — 2026 UX/UI Reference Stack & Expert Review

Status: INTERNAL / non-production
Date: 2026-09-28
Applies: D-048 / SD-005

## 1. Why this exists

Home v4.1 fixed the biggest structural problem of the old site: it stopped behaving like a catalogue of book/course/content/community assets and began to behave like a knowledge-brand journey. Before user review, however, the prototype still needs an expert visual/content pass. The goal of v4.2 is not to chase aesthetics. It is to remove patterns that make the service feel generic, dated, AI-generated, or like a traditional coach/course homepage.

## 2. Evidence hierarchy

Use references in this order. A lower tier may inspire but never override a higher tier.

### Tier 1 — usability evidence
- Nielsen Norman Group — https://www.nngroup.com/
- Baymard Institute — https://baymard.com/
- W3C WAI — https://www.w3.org/WAI/
- GOV.UK Service Manual — https://www.gov.uk/service-manual

Use for IA, task completion, information scent, mobile behavior, accessibility, error/recovery, testing method.

### Tier 2 — current industry / 2026 trend reports
- Figma State of the Designer / Web Design Trends — https://www.figma.com/reports/ , https://www.figma.com/resource-library/web-design-trends/
- Webflow Web Design Trends / State of the Website — https://webflow.com/blog/web-design-trends-2026 , https://webflow.com/resources/report/2026-state-of-the-website
- Adobe Creative Trends — https://business.adobe.com/resources/creative-trends-report.html

Use for current visual language, craft, AI-era web expectations, AEO/GEO context. These are trend inputs, not usability proof.

### Tier 3 — applied professional critique
- Smashing Magazine — https://www.smashingmagazine.com/
- A List Apart — https://alistapart.com/
- UX Magazine — https://uxmag.com/
- UXmatters — https://www.uxmatters.com/
- Built for Mars — https://builtformars.com/
- Growth.Design — https://growth.design/case-studies

Use for concrete critiques, content design, accessibility, product psychology, onboarding/retention patterns.

### Tier 4 — shipped interface / flow libraries
- Mobbin — https://mobbin.com/
- Page Flows — https://pageflows.com/
- SaaSFrame — https://www.saasframe.io/

Use to inspect real current screens and end-to-end flows rather than imagining conventions.

### Tier 5 — inspiration / community signal
Awwwards, SiteInspire, UX Collective, Designer News, r/UXDesign. Useful to discover visual directions and debates; never treated as proof that a pattern is usable.

## 3. 2026 signals that matter for NJS

1. **Human craft is the differentiator.** AI makes average layout/copy easy. The site needs a recognizable editorial system rather than interchangeable rounded-card UI.
2. **Minimal copy, not contextless copy.** Say less on first contact, but make each sentence cause the next sentence to make sense. Progressive depth beats category-name dumping.
3. **Scan first, dive selectively.** Users should grasp the whole proposition quickly, then choose a depth. A long Home can work if its hierarchy is clear.
4. **Expressive typography with conventional navigation.** Type can carry brand personality. Navigation must remain predictable because NJS has learning, community, program, account, support, and commerce destinations.
5. **Use real evidence.** Actual book, knowledge, course/program UI, speaking image, work artifacts, and a supporting portrait are stronger than decorative stock or AI imagery.
6. **Editorial + product, not creator portfolio + SaaS cards.** NJS is a personal knowledge business with real service surfaces. The Home should feel like a modern editorial knowledge brand that opens into products and tools.
7. **AEO/GEO changes entry behavior.** AI/search may land users directly on a Knowledge detail. Detail pages therefore need their own context, author/proof, related learning, and next action; Home cannot carry all orientation responsibility.
8. **Mobile is a separate attention context.** Reduce simultaneous choices and text, not merely columns. Preserve capability while changing priority.

## 4. Trends we do not adopt by default

- Experimental/nonlinear navigation — harms information scent for this service.
- Decorative 3D/WebGL/heavy motion — only consider when it explains a concept or service state.
- Dopamine/maximalist color merely because it is fashionable.
- Generic SaaS card walls.
- Hero portrait domination that makes NJS read as an old-style coach/speaker homepage.
- Long AI-looking sentences listing branding, marketing, psychology, operations, AI, platform, etc. just to prove breadth.

## 5. v4.1 expert audit

### Keep
- Warm editorial base and dark POV chapter.
- Problem-first entry and showing real Knowledge before selling.
- Actual book/profile/speaking assets and product-UI mockups.
- Program and Community explained through different behaviors.
- Public Home vs My Space separation.

### Revise before user review

**S3 candidate — Hero visual.** The large portrait still makes the first impression person-led rather than knowledge/service-led. Replace the single dominant portrait with an editorial evidence stack: real book + Knowledge note + service UI + smaller human proof.

**S3 candidate — Hero framing.** `팔기 전에, 선택받을 이유부터.` connects strongly to NEVER JUST SELL, but `팔기` may pull the first mental model back toward ecommerce education. Keep it as a test condition, not the default assumption.

**S2 — too much text taxonomy early.** Three problems, three Knowledge items, then four POV principles can feel like consecutive text lists. Compress the problem area and let a real piece of content interrupt earlier.

**S2 — mobile POV density.** Four principles are acceptable on desktop; mobile should reveal two first and make the rest secondary.

**S2 — weak proprietary visual language.** Introduce a restrained reverse-engineering / field-note motif derived from Max's actual way of thinking: `현상 → 원인 → 선택 이유 → 고객 관계 → 사업 자산`. It must explain thinking, not decorate the page.

**S2 — Program/Community mobile competition.** Prioritize current action/program first, then other people's experience/community.

## 6. v4.2 working message

### Hero H3 — test candidate
**방법은 바뀌어도, 선택받는 이유는 남습니다.**

NJS는 브랜딩과 마케팅을 ‘어떻게 더 팔까’보다 ‘왜 이 브랜드를 고를까’에서 시작합니다.

현장에서 생긴 문제를 원리까지 거슬러 올라가고, 다시 사업에 쓸 수 있는 판단 기준으로 정리합니다.

Primary CTA: `지금 막힌 문제부터 보기`
Secondary: `맥작가의 관점과 이력`

H3 is not approved public copy. Compare it with H1 in a 5-second comprehension test.

## 7. v4.2 screen contract

### Desktop
- Conventional global navigation.
- Hero: message on left; evidence collage/stack on right, not single portrait.
- Immediately after hero: one reverse-engineering line that demonstrates the NJS way of thinking.
- Current problem area: one featured problem + two compact alternatives, not three equal boxes.
- Knowledge proof appears earlier and with real editorial hierarchy.
- POV uses scale change/dark chapter, not another card grid.
- Proof combines small human image with career/experience as source of the POV.
- Learning uses book + course as two depth modes.
- Program before Community in the action/relationship sequence.
- B2B remains late but discoverable.

### Mobile
- First viewport: eyebrow + headline + one paragraph + one primary CTA. No giant portrait.
- Evidence stack begins in the next viewport.
- One featured problem + `다른 문제 보기`.
- One featured Knowledge item + two compact links.
- Two POV principles first; remaining principles secondary.
- Program is a stronger module than Community on Home; Community remains available from global menu.
- Minimum touch target and focus behavior remain expert-audit requirements.

## 8. Gate

Create `home-v4-2-content-aware-prototype.html` on the non-production branch, render at Desktop 1440 and Mobile 390, perform expert review on hierarchy/copy/image purpose/mobile density/accessibility, fix S3+, and only then ask the user for naturalness and meaning feedback. Production remains unchanged until user test and A2 approval.
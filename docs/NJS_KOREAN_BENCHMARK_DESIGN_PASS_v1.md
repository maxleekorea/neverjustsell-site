# NJS Korean Benchmark Design Pass v1

Date: 2026-10-10
Candidate: V3.4 Korean Benchmark

## Benchmarks
### CLASS101
- Korean learning/commerce reference.
- Measured Hero H1: 52px desktop / 32px mobile.
- Header: 64px.
- One primary message + strong visual + one dominant CTA.
- Mobile compresses the same hierarchy instead of preserving desktop-scale typography.

### PUBLY
- Korean professional knowledge/content reference.
- Uses Pretendard-style sans typography, 1200px-class content width, familiar content cards and clear navigation.
- First viewport is content/service-led rather than manifesto-led.

### Naver Premium Contents
- Korean paid-content discovery reference.
- Compact 54px-class header, strong visual banner, dense content cards/categories immediately below.
- Mobile surfaces content within the first screen and accepts higher information density.

### EO Planet
- Korean community/content reference.
- Compact navigation, clear section headings, dense ranked/list content, familiar cards.
- Mobile prioritizes actual posts and actions instead of large decorative whitespace.

### LongBlack
- Editorial content reference.
- Live automated capture was blocked by Vercel checkpoint, so current public copy/search evidence and prior visual references are used qualitatively only.
- Relevant pattern: strong Korean headline + visual/content immediately following; not a serif-heavy magazine layout everywhere.

## NJS synthesis
Do not copy any one service.

Adopt:
- Pretendard/sans as the primary UI and headline typeface.
- Desktop Home H1 around 48–52px; Mobile around 32–36px.
- Section headings around 34–40px desktop / 26–30px mobile.
- White/light-neutral surfaces and familiar 8–12px radii only for actionable content cards.
- Real content, image, list or CTA visible quickly after each heading.
- Product-cycle explanation as a compact strip/list, not a separate SaaS feature card.
- Mobile first viewport should reveal action/content, not only a manifesto.
- Keep NJS Terracotta as a restrained accent and keep the expert thesis/copy identity.

Avoid:
- serif on every major heading
- forced editorial line breaks on every section
- giant black Community block
- oversized whitespace used only to appear premium
- decorative custom illustration without product value

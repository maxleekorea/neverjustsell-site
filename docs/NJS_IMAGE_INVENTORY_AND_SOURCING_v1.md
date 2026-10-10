# NJS Image Inventory & Sourcing Rule v1

Date: 2026-10-10
Baseline: V3.3 Korean Editorial + PR #98 message candidate

## Decision rule
Images are not added merely to fill whitespace.

Use **real images** when the image functions as evidence:
- author identity / expertise
- lecture and workshop proof
- book/product appearance
- actual course/product artwork
- actual community activity
- case-study source material

Use **simple generated/placeholder images** only when a layout needs an image before a real asset exists.
The image is secondary to the UI ratio and should use a conventional web style:
- clean studio / neutral lifestyle / restrained editorial photography
- simple abstract or diagram background only when photography would imply a false real-world scene
- no bespoke art direction unless the image itself later becomes an important brand asset
- spend minimal production effort; the purpose is to validate composition, ratio, and responsive behavior

Never use AI-generated people, events, classrooms, customers, reviews, business results, or product photos as if they were real NJS evidence.

## Existing reusable real assets found
Current NJS/Cafe24:
- author portrait: HERO_IMAGE
- lecture photo: LECTURE_IMAGE
- print book cover: BOOK_IMAGE
- YouTube thumbnails: live feed

Existing LiveKlass assets:
- author avatar: https://cdn.liveklass.com/common/1788327490183.png
- author/hero banner: https://cdn.liveklass.com/common/1788343547420.png
- brand-era graphic: https://cdn.liveklass.com/common/1788328968813.png
- main online-course thumbnail: https://cdn.liveklass.com/course/01a08446ae4f75678a16661236fa9dc6.png.medium
- slide commentary material: https://cdn.liveklass.com/course/01a084dfe9de7099910bc8385cbe4ec0.png.medium
- commerce-history/search-algorithm course: https://cdn.liveklass.com/course/1780551809295.png.medium
- keyword-strategy course: https://cdn.liveklass.com/course/1782181862328.png.medium
- channel-expansion course: https://cdn.liveklass.com/course/01a084282aa57656aa5d81a9e871f299.png.medium
- legacy digital-book cover: https://cdn.liveklass.com/course/01a060d982a97906b022b6a8f5397d52.jpeg.medium

## Page audit
### Home
Status: not missing by accident.
The Hero is intentionally type + product-cycle led. A real author banner already exists if later A/B testing shows imagery improves first-visit comprehension. Do not add a stock/generated person.

### Content
Video already has real thumbnails.
Column/briefing are editorial text products and do not require mandatory images.
Book interpretation and case studies should use the actual book/source brand imagery when real content exists; do not fabricate case-study pictures.

### Knowledge
No mandatory image. Search/index reading efficiency has priority.
Do not add illustration just to fill whitespace.

### Learning
Image gap found.
A real course artwork exists but was omitted. Add the actual main-course artwork to the learning feature.

### Store
Image gap found.
A store benefits from concrete product representation. Add the actual main-course artwork now.
Do not display old ebook/course artwork as currently on sale until commerce state is explicitly verified for NJS.

### Support
No image needed. Direct action hierarchy is more important.

### About
Real author portrait already exists.

### Book
Real cover already exists.

### Lecture
Real lecture photo already exists.
Future improvement should use more real speaking/workshop photographs, not generated event photography.

### Community
Real evidence would help, but no safe real activity image set is currently available in the NJS code.
Do not fake community participation with AI imagery. Keep typographic until real screenshots/photos with permission are available.

## User-prepared image list (later, not blocking current work)
High priority:
1. editorial author portraits: horizontal 3:2 or 16:10 + vertical 4:5
2. real lecture/speaking photos: wide + audience/context shots
3. workshop/cohort/community activity: only with permission
4. book/product lifestyle photos: desk, reading, signing, event
5. working-process photos: reviewing material, whiteboard, recording, teaching

Nice to have:
- behind-the-scenes YouTube/content production
- event venue/details
- multiple neutral-background headshots

## Temporary image / layout rule
Images are subordinate to layout.

Default ratios:
- course/content thumbnail: 16:9
- editorial/lecture wide photo: 3:2 or 16:10
- author portrait: 4:5
- book/product cover: preserve native cover ratio
- mobile feature image: 100% content width, usually 16:9

Desktop feature image should usually occupy about 35–45% of the content row, not dominate the copy.
Mobile should stack image above copy and avoid consuming most of the first viewport.

If no real image exists:
- use a conventional neutral image/placeholder only to test the layout;
- prefer ordinary clean photography or a simple neutral graphic;
- do not create elaborate custom illustration for a low-value placeholder;
- replace it later if a real image materially improves credibility.

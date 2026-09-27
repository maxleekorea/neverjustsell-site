# NJS Home v4.3 Expert Review

Status: USER REVIEW CANDIDATE / NOT PRODUCTION
Date: 2026-09-28

## Review basis

- Korean service benchmarks: Toss narrative home, LongBlack contextual copy/editorial rhythm, 29CM contextual image+copy, Trevari action-based program/community language, CLASS101 learning UX.
- UX evidence: conventional navigation, clear information scent, progressive disclosure, mobile-specific density reduction, explicit auth/recovery paths.
- Brand gate: Macjagga must read as a branding-centered marketing/business expert; commerce experience remains proof, not umbrella identity.

## Pass results

### 1. Five-second framing — PASS WITH USER TEST
Hero no longer starts from Smart Store / online-commerce labels. H3 frames NJS around changing methods vs durable reasons-to-choose. Actual interpretation still requires 5-second user test.

### 2. Visual hierarchy — PASS
Hero has one primary CTA. Public navigation uses concrete destinations. Sections vary in scale and treatment instead of repeating equal cards.

### 3. Human / Korean copy context — PASS WITH POLISH
Problem → consequence → actual knowledge → point of view now forms a narrative. Meta-copy and category-dump sentences were reduced. Final public copy remains A2-pending.

### 4. Evidence / image purpose — PASS
A single large portrait no longer dominates Hero. Hero uses an editorial evidence stack (book/knowledge/reverse-engineering). Real book and lecture assets appear where they function as proof or learning/B2B context rather than decoration.

### 5. Mobile priority — PASS FOR EXPERT PROTOTYPE
Mobile keeps headline, one paragraph and primary CTA first; reduces Hero evidence; hides the third problem, second secondary Knowledge item and third POV principle; controls target approximately 44px. Mobile is not a simple vertical copy of desktop.

### 6. Navigation / service model — PASS WITH USER TEST
Default Global Nav: Knowledge | Books·Courses | Program | Community | Macjagga. Guest shows Login; Member state can switch to My Space. `Books·Courses` grouping remains a first-click test item.

### 7. Accessibility basics — PASS FOR PROTOTYPE
No duplicate IDs or broken hash-route targets. Mobile menu has aria-expanded/aria-controls and Escape close. Dummy `href="#"` links were removed. Production still needs aria-current, focus management on route changes, live status feedback, form labels/errors and real search semantics.

### 8. Product journey — PASS
Home is discovery/editorial. My Space remains returning-user continuity. Program and Community are differentiated by behavior: current action/submission/feedback vs cases/experience/relationship.

## Remaining non-expert questions for the user

The user should not review grids, accessibility or interaction engineering. Only check:
1. What kind of service does this look like within five seconds?
2. Does each section make you want to continue to the next one?
3. Do sentences feel connected rather than like slogans pasted together?
4. Does each image/evidence element have a reason to be there?
5. Is the next action obvious without studying the page?

## Gate

No S4 blocker found. The prior Hero portrait-dominance S3 candidate is resolved in v4.3. Remaining uncertainties are empirical: H3 interpretation, `Books·Courses` label, final Korean copy naturalness, and actual image selection/cropping. Proceed to user naturalness review, then 5-person first-click/task test. Do not modify Production Home before A2 approval.

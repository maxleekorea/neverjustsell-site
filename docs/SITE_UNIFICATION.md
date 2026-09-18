# NEVER JUST SELL site unification

## Goal

Move the user-facing website out of Cafe24 design templates. Keep Cafe24 as commerce infrastructure while the public site, classroom and community are independently controlled in GitHub/Cloudflare.

## Target architecture

- `neverjustsell.com` → `site/` Worker: public pages, navigation, SEO, content hub.
- Course Worker → classroom, Cafe24 member OAuth, paid-course entitlement.
- Community Worker → posts, comments, likes, profiles, D1.
- Cafe24 storefront origin → member pages, cart, orders, products and payment.

The public site links to the existing Course and Community Workers during migration. Custom subdomains can replace the temporary `workers.dev` URLs after functional validation.

## Phase 1 — implemented on `site-unification`

- Standalone SSR home page based on the current NEVER JUST SELL visual system.
- Independent routes: `/about`, `/book`, `/class`, `/content`, `/lecture`.
- Functional bridges: `/classroom`, `/community`, `/login`, `/store`, `/cart`.
- SEO endpoints: `/robots.txt`, `/sitemap.xml`, `/llms.txt`.
- Canonical, Open Graph and JSON-LD markup.
- Responsive navigation and mobile layout.
- No dependency on Cafe24 Smart Design for the public navigation.

## Verified systems reused without redesign

- Cafe24 customer OAuth and per-browser classroom session.
- Cafe24 Admin order read with `mall.read_order` after token refresh.
- Purchase-based classroom entitlement.
- Community Worker auth bridge, signed tickets, Service Binding and D1 write path.

## Cutover gates

1. Preview/deploy `site/` Worker without moving the production domain.
2. Smoke-test desktop/mobile public routes and all bridge links.
3. Confirm classroom purchase lookup and community login still work from the new frontend.
4. Move `neverjustsell.com` to the new Worker.
5. Keep Cafe24 available at its Cafe24 origin first; attach `shop.neverjustsell.com` only when DNS/custom-domain routing is ready.
6. Replace temporary Worker URLs with final classroom/community custom domains.
7. Remove old Cafe24 homepage-injection code only after rollback is no longer needed.

## Rollback

Until production cutover, the existing Cafe24 site remains untouched. The new frontend lives in a separate directory and branch, so it can be previewed without changing the current live site.

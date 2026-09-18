# NEVER JUST SELL site unification

## Goal

Move the user-facing website out of Cafe24 design templates. Keep Cafe24 as commerce infrastructure while the public site, classroom and community are independently controlled in GitHub/Cloudflare.

## Target architecture

- `www.neverjustsell.com` → `site/` Worker: public pages, navigation, SEO, content hub.
- `neverjustsell.com` → canonical redirect to `www.neverjustsell.com`.
- `classroom.neverjustsell.com` → Course/Auth Worker: Cafe24 member OAuth, classroom and paid-course entitlement.
- `community.neverjustsell.com` → Community Worker: posts, comments, likes, profiles and D1.
- `neverjustsell.cafe24.com` → Cafe24 storefront origin during the first production phase: member pages, cart, orders, products and payment.

## Implemented

- Standalone SSR public site under `site/`.
- Independent routes: `/about`, `/book`, `/class`, `/content`, `/lecture`.
- Functional bridges: `/classroom`, `/community`, `/login`, `/store`, `/cart`.
- SEO endpoints: `/robots.txt`, `/sitemap.xml`, `/llms.txt`.
- Canonical, Open Graph and JSON-LD markup.
- Responsive navigation and mobile layout.
- No dependency on Cafe24 Smart Design for the public navigation.
- Cafe24 customer OAuth and per-browser classroom session.
- Cafe24 Admin order read with `mall.read_product` and `mall.read_order`.
- Purchase-based classroom entitlement.
- Community Worker auth bridge, signed tickets, Service Binding and D1 write path.
- Login-state synchronization between the public site and classroom for the final `neverjustsell.com` domain family.
- Configurable Cafe24 OAuth callback origin for the final classroom subdomain.

## Production configuration files

The default Wrangler files remain on the tested `workers.dev` setup so normal Git deployments do not cut over production accidentally.

Production domain files are staged separately:

- `site/wrangler.production.jsonc`
- `worker/wrangler.production.jsonc`
- `community/wrangler.production.jsonc`

They define the final custom domains and production origins without changing the current live domain until an explicit production deployment is made.

## Cutover order

1. Attach `classroom.neverjustsell.com` to `neverjustsell-course-access` using `worker/wrangler.production.jsonc`.
2. Change the Cafe24 Developers OAuth redirect URI to `https://classroom.neverjustsell.com/oauth/cafe24/callback` at the same time the production auth config is activated.
3. Confirm login, logout, classroom session and purchase entitlement on the classroom custom domain.
4. Attach `community.neverjustsell.com` to `neverjustsell-community` using `community/wrangler.production.jsonc` and confirm community login/write flow.
5. Attach `www.neverjustsell.com` and `neverjustsell.com` to `neverjustsell-site` using `site/wrangler.production.jsonc`.
6. Confirm public navigation, login display state, classroom/community links, SEO endpoints and mobile layout on the production domain.
7. Keep the Cafe24 storefront at `neverjustsell.cafe24.com` until `shop.neverjustsell.com` is deliberately introduced.
8. Remove old Cafe24 homepage-injection code only after rollback is no longer needed.

## Rollback

Until step 5, the existing Cafe24 public site remains untouched. The tested `workers.dev` routes and default Wrangler files remain available. If the public cutover fails, remove the public custom-domain mapping and restore the former `www`/apex DNS target; Cafe24 commerce data, orders and member accounts are not migrated or modified by this frontend cutover.

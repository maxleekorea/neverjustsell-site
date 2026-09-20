# NEVER JUST SELL architecture stabilization

This document is the production source of truth. Do not patch individual URLs outside this model.

## Canonical public surfaces

| Surface | Canonical origin | Responsibility |
| --- | --- | --- |
| Public site | https://www.neverjustsell.com | Brand, books, classes, content, lecture, navigation |
| Apex | https://neverjustsell.com | 308 redirect to `www`, preserving path/query |
| Classroom / auth | https://classroom.neverjustsell.com | Cafe24 customer OAuth, classroom session, entitlement |
| Community | https://community.neverjustsell.com | Community UI, D1 data, community session |
| Commerce origin | https://neverjustsell.cafe24.com | Product, cart, order, payment only |

Production UI must not send users to `*.workers.dev`.

## Authentication flows

### Main-site login

1. `www /login`
2. Redirect to `classroom /site-login?return_to=https://www.neverjustsell.com/auth/complete`
3. Cafe24 customer OAuth
4. Callback only at `classroom /oauth/cafe24/callback`
5. Create classroom session and the site login display cookie
6. Redirect to `www /auth/complete`
7. `/auth/complete` immediately redirects to `/`

### Classroom member authentication

1. `classroom /classroom`
2. If no classroom session, show **회원 인증하기**
3. Button must target `classroom /oauth/cafe24/customer/start` with no community `return_to`
4. Cafe24 OAuth callback creates the classroom session
5. Redirect to `classroom /classroom`

### Community authentication

1. Community requests login with a return URL of exactly `community /auth/callback`
2. Redirect to `classroom /oauth/cafe24/customer/start?return_to=...`
3. Cafe24 OAuth callback creates a short-lived signed community ticket
4. Redirect to `community /auth/callback?ticket=...`
5. Community consumes ticket and creates its own session

Generic classroom authentication and community authentication must never share return-URL validation semantics.

## Navigation contract

Public site uses the full global navigation.

Classroom uses a reduced cross-product navigation:
- NEVER JUST SELL → public home
- 커뮤니티 → community
- 로그아웃 → synchronized logout

Community uses:
- NEVER JUST SELL → public home
- 내 강의실 → classroom
- login/logout according to its own session state

The reduced navigation is intentional; missing cross-product links are not.

## Deployment rules

1. DNS and Worker Custom Domains are declarative via `cloudflare/desired-state.json`.
2. Manual DNS changes are emergency-only.
3. Changes are tested on a non-production branch first.
4. Production cutover is allowed only after anonymous live smoke tests pass.
5. Never add a new production `workers.dev` link as a fallback.
6. Cafe24 remains commerce infrastructure; it is not the public-site router.
7. No new OAuth wrapper should be added unless the existing route tree cannot express the flow.

## Cleanup target

The course/auth Worker currently has multiple wrapper layers (`production.js`, `unified.js`, diagnostics/router/runtime layers). Stabilization should reduce authentication routing to one owner so that:
- each route is defined once,
- each return URL is validated once,
- each canonical origin comes from one config source,
- tests cover every cross-domain transition.

Until that consolidation is complete, any authentication change must update tests before production deployment.

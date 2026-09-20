# P30 user, access, and module model

Status: architecture-stabilization
Project: P30 — 플랫폼_neverjustsell.com
Scope: launch model only. P90 multi-tenant platform features are explicitly deferred.

## 1. Module boundaries

P30 is modular by business capability, not by page or by technical layer.

| Module | Owner/runtime | Owns | Must not own |
| --- | --- | --- | --- |
| Public site | `neverjustsell-site` | public pages, SEO, navigation, public CTAs | customer session, purchase authorization |
| Commerce | Cafe24 | products, orders, payments, refunds, member commerce identity | classroom/community UI |
| Access/Classroom | `neverjustsell-course-access` | Cafe24 customer OAuth bridge, classroom session, purchase verification, digital-access decision | community content/data, public-site login display |
| Community | `neverjustsell-community` | community profile, posts, comments, moderation, community session | commerce orders, course catalog ownership |
| Infrastructure | GitHub Actions + Cloudflare | DNS/custom domains, deployment checks, smoke tests | business authorization rules |

Cloudflare Service Bindings are preferred for Worker-to-Worker internal calls where a browser redirect is not part of the user experience.

## 2. Do not model people as mutually exclusive user types

P30 does not use a single enum such as:
`community_user | buyer | student | ebook_reader`.

A person may be several of these at the same time. The stable model is:

- **Identity** — who the person is / which external account authenticated them.
- **Role** — what administrative or creator actions the person may perform.
- **Purchase** — what was bought and paid for.
- **Entitlement** — what digital/service access the person currently has.
- **Community membership** — community participation state.
- **Derived segment** — convenient labels calculated from the facts above.

Examples of derived segments:
- purchaser/customer = has at least one valid paid order
- learner = has an active course entitlement
- ebook reader = has an active ebook/download entitlement
- community member = has an active community membership
- physical-goods buyer = has a paid physical-product order

These are filters/segments, not permanent account types.

## 3. Launch-level data rule

P30 may continue to use Cafe24 member identity as the current external identity source, but it must be treated as an external subject, not as the future permanent platform user ID.

Do not build a new cross-platform user database only for theoretical future needs before launch.

When P90 introduces multi-tenant creators, the platform can add a stable internal `user_id` and map:
`provider + external_subject -> user_id`.

Current P30 data must therefore avoid assumptions such as:
- Cafe24 member ID can never change providers.
- every community member is a purchaser.
- every purchaser is a course student.
- one account has exactly one role.

## 4. Purchase and entitlement are separate

A valid order is evidence of a transaction. It is not itself the permanent access model.

For launch:
- physical product: order history is sufficient; no entitlement is required.
- course: valid paid order grants course access.
- ebook/digital download: valid paid order can grant download/read access.
- paid community/membership later: purchase can grant a community/membership entitlement.
- refunds/cancellations must be able to remove or deny an entitlement where the product policy requires it.

The launch implementation may calculate course entitlement from Cafe24 orders on demand. The interface should still return an access decision rather than exposing raw order semantics to the classroom UI.

## 5. Role and entitlement are independent

Administrative/creator roles:
- platform_operator (future P90/system)
- site_admin
- community_moderator
- creator/author (future P90)

Customer access:
- course:<resource>
- ebook:<resource>
- community:<resource>
- membership:<resource>

A future creator can also be a purchaser, learner, reader, or community member. Never encode creator/customer as mutually exclusive account types.

## 6. Community access policy

Community membership is a separate state from purchase history.

At launch the community may be:
- authenticated-account access,
- manually granted access,
- or entitlement-gated access.

The policy can change without changing the person's core identity model.

Community code should ask “may this identity participate?” rather than “what user type is this person?”

## 7. Future tenant boundary

P30 is tenant/creator #1 in business terms, but P30 does not implement tenant administration.

For future P90 compatibility:
- content/product/course objects should retain owner/source references.
- cross-project objects retain Project ID/Object ID.
- creator ownership is not inferred from domain names or Cafe24 member IDs.
- tenant-specific roles are introduced only when the second real creator requires them.

## 8. Required launch test personas

Automated or fixture-based tests should cover:

1. anonymous visitor
2. authenticated Cafe24 member with no purchases
3. physical-product-only purchaser
4. paid course purchaser
5. ebook/digital purchaser
6. community member with no purchase
7. refunded/cancelled course purchaser
8. community moderator/admin
9. future-compatibility invariant: one identity can simultaneously hold customer access and an administrative/creator role

Tests 3–5 must not require separate account types.

## 9. Benchmarks used

- Thinkific treats courses, communities, digital downloads, coaching/webinars and memberships as separate learning products. A community can be standalone or access can be granted by course/bundle/group/login.
- Kajabi links a customer purchase to an Offer and its included Products; community access can be granted or revoked through an Offer rather than by changing the customer's identity type.
- Stripe Entitlements separates a purchased Product from the Feature/active entitlement that controls access.
- Teachable separates account identity from school roles and supports the student role alongside administrative roles.
- Auth0 Organizations demonstrates that a user can belong to multiple organizations with roles scoped to each membership.
- Cloudflare Service Bindings support separate Workers with explicit internal interfaces, including a shared authentication service.
- AWS architecture guidance recommends bounded contexts/interfaces but warns that distributed microservices add unnecessary complexity for small/midsized applications.

## 10. Stabilization decision

P30 remains modular, but we will not split it into more deployable services unless a business boundary requires it.

The immediate stabilization target is:
1. remove public-site session ownership,
2. consolidate course/auth route ownership,
3. centralize canonical origin/configuration,
4. keep purchase lookup behind an access-decision interface,
5. keep community data/session independent,
6. expand smoke tests using the launch personas above.

Do not add multi-tenant creator dashboards, payout logic, or a central P90 identity database before the P30 launch.

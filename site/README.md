# NEVER JUST SELL unified site

Standalone public frontend for NEVER JUST SELL.

## Responsibility

- `neverjustsell.com`: editorial/public site owned by this Worker.
- Cafe24: member, product, order and payment backend only.
- Course Worker: classroom and purchase entitlement.
- Community Worker: community content and member projection.

## Local

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```

Before production cutover, verify the four origins in `wrangler.jsonc` and attach the production custom domain only after the Worker preview passes smoke tests.

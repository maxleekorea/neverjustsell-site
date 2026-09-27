import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [worker, release, siteRelease] = await Promise.all([
  readFile(new URL("../worker/src/production.js", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/production-deploy.yml", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/site-production-deploy.yml", import.meta.url), "utf8")
]);

const build = "2026-09-27-retention-knowledge-program-v1";
assert.ok(worker.includes(`const PRODUCTION_BUILD = "${build}"`));
assert.ok(release.includes(`const expected="${build}"`));
assert.ok(release.includes("j?.knowledge_ops?.ok"));
assert.ok(release.includes('body?.version!=="2026-09-27-knowledge-ops-v2"'));
assert.ok(release.includes('for(const path of ["/programs","/program-host/review"])'));
assert.ok(release.includes("deploy-site:"));
assert.match(release, /deploy-site:\n\s+needs: deploy-community/);
assert.match(release, /verify:\n\s+needs: deploy-site/);
assert.ok(release.includes('working-directory: site'));
assert.ok(siteRelease.includes("workflow_dispatch:"));
assert.ok(!/\n\s+push:\n/.test(siteRelease));

console.log("production release contract: ok");

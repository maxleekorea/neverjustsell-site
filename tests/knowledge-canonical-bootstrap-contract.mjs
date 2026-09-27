import assert from "node:assert/strict";
import fs from "node:fs";

const bootstrap = fs.readFileSync("worker/src/knowledge-canonical-bootstrap.js", "utf8");
const entrypoint = fs.readFileSync("worker/src/entrypoint.js", "utf8");

assert.ok(bootstrap.includes("https://www.neverjustsell.com/knowledge/catalog.json"));
assert.ok(bootstrap.includes("verifyKnowledgeCatalogParity"));
assert.ok(bootstrap.includes("source.length === database.length"));
assert.ok(bootstrap.includes("missing.length === 0"));
assert.ok(bootstrap.includes("extra.length === 0"));
assert.ok(bootstrap.includes('if (!parity.ok)'));
assert.ok(bootstrap.indexOf('if (!parity.ok)') < bootstrap.indexOf('setKnowledgeSourceMode(env, "canonical")'));
assert.ok(bootstrap.includes('beforeMode === "canonical"'));
assert.ok(bootstrap.includes('counts.published < 1'));
assert.ok(bootstrap.includes('status: "published"'));
assert.ok(bootstrap.includes('source_type: "legacy_catalog"'));

assert.ok(entrypoint.includes('import { ensureKnowledgeCanonicalBootstrap } from "./knowledge-canonical-bootstrap.js"'));
assert.ok(entrypoint.includes('url.pathname === "/migration-health"'));
assert.ok(entrypoint.includes("await ensureKnowledgeCanonicalBootstrap(env)"));
assert.ok(entrypoint.includes('error: "knowledge_canonical_bootstrap_failed"'));

console.log("knowledge canonical bootstrap contract: ok");

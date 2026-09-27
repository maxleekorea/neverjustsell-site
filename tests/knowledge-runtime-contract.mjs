import assert from "node:assert/strict";
import {
  LEGACY_KNOWLEDGE_ENTRIES,
  loadKnowledgeEntries,
  findKnowledgeEntry,
  knowledgeSitemapXml,
  renderKnowledgeIndex
} from "../site/src/knowledge-runtime.js";

let state = await loadKnowledgeEntries({});
assert.equal(state.source, "legacy");
assert.equal(state.entries.length, LEGACY_KNOWLEDGE_ENTRIES.length);

state = await loadKnowledgeEntries({
  KNOWLEDGE_BRIDGE: {
    fetch: async () => new Response(JSON.stringify({ ok: true, active: false, items: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  }
});
assert.equal(state.source, "legacy");
assert.equal(state.entries.length, LEGACY_KNOWLEDGE_ENTRIES.length);

const canonicalItem = {
  slug: "canonical-test",
  title: "Canonical Test",
  type: "term",
  category: "marketing",
  summary: "summary",
  body: "body",
  keywords: ["test"],
  updated: "2026-09-27",
  version: 2
};
state = await loadKnowledgeEntries({
  KNOWLEDGE_BRIDGE: {
    fetch: async () => new Response(JSON.stringify({ ok: true, active: true, items: [canonicalItem] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  }
});
assert.equal(state.source, "canonical");
assert.equal(state.entries.length, 1);
assert.equal(findKnowledgeEntry("canonical-test", state.entries)?.title, "Canonical Test");
assert.ok(knowledgeSitemapXml(state.entries).some((url) => url.endsWith("/knowledge/canonical-test")));
assert.ok(renderKnowledgeIndex(state.entries).includes("Canonical Test"));

state = await loadKnowledgeEntries({
  KNOWLEDGE_BRIDGE: {
    fetch: async () => new Response(JSON.stringify({ ok: true, active: true, items: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  }
});
assert.equal(state.source, "legacy");

console.log("knowledge-runtime contract: ok");

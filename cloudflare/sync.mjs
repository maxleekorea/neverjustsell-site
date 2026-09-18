import fs from "node:fs/promises";

const API_BASE = "https://api.cloudflare.com/client/v4";
const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const mode = (process.argv[2] || "plan").toLowerCase();
const apply = mode === "apply";

if (!token || !accountId) {
  console.error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID");
  process.exit(1);
}

const desired = JSON.parse(
  await fs.readFile(new URL("./desired-state.json", import.meta.url), "utf8")
);

async function cf(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const detail = payload.errors?.map((error) => `${error.code}: ${error.message}`).join("; ") || JSON.stringify(payload);
    throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${detail}`);
  }
  return payload;
}

function action(message) {
  console.log(`${apply ? "APPLY" : "PLAN"}: ${message}`);
}

const zoneLookup = await cf(`/zones?name=${encodeURIComponent(desired.zone)}&status=active&per_page=50`);
const zone = zoneLookup.result?.find((item) => item.name === desired.zone);
if (!zone) throw new Error(`Active Cloudflare zone not found: ${desired.zone}`);

console.log(`Zone: ${zone.name} (${zone.id})`);
console.log(`Account: ${accountId}`);
console.log(`Mode: ${apply ? "apply" : "plan"}`);

async function listWorkerDomains() {
  const payload = await cf(`/accounts/${accountId}/workers/domains`);
  return Array.isArray(payload.result) ? payload.result : [];
}

async function conflictingDnsRecords(hostname) {
  const payload = await cf(`/zones/${zone.id}/dns_records?name=${encodeURIComponent(hostname)}&per_page=100`);
  const records = Array.isArray(payload.result) ? payload.result : [];
  return records.filter((record) => ["A", "AAAA", "CNAME"].includes(record.type));
}

async function removeDnsConflicts(hostname) {
  const records = await conflictingDnsRecords(hostname);
  for (const record of records) {
    action(`remove conflicting DNS ${record.type} ${record.name} -> ${record.content}`);
    if (apply) {
      await cf(`/zones/${zone.id}/dns_records/${record.id}`, { method: "DELETE" });
    }
  }
}

async function detachDomain(domain) {
  action(`detach ${domain.hostname} from Worker ${domain.service}`);
  if (apply) {
    await cf(`/accounts/${accountId}/workers/domains/${domain.id}`, { method: "DELETE" });
  }
}

async function attachDomain(hostname, service) {
  action(`attach ${hostname} -> ${service}`);
  if (apply) {
    await cf(`/accounts/${accountId}/workers/domains`, {
      method: "PUT",
      body: JSON.stringify({
        hostname,
        service,
        zone_id: zone.id,
        zone_name: zone.name
      })
    });
  }
}

let workerDomains = await listWorkerDomains();

for (const [hostname, service] of Object.entries(desired.domains)) {
  const current = workerDomains.find((domain) => domain.hostname === hostname);

  if (current?.service === service) {
    console.log(`OK: ${hostname} -> ${service}`);
    continue;
  }

  if (current) {
    await detachDomain(current);
    if (apply) workerDomains = await listWorkerDomains();
  }

  await removeDnsConflicts(hostname);
  await attachDomain(hostname, service);

  if (apply) workerDomains = await listWorkerDomains();
}

if (!apply) {
  console.log("\nPlan complete. No Cloudflare changes were made.");
  process.exit(0);
}

const finalDomains = await listWorkerDomains();
const failures = [];
for (const [hostname, service] of Object.entries(desired.domains)) {
  const current = finalDomains.find((domain) => domain.hostname === hostname);
  if (current?.service !== service) {
    failures.push(`${hostname}: expected ${service}, got ${current?.service || "not attached"}`);
  }
}

if (failures.length) {
  console.error("Cloudflare reconciliation incomplete:\n" + failures.join("\n"));
  process.exit(2);
}

console.log("\nCloudflare domain reconciliation complete:");
for (const [hostname, service] of Object.entries(desired.domains)) {
  console.log(`  ${hostname} -> ${service}`);
}

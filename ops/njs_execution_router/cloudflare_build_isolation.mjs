const API = "https://api.cloudflare.com/client/v4";
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) throw new Error("Missing CLOUDFLARE_API_TOKEN");

async function cf(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) {
    throw new Error(`${options.method || "GET"} ${path}: ${response.status} ${JSON.stringify(body?.errors || body)}`);
  }
  return body?.result;
}

function isPreviewTrigger(trigger) {
  const deploy = String(trigger?.deploy_command || "").toLowerCase();
  const excludes = Array.isArray(trigger?.branch_excludes) ? trigger.branch_excludes : [];
  return deploy.includes("wrangler preview") || excludes.includes("main");
}

function sanitized(trigger) {
  return {
    trigger_uuid: trigger?.trigger_uuid,
    trigger_name: trigger?.trigger_name,
    build_command: trigger?.build_command,
    deploy_command: trigger?.deploy_command,
    root_directory: trigger?.root_directory,
    branch_includes: trigger?.branch_includes,
    branch_excludes: trigger?.branch_excludes,
    path_includes: trigger?.path_includes,
    path_excludes: trigger?.path_excludes
  };
}

const zone = (await cf("/zones?name=neverjustsell.com&status=active&per_page=10"))?.[0];
if (!zone?.account?.id) throw new Error("Unable to resolve Cloudflare account from neverjustsell.com zone");
const accountId = zone.account.id;

const scripts = await cf(`/accounts/${accountId}/workers/scripts`);
const targets = [
  { name: "neverjustsell-site", include: "site/*" },
  { name: "neverjustsell-community", include: "community/*" },
  { name: "neverjustsell-course-access", include: "worker/*" }
];

const planned = [];
for (const target of targets) {
  const script = scripts.find(item => item?.id === target.name);
  if (!script?.tag) throw new Error(`Worker tag not found: ${target.name}`);
  const triggers = await cf(`/accounts/${accountId}/builds/workers/${script.tag}/triggers`);
  console.log("TRIGGERS_BEFORE", target.name, JSON.stringify(triggers.map(sanitized)));

  const previews = triggers.filter(isPreviewTrigger);
  if (previews.length !== 1) {
    throw new Error(`Expected exactly one preview trigger for ${target.name}; found ${previews.length}`);
  }
  const trigger = previews[0];
  if (!trigger?.trigger_uuid) throw new Error(`Preview trigger UUID missing for ${target.name}`);
  if (String(trigger.deploy_command || "").toLowerCase().includes("wrangler deploy")) {
    throw new Error(`Preview trigger unexpectedly uses wrangler deploy for ${target.name}`);
  }
  if (Array.isArray(trigger.branch_includes) && trigger.branch_includes.includes("main") && !(trigger.branch_excludes || []).includes("main")) {
    throw new Error(`Preview trigger includes main without excluding it for ${target.name}`);
  }
  planned.push({ target, trigger });
}

// Apply only after every Worker passed discovery and safety checks.
for (const { target, trigger } of planned) {
  const result = await cf(`/accounts/${accountId}/builds/triggers/${trigger.trigger_uuid}`, {
    method: "PATCH",
    body: JSON.stringify({ path_includes: [target.include] })
  });
  console.log("PATCH_RESULT", target.name, JSON.stringify(sanitized(result)));
}

// Read back every trigger and require the exact include path.
for (const { target, trigger } of planned) {
  const triggers = await cf(`/accounts/${accountId}/builds/workers/${(scripts.find(item => item?.id === target.name)).tag}/triggers`);
  const updated = triggers.find(item => item?.trigger_uuid === trigger.trigger_uuid);
  console.log("TRIGGERS_AFTER", target.name, JSON.stringify(triggers.map(sanitized)));
  if (!updated || JSON.stringify(updated.path_includes || []) !== JSON.stringify([target.include])) {
    throw new Error(`Readback mismatch for ${target.name}: ${JSON.stringify(updated?.path_includes)}`);
  }
}

console.log("NJS_CLOUDFLARE_BUILD_ISOLATION=PASS");

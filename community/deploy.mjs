import { spawn } from "node:child_process";

async function runWrangler(args) {
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["wrangler", ...args],
    { stdio: "inherit", env: process.env }
  );

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) process.exit(exitCode);
}

await runWrangler([
  "deploy",
  "--config",
  "wrangler.production.jsonc"
]);

const response = await fetch("https://community.neverjustsell.com/auth/db-health");
const payload = await response.json().catch(() => null);
console.log("Community program schema health:", payload);
if (!response.ok || payload?.ok !== true || payload?.program_schema?.ok !== true) {
  console.error("Community program schema reconciliation failed after deploy.");
  process.exit(1);
}

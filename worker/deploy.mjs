import { writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Build secrets are forwarded into the Worker runtime.
const required = ["CAFE24_CLIENT_ID", "CAFE24_CLIENT_SECRET", "VIMEO_ACCESS_TOKEN"];
const optionalSecrets = ["COURSE_ADMIN_PASSWORD"];
const present = Object.fromEntries(required.map((key) => [key, Boolean(process.env[key])]));
console.log("Cloudflare build secrets detected:", present);

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing Cloudflare build secret(s): ${missing.join(", ")}`);
  process.exit(1);
}

const secretsPath = join(tmpdir(), `neverjustsell-secrets-${process.pid}.json`);
const secretKeys = [...required, ...optionalSecrets.filter((key) => Boolean(process.env[key]))];
const secrets = Object.fromEntries(secretKeys.map((key) => [key, process.env[key]]));
console.log("Optional runtime secrets detected:", Object.fromEntries(optionalSecrets.map((key) => [key, Boolean(process.env[key])])));

await writeFile(secretsPath, JSON.stringify(secrets), { mode: 0o600 });

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

try {
  await runWrangler(["deploy", "--config", "wrangler.production.jsonc", "--secrets-file", secretsPath]);

  const response = await fetch("https://classroom.neverjustsell.com/migration-health");
  const payload = await response.json().catch(() => null);
  console.log("Program schema health:", payload);
  if (!response.ok || payload?.ok !== true || payload?.program_schema?.ok !== true) {
    console.error("Program schema reconciliation failed after deploy.");
    process.exit(1);
  }
} finally {
  await rm(secretsPath, { force: true });
}

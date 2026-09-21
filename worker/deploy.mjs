import { writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Build secrets are forwarded into the Worker runtime.
const required = ["CAFE24_CLIENT_ID", "CAFE24_CLIENT_SECRET", "VIMEO_ACCESS_TOKEN", "COURSE_ADMIN_PASSWORD"];
const present = Object.fromEntries(required.map((key) => [key, Boolean(process.env[key])]));
console.log("Cloudflare build secrets detected:", present);

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing Cloudflare build secret(s): ${missing.join(", ")}`);
  process.exit(1);
}

const secretsPath = join(tmpdir(), `neverjustsell-secrets-${process.pid}.json`);
const secrets = Object.fromEntries(required.map((key) => [key, process.env[key]]));

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
  await runWrangler([
    "d1",
    "migrations",
    "apply",
    "neverjustsell-courses",
    "--remote",
    "--config",
    "wrangler.jsonc"
  ]);

  await runWrangler(["deploy", "--secrets-file", secretsPath]);
} finally {
  await rm(secretsPath, { force: true });
}

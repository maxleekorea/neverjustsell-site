import { writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const required = ["CAFE24_CLIENT_ID", "CAFE24_CLIENT_SECRET"];
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

try {
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["wrangler", "deploy", "--secrets-file", secretsPath],
    { stdio: "inherit", env: process.env }
  );

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) process.exit(exitCode);
} finally {
  await rm(secretsPath, { force: true });
}

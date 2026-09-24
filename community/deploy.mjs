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
  "d1",
  "migrations",
  "apply",
  "neverjustsell-community",
  "--remote",
  "--config",
  "wrangler.jsonc"
]);

await runWrangler([
  "deploy",
  "--config",
  "wrangler.production.jsonc"
]);

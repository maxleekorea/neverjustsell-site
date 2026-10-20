/**
 * P30 non-production QA evidence: derive test inventory from existing
 * site/package.json and production-smoke.yml, never a hand-maintained count.
 *
 * From repository root:
 *   node site/scripts/p30-qa-summary.mjs --inventory
 *   node site/scripts/p30-qa-summary.mjs --self-test
 *   node site/scripts/p30-qa-summary.mjs --run
 *
 * --run executes ONLY explicitly listed local Node tests. No deploy, auth,
 * browser login, database writes, or external production actions are added.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const siteRoot = join(root, 'site');
const siteManifest = join(siteRoot, 'package.json');
const workflowManifest = join(root, '.github/workflows/production-smoke.yml');
const reportPath = join(root, 'screenshots/p30-test-summary.json');
const hash = (value) => createHash('sha256').update(value).digest('hex');

function unique(tests, label) {
  if (!tests.length) throw new Error('No ' + label + ' tests found in existing contract');
  const ids = tests.map((test) => test.path);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate ' + label + ' test path');
  return tests;
}

function parseSiteTests(manifest) {
  const value = JSON.parse(manifest).scripts?.test;
  if (typeof value !== 'string') throw new Error('Existing site npm test script not found');
  const commands = value.split(/\s*&&\s*/).map((s) => s.trim());
  return unique(commands.map((cmd) => {
    const match = /^node\s+([a-zA-Z0-9_.-]+\.mjs)$/.exec(cmd);
    if (!match || match[1].startsWith('.')) throw new Error('Unrecognized site test command: ' + cmd);
    return { group: 'site', path: 'site/' + match[1], cwd: siteRoot, entry: match[1] };
  }), 'site');
}

function parseContractTests(yaml) {
  const tests = [];
  for (const line of yaml.split(/\r?\n/)) {
    const match = /^\s*(?:-\s*)?run:\s*node\s+(tests\/[a-zA-Z0-9_.-]+\.mjs)\s*$/.exec(line);
    if (match) tests.push({ group: 'contract', path: match[1], cwd: root, entry: match[1] });
  }
  return unique(tests, 'contract');
}

function selfTest() {
  assert.deepEqual(parseSiteTests(JSON.stringify({ scripts: { test: 'node alpha.mjs && node beta.mjs' } })).map((t) => t.entry), ['alpha.mjs', 'beta.mjs']);
  assert.deepEqual(parseContractTests('    run: node tests/a.mjs\n  run: node tests/b.mjs').map((t) => t.entry), ['tests/a.mjs', 'tests/b.mjs']);
  assert.throws(() => parseSiteTests(JSON.stringify({ scripts: { test: 'node alpha.mjs && curl example.com' } })), /Unrecognized site test/);
  assert.throws(() => parseContractTests('run: node tests/a.mjs\nrun: node tests/a.mjs'), /Duplicate/);
  assert.throws(() => parseContractTests('run: echo empty'), /No contract tests/);
  process.stdout.write('P30 QA summary parser self-test: PASS\n');
}

async function inventory() {
  const [siteText, workflowText] = await Promise.all([
    readFile(siteManifest, 'utf8'), readFile(workflowManifest, 'utf8')
  ]);
  const entries = [...parseSiteTests(siteText), ...parseContractTests(workflowText)];
  for (const item of entries) {
    const fullPath = resolve(root, item.path);
    if (!fullPath.startsWith(root + sep)) throw new Error('Disallowed path: ' + item.path);
    if (!(await stat(fullPath)).isFile()) throw new Error('Missing existing test: ' + item.path);
  }
  return {
    siteTests: entries.filter((e) => e.group === 'site').length,
    contractTests: entries.filter((e) => e.group === 'contract').length,
    total: entries.length,
    manifestDigests: { sitePackageSha256: hash(siteText), workflowSha256: hash(workflowText) },
    entries
  };
}

function gitSha() {
  const result = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root, encoding: 'utf8', timeout: 5000 });
  return result.status === 0 ? result.stdout.trim() : 'UNVERIFIED';
}

function execute(test) {
  const started = Date.now();
  const result = spawnSync(process.execPath, [test.entry], {
    cwd: test.cwd, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024,
  });
  const status = result.error?.code === 'ETIMEDOUT' ? 'TIMEOUT' : result.status === 0 ? 'PASS' : 'FAIL';
  return {
    group: test.group, path: test.path, status,
    exitCode: result.status, durationMs: Date.now() - started,
    stdoutSha256: hash(result.stdout || ''), stderrSha256: hash(result.stderr || ''),
  };
}

const mode = process.argv[2];
if (mode === '--self-test') {
  selfTest();
} else if (mode === '--inventory' || mode === '--run') {
  const data = await inventory();
  if (mode === '--inventory') {
    process.stdout.write(JSON.stringify({
      mode: 'INVENTORY_ONLY_NOT_TEST_PASS', siteTests: data.siteTests,
      contractTests: data.contractTests, total: data.total,
      files: data.entries.map(({ group, path }) => ({ group, path })),
      manifestDigests: data.manifestDigests,
    }, null, 2) + '\n');
  } else {
    const results = data.entries.map(execute);
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.length - passed;
    const report = {
      schemaVersion: 1, projectId: 'P30', mode: 'EXECUTED_LOCAL_TESTS',
      commitSha: gitSha(), generatedAt: new Date().toISOString(),
      inventory: { siteTests: data.siteTests, contractTests: data.contractTests, total: data.total, ...data.manifestDigests },
      passed, failed, verdict: failed ? 'FAIL' : 'PASS',
      results,
      limits: 'Node unit/contract tests only; not live Cafe24 OAuth, payments, human UX or site deployment',
    };
    await mkdir(resolve(root, 'screenshots'), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
    process.stdout.write(JSON.stringify({
      verdict: report.verdict, commitSha: report.commitSha, total: data.total,
      siteTests: data.siteTests, contractTests: data.contractTests, passed, failed,
      report: relative(root, reportPath),
    }) + '\n');
    if (failed) process.exitCode = 1;
  }
} else {
  process.stderr.write('Usage: node site/scripts/p30-qa-summary.mjs --self-test | --inventory | --run\n');
  process.exitCode = 2;
}

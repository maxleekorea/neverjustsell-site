/**
 * P30 non-production QA evidence: derive test inventory from existing
 * site/package.json and production-smoke.yml, never a hand-maintained count.
 *
 * From repository root:
 *   node site/scripts/p30-qa-summary.mjs --inventory
 *   node site/scripts/p30-qa-summary.mjs --self-test
 *   node site/scripts/p30-qa-summary.mjs --run
 *
 * --run executes only unconditional Node test steps from the existing smoke
 * workflow. Live production checks guarded by workflow step conditions are
 * excluded. This does not perform deployment, browser login or real E2E.
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
const reportPath = join(root, 'screenshots/p30-test-summary-safe.json');
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
  // Only unconditional Node contracts in the existing smoke job qualify as
  // safe, isolated PR-style checks. Conditional steps may query live production.
  const tests = [];
  let inSmoke = false;
  let inSteps = false;
  let step = null;
  const append = () => {
    if (step?.entry && !step.conditional) {
      tests.push({ group: 'contract', path: step.entry, cwd: root, entry: step.entry });
    }
    step = null;
  };
  for (const line of yaml.split(/\r?\n/)) {
    if (/^  smoke:\s*$/.test(line)) {
      inSmoke = true;
      continue;
    }
    if (!inSmoke) continue;
    if (/^  [a-zA-Z0-9_-]+:\s*$/.test(line)) {
      append();
      break;
    }
    if (/^    if:\s*/.test(line)) throw Error('Conditional smoke job is not eligible for local execution');
    if (/^    steps:\s*$/.test(line)) {
      inSteps = true;
      continue;
    }
    if (!inSteps) continue;
    if (/^      - /.test(line)) {
      append();
      step = { entry: null, conditional: false };
    }
    if (!step) continue;
    if (/^        if:\s*/.test(line)) {
      step.conditional = true;
      continue;
    }
    const match = /^        run:\s*node\s+(tests\/[a-zA-Z0-9_.-]+\.mjs)\s*$/.exec(line)
      || /^      - run:\s*node\s+(tests\/[a-zA-Z0-9_.-]+\.mjs)\s*$/.exec(line);
    if (match) step.entry = match[1];
  }
  append();
  return unique(tests, 'contract');
}

function selfTest() {
  assert.deepEqual(parseSiteTests(JSON.stringify({ scripts: { test: 'node alpha.mjs && node beta.mjs' } })).map((t) => t.entry), ['alpha.mjs', 'beta.mjs']);
  const workflow = [
    'jobs:', '  smoke:', '    steps:',
    '      - name: Unconditional A', '        run: node tests/a.mjs',
    '      - name: Unconditional B', '        run: node tests/b.mjs',
    '      - name: Live run conditional after', '        run: node tests/live-smoke.mjs',
    "        if: github.event_name != 'pull_request'",
    '      - name: Live run conditional before',
    "        if: github.event_name != 'pull_request'",
    '        run: node tests/public-site-crawl.mjs',
    '      - name: Run block is not a single Node command', '        run: |',
    '          node tests/not-a-direct-command.mjs',
    '  other:', '    steps:', '      - run: node tests/not-this-job.mjs',
  ].join('\n');
  assert.deepEqual(parseContractTests(workflow).map((t) => t.entry), ['tests/a.mjs', 'tests/b.mjs']);
  assert.throws(() => parseSiteTests(JSON.stringify({ scripts: { test: 'node alpha.mjs && curl example.com' } })), /Unrecognized site test/);
  assert.throws(() => parseContractTests('jobs:\n  smoke:\n    steps:\n      - run: node tests/a.mjs\n      - run: node tests/a.mjs'), /Duplicate/);
  assert.throws(() => parseContractTests('jobs:\n  smoke:\n    if: always()\n    steps:\n      - run: node tests/a.mjs'), /Conditional smoke job/);
  assert.throws(() => parseContractTests('jobs:\n  smoke:\n    steps:\n      - run: echo empty'), /No contract tests/);
  process.stdout.write('P30 QA summary parser self-test (exclude production-only steps): PASS\n');
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

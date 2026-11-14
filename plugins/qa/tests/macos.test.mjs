import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {macos} from '../scripts/macos.mjs';
import {command, Blocked} from '../scripts/process.mjs';

const cli = new URL('../scripts/macos.mjs', import.meta.url).pathname;
const qaCLI = new URL('../scripts/qa.mjs', import.meta.url).pathname;
const sourceSHA256 = 'a'.repeat(64);

test('macOS protocol preserves argv and classifies blocked, failed and malformed replies', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-macos-protocol-'));
  try {
    const driver = path.join(root, 'driver with spaces');
    // This process is a protocol peer, never a substitute for live native acceptance.
    await writeFile(driver, `#!/usr/bin/env node
let input = ''
for await (const chunk of process.stdin) input += chunk
const request = JSON.parse(input)
if (request.params.target === 'malformed') { console.log('not json') }
else if (request.params.target === 'blocked') { console.log(JSON.stringify({protocol: 1, status: 'blocked', reason: 'GUI unavailable'})); process.exitCode = 2 }
else if (request.params.target === 'failed') { console.log(JSON.stringify({protocol: 1, status: 'error', reason: 'Frozen bundle changed'})); process.exitCode = 1 }
else if (request.params.target === 'version') { console.log(JSON.stringify({protocol: 2, status: 'ok', data: {}})) }
else console.log(JSON.stringify({protocol: 1, status: 'ok', data: request.operation === 'identity' ? {bundleID: request.contract.bundleID, binarySHA256: '${'b'.repeat(64)}', cdHash: '${'c'.repeat(40)}'} : request.params}))
`, {mode: 0o700});
    const contract = {appPath: '/tmp/Example.app', bundleID: 'com.example.qa', targets: {}};
    const observer = await macos({driver, contract});
    contract.frozen = await observer.freeze(sourceSHA256);
    assert.equal(contract.frozen.projectSourceSHA256, sourceSHA256);
    assert.match(contract.frozen.driverSHA256, /^[a-f0-9]{64}$/);
    assert.match(contract.frozen.driverSourceSHA256, /^[a-f0-9]{64}$/);
    const contractFile = path.join(root, 'contract.json');
    await writeFile(contractFile, JSON.stringify(contract));
    const params = {target: 'owned list', output: '/tmp/a $(never-execute).png'};
    const ok = await command(process.execPath, [cli, 'call', 'snapshot', '--driver', driver, '--contract', contractFile, '--params', JSON.stringify(params)]);
    assert.equal(ok.code, 0, ok.stderr);
    assert.deepEqual(JSON.parse(ok.stdout), params, 'JSON crosses stdin without shell expansion');
    for (const [target, code, reason] of [['blocked', 2, /GUI unavailable/], ['failed', 1, /Frozen bundle changed/], ['malformed', 1, /one JSON reply/], ['version', 1, /Unsupported macOS protocol/]]) {
      const result = await command(process.execPath, [cli, 'call', 'snapshot', '--driver', driver, '--contract', contractFile, '--params', JSON.stringify({target})]);
      assert.equal(result.code, code, result.stderr);
      assert.match(result.stderr, reason);
    }
    await assert.rejects(observer.call('drag', {target: 'owned list'}), Blocked);
    const manual = await macos({driver, contract, mode: 'manual-live'});
    assert.deepEqual(await manual.call('drag', params), params);
    const fixture = await macos({driver, contract, mode: 'fixture'});
    assert.deepEqual(await fixture.call('click', params), params);
    await writeFile(driver, '\n', {flag: 'a'});
    await assert.rejects(manual.call('snapshot', params), /Driver changed/);
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('macOS runner reports blocked prerequisites without opening a browser or counting dispatch as an assertion', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-macos-runner-'));
  try {
    await mkdir(path.join(root, '.agents/qa'), {recursive: true});
    const driver = path.join(root, 'driver');
    await writeFile(driver, `#!/usr/bin/env node
for await (const chunk of process.stdin) {}
console.log(JSON.stringify({protocol: 1, status: 'blocked', reason: 'Harness AX access missing'}))
process.exitCode = 2
`, {mode: 0o700});
    await writeFile(path.join(root, '.agents/qa/config.json'), JSON.stringify({name: 'macos-contract'}));
    await writeFile(path.join(root, '.agents/qa/suite.mjs'), `export const cases = [
{id:'native.preflight',surface:'macos',async run(qa) { const mac = await qa.macos({driver:${JSON.stringify(driver)},contract:{targets:{}}}); await mac.call('preflight') }},
{id:'native.dispatch-only',surface:'macos',async run(qa) { await qa.command(process.execPath,['-e','process.exit(0)']) }}
]`);
    const output = path.join(root, 'results');
    const run = await command(process.execPath, [qaCLI, 'run', '--root', root, '--output', output], {env: {...process.env, QA_STATE_DIR: path.join(root, 'private')}});
    assert.equal(run.code, 1, run.stdout);
    const report = JSON.parse(await readFile(path.join(output, 'report.json'), 'utf8'));
    assert.deepEqual(report.results.map(({status}) => status), ['blocked', 'fail']);
    assert.match(report.results[0].reason, /Harness AX access missing/);
    assert.match(report.results[1].reason, /explicit outcome assertion/);
  } finally { await rm(root, {recursive: true, force: true}); }
});

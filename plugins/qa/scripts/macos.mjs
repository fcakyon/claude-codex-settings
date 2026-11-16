#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs, stripVTControlCharacters} from 'node:util';
import {command, Blocked} from './process.mjs';

const source = fileURLToPath(new URL('./macos-driver.swift', import.meta.url));
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const observations = new Set(['identity', 'preflight', 'snapshot', 'inspect', 'capture']);
const operations = new Set([...observations, 'click', 'press', 'drag', 'move', 'resize', 'hide', 'close']);

export function assertSwiftTests(check, result, {selfTest = false} = {}) {
  const output = stripVTControlCharacters(result.stdout || '');
  const details = [result.stderr, output].filter(Boolean).join('\n').trim().slice(-2000);
  check.equal(result.code, 0, details ? `Native test command completed successfully\n${details}` : 'Native test command completed successfully');
  const summaries = [...output.matchAll(/Test run with (\d+) tests?(?: in \d+ suites?)? (passed|failed)/g)];
  check.ok(summaries.length > 0, 'Swift Testing reported a test run');
  for (const match of summaries) check.equal(match[2], 'passed', 'Every native test run passed');
  const passed = summaries.reduce((total, match) => total + Number(match[1]), 0);
  check.ok(passed > 0, 'Native owner tests actually ran');
  check.doesNotMatch(output, /(?:^|\n)\s*(?:[^\n]*\bTest(?:\s+Case)?\b[^\n]*\bskipped\b(?=\s*(?::|$|\())|Test run[^\n]*\bskipped\b)/i, 'Native owner tests have no skipped coverage');
  if (selfTest) {
    const reports = [...output.matchAll(/^\{[\s\S]*?^\}/gm)].map(match => {
      try { return JSON.parse(match[0]); } catch { return null; }
    }).filter(Boolean);
    check.ok(reports.some(report => report.passed === true), 'App self-test reported success');
  }
  return {passed, skipped: 0, ...(selfTest && {selfTest: true})};
}

export async function macos({driver, contract, mode = 'observe', timeout = 10000}) {
  assert.ok(['observe', 'fixture', 'manual-live'].includes(mode), 'Unknown macOS execution mode');
  assert.ok(Number.isInteger(timeout) && timeout >= 2000 && timeout <= 30000, 'macOS deadline must be 2000..30000 ms');
  if (!driver) throw new Blocked('Compile the macOS driver and select its explicit path');
  async function call(operation, params = {}) {
    assert.ok(operations.has(operation), 'Unknown macOS operation');
    if (!observations.has(operation) && mode === 'observe') throw new Blocked('Native actions require fixture or explicitly authorized manual-live scope');
    if (!['identity', 'preflight'].includes(operation)) {
      assert.ok(contract.frozen, 'Freeze the app, driver and source before window operations');
      const [driverSHA256, driverSourceSHA256] = await Promise.all([hash(driver), hash(source)]);
      assert.equal(driverSHA256, contract.frozen.driverSHA256, 'Driver changed after freeze');
      assert.equal(driverSourceSHA256, contract.frozen.driverSourceSHA256, 'Driver source changed after freeze');
    }
    const request = {protocol: 1, operation, mode, contract, params, issuedAt: Date.now(), timeoutMs: timeout - 1000};
    const result = await command(driver, [], {input: JSON.stringify(request), timeout});
    if (result.signal) throw new Error('macOS driver exceeded its deadline or was terminated');
    let reply;
    try { reply = JSON.parse(result.stdout); }
    catch { throw new Error('macOS driver did not return one JSON reply'); }
    assert.equal(reply.protocol, 1, 'Unsupported macOS protocol');
    assert.ok(['ok', 'blocked', 'error'].includes(reply.status), 'Invalid macOS reply status');
    if (reply.status === 'blocked' && result.code === 2) throw new Blocked(reply.reason);
    assert.equal(result.code, 0, reply.reason || 'macOS driver failed');
    assert.equal(reply.status, 'ok', reply.reason || 'macOS driver failed');
    return reply.data;
  }
  return {
    call,
    async freeze(projectSourceSHA256) {
      assert.match(projectSourceSHA256, /^[a-f0-9]{64}$/, 'Supply the frozen project source manifest SHA256');
      const [identity, driverSHA256, driverSourceSHA256] = await Promise.all([call('identity'), hash(driver), hash(source)]);
      return {...identity, projectSourceSHA256, driverSHA256, driverSourceSHA256};
    },
  };
}

async function main() {
  const {values, positionals} = parseArgs({allowPositionals: true, options: {
    driver: {type: 'string'}, contract: {type: 'string'}, mode: {type: 'string', default: 'observe'},
    params: {type: 'string'}, output: {type: 'string'}, 'source-sha256': {type: 'string'}, help: {type: 'boolean'},
    script: {type: 'string'}, 'self-test': {type: 'boolean'},
  }});
  if (values.help || !positionals.length) {
    console.log('macos.mjs test --script FILE [--self-test] -- SCRIPT_ARGS | build --output DRIVER | freeze --driver DRIVER --contract FILE --source-sha256 SHA | call OP --driver DRIVER --contract FILE [--mode observe|fixture|manual-live] [--params JSON]');
    return;
  }
  if (positionals[0] === 'test') {
    if (process.platform !== 'darwin') throw new Blocked('Native Swift owner tests require a macOS runner');
    assert.ok(values.script, 'Select the project sandboxed native test script');
    const result = await command('/bin/bash', [values.script, ...positionals.slice(1)], {timeout: 1200000});
    console.log(JSON.stringify(assertSwiftTests(assert, result, {selfTest: values['self-test']})));
    return;
  }
  if (positionals[0] === 'build') {
    if (process.platform !== 'darwin') throw new Blocked('The macOS driver requires the macOS SDK');
    assert.ok(values.output, 'Choose an output path for the compiled driver');
    const result = await command('xcrun', ['swiftc', source, '-o', values.output]);
    assert.equal(result.code, 0, result.stderr);
    console.log(JSON.stringify({driverSHA256: await hash(values.output), driverSourceSHA256: await hash(source)}));
    return;
  }
  const client = await macos({driver: values.driver, contract: JSON.parse(await readFile(values.contract, 'utf8')), mode: values.mode});
  assert.ok(['call', 'freeze'].includes(positionals[0]), 'Unknown macOS command');
  const data = positionals[0] === 'freeze' ? await client.freeze(values['source-sha256']) : await client.call(positionals[1], JSON.parse(values.params || '{}'));
  const json = JSON.stringify(data, null, 2) + '\n';
  if (values.output) await writeFile(values.output, json, {mode: 0o600, flag: 'wx'});
  else process.stdout.write(json);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = error instanceof Blocked ? 2 : 1;
  });
}

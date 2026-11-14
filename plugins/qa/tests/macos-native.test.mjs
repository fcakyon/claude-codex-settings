import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {macos} from '../scripts/macos.mjs';
import {command} from '../scripts/process.mjs';

// This boundary checks the real macOS SDK and code signature, without GUI actions or permission mutations.
test('native driver freezes a scratch signed app and rejects expired requests and changed code', {skip: process.platform !== 'darwin'}, async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-native-identity-'));
  try {
    const driver = path.join(root, 'macos-driver');
    const cli = new URL('../scripts/macos.mjs', import.meta.url).pathname;
    const build = await command(process.execPath, [cli, 'build', '--output', driver]);
    assert.equal(build.code, 0, build.stderr);
    const appPath = path.join(root, 'Fixture.app');
    await mkdir(path.join(appPath, 'Contents/MacOS'), {recursive: true});
    await writeFile(path.join(appPath, 'Contents/Info.plist'), `<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>com.example.qa.fixture</string><key>CFBundleExecutable</key><string>Fixture</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>`);
    const fixtureSource = path.join(root, 'fixture.swift');
    await writeFile(fixtureSource, 'import Foundation\nprint("fixture only, never launched by CI")\n');
    const binary = path.join(appPath, 'Contents/MacOS/Fixture');
    const compile = await command('xcrun', ['swiftc', fixtureSource, '-o', binary]);
    assert.equal(compile.code, 0, compile.stderr);
    const sign = await command('/usr/bin/codesign', ['--force', '--sign', '-', appPath]);
    assert.equal(sign.code, 0, sign.stderr);
    const contract = {bundleID: 'com.example.qa.fixture', appPath, targets: {}};
    const client = await macos({driver, contract});
    contract.frozen = await client.freeze(createHash('sha256').update(await readFile(fixtureSource)).digest('hex'));
    assert.equal(contract.frozen.bundleID, contract.bundleID);
    assert.equal(contract.frozen.binarySHA256, createHash('sha256').update(await readFile(binary)).digest('hex'));
    assert.match(contract.frozen.cdHash, /^[a-f0-9]{40}$/);
    const expired = await command(driver, [], {input: JSON.stringify({protocol: 1, operation: 'identity', mode: 'observe', contract, params: {}, issuedAt: Date.now() - 60000, timeoutMs: 1000})});
    assert.equal(expired.code, 2);
    assert.equal(JSON.parse(expired.stdout).reason, 'Native selector deadline expired');
    const system = await macos({driver, contract: {...contract, bundleID: 'com.apple.keychainaccess'}});
    await assert.rejects(system.call('identity'), /System apps cannot be the app under test/);
    const changed = await readFile(binary);
    changed[4096] ^= 1;
    await writeFile(binary, changed);
    await assert.rejects(client.call('identity'), /Strict code signature verification failed/);
  } finally { await rm(root, {recursive: true, force: true}); }
});

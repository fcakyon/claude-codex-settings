import {test} from 'node:test';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, readFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {setup} from '../scripts/setup.mjs';
import {command} from '../scripts/runtime.mjs';
import {sqliteQuery} from '../scripts/native.mjs';

test('setup detects components, keeps project edits and reports blocked coverage', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-setup-contract-'));
  const backend = await mkdtemp(path.join(tmpdir(), 'qa-related-backend-'));
  try {
    await writeFile(path.join(root, 'package.json'), JSON.stringify({dependencies: {next: '1'}, scripts: {build: 'next build'}}));
    await writeFile(path.join(root, 'manifest.json'), JSON.stringify({manifest_version: 3, version: '1', content_scripts: [{matches: ['https://example.test/*']}]}));
    await writeFile(path.join(backend, 'go.mod'), 'module example\nrequire github.com/pocketbase/pocketbase v0.1.0\n');
    const first = await setup(root, {baseUrl: 'https://example.test', related: [path.relative(root, backend)]});
    assert.deepEqual(new Set(first.inventory.components.map(item => item.kind)), new Set(['website', 'extension']));
    const suite = path.join(root, '.agents/qa/suite.mjs');
    assert.equal((await command(process.execPath, ['--check', suite])).code, 0, 'Generated suite is not executable JavaScript');
    const relatedRun = await command(process.execPath, [new URL('../scripts/qa.mjs', import.meta.url).pathname, 'run', '--root', root, '--filter', 'backend', '--output', path.join(root, 'related-results')], {env: {...process.env, QA_STATE_DIR: path.join(root, 'private')}});
    assert.equal(relatedRun.code, 2, 'An unconfigured related backend must report blocked coverage');
    const relatedReport = JSON.parse(await readFile(path.join(root, 'related-results/report.json'), 'utf8'));
    assert.equal(relatedReport.results[0].id, 'backend.unconfigured');
    const specialized = `export const cases=[{id:'missing-session',surface:'provider',async run(qa){throw new qa.Blocked('Login required')}},{id:'empty-test',surface:'backend',async run(){}}];`;
    await writeFile(suite, specialized);
    assert.deepEqual((await setup(root)).created, []);
    assert.equal(await readFile(suite, 'utf8'), specialized);
    const result = await command(process.execPath, [new URL('../scripts/qa.mjs', import.meta.url).pathname, 'run', '--root', root, '--output', path.join(root, 'results')], {env: {...process.env, QA_STATE_DIR: path.join(root, 'private')}});
    assert.equal(result.code, 1);
    const report = JSON.parse(await readFile(path.join(root, 'results/report.json'), 'utf8'));
    assert.equal(report.counts.pass, 0);
    assert.equal(report.counts.blocked, 1);
    assert.equal(report.counts.fail, 1);
    assert.equal(report.telemetry.deliveryVerified, false);
  } finally { await rm(root, {recursive: true, force: true}); await rm(backend, {recursive: true, force: true}); }
});

test('database assertions read actual SQLite state and cannot write it', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-db-contract-'));
  try {
    const db = path.join(root, 'test.db');
    assert.equal((await command('sqlite3', [db, 'create table votes(app text); insert into votes values ("android");'])).code, 0);
    assert.deepEqual(await sqliteQuery(db, 'select app from votes'), [{app: 'android'}]);
    await assert.rejects(sqliteQuery(db, 'delete from votes'));
    assert.deepEqual(await sqliteQuery(db, 'select count(*) as total from votes'), [{total: 1}]);
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('run selects the requested HTTP target without rewriting project settings', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'qa-target-contract-'));
  const hits = [0, 0];
  const servers = ['configured', 'candidate'].map((name, index) => createServer((request, response) => {
    hits[index]++;
    response.end(name);
  }));
  try {
    await Promise.all(servers.map(server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve))));
    const urls = servers.map(server => 'http://127.0.0.1:' + server.address().port);
    await setup(root, {baseUrl: urls[0]});
    const configPath = path.join(root, '.agents/qa/config.json');
    const config = await readFile(configPath, 'utf8');
    await writeFile(path.join(root, '.agents/qa/suite.mjs'), `export const cases=[{id:'target',surface:'website',async run(qa){qa.assert.equal(await (await qa.http(qa.config.baseUrl)).text(),process.env.QA_EXPECTED_TARGET,'Request reached the wrong target')}}];`);
    const reports = [];
    for (const [index, name] of ['configured', 'candidate'].entries()) {
      const output = path.join(root, name);
      const result = await command(process.execPath, [new URL('../scripts/qa.mjs', import.meta.url).pathname, 'run', '--root', root, '--output', output, ...(index ? ['--base-url', urls[index]] : [])], {env: {...process.env, QA_STATE_DIR: path.join(root, 'private'), QA_EXPECTED_TARGET: name}});
      assert.equal(result.code, 0, result.stdout);
      reports.push(JSON.parse(await readFile(path.join(output, 'report.json'), 'utf8')));
    }
    assert.deepEqual(hits, [1, 1], 'Each run must reach only its selected server');
    assert.deepEqual(reports.map(report => report.baseUrl), urls);
    assert.equal(await readFile(configPath, 'utf8'), config);
  } finally {
    await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
    await rm(root, {recursive: true, force: true});
  }
});

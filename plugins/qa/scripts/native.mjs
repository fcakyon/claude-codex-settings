import assert from 'node:assert/strict';
import {command, Blocked} from './process.mjs';

export async function androidInstrumentation(serial, runner, options = {}) {
  if (!serial || !runner) throw new Blocked('Android needs an explicit device serial and instrumentation runner');
  const result = await command('adb', ['-s', serial, 'shell', 'am', 'instrument', '-w', '-r', runner], options);
  assert.equal(result.code, 0, 'Android instrumentation command failed');
  assert.ok(!/FAILURES!!!|INSTRUMENTATION_FAILED|Process crashed/.test(result.stdout), 'Android instrumentation failed');
  const count = /OK \((\d+) tests?\)/.exec(result.stdout)?.[1];
  assert.ok(Number(count) > 0, 'Android runner did not report any passing tests');
  return {tests: Number(count)};
}

export async function sqliteQuery(database, sql) {
  const result = await command('sqlite3', ['-readonly', '-json', database, sql]);
  assert.equal(result.code, 0, 'Read-only SQLite query failed');
  return JSON.parse(result.stdout || '[]');
}

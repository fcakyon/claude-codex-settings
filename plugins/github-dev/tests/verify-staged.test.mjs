import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

const verify = fileURLToPath(new URL('../skills/commit-staged/scripts/verify-staged', import.meta.url))

test('a staged check runs the index, excludes local files and propagates failures', t => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'verify-staged-'))
  t.after(() => rmSync(cwd, {recursive: true, force: true}))
  const run = (file, args) => spawnSync(file, args, {cwd, encoding: 'utf8'})
  assert.equal(run('git', ['init', '-q']).status, 0)
  writeFileSync(path.join(cwd, 'value'), 'staged')
  assert.equal(run('git', ['add', 'value']).status, 0)
  const tree = run('git', ['write-tree']).stdout.trim()
  writeFileSync(path.join(cwd, 'value'), 'unstaged')
  writeFileSync(path.join(cwd, 'local'), '')
  const check = run(verify, ['bash', '-c', '[[ $(cat value) == staged && ! -e local ]]'])
  assert.equal(check.status, 0, check.stderr)
  assert.ok(check.stdout.includes(tree))
  const failure = run(verify, ['bash', '-c', 'exit 23'])
  assert.equal(failure.status, 23)
  assert.doesNotMatch(failure.stdout, /Verified staged tree/)
})

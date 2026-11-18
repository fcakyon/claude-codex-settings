import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync, readFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

const guidance = fileURLToPath(new URL('../skills/modern-web-guidance/scripts/guidance', import.meta.url))

test('the packaged launcher can find and retrieve the form accessibility guide', t => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'guidance-smoke-'))
  t.after(() => rmSync(cwd, {recursive: true, force: true}))
  const options = {cwd, encoding: 'utf8', env: {...process.env, TMPDIR: cwd}}
  const search = spawnSync(guidance, ['search', 'announce form errors'], options)
  assert.equal(search.status, 0, search.stderr)
  const id = 'accessible-error-announcement'
  assert.ok(JSON.parse(search.stdout).some(guide => guide.id === id))
  const result = spawnSync(guidance, ['retrieve', id], options)
  assert.equal(result.status, 0, result.stderr)
  const saved = result.stdout.match(/saved to (.+?) to prevent CLI stdout truncation/)
  const content = saved ? readFileSync(saved[1], 'utf8') : result.stdout
  assert.match(content, /aria-invalid/)
})

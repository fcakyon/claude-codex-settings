import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { surfaceCandidates } from "../skills/test-audit/scripts/surface-candidates.mjs";

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(PLUGIN, "../..");
const CLI = path.join(PLUGIN, "skills/test-audit/scripts/surface-candidates.mjs");

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "test-audit-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  }
  return root;
}

test("testOnlySeams splits Go same-package, external-package and other-directory test callers", (t) => {
  const root = fixture(t, {
    "go.mod": "module example.com/demo\n",
    "lib/lib.go": "package lib\n\n// Helper returns one.\nfunc Helper() int { return 1 }\n\nfunc Used() int { return 2 }\n\nfunc init() {}\n\nconst (\n\tLimit = 3\n)\n",
    "lib/lib_test.go": "package lib\n\nimport \"testing\"\n\nfunc TestHelper(t *testing.T) { if Helper() != 1 || Limit != 3 { t.Fatal(\"bad\") } }\n",
    "lib/external_test.go": "package lib_test\n\nimport \"testing\"\n\nfunc TestExternal(t *testing.T) { if lib.Helper() != 1 { t.Fatal(\"bad\") } }\n",
    "cmd/cmd_test.go": "package main\n\nimport \"testing\"\n\nfunc TestCmd(t *testing.T) { if lib.Helper() != lib.Used() { t.Error(\"bad\") } }\n",
    "cmd/main.go": "package main\n\nfunc main() { println(lib.Used()) }\n",
  });
  const seams = surfaceCandidates(root).testOnlySeams;
  assert.deepEqual(seams, [
    { symbol: "Helper", definedIn: "lib/lib.go", nonTestCallers: 0, samePkgTestCallers: 1, otherPkgTestCallers: 2 },
    { symbol: "Limit", definedIn: "lib/lib.go", nonTestCallers: 0, samePkgTestCallers: 1, otherPkgTestCallers: 0 },
  ]);
});

test("testOnlySeams flags JS exports and Python top-level names used only by tests", (t) => {
  const root = fixture(t, {
    "package.json": "{}\n",
    "src/a.mjs": "export function onlyTested() { return 1 }\nexport const prod = 2\nexport default function main() {}\n/*\nexport function commentedOut() {}\n*/\n",
    "src/b.mjs": "import { prod } from './a.mjs'\nconsole.log(prod)\n",
    "src/c.mjs": "export function onlyTested() { return 3 }\n",
    "tests/a.test.mjs": "import { onlyTested, prod } from '../src/a.mjs'\ntest('a', () => assert.equal(onlyTested() + prod, 3))\nconst commentedOut = () => 0\ncommentedOut()\n",
    "pkg/mod.py": "LIMIT = 3\n\ndef helper():\n    return LIMIT\n\ndef used():\n    return 1\n",
    "pkg/app.py": "from pkg.mod import used\nused()\n",
    "pkg/tests/test_mod.py": "from pkg.mod import helper, used\n\ndef test_helper():\n    assert helper() == used() + 2\n",
  });
  const seams = surfaceCandidates(root).testOnlySeams.map(({ symbol, definedIn }) => `${definedIn}:${symbol}`);
  assert.deepEqual(seams, ["pkg/mod.py:helper", "src/a.mjs:onlyTested", "src/c.mjs:onlyTested"]);
});

test("undercountedScripts needs five assertions and no runner declarations", (t) => {
  const asserts = (count) => Array.from({ length: count }, (_, i) => `assert.equal(${i}, ${i})\n`).join("");
  const root = fixture(t, {
    "tests/script.test.mjs": `import assert from 'node:assert/strict'\nassert.ok(/a/.test('a'))\n${asserts(4)}`,
    "tests/declared.test.mjs": `test('declared', () => {\n${asserts(5)}})\n`,
    "tests/short.test.mjs": asserts(4),
    "lib/helpers_test.go": `package lib\n\nfunc check(t *testing.T) {\n${"\tt.Fatal(\"bad\")\n".repeat(5)}}\n`,
  });
  assert.deepEqual(surfaceCandidates(root).undercountedScripts, [{ testFile: "tests/script.test.mjs", assertionCount: 5, declarationCount: 0 }]);
});

test("bundleGrepsWithBuildGuards needs a build config above the source-reading test", (t) => {
  const grep = "const text = fs.readFileSync('dist/main.js', 'utf8')\ntest('no fixture', () => assert.ok(!text.includes('fixture')))\n";
  const root = fixture(t, {
    "app/vite.config.mts": "export default {}\n",
    "app/tests/bundle.test.mjs": grep,
    "app/tests/plain.test.mjs": "test('math', () => assert.equal(1 + 1, 2))\n",
    "lib/tests/bundle.test.mjs": grep,
  });
  assert.deepEqual(surfaceCandidates(root).bundleGrepsWithBuildGuards, [{ testFile: "app/tests/bundle.test.mjs", buildConfigs: ["app/vite.config.mts"] }]);
});

test("assertion-free tests are separated from skipped and environment-gated tests", (t) => {
  const root = fixture(t, {
    "web/cases.test.mjs": [
      "function check(value) { assert.ok(value) }",
      "// make it (really) fast",
      "test('empty', () => { compute() })",
      "test('through helper', () => { check(compute()) })",
      "test.skip('skipped', () => {})",
      "test('gated', () => { if (!process.env.LIVE) return })",
      "test.each([[1]])('table %s', (value) => { expect(value).toBe(1) })",
      "",
    ].join("\n"),
    "svc/svc_test.go": [
      "package svc",
      "",
      "func TestEmpty(t *testing.T) {",
      "\trun()",
      "}",
      "",
      "func TestSkipped(t *testing.T) {",
      "\tt.Skip(\"live only\")",
      "}",
      "",
      "func (e *env) call(t *testing.T) { t.Fatalf(\"bad\") }",
      "",
      "func TestHelper(t *testing.T) {",
      "\tnewEnv().call(t)",
      "}",
      "",
    ].join("\n"),
    "py/test_cases.py": [
      "import pytest",
      "",
      "def test_multiline(",
      "    value=1,",
      "):",
      "    assert value == 1",
      "",
      "def test_empty():",
      "    run()",
      "",
      "@pytest.mark.skip(reason='live')",
      "def test_marked():",
      "    run()",
      "",
    ].join("\n"),
  });
  const report = surfaceCandidates(root);
  const names = (items) => items.map(({ testFile, name, line }) => `${testFile}:${line}:${name}`);
  assert.deepEqual(names(report.assertionFreeTests), ["py/test_cases.py:8:test_empty", "svc/svc_test.go:3:TestEmpty", "web/cases.test.mjs:3:empty"]);
  assert.deepEqual(
    report.envGatedOrSkippedTests.map(({ testFile, name, line, guards }) => `${testFile}:${line}:${name}:${guards.join(",")}`),
    ["py/test_cases.py:12:test_marked:pytest.mark.skip", "svc/svc_test.go:7:TestSkipped:t.Skip", "web/cases.test.mjs:5:skipped:test.skip", "web/cases.test.mjs:6:gated:process.env"],
  );
});

test("qaSuiteOverlap flags unit tests that mock a QA journey route", (t) => {
  const suite = [
    "export const cases = [",
    "  {id: 'items.list', surface: 'backend', async run(qa) { await qa.http(`${base}/api/items/${id}?full=1`) }},",
    "  {id, surface: 'website', async run(qa) { await qa.page.goto('/settings') }},",
    "  {id: 'items.create', requires: ['items.list'], surface: 'backend', async run(qa) { qa.assert.ok(buildItem()) }},",
    "]",
    "",
  ].join("\n");
  const root = fixture(t, {
    ".agents/qa/suite.mjs": suite,
    "src/items.mjs": "export const buildItem = () => ({})\n",
    ".agents/qa/custom.mjs": suite,
    "web/items.test.mjs": "const fetch = vi.fn()\ntest('items', async () => { await load('/api/items/42'); expect(fetch).toHaveBeenCalled() })\n",
    "web/real.test.mjs": "test('items', async () => { assert.ok(await get('/api/items/42')) })\n",
    "web/other.test.mjs": "const fetch = vi.fn()\ntest('other', async () => { await load('/api/other'); expect(fetch).toHaveBeenCalled() })\n",
  });
  const report = surfaceCandidates(root);
  assert.deepEqual(report.qaSuite, { path: ".agents/qa/suite.mjs", caseIds: ["items.create", "items.list"], surfaces: ["backend", "website"], routes: ["/api/items/*", "/settings"] });
  assert.deepEqual(report.qaSuiteOverlap, [{ testFile: "web/items.test.mjs", routes: ["/api/items/*"], mocks: ["vi.fn"] }]);
  assert.deepEqual(report.testOnlySeams.map(({ symbol }) => symbol), ["buildItem"]);
  assert.equal(surfaceCandidates(root, { qaSuite: ".agents/qa/custom.mjs" }).qaSuite.path, ".agents/qa/custom.mjs");
  assert.throws(() => surfaceCandidates(root, { qaSuite: "missing.mjs" }), /QA suite not readable/);
  assert.equal(surfaceCandidates(fixture(t, { "a.test.mjs": "" })).qaSuite, null);
});

test("discovery uses Git listings and reports what it did not audit", (t) => {
  const root = fixture(t, {
    ".gitignore": "ignored.test.mjs\n",
    "ignored.test.mjs": "test('ignored', () => {})\n",
    "deleted.mjs": "export const gone = 1\n",
    "untracked.test.mjs": "test('untracked', () => {})\n",
    "binary.mjs": "export const a = 1\0",
    "node_modules/dep/index.test.mjs": "test('dep', () => {})\n",
    "App.swift": "struct App {}\n",
  });
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "-f", "deleted.mjs", "binary.mjs", "App.swift", "node_modules/dep/index.test.mjs"], { cwd: root });
  fs.rmSync(path.join(root, "deleted.mjs"));
  const report = surfaceCandidates(root);
  assert.equal(report.discovery, "git");
  assert.deepEqual(report.assertionFreeTests.map((entry) => entry.testFile), ["untracked.test.mjs"]);
  assert.deepEqual(report.notAudited, { skippedDirectories: ["node_modules"], unsupportedLanguages: { ".swift": 1 }, unreadableFiles: ["binary.mjs", "deleted.mjs"] });

  fs.rmSync(path.join(root, ".git"), { recursive: true });
  const walked = surfaceCandidates(root);
  assert.equal(walked.discovery, "walk");
  assert.deepEqual(walked.assertionFreeTests.map((entry) => entry.testFile), ["ignored.test.mjs", "untracked.test.mjs"]);
  assert.deepEqual(walked.notAudited.skippedDirectories, ["node_modules"]);
});

test("the CLI renders every format and rejects an unknown one", (t) => {
  const root = fixture(t, { "a.test.mjs": "test('empty', () => {})\n" });
  const run = (...args) => spawnSync(process.execPath, [CLI, "--root", root, ...args], { encoding: "utf8" });
  const json = run("--format", "json");
  assert.equal(json.status, 0);
  assert.deepEqual(JSON.parse(json.stdout).assertionFreeTests, [{ testFile: "a.test.mjs", name: "empty", line: 1, assertionCount: 0 }]);
  for (const [format, heading] of [["markdown", "## Assertion-free tests (1)"], ["text", "Assertion-free tests (1)\n  a.test.mjs:1 empty"]]) {
    const result = run("--format", format);
    assert.equal(result.status, 0);
    assert.ok(result.stdout.includes(heading), result.stdout);
  }
  const bad = run("--format", "yaml");
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /Invalid --format/);
});

test("the synced skill keeps the local surfacing reference and its pointers", () => {
  const skill = path.join(PLUGIN, "skills/test-audit");
  const source = fs.readFileSync(path.join(REPO, ".github/scripts/test-audit/surfacing.md"), "utf8");
  assert.equal(fs.readFileSync(path.join(skill, "references/surfacing.md"), "utf8"), source);
  assert.match(fs.readFileSync(path.join(skill, "SKILL.md"), "utf8"), /^## Audit and validation\n\n- .*\]\(references\/surfacing\.md\)/m);
  assert.match(fs.readFileSync(path.join(skill, "references/audit.md"), "utf8"), /^## Candidate evidence\n\n- .*\]\(surfacing\.md\)/m);
  assert.ok(!source.includes(";"), "surfacing.md prose has no semicolons");
});

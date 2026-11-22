#!/usr/bin/env node
/**
 * List test-audit candidates in a repository with deterministic, dependency-free detectors.
 * The report is a set of leads for read-only discovery, never a deletion verdict.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKIPPED_DIRS = new Set([".git", "node_modules", "dist", "build", "vendor", ".next", "coverage", "__pycache__", "artifacts", "analysis", ".venv"]);
const TEST_DIRS = new Set(["test", "tests", "__tests__", "__mocks__", "testdata"]);
const FAMILY = { ".go": "go", ".py": "py", ...Object.fromEntries([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"].map((ext) => [ext, "js"])) };
const UNSUPPORTED_CODE = new Set([".swift", ".kt", ".java", ".rs", ".rb", ".php", ".cs", ".c", ".cc", ".cpp", ".m", ".dart", ".scala", ".sh", ".vue", ".svelte"]);
const MANIFESTS = new Set(["package.json", "go.mod", "pyproject.toml", "setup.py", "setup.cfg"]);
const BUILD_CONFIG = /^(?:vite\.config|webpack\.config|rollup\.config|esbuild(?:\.config)?)\.[cm]?[jt]s$/;
const MAX_BYTES = 2 * 1024 * 1024;
const ENTRYPOINTS = new Set(["main", "init", "default", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const GO_TEST_FUNC = /^(?:Test|Benchmark|Example|Fuzz)(?![a-z])/;

const IDENTIFIER = /[A-Za-z_$][\w$]*/g;
const IMPORT_LINE = /^[ \t]*(?:import\b|from\s+\S+\s+import\b).*$/gm;
const ASSERTION = /\bassert\w*|(?<![\w$])expect\s*\(|\bt\.(?:Fatal|Error|Fail)\w*|\bthrow\s+new\s+Error\b|\brequire\.[A-Z]\w*|\bpytest\.raises\b/g;
const DECLARATION = {
  go: /^func\s+Test\w*\s*\(/gm,
  js: /(?<![\w$.])(?<!function\s+)(?:test|it|describe)(?:\.\w+)?\s*\(/g,
  py: /^[ \t]*(?:async\s+)?def\s+test_\w*/gm,
};
const JS_TEST = /(?<![\w$.])(?<!function\s+)(?:test|it)(?:\.\w+)?\s*\(/g;
const JS_FUNCTION = /^[ \t]*(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(|^[ \t]*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/gm;
const GO_FUNCTION = /^func\s+(\([^)]*\)\s*)?([A-Za-z_]\w*)\s*(?:\[[^\]]*\])?\([^)]*\)[^{\n]*\{/gm;
const PY_FUNCTION = /^([ \t]*)(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/gm;
const CALL = /([A-Za-z_$][\w$]*)\s*\(/g;
const GUARD = /\bt\.(?:Skip\w*|skip)\s*\(|\b(?:test|it|describe)\.(?:skip|todo)\b|\b(?:skip|todo)\s*:|\bpytest\.(?:skip|mark\.skip\w*)\b|@unittest\.skip\w*|\bprocess\.env\b|\bos\.Getenv\b|\bos\.environ\b/g;
const READS_TEXT = /\b(?:readFileSync|readFile|ReadFile)\s*\(|(?<![\w$.])open\s*\(/;
const STRING_CHECK = /\.includes\s*\(|\.match\s*\(|\bstrings\.Contains\w*\s*\(|\bregexp\.\w+/;
const MOCK = /\b(?:vi|jest)\.fn\b|\bhttptest\b|\bnock\b|\bmsw\b|mock|stub/gi;
const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const CASE_ID = /\bid\s*:\s*(['"`])([^'"`\n]+)\1[^{}]*?\bsurface\s*:|\bsurface\s*:\s*(['"`])[^'"`\n]+\3[^{}]*?\bid\s*:\s*(['"`])([^'"`\n]+)\4/g;
const SURFACE = /\bsurface\s*:\s*(['"`])([^'"`\n]+)\1/g;
const DEFINITIONS = {
  go: [/^(?:func|type|const|var)\s+([A-Za-z_]\w*)/gm],
  js: [/^export\s+(?:declare\s+)?(?:async\s+)?(?:abstract\s+)?(?:function\s*\*?\s*|(?:class|const|let|var|type|interface|enum)\s+)([A-Za-z_$][\w$]*)/gm],
  py: [/^(?:async\s+def|def|class)\s+([A-Za-z_]\w*)/gm, /^([A-Z][A-Z0-9_]*)\s*(?::[^=\n]*)?=(?!=)/gm],
};
const GO_GROUP = /^(?:const|var|type)\s*\(\n([\s\S]*?)^\)/gm;
const CALL_CHAIN = /\s*\(/y;
const TEST_NAME = new RegExp(`\\s*${STRING_LITERAL.source}`, "y");

const isTestFile = (rel) => /\.(?:test|spec)\.\w+$|_test\.\w+$|^test_\w*\.py$/.test(path.posix.basename(rel));
const isTestSupport = (rel, qaPrefix) =>
  isTestFile(rel) ||
  path.posix.basename(rel) === "conftest.py" ||
  (qaPrefix !== undefined && rel.startsWith(qaPrefix)) ||
  rel.split("/").slice(0, -1).some((part) => TEST_DIRS.has(part.toLowerCase()));
const unique = (values) => [...new Set(values)].sort();

function listFiles(root) {
  const skipped = new Set();
  const keep = (rel) => {
    const parts = rel.split("/");
    const at = parts.findIndex((part, index) => index < parts.length - 1 && SKIPPED_DIRS.has(part));
    if (at !== -1) skipped.add(parts.slice(0, at + 1).join("/"));
    return at === -1;
  };
  try {
    const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1 << 28,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return { discovery: "git", files: unique(out.split("\0").filter(Boolean)).filter(keep), skipped };
  } catch {
    // Not a Git work tree, or Git is missing: walk the directory instead.
  }
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (SKIPPED_DIRS.has(entry.name)) skipped.add(rel);
        else walk(rel);
      } else if (entry.isFile()) files.push(rel);
    }
  };
  walk("");
  return { discovery: "walk", files: files.sort(), skipped };
}

function readText(abs) {
  try {
    const stat = fs.statSync(abs);
    if (!stat.isFile() || stat.size > MAX_BYTES) return null;
    const buffer = fs.readFileSync(abs);
    return buffer.includes(0) ? null : buffer.toString("utf8");
  } catch {
    // Tracked files can be deleted or replaced by a directory in the work tree.
    return null;
  }
}

/** Return the index of the bracket that closes the one at `open`, skipping strings and comments, or -1. */
function closingIndex(text, open) {
  if (open < 0) return -1;
  const closer = text[open] === "(" ? ")" : "}";
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "/" && text[i + 1] === "/") {
      i = text.indexOf("\n", i);
      if (i === -1) return -1;
    } else if (ch === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i + 2) + 1;
      if (i === 0) return -1;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      i = stringEnd(text, i);
      if (i === -1) return -1;
    } else if (ch === text[open]) depth += 1;
    else if (ch === closer && --depth === 0) return i;
  }
  return -1;
}

function stringEnd(text, start) {
  for (let i = start + 1; i < text.length; i += 1) {
    if (text[i] === "\\") i += 1;
    else if (text[i] === text[start]) return i;
    else if (text[i] === "\n" && text[start] !== "`") return -1;
  }
  return -1;
}

/** Return the test blocks and helper functions in a file. `head` is the declaration and `start` includes decorators. */
function blocksOf({ text, family }) {
  const blocks = [];
  const add = (name, test, head, end, start = head) => end !== -1 && name && blocks.push({ name, test, head, start, end });
  const nameAt = (index) => {
    TEST_NAME.lastIndex = index;
    return TEST_NAME.exec(text)?.[2];
  };
  if (family === "js") {
    for (const match of text.matchAll(JS_TEST)) {
      let open = match.index + match[0].length - 1;
      let end = closingIndex(text, open);
      const name = nameAt(open + 1);
      // A table call such as `test.each(rows)(name, fn)` keeps its name and body in the next call.
      for (CALL_CHAIN.lastIndex = end + 1; end !== -1 && CALL_CHAIN.test(text); CALL_CHAIN.lastIndex = end + 1) {
        open = CALL_CHAIN.lastIndex - 1;
        end = closingIndex(text, open);
      }
      add(name ?? nameAt(open + 1), true, match.index, end);
    }
    for (const match of text.matchAll(JS_FUNCTION)) {
      const params = match[1] ? closingIndex(text, match.index + match[0].length - 1) : -1;
      const open = match[2] ? match.index + match[0].length - 1 : params < 0 ? -1 : text.indexOf("{", params);
      add(match[1] ?? match[2], false, match.index, closingIndex(text, open));
    }
  } else if (family === "go") {
    for (const match of text.matchAll(GO_FUNCTION)) add(match[2], !match[1] && /^Test/.test(match[2]), match.index, closingIndex(text, match.index + match[0].length - 1));
  } else {
    for (const match of text.matchAll(PY_FUNCTION)) {
      const test = match[2].startsWith("test_");
      let start = match.index;
      while (test && start > 0 && /^[ \t]*@/.test(text.slice(text.lastIndexOf("\n", start - 2) + 1, start))) start = text.lastIndexOf("\n", start - 2) + 1;
      // The body ends before the next non-blank line indented no deeper than the `def`.
      const dedent = new RegExp(`\\n(?![ \\t]{${match[1].length + 1}})(?=[ \\t]*\\S)`, "g");
      dedent.lastIndex = closingIndex(text, match.index + match[0].length - 1);
      if (dedent.lastIndex > 0) add(match[2], test, match.index, dedent.test(text) ? dedent.lastIndex - 1 : text.length - 1, start);
    }
  }
  return blocks;
}

function assertionCount(span, helpers) {
  let count = span.replace(IMPORT_LINE, "").match(ASSERTION)?.length ?? 0;
  for (const [, name] of span.matchAll(CALL)) if (helpers?.has(name)) count += 1;
  return count;
}

/** Return the names of test-support functions that assert directly or through another such function. */
function assertionHelpers(files) {
  const candidates = files.flatMap((file) => file.blocks.filter((block) => !block.test).map((block) => ({ name: block.name, span: file.text.slice(block.start, block.end + 1) })));
  const helpers = new Set();
  for (let grew = true; grew; ) {
    grew = false;
    for (const { name, span } of candidates) {
      if (!helpers.has(name) && assertionCount(span, helpers) > 0) {
        helpers.add(name);
        grew = true;
      }
    }
  }
  return helpers;
}

function definitions(file) {
  const source = file.code ?? file.text;
  const names = [];
  for (const pattern of DEFINITIONS[file.family]) for (const match of source.matchAll(pattern)) names.push(match[1]);
  if (file.family === "go") {
    for (const group of source.matchAll(GO_GROUP)) for (const match of group[1].matchAll(/^\t([A-Za-z_]\w*)/gm)) names.push(match[1]);
  }
  const counts = new Map();
  for (const name of names) {
    if (ENTRYPOINTS.has(name) || name === "_" || /^__\w+__$/.test(name) || (file.family === "go" && GO_TEST_FUNC.test(name))) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

/** Return `text` without line and block comments, skipping strings, so prose never counts as a caller. */
function stripComments(text, family) {
  const line = family === "py" ? "#" : "//";
  let code = "";
  let from = 0;
  for (let i = 0; i < text.length; i += 1) {
    const block = family !== "py" && text.startsWith("/*", i);
    if (text[i] === '"' || text[i] === "'" || text[i] === "`") i = Math.max(i, stringEnd(text, i));
    else if (block || text.startsWith(line, i)) {
      const end = block ? text.indexOf("*/", i + 2) + 2 : text.indexOf("\n", i);
      code += text.slice(from, i);
      from = end < i ? text.length : end;
      i = from - 1;
    }
  }
  return code + text.slice(from);
}

function countTokens(text, into) {
  for (const [token] of text.matchAll(IDENTIFIER)) into.set(token, (into.get(token) ?? 0) + 1);
}

function routesIn(text) {
  const routes = new Set();
  for (const [, , raw] of text.matchAll(STRING_LITERAL)) {
    const value = raw
      .replace(/\$\{[^}]*\}/g, "*")
      .replace(/^[a-z]+:\/\/[^/]+/i, "")
      .replace(/^\*(?=\/)/, "")
      .split(/[?#]/)[0];
    if (/^\/[\w.~*:{}-]+(?:\/[\w.~*:{}-]*)*$/.test(value) && /[a-z]/i.test(value)) routes.add(value.replace(/\/(?::\w+|\{\w+\}|\*)(?=\/|$)/g, "/*"));
  }
  return routes;
}

function routeMatches(a, b) {
  const [left, right] = [a.split("/"), b.split("/")];
  return left.length === right.length && left.every((part, index) => part === right[index] || part === "*" || right[index] === "*");
}

function readQaSuite(root, qaSuite) {
  const rel = qaSuite ? path.relative(root, path.resolve(root, qaSuite)).split(path.sep).join("/") : ".agents/qa/suite.mjs";
  const text = readText(path.join(root, rel));
  if (text === null) {
    if (qaSuite) throw new Error(`QA suite not readable: ${qaSuite}`);
    return null;
  }
  return {
    path: rel,
    caseIds: unique([...text.matchAll(CASE_ID)].map((match) => match[2] ?? match[5])),
    surfaces: unique([...text.matchAll(SURFACE)].map((match) => match[2])),
    routes: unique(routesIn(text)),
  };
}

/**
 * Scan a repository and return test-audit candidates.
 *
 * @param {string} root Repository directory to scan.
 * @param {{qaSuite?: string}} [opts] Optional QA suite path, relative to `root` or absolute.
 */
export function surfaceCandidates(root, opts = {}) {
  root = path.resolve(root);
  const { discovery, files, skipped } = listFiles(root);
  const manifestDirs = new Set(files.filter((rel) => MANIFESTS.has(path.posix.basename(rel))).map((rel) => path.posix.dirname(rel)));
  const buildConfigs = files.filter((rel) => BUILD_CONFIG.test(path.posix.basename(rel)));
  const qaSuite = readQaSuite(root, opts.qaSuite);
  const qaPrefix = qaSuite ? `${path.posix.dirname(qaSuite.path)}/` : undefined;
  const unsupported = {};
  const unreadable = [];
  const sources = [];
  for (const rel of files) {
    const ext = path.posix.extname(rel);
    if (UNSUPPORTED_CODE.has(ext)) unsupported[ext] = (unsupported[ext] ?? 0) + 1;
    if (!FAMILY[ext] || /\.d\.[cm]?ts$/.test(rel)) continue;
    const text = readText(path.join(root, rel));
    if (text === null) unreadable.push(rel);
    else sources.push({ rel, text, family: FAMILY[ext], test: isTestFile(rel), support: isTestSupport(rel, qaPrefix) });
  }

  const packageOf = (file) => {
    let dir = path.posix.dirname(file.rel);
    if (file.family === "go") return `${dir}#${file.text.match(/^package\s+(\w+)/m)?.[1] ?? ""}`;
    while (dir !== "." && !manifestDirs.has(dir)) dir = path.posix.dirname(dir);
    return dir;
  };
  const nonTestTokens = { go: new Map(), js: new Map(), py: new Map() };
  const testTokens = { go: new Map(), js: new Map(), py: new Map() };
  for (const file of sources) {
    file.code = stripComments(file.text, file.family);
    if (!file.support) countTokens(file.code, nonTestTokens[file.family]);
    else {
      const key = packageOf(file);
      if (!testTokens[file.family].has(key)) testTokens[file.family].set(key, new Map());
      countTokens(file.code, testTokens[file.family].get(key));
    }
  }

  const defined = sources.filter((source) => !source.support).map((file) => ({ file, defs: definitions(file) }));
  for (const { file, defs } of defined) {
    for (const [symbol, count] of defs) nonTestTokens[file.family].set(symbol, Math.max(0, (nonTestTokens[file.family].get(symbol) ?? 0) - count));
  }
  const testOnlySeams = [];
  for (const { file, defs } of defined) {
    const pkg = packageOf(file);
    for (const symbol of defs.keys()) {
      const nonTestCallers = nonTestTokens[file.family].get(symbol) ?? 0;
      if (nonTestCallers > 0) continue;
      let samePkgTestCallers = 0;
      let otherPkgTestCallers = 0;
      for (const [key, tokens] of testTokens[file.family]) {
        if (key === pkg) samePkgTestCallers += tokens.get(symbol) ?? 0;
        else otherPkgTestCallers += tokens.get(symbol) ?? 0;
      }
      if (samePkgTestCallers + otherPkgTestCallers > 0) testOnlySeams.push({ symbol, definedIn: file.rel, nonTestCallers, samePkgTestCallers, otherPkgTestCallers });
    }
  }

  const support = sources.filter((file) => file.support);
  for (const file of support) file.blocks = blocksOf(file);
  const helpers = Object.fromEntries(["go", "js", "py"].map((family) => [family, assertionHelpers(support.filter((file) => file.family === family))]));
  const tests = sources.filter((file) => file.test && file.rel !== qaSuite?.path);
  const undercountedScripts = [];
  const bundleGrepsWithBuildGuards = [];
  const assertionFreeTests = [];
  const envGatedOrSkippedTests = [];
  const qaSuiteOverlap = [];
  for (const file of tests) {
    const assertions = assertionCount(file.text, helpers[file.family]);
    const declarationCount = file.text.match(DECLARATION[file.family])?.length ?? 0;
    if (file.family !== "go" && assertions >= 5 && declarationCount === 0) undercountedScripts.push({ testFile: file.rel, assertionCount: assertions, declarationCount });

    const guards = buildConfigs.filter((config) => {
      const dir = path.posix.dirname(config);
      return dir === "." || file.rel.startsWith(`${dir}/`);
    });
    if (guards.length && READS_TEXT.test(file.text) && STRING_CHECK.test(file.text)) bundleGrepsWithBuildGuards.push({ testFile: file.rel, buildConfigs: guards });

    let line = 1;
    let scanned = 0;
    for (const { name, head, start, end } of file.blocks.filter((block) => block.test).sort((a, b) => a.head - b.head)) {
      while (scanned < head) if (file.text[scanned++] === "\n") line += 1;
      const span = file.text.slice(start, end + 1);
      const block = { testFile: file.rel, name, line, assertionCount: assertionCount(span, helpers[file.family]) };
      const blockGuards = unique(span.match(GUARD)?.map((guard) => guard.replace(/[\s(:]+$/, "")) ?? []);
      if (blockGuards.length) envGatedOrSkippedTests.push({ ...block, guards: blockGuards });
      else if (block.assertionCount === 0) assertionFreeTests.push(block);
    }

    const mocks = unique(file.text.match(MOCK)?.map((signal) => signal.toLowerCase()) ?? []);
    if (qaSuite && mocks.length) {
      const testRoutes = [...routesIn(file.text)];
      const routes = qaSuite.routes.filter((route) => testRoutes.some((testRoute) => routeMatches(route, testRoute)));
      if (routes.length) qaSuiteOverlap.push({ testFile: file.rel, routes, mocks });
    }
  }

  return {
    root,
    discovery,
    filesScanned: sources.length,
    testOnlySeams,
    undercountedScripts,
    bundleGrepsWithBuildGuards,
    assertionFreeTests,
    envGatedOrSkippedTests,
    qaSuiteOverlap,
    qaSuite,
    notAudited: { skippedDirectories: unique(skipped), unsupportedLanguages: unsupported, unreadableFiles: unreadable },
  };
}

const SECTIONS = [
  ["testOnlySeams", "Test-only seams", (s) => `${s.symbol} in ${s.definedIn}: nonTest=${s.nonTestCallers} samePkgTests=${s.samePkgTestCallers} otherPkgTests=${s.otherPkgTestCallers}`],
  ["undercountedScripts", "Undercounted test scripts", (s) => `${s.testFile}: ${s.assertionCount} assertions, ${s.declarationCount} declarations`],
  ["bundleGrepsWithBuildGuards", "Source greps under build guards", (s) => `${s.testFile}: ${s.buildConfigs.join(", ")}`],
  ["assertionFreeTests", "Assertion-free tests", (s) => `${s.testFile}:${s.line} ${s.name}`],
  ["envGatedOrSkippedTests", "Skipped or environment-gated tests", (s) => `${s.testFile}:${s.line} ${s.name} (${s.guards.join(", ")})`],
  ["qaSuiteOverlap", "Unit mocks overlapping QA routes", (s) => `${s.testFile}: ${s.routes.join(", ")} (${s.mocks.join(", ")})`],
];

/**
 * Render a report as `json`, `markdown` or `text`.
 *
 * @param {ReturnType<typeof surfaceCandidates>} report Report from `surfaceCandidates`.
 * @param {"json" | "markdown" | "text"} [format] Output format.
 */
export function formatReport(report, format = "text") {
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;
  const [heading, item] = format === "markdown" ? ["## ", "- "] : ["", "  "];
  const lines = [`${format === "markdown" ? "# " : ""}Test-audit candidates in ${report.root} (${report.filesScanned} files, ${report.discovery})`];
  for (const [key, title, describe] of SECTIONS) lines.push("", `${heading}${title} (${report[key].length})`, ...report[key].map((entry) => item + describe(entry)));
  const { qaSuite, notAudited } = report;
  lines.push(
    "",
    `${heading}Scope`,
    item + (qaSuite ? `QA suite ${qaSuite.path}: ${qaSuite.caseIds.length} cases, ${qaSuite.routes.length} routes, surfaces ${qaSuite.surfaces.join(", ") || "none"}` : "QA suite: none found"),
    `${item}Not audited directories: ${notAudited.skippedDirectories.join(", ") || "none"}`,
    `${item}Not audited languages: ${Object.entries(notAudited.unsupportedLanguages).map(([ext, count]) => `${ext} (${count})`).join(", ") || "none"}`,
    `${item}Unreadable files: ${notAudited.unreadableFiles.length}`,
  );
  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const opts = { root: ".", format: "text" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") opts.help = true;
    else if (["--root", "--qa-suite", "--format"].includes(arg) && argv[i + 1] !== undefined) opts[arg === "--qa-suite" ? "qaSuite" : arg.slice(2)] = argv[++i];
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  if (!["json", "markdown", "text"].includes(opts.format)) throw new Error(`Invalid --format "${opts.format}". Expected json|markdown|text.`);
  return opts;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    process.stdout.write(
      opts.help
        ? "Usage: surface-candidates.mjs --root <dir> [--qa-suite <path>] [--format json|markdown|text]\n"
        : formatReport(surfaceCandidates(opts.root, opts), opts.format),
    );
  } catch (err) {
    process.stderr.write(`surface-candidates error: ${err.message}\n`);
    process.exitCode = 2;
  }
}

import {readdir, readFile, mkdir, writeFile, stat} from 'node:fs/promises';
import path from 'node:path';

const ignored = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'out', '.venv', 'venv', 'inspection', '.local', '.agents']);
async function filesUnder(root, depth = 0) {
  const result = [];
  for (const entry of await readdir(root, {withFileTypes: true})) {
    if (ignored.has(entry.name) || entry.name.startsWith('.env')) continue;
    const filename = path.join(root, entry.name);
    if (entry.isDirectory() && depth < 5) result.push(...await filesUnder(filename, depth + 1));
    else if (entry.isFile()) result.push(filename);
  }
  return result;
}

export async function discover(root) {
  root = path.resolve(root);
  const files = await filesUnder(root);
  const components = [];
  for (const filename of files) {
    const relative = path.relative(root, filename);
    if (path.basename(filename) === 'package.json') {
      const data = JSON.parse(await readFile(filename, 'utf8'));
      const dependencies = {...data.dependencies, ...data.devDependencies};
      if (dependencies.express || dependencies.fastify || dependencies.hono || dependencies['@nestjs/core']) components.push({kind: 'backend', evidence: relative, runtime: 'node', scripts: data.scripts || {}});
      if (dependencies.next || dependencies.react || dependencies.vue || dependencies.svelte) components.push({kind: 'website', evidence: relative, framework: dependencies.next ? 'next' : dependencies.vue ? 'vue' : dependencies.svelte ? 'svelte' : 'react', scripts: data.scripts || {}});
    }
    if (path.basename(filename) === 'manifest.json') {
      const data = JSON.parse(await readFile(filename, 'utf8'));
      if (data.manifest_version) components.push({kind: 'extension', evidence: relative, version: data.version, hosts: data.content_scripts?.flatMap(script => script.matches) || []});
    }
    if (path.basename(filename) === 'pyproject.toml') {
      const source = await readFile(filename, 'utf8');
      if (/fastapi|django|flask/.test(source)) components.push({kind: 'backend', evidence: relative, runtime: 'python'});
    }
    if (path.basename(filename) === 'schema.prisma') components.push({kind: 'database', evidence: relative, engine: 'prisma'});
    if (path.basename(filename) === 'AndroidManifest.xml') components.push({kind: 'android', evidence: relative});
    if (path.basename(filename) === 'go.mod') {
      const source = await readFile(filename, 'utf8');
      components.push({kind: 'backend', evidence: relative, runtime: 'go'});
      if (source.includes('pocketbase')) components.push({kind: 'database', evidence: relative, engine: 'pocketbase/sqlite'});
    }
  }
  if (components.some(item => item.kind === 'extension')) {
    for (const item of components.filter(item => item.kind === 'website' && item.framework === 'react' && item.evidence === 'package.json')) item.kind = 'extension-ui';
  }
  const sourceFiles = files.filter(filename => /\.(go|[cm]?[jt]sx?|ya?ml)$/.test(filename) && !/[/\\](?:\.agents|tests?)[/\\]|[._](?:test|spec)\./.test(filename));
  const capabilities = {};
  const patterns = {authentication: /auth\/(?:login|logout)|signInWith|loginWith|authenticate\(/, credits: /creditAccess|insufficient.credit|credit_ledger/i, payments: /stripe|paypal|paddle/i, netflix: /netflix\.com/, prime: /primevideo\.com/, analytics: /sendToGA|GoogleTagManager|gtag\(/};
  for (const filename of sourceFiles) {
    if ((await stat(filename)).size > 300000) continue;
    const source = await readFile(filename, 'utf8');
    for (const [name, pattern] of Object.entries(patterns)) {
      if (!capabilities[name] && pattern.test(source)) capabilities[name] = path.relative(root, filename);
    }
  }
  return {root, components, capabilities, note: 'Source evidence identifies candidate coverage. It does not prove a working flow.'};
}

export async function setup(root, options = {}) {
  root = path.resolve(root);
  const inventory = await discover(root);
  const dir = path.join(root, '.agents/qa');
  const skillDir = path.join(root, '.agents/skills/qa');
  await mkdir(dir, {recursive: true});
  await mkdir(skillDir, {recursive: true});
  const related = await Promise.all((options.related || []).map(async relative => ({...await discover(path.resolve(root, relative)), root: relative})));
  const config = {name: options.name || path.basename(root), baseUrl: options.baseUrl || null, telemetry: {urls: ['**://*.google-analytics.com/**', '**://*.analytics.google.com/g/collect*']}, authOrigins: []};
  if (options.extension) config.extension = options.extension;
  const missing = [...new Set([inventory, ...related].flatMap(item => [...item.components.map(component => component.kind), ...Object.keys(item.capabilities)]))].filter(kind => kind !== 'website');
  config.coverageGaps = missing.map(kind => `${kind}: specialize a journey with an observed outcome`);
  const blocked = missing.map(kind => ({id: kind + '.unconfigured', surface: kind}));
  const files = {
    [path.join(dir, 'config.json')]: JSON.stringify(config, null, 2) + '\n',
    [path.join(dir, 'suite.mjs')]: `export const cases = [${inventory.components.some(item => item.kind === 'website') || options.baseUrl ? `{\n  id: 'public-page', surface: 'website',\n  async run(qa) {\n    if (!qa.config.baseUrl) throw new qa.Blocked('Set baseUrl after inspecting the project');\n    const page = await (await qa.browser()).newPage();\n    try {\n      const response = await page.goto(qa.config.baseUrl);\n      qa.assert.ok(response.ok(), 'Public page request failed');\n      qa.assert.ok((await page.locator('body').innerText()).trim().length > 30, 'Page is blank');\n      qa.evidence('title', await page.title());\n      await qa.screenshot(page, 'public-page');\n    } finally { await page.close(); }\n  },\n},` : ''} ...${JSON.stringify(blocked)}.map(item => ({...item, async run(qa) { throw new qa.Blocked('Specialize this discovered component in the tracked suite before claiming coverage'); }}))];\n`,
    [path.join(skillDir, 'SKILL.md')]: `---\nname: qa\ndescription: Run this project's tracked QA journeys and inspect their pass, fail and blocked evidence.\n---\n\n# Project QA\n\nRun \`project-qa run --root .\` from this repository. The executable cases live in \`.agents/qa/suite.mjs\`. Execution settings live in \`.agents/qa/config.json\`.\n\nSetup detected: ${inventory.components.map(item => item.kind).join(', ') || 'no known components'}. Inspect those owning components before replacing the initial public-page smoke test with the project's real journeys. Authentication, persistence and provider playback need their own observed outcomes. Do not count the generated smoke test as complete project coverage.\n\nReuse saved QA login state and provider sessions. Runs are headless by default. Read the shared qa plugin's session guidance before importing cookies or logging in again. Keep credentials, browser state and run output outside Git. Production analytics are captured locally, so GA ingestion is not verified by these runs.\n\nA nonzero exit means failures or blocked coverage. Check the JSON report before deciding whether the requested release is verified.\n`,
  };
  const created = [];
  for (const [filename, content] of Object.entries(files)) {
    try { await writeFile(filename, content, {flag: 'wx'}); created.push(path.relative(root, filename)); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  return {created, inventory: {...inventory, related}};
}

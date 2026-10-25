import assert from 'node:assert/strict';
import {command, Blocked} from './process.mjs';
import {androidInstrumentation, sqliteQuery} from './native.mjs';
export {command, Blocked} from './process.mjs';
import {mkdir, readFile, writeFile, realpath} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {importCookies} from './session.mjs';
import {signIn} from './auth.mjs';
import {advancingVideo, observeSkip, videoState} from './media.mjs';

export function privateDirectory(root, config) {
  return process.env.QA_STATE_DIR || path.join(homedir(), '.local', 'share', 'project-qa', config.stateGroup || config.name + '-' + createHash('sha256').update(root).digest('hex').slice(0, 8));
}

export async function secret(name, stateDir) {
  if (process.env[name]) return process.env[name];
  const credentials = await readFile(path.join(stateDir, 'credentials.json'), 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '{}';
    throw error;
  });
  const value = JSON.parse(credentials)[name];
  if (!value) throw new Blocked(`Missing credential ${name}. Configure it outside the repository.`);
  return value;
}

export function telemetryEvent(url, body) {
  const u = new URL(url);
  if (body?.trim().startsWith('{')) {
    const data = JSON.parse(body || '{}');
    return {transport: 'relay', events: (data.events || []).map(event => ({name: event.name, params: Object.keys(event.params || {})})), version: data.user_properties?.extension_version?.value};
  }
  return {transport: 'google', events: [{name: u.searchParams.get('en') || new URLSearchParams(body || '').get('en') || 'collect'}]};
}

export async function openBrowser(config, stateDir, telemetry) {
  const executablePath = process.env.QA_BROWSER_EXECUTABLE || config.browser?.executablePath || await secret('QA_BROWSER_EXECUTABLE', stateDir);
  const extension = config.extension && await realpath(path.resolve(config.root, config.extension));
  const context = await chromium.launchPersistentContext('', {
    executablePath, headless: process.env.QA_HEADED !== '1', slowMo: config.browser?.actionDelayMs ?? 500,
    ignoreDefaultArgs: ['--disable-extensions', '--disable-component-update'],
    viewport: {width: 1365, height: 900}, locale: 'en-US',
    serviceWorkers: 'allow',
    args: ['--enable-unsafe-extension-debugging'],
  });
  context.setDefaultTimeout(20000);
  const patterns = config.telemetry?.urls || ['**://*.google-analytics.com/**', '**://*.analytics.google.com/g/collect*'];
  for (const pattern of patterns) await context.route(pattern, async route => {
    telemetry.push(telemetryEvent(route.request().url(), route.request().postData()));
    await route.fulfill({status: 204, headers: {'access-control-allow-origin': route.request().headers().origin || '*', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, GET, OPTIONS'}});
  });
  try {
    const saved = await readFile(path.join(stateDir, 'session.json'), 'utf8').catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (saved) await context.setStorageState(JSON.parse(saved));
    context.qaSave = async () => {
      const state = await context.storageState();
      state.origins = state.origins.filter(item => /^https?:/.test(item.origin));
      await writeFile(path.join(stateDir, 'session.json'), JSON.stringify(state), {mode: 0o600});
    };
    if (extension) {
      const cdp = await context.browser().newBrowserCDPSession();
      const {id} = await cdp.send('Extensions.loadUnpacked', {path: extension});
      context.qaExtensionId = id;
    }
  } catch (error) { await context.close(); throw error; }
  return context;
}

export async function runSuite(root, {filter, output} = {}) {
  root = await realpath(root);
  const config = JSON.parse(await readFile(path.join(root, '.agents/qa/config.json'), 'utf8'));
  config.root = root;
  const stateDir = privateDirectory(root, config);
  await mkdir(stateDir, {recursive: true, mode: 0o700});
  const outputDir = output || path.join(stateDir, 'runs', new Date().toISOString().replaceAll(':', '-'));
  await mkdir(outputDir, {recursive: true, mode: 0o700});
  const {cases} = await import(pathToFileURL(path.join(root, '.agents/qa/suite.mjs')));
  const wanted = new Set(cases.filter(item => !filter || item.id.includes(filter)).map(item => item.id));
  for (let count = -1; count !== wanted.size;) {
    count = wanted.size;
    for (const item of cases.filter(item => wanted.has(item.id))) for (const id of item.requires || []) wanted.add(id);
  }
  const selected = cases.filter(item => wanted.has(item.id));
  if (!selected.length) throw new Error('No QA cases selected. Setup must include executable cases.');
  const report = {project: config.name, coverageGaps: config.coverageGaps || [], selected: selected.map(item => item.id), omitted: cases.filter(item => !selected.includes(item)).map(item => item.id), startedAt: new Date().toISOString(), root, revision: (await command('git', ['rev-parse', 'HEAD'], {cwd: root})).stdout.trim(), telemetry: {mode: 'capture', deliveryVerified: false, events: []}, results: []};
  report.dirty = Boolean((await command('git', ['status', '--porcelain'], {cwd: root})).stdout.trim());
  if (config.extension) report.extensionVersion = JSON.parse(await readFile(path.resolve(root, config.extension, 'manifest.json'), 'utf8')).version;
  let browserContext;
  const qa = {
    root, config, stateDir, outputDir, Blocked, command, androidInstrumentation, sqliteQuery,
    assert: new Proxy(assert, {apply: (target, self, args) => { qa.current.assertions++; return Reflect.apply(target, self, args); }, get: (target, key) => typeof target[key] === 'function' ? (...args) => { qa.current.assertions++; return target[key](...args); } : target[key]}),
    signIn: page => signIn(qa, page),
    advancingVideo, observeSkip, videoState,
    telemetry: report.telemetry.events,
    secret: name => secret(name, stateDir),
    browser: async () => {
      browserContext ||= await openBrowser(config, stateDir, report.telemetry.events);
      report.browser = {version: browserContext.browser().version(), headless: process.env.QA_HEADED !== '1', actionDelayMs: config.browser?.actionDelayMs ?? 500};
      return browserContext;
    },
    reuseCookies: async origins => {
      let endpoint = process.env.QA_SOURCE_CDP;
      if (!endpoint) {
        const profile = await secret('QA_SOURCE_PROFILE', stateDir);
        const [port, target] = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).trim().split('\n');
        endpoint = `ws://127.0.0.1:${port}${target}`;
      }
      for (const origin of origins) assert.ok(config.authOrigins?.includes(origin), `Cookie origin is not configured: ${origin}`);
      const cookies = await importCookies(endpoint, origins);
      const context = await qa.browser();
      for (const {name, domain, path} of await context.cookies(origins)) await context.clearCookies({name, domain, path});
      await context.addCookies(cookies);
      return cookies.length;
    },
    evidence: (name, value) => { qa.current.evidence[name] = value; },
    screenshot: async (page, name) => {
      const filename = path.join(outputDir, `${qa.current.id}-${name}.png`);
      await page.screenshot({path: filename});
      qa.current.evidence[name] = filename;
    },
    http: async (url, options = {}) => {
      const response = await fetch(url, {...options, signal: AbortSignal.timeout(30000)});
      return response;
    },
  };
  try {
    for (const item of selected) {
      const start = Date.now();
      qa.current = {id: item.id, surface: item.surface, status: 'running', assertions: 0, evidence: {}};
      try {
        const missing = (item.requires || []).filter(id => !report.results.some(result => result.id === id && result.status === 'pass'));
        if (missing.length) throw new Blocked('Required journey did not pass: ' + missing.join(', '));
        await item.run(qa);
        assert.ok(qa.current.assertions > 0, 'Case completed without an explicit outcome assertion');
        qa.current.status = 'pass';
      } catch (error) {
        qa.current.status = error instanceof Blocked ? 'blocked' : 'fail';
        qa.current.reason = error instanceof Blocked ? error.message : `${error.name}: ${error.message.split('\n')[0]}`;
      }
      qa.current.durationMs = Date.now() - start;
      report.results.push(qa.current);
      process.stdout.write(`${qa.current.status.toUpperCase()} ${item.id}${qa.current.reason ? ': ' + qa.current.reason : ''}\n`);
    }
  } finally {
    if (browserContext) {
      for (const page of browserContext.pages()) await page.evaluate(() => document.querySelectorAll('video').forEach(video => video.pause())).catch(() => {});
      try {
        await browserContext.qaSave();
      } catch (error) { report.results.push({id: 'cleanup.session', status: 'fail', reason: error.message.split('\n')[0]}); }
      try { await browserContext.close(); }
      catch (error) { report.results.push({id: 'cleanup.browser', status: 'fail', reason: error.message.split('\n')[0]}); }
    }
    report.finishedAt = new Date().toISOString();
    report.counts = Object.fromEntries(['pass', 'fail', 'blocked'].map(status => [status, report.results.filter(item => item.status === status).length]));
    await writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n', {mode: 0o600});
    process.stdout.write(`Report: ${path.join(outputDir, 'report.json')}\n`);
  }
  return report;
}

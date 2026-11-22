#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {discover, setup} from './setup.mjs';
import {command, runSuite, resolveBrowserExecutable, privateDirectory} from './runtime.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const {values, positionals} = parseArgs({allowPositionals: true, options: {
  root: {type: 'string', default: process.cwd()}, name: {type: 'string'}, 'base-url': {type: 'string'}, extension: {type: 'string'}, related: {type: 'string', multiple: true, default: []}, filter: {type: 'string', multiple: true, default: []}, output: {type: 'string'}, verification: {type: 'boolean'}, 'load-suite': {type: 'boolean'}, help: {type: 'boolean'},
}});
if (values.help || !positionals.length) {
  console.log('project-qa discover|setup|doctor|run --root PATH [--load-suite] [--base-url URL] [--extension dist] [--filter ID ...] [--output PATH] [--verification]\nSet QA_BROWSER_EXECUTABLE to a supported Chrome build. QA_STATE_DIR selects private persistent state. QA_SOURCE_CDP optionally imports authorized provider cookies after session failure.');
} else if (positionals[0] === 'discover') console.log(JSON.stringify(await discover(values.root, {loadSuite: values['load-suite']}), null, 2));
else if (positionals[0] === 'setup') console.log(JSON.stringify(await setup(values.root, {name: values.name, baseUrl: values['base-url'], extension: values.extension, related: values.related}), null, 2));
else if (positionals[0] === 'run') {
  const report = await runSuite(values.root, {filter: values.filter, output: values.output, baseUrl: values['base-url']});
  if (values.verification) console.log('verification: ' + report.results.map(item => item.id + ' ' + item.status).join(', '));
  process.exitCode = report.counts.fail ? 1 : report.counts.blocked ? 2 : 0;
} else if (positionals[0] === 'doctor') {
  for (const [name, args] of [['node', ['--version']], ['sqlite3', ['--version']], ['adb', ['version']]]) {
    const result = await command(name, args).catch(() => null);
    console.log(`${name}: ${result?.code === 0 ? result.stdout.trim().split('\n')[0] : 'unavailable'}`);
  }
  const config = JSON.parse(await readFile(path.join(values.root, '.agents/qa/config.json'), 'utf8').catch(() => '{}'));
  const browser = await resolveBrowserExecutable(config, privateDirectory(values.root, config));
  console.log(`QA_BROWSER_EXECUTABLE: ${browser ? 'configured' : 'missing'}`);
} else throw new Error('Unknown command. Run project-qa --help.');

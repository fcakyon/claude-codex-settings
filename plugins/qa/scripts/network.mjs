import {mkdtemp} from 'node:fs/promises';
import path from 'node:path';
import {command, Blocked} from './process.mjs';

export async function withNetwork(qa, startArgs, run) {
  const file = process.env.BROWSER_NETWORK_CLI ? process.execPath : 'browser-network';
  const prefix = process.env.BROWSER_NETWORK_CLI ? [process.env.BROWSER_NETWORK_CLI] : [];
  const version = await command(file, [...prefix, '--version']).catch(error => {
    if (error.code === 'ENOENT') throw new Blocked('Install browser-network-cli 0.2.1+ for network diagnostics.');
    throw error;
  });
  const [major, minor, patch] = version.stdout.trim().split('.').map(Number);
  if (version.code !== 0 || !(major > 0 || major === 0 && (minor > 2 || minor === 2 && patch >= 1))) throw new Blocked('Network diagnostics require browser-network-cli 0.2.1+.');
  const directory = await mkdtemp(path.join(qa.outputDir, 'network-'));
  const state = path.join(directory, 'state.json');
  const call = async (name, args = []) => {
    const result = await command(file, [...prefix, name, ...args, '--state', state], {timeout: 135000});
    if (result.code !== 0) throw new Error(`browser-network ${name}: ${result.stderr.trim()}`);
    return JSON.parse(result.stdout);
  };
  await call('start', startArgs);
  try { return await run(call); }
  finally {
    try {
      const output = path.join(directory, 'capture.json');
      await call('export', ['--output', output]);
      qa.evidence(path.basename(directory), output);
    } finally { await call('stop'); }
  }
}

import {spawn} from 'node:child_process';

export class Blocked extends Error {}

export async function command(file, args = [], options = {}) {
  const {timeout = 120000, input, ...spawnOptions} = options;
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {...spawnOptions, stdio: ['pipe', 'pipe', 'pipe']});
    let stdout = '', stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeout);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', (code, signal) => { clearTimeout(timer); resolve({code, signal, stdout, stderr}); });
    child.stdin.end(input);
  });
}

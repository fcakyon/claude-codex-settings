export async function importCookies(endpoint, origins) {
  const url = new URL(endpoint);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Cookie source must be a local authorized browser');
  let webSocketDebuggerUrl = endpoint;
  if (!['ws:', 'wss:'].includes(url.protocol)) {
    const response = await fetch(new URL('/json/version', url), {signal: AbortSignal.timeout(10000)});
    if (!response.ok()) throw new Error('Browser discovery is unavailable. Set QA_SOURCE_CDP to the authorized DevTools WebSocket URL.');
    ({webSocketDebuggerUrl} = await response.json());
  }
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.close(); reject(new Error('Authorized browser connection timed out')); }, 30000);
    socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, {once: true});
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Authorized browser connection failed')); }, {once: true});
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', ({data}) => {
    const message = JSON.parse(data);
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Browser command timed out: ${method}`)); }, 10000);
    pending.set(id, {resolve, reject, timer});
    socket.send(JSON.stringify({id, method, params, ...(sessionId ? {sessionId} : {})}));
  });
  let targetId;
  try {
    ({targetId} = await call('Target.createTarget', {url: 'about:blank', background: true}));
    const {sessionId} = await call('Target.attachToTarget', {targetId, flatten: true});
    const {cookies} = await call('Network.getCookies', {urls: origins}, sessionId);
    return cookies.filter(cookie => !cookie.partitionKey).map(({name, value, domain, path, expires, httpOnly, secure, sameSite}) => ({name, value, domain, path, expires, httpOnly, secure, ...(sameSite ? {sameSite} : {})}));
  } finally {
    try { if (targetId) await call('Target.closeTarget', {targetId}); }
    finally { socket.close(); }
  }
}

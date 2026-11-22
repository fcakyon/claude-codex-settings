import {test} from 'node:test';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createMcpChecks} from '../scripts/mcp.mjs';
import {command} from '../scripts/process.mjs';

const qa = createMcpChecks();
const prm = '/.well-known/oauth-protected-resource';
const ui = 'ui://example/report-a1b2.html';
const appHTML = '<!doctype html><title>Report</title>';
const png1x1 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);
const options = {
  token: 'qa-fixture', requiredTools: ['open_report'], requireProfileTool: true,
  requireIcons: true, requireToolAnnotations: true, requireWebsite: true, requireDescription: true,
};

async function fixture(t, fault) {
  let base;
  const server = createServer(async (req, res) => {
    const json = (value, status = 200) => {
      res.writeHead(status, {'content-type': 'application/json'});
      res.end(JSON.stringify(value));
    };
    const url = new URL(req.url, base);
    if (req.method === 'OPTIONS' && url.pathname.startsWith('/.well-known/')) {
      res.writeHead(fault === 'preflight' ? 405 : 204, fault === 'preflight-headers' ? {} : {'access-control-allow-origin': 'https://client.example'}).end();
      return;
    }
    if (url.pathname === '/icon.png') {
      if (fault === 'icon-html') {
        res.writeHead(200, {'content-type': 'text/html; charset=utf-8'}).end('<!doctype html><html><body>SPA</body></html>');
        return;
      }
      res.writeHead(200, {'content-type': 'image/png'}).end(png1x1);
      return;
    }
    if (url.pathname === '/api/mcp') {
      if (fault === 'removed-present') {
        res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${base}${prm}/api/mcp"`);
        return json({error: 'unauthorized'}, 401);
      }
      return json({error: 'not found'}, 404);
    }
    if ([prm, prm + '/', prm + '/mcp'].includes(url.pathname)) return json({
      resource: base + (fault === 'resource' && url.pathname === prm + '/mcp' ? '/wrong' : '/mcp'),
      authorization_servers: [base + '/oauth'],
    });
    if (url.pathname === '/.well-known/oauth-authorization-server/oauth' || url.pathname === '/oauth/.well-known/openid-configuration') {
      const mismatch = fault === 'oidc-mismatch' && url.pathname.includes('/.well-known/openid-configuration');
      return json({
        issuer: base + (fault === 'issuer' || mismatch ? '/other' : '/oauth'),
        authorization_endpoint: base + '/authorize',
        token_endpoint: base + '/token',
        registration_endpoint: base + '/register',
        code_challenge_methods_supported: [fault === 'pkce' ? 'plain' : 'S256'],
      });
    }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    if (url.pathname === '/register') {
      const {redirect_uris: uris} = JSON.parse(raw);
      return uris.every(uri => new URL(uri).protocol === 'https:' && !new URL(uri).hash)
        ? json({client_id: 'registered'}, 201)
        : json({error: 'invalid_redirect_uri'}, 400);
    }
    if (url.pathname === '/authorize') {
      if (fault === 'redirect') res.setHeader('Location', url.searchParams.get('redirect_uri'));
      res.writeHead(fault === 'redirect' ? 302 : 400).end();
      return;
    }
    if (url.pathname === '/token') {
      const form = new URLSearchParams(raw);
      if (form.get('resource') !== base + '/mcp') return json({error: 'invalid_target'}, 400);
      if (fault === 'token') return json({access_token: 'fixture-only'});
      return json({error: form.get('grant_type') === 'password' ? 'unsupported_grant_type' : 'invalid_grant'}, 400);
    }
    if (url.pathname !== '/mcp') return json({error: 'unknown route'}, 404);
    if (req.headers.authorization !== 'Bearer qa-fixture') {
      if (fault !== 'challenge') res.setHeader('WWW-Authenticate', 'Bearer resource_metadata="' + base + prm + '"');
      return json({error: 'unauthorized'}, 401);
    }
    if (req.method !== 'POST') {
      if (req.method === 'GET' && fault === 'stateful') {
        res.writeHead(200, {'content-type': 'text/event-stream'});
        res.flushHeaders();
        return;
      }
      res.writeHead(405, {allow: 'POST'}).end();
      return;
    }
    if (req.headers.origin && fault !== 'origin') return json({error: 'origin'}, 403);

    const {id, method, params} = JSON.parse(raw);
    const result = value => json({jsonrpc: '2.0', id, result: value});
    const rpcError = (message, status = 400) => json({jsonrpc: '2.0', id, error: {code: -32602, message}}, status);
    const protocol = req.headers['mcp-protocol-version'];
    if (protocol === '2026-07-28') {
      if (req.headers['mcp-method'] !== method || params._meta?.['io.modelcontextprotocol/protocolVersion'] !== protocol)
        return rpcError('Missing MCP method or protocol metadata');
      if (['tools/call', 'resources/read'].includes(method) && req.headers['mcp-name'] !== (params.name ?? params.uri))
        return rpcError('Missing MCP name');
    } else if (protocol !== '2025-11-25') return rpcError('Unsupported version');

    const discovery = {
      capabilities: {tools: {}, resources: {}},
      instructions: (fault === 'instructions' ? 'a'.repeat(513) : 'Find reports.') + '\r\n \r\n' + 'b'.repeat(600),
    };
    const info = {
      name: 'example', title: 'Example', version: '1.0.0', description: 'Find your reports.',
      websiteUrl: 'https://example.test', icons: [{src: base + '/icon.png', mimeType: 'image/png'}],
    };
    const serverInfo = {...info, ...(fault === 'icons' && {icons: []})};
    switch (method) {
      case 'server/discover':
        return result({...discovery, supportedVersions: ['2026-07-28'], _meta: {'io.modelcontextprotocol/serverInfo': serverInfo}});
      case 'initialize':
        return result({...discovery, protocolVersion: '2025-11-25', serverInfo});
      case 'tools/list':
        if (params.cursor === 'next') return result({tools: [{
          name: 'open_report',
          ...(fault !== 'missing-annotations' && {annotations: {readOnlyHint: true}}),
          _meta: {ui: {resourceUri: ui}, ...(fault !== 'flat resource URI' && {'ui/resourceUri': ui})},
        }]});
        return result({tools: [{
          name: 'whoami', outputSchema: {type: 'object', properties: {id: {type: 'string'}}, required: ['id']},
          annotations: {readOnlyHint: true}, _meta: {'openai/profile': true},
        }], nextCursor: 'next'});
      case 'tools/call':
        if (params.name === 'whoami') return result({content: [], structuredContent: {id: 'fixture-id'}});
        if (params.name !== 'open_report') return rpcError('Unknown tool');
        if (!params.arguments?.id) return result({isError: true, content: [{type: 'text', text: 'Choose a report'}]});
        return result({content: [{type: 'text', text: fault === 'result size' ? 'x'.repeat(100_001) : params.arguments.id}]});
      case 'resources/read':
        return result({contents: [{
          uri: params.uri, mimeType: 'text/html;profile=mcp-app',
          text: fault === 'fallback app'
            ? '<!doctype html><title>Fallback</title>'
            : fault === 'external-bundle'
              ? '<!doctype html><script src="/assets/bundle.js"></script><title>Report</title>'
              : appHTML,
          _meta: {ui: fault === 'csp' ? {} : {csp: {}}},
        }]});
      default: return rpcError('Unexpected method');
    }
  });
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise(resolve => server.close(resolve));
  });
  base = 'http://127.0.0.1:' + server.address().port;
  return {base, endpoint: base + '/mcp'};
}

const authorization = {
  registerEndpoint: '/register', authorizeEndpoint: '/authorize', tokenEndpoint: '/token', protectedResource: '/mcp',
};

test('discovers OAuth from the bearer challenge and checks metadata, preflights, OIDC parity, and retired routes', async t => {
  const {base, endpoint} = await fixture(t);
  const {protectedResource, authorizationServer} = await qa.discoverOAuth(endpoint, {
    expectedIssuer: base + '/oauth', expectedResource: endpoint, extraProtectedResourcePaths: [prm + '/', prm + '/mcp'],
    removedPaths: ['/api/mcp'], checkPreflight: true, preflightOrigin: 'https://client.example', checkOpenIDConfig: true,
  });
  assert.equal(protectedResource.resource, endpoint);
  assert.equal(authorizationServer.token_endpoint, base + '/token');
  await qa.assertOAuthNegativeBoundaries(base, authorization);
});

for (const [fault, message] of [
  ['challenge', /advertises Bearer resource_metadata/],
  ['resource', /names the expected resource/],
  ['issuer', /names the expected issuer/],
  ['pkce', /advertises S256/],
  ['oidc-mismatch', /OpenID configuration issuer matches authorization server/],
  ['preflight', /OPTIONS preflight accepted/],
  ['preflight-headers', /preflight allows origin/],
  ['removed-present', /Removed endpoint GET \/api\/mcp returns 404/],
]) {
  test('fails OAuth discovery for ' + fault, async t => {
    const {endpoint} = await fixture(t, fault);
    await assert.rejects(qa.discoverOAuth(endpoint, {
      extraProtectedResourcePaths: [prm + '/mcp'],
      removedPaths: ['/api/mcp'],
      checkPreflight: true,
      preflightOrigin: 'https://client.example',
      checkOpenIDConfig: true,
    }), message);
  });
}

for (const [fault, message] of [
  ['redirect', /does not redirect to an unregistered URI/],
  ['token', /rejects password/],
]) {
  test('fails OAuth negative checks for ' + fault, async t => {
    const {base} = await fixture(t, fault);
    await assert.rejects(qa.assertOAuthNegativeBoundaries(base, authorization), message);
  });
}

test('accepts paginated tools, verified PNG icons, tool annotations, and self-contained widgets over MCP', async t => {
  const {endpoint} = await fixture(t);
  for (const protocolVersion of ['2026-07-28', '2025-11-25']) {
    const contract = await qa.assertServerContract(endpoint, {...options, protocolVersion});
    assert.equal(contract.serverInfo.title, 'Example');
    assert.deepEqual(contract.tools.map(tool => tool.name), ['whoami', 'open_report']);
  }
});

for (const [fault, message] of [
  ['icons', /serverInfo contains icons/],
  ['icon-html', /serves an image content-type/],
  ['missing-annotations', /declares safety annotations/],
  ['external-bundle', /inlines scripts and stylesheets/],
  ['stateful', /Authenticated MCP GET is disabled/],
  ['instructions', /first paragraph exceeds 512/],
  ['origin', /rejects a foreign Origin/],
  ['flat resource URI', /declares matching ui.resourceUri and ui\/resourceUri/],
  ['csp', /resource declares ui.csp/],
]) {
  test('fails the MCP contract for ' + fault, async t => {
    const {endpoint} = await fixture(t, fault);
    await assert.rejects(qa.assertServerContract(endpoint, options), message);
  });
}

test('checks the app returned for a tool against the built HTML hash', async t => {
  const {endpoint} = await fixture(t);
  const hash = createHash('sha256').update(appHTML).digest('hex');
  const expectedAppHashes = {open_report: hash};
  await qa.assertServerContract(endpoint, {...options, expectedAppHashes});

  const fallback = await fixture(t, 'fallback app');
  await qa.assertServerContract(fallback.endpoint, options);
  await assert.rejects(
    qa.assertServerContract(fallback.endpoint, {...options, expectedAppHashes}),
    /open_report serves the expected MCP app build/,
  );
  await assert.rejects(
    qa.assertServerContract(endpoint, {...options, expectedAppHashes: {whoami: hash}}),
    /whoami advertises an MCP app/,
  );
});

test('reports JSON-RPC and tool-level errors and measures the serialized result', async t => {
  const {endpoint} = await fixture(t);
  const response = await qa.assertToolCall(endpoint, {token: options.token, name: 'open_report', arguments: {id: 'report-1'}});
  assert.equal(response.status, 200);
  assert.equal(response.body.result.content[0].text, 'report-1');
  assert.equal(response.chars, JSON.stringify(response.result).length);
  const appError = await qa.assertToolCall(endpoint, {token: options.token, name: 'open_report', expectError: true});
  assert.equal(appError.result.isError, true);
  const rpcError = await qa.assertToolCall(endpoint, {token: options.token, name: 'missing', expectError: true});
  assert.equal(rpcError.error.code, -32602);
  const denied = await qa.call(endpoint, {method: 'tools/list'});
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get('www-authenticate'), /Bearer resource_metadata/);
  await assert.rejects(qa.assertToolCall(endpoint, {token: options.token, name: 'open_report'}), /expected error status/);
});

test('rejects a tool result above the default 100,000 character budget', async t => {
  const {endpoint} = await fixture(t, 'result size');
  await assert.rejects(qa.assertToolCall(endpoint, {
    token: options.token, name: 'open_report', arguments: {id: 'report-1'},
  }), /characters, limit 100000/);
});

test('counts MCP contract checks as outcomes in an actual project QA run', async t => {
  const {endpoint} = await fixture(t);
  const root = await mkdtemp(path.join(tmpdir(), 'qa-mcp-contract-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(path.join(root, '.agents/qa'), {recursive: true});
  await writeFile(path.join(root, '.agents/qa/config.json'), JSON.stringify({name: 'mcp-fixture', baseUrl: endpoint}));
  await writeFile(path.join(root, '.agents/qa/suite.mjs'), `
export const cases = [{
  id: 'mcp.contract', surface: 'backend',
  async run(qa) { await qa.mcp.assertServerContract(qa.config.baseUrl, ${JSON.stringify(options)}) },
}];
`);
  const output = path.join(root, 'report');
  const cli = fileURLToPath(new URL('../scripts/qa.mjs', import.meta.url));
  const result = await command(process.execPath, [cli, 'run', '--root', root, '--output', output], {
    env: {...process.env, QA_STATE_DIR: path.join(root, 'private')},
  });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  const {results: [report]} = JSON.parse(await readFile(path.join(output, 'report.json'), 'utf8'));
  assert.equal(report.status, 'pass');
  assert.ok(report.assertions > 0);
});

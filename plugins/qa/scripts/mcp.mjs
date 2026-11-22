import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const version = '2026-07-28';
const resultLimit = 100_000;
const invalidOrigin = 'https://untrusted.example.invalid';
const uiMime = 'text/html;profile=mcp-app';
const jsonType = /^application\/json\s*(?:;|$)/i;
const externalBundleRef = /<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel\s*=\s*(?:["']?stylesheet\b|["'][^"']*\bstylesheet\b)/i;
const object = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

function request(url, options = {}, timeoutMs = 30_000) {
  return fetch(url, {...options, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs)});
}

function challengeHeader(headers) {
  return headers.get('www-authenticate')?.match(/(?:^|,\s*)Bearer\b(.*?)(?=,\s*\w+\s+(?!\s*=)|$)/i)?.[1] || '';
}

async function call(endpoint, {token, method, params = {}, protocolVersion = version, headers} = {}) {
  const requestHeaders = new Headers({
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    'mcp-protocol-version': protocolVersion,
    ...(token && {authorization: 'Bearer ' + token}),
  });
  if (protocolVersion >= version) {
    requestHeaders.set('Mcp-Method', method);
    const name = method === 'resources/read' ? params.uri : ['tools/call', 'prompts/get'].includes(method) && params.name;
    if (name) requestHeaders.set('Mcp-Name', name);
    params = {...params, _meta: {
      'io.modelcontextprotocol/clientInfo': {name: 'project-qa', version: '1.0.0'},
      'io.modelcontextprotocol/clientCapabilities': {},
      ...params._meta,
      'io.modelcontextprotocol/protocolVersion': protocolVersion,
    }};
  }
  for (const [key, value] of new Headers(headers)) requestHeaders.set(key, value);
  const response = await request(endpoint, {
    method: 'POST', headers: requestHeaders, body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
  });
  const contentType = response.headers.get('content-type') || '';
  let body = null;
  if (/^text\/event-stream\s*(?:;|$)/i.test(contentType)) await response.body?.cancel();
  else if (jsonType.test(contentType)) body = await response.json();
  else body = await response.text();
  const {result, error} = body ?? {};
  const payload = result ?? error;
  return {status: response.status, headers: response.headers, body, result, error, chars: payload === undefined ? 0 : JSON.stringify(payload).length};
}

export function createMcpChecks(check = assert) {
  function assertChallenge(response, label) {
    check.equal(response.status, 401, label + ' requires a bearer token');
    const metadata = challengeHeader(response.headers).match(/\bresource_metadata\s*=\s*"([^"]+)"/i)?.[1];
    check.ok(metadata, label + ' advertises Bearer resource_metadata');
    return metadata;
  }

  async function metadataDocument(url, label, timeoutMs) {
    const response = await request(url, {}, timeoutMs);
    if (!response.ok) await response.body?.cancel();
    check.equal(response.status, 200, label + ' returns HTTP 200');
    const document = await response.json();
    check.ok(object(document), label + ' returns a JSON object');
    return document;
  }

  async function verifyIcon(icon, endpoint, timeoutMs) {
    const iconUrl = new URL(icon.src, endpoint);
    if (iconUrl.protocol === 'data:') {
      check.match(icon.src, /^data:image\/[^;,]+(?:;[^,]+)?,.+/i, 'Inline MCP server icon uses an image data URI');
      return;
    }
    const response = await request(iconUrl, {}, timeoutMs);
    const contentType = (response.headers.get('content-type') || '').toLowerCase().split(';', 1)[0].trim();
    const bytes = await response.arrayBuffer();
    check.equal(response.status, 200, `MCP icon ${iconUrl.pathname} returns HTTP 200`);
    check.match(contentType, /^image\//, `MCP icon ${iconUrl.pathname} serves an image content-type`);
    if (nonempty(icon.mimeType)) check.equal(contentType, icon.mimeType.toLowerCase(), `MCP icon ${iconUrl.pathname} matches declared mimeType`);
    check.ok(bytes.byteLength > 0, `MCP icon ${iconUrl.pathname} is non-empty`);
  }

  async function discoverOAuth(endpoint, {
    expectedIssuer, expectedResource = String(endpoint), extraProtectedResourcePaths = [],
    removedPaths = [], checkPreflight = false, preflightOrigin = invalidOrigin, checkOpenIDConfig = false, timeoutMs,
  } = {}) {
    const origin = new URL(endpoint).origin;
    const response = await request(endpoint, {}, timeoutMs);
    await response.body?.cancel();
    const metadataUrl = new URL(assertChallenge(response, 'Unauthenticated MCP GET'));
    check.ok(metadataUrl.origin === origin, 'MCP advertises protected resource metadata on its own origin');
    const urls = new Set([metadataUrl.href, ...extraProtectedResourcePaths.map(path => {
      const url = new URL(path, origin);
      check.ok(url.origin === origin, 'Protected resource metadata paths stay on the MCP origin');
      return url.href;
    })]);
    const documents = await Promise.all([...urls].map(url => metadataDocument(url, 'Protected resource metadata', timeoutMs)));
    const protectedResource = documents[0];
    const issuer = expectedIssuer ?? protectedResource.authorization_servers?.[0];
    check.ok(nonempty(issuer), 'Protected resource metadata names an authorization server');
    for (const document of documents) {
      check.ok(document.resource === expectedResource, 'Protected resource metadata names the expected resource');
      check.ok(Array.isArray(document.authorization_servers) && document.authorization_servers.includes(issuer), 'Protected resource metadata lists the expected issuer');
    }
    const issuerUrl = new URL(issuer);
    check.ok(expectedIssuer || issuerUrl.origin === origin, 'Set expectedIssuer to verify metadata on a different origin');
    const authorizationServerUrl = new URL('/.well-known/oauth-authorization-server' + issuerUrl.pathname.replace(/\/$/, ''), issuerUrl);
    const authorizationServer = await metadataDocument(authorizationServerUrl, 'Authorization server metadata', timeoutMs);
    check.ok(authorizationServer.issuer === issuer, 'Authorization server metadata names the expected issuer');
    check.ok(nonempty(authorizationServer.authorization_endpoint) && nonempty(authorizationServer.token_endpoint), 'Authorization server metadata names authorization and token endpoints');
    check.ok(Array.isArray(authorizationServer.code_challenge_methods_supported) && authorizationServer.code_challenge_methods_supported.includes('S256'), 'Authorization server metadata advertises S256 PKCE');

    if (checkOpenIDConfig) {
      const oidcUrl = new URL(issuerUrl.pathname.replace(/\/$/, '') + '/.well-known/openid-configuration', issuerUrl);
      const oidc = await metadataDocument(oidcUrl, 'OpenID configuration', timeoutMs);
      check.equal(oidc.issuer, authorizationServer.issuer, 'OpenID configuration issuer matches authorization server');
      check.equal(oidc.authorization_endpoint, authorizationServer.authorization_endpoint, 'OpenID authorization_endpoint matches authorization server');
      check.equal(oidc.token_endpoint, authorizationServer.token_endpoint, 'OpenID token_endpoint matches authorization server');
    }

    if (checkPreflight) {
      for (const target of [metadataUrl.href, authorizationServerUrl.href]) {
        const preflight = await request(target, {
          method: 'OPTIONS',
          headers: {origin: preflightOrigin, 'access-control-request-method': 'GET'},
        }, timeoutMs);
        await preflight.body?.cancel();
        check.ok(preflight.ok, `OPTIONS preflight accepted for ${new URL(target).pathname}`);
        check.ok(['*', preflightOrigin].includes(preflight.headers.get('access-control-allow-origin')), 'OPTIONS preflight allows origin');
      }
    }

    for (const removed of removedPaths) {
      const target = new URL(removed, origin);
      for (const method of ['GET', 'POST']) {
        const gone = await request(target, {method}, timeoutMs);
        await gone.body?.cancel();
        check.equal(gone.status, 404, `Removed endpoint ${method} ${target.pathname} returns 404`);
        check.ok(!gone.headers.has('www-authenticate'), `Removed endpoint ${method} ${target.pathname} omits WWW-Authenticate`);
      }
    }

    return {protectedResource, authorizationServer};
  }

  function assertRpc(response, label, {expectRpcError = false, maxChars = resultLimit} = {}) {
    const {status, headers, body, result, error, chars} = response;
    check.ok(status === 200 || (expectRpcError && error && status >= 400 && status < 500), label + ' returns an MCP response (HTTP ' + status + ')');
    check.ok(jsonType.test(headers.get('content-type')), label + ' uses application/json');
    check.ok(!headers.has('mcp-session-id'), label + ' has no MCP session ID');
    const matched = (object(result) && error === undefined) || (object(error) && result === undefined);
    check.ok(body?.jsonrpc === '2.0' && body.id === 1 && matched, label + ' returns a matched JSON-RPC envelope');
    check.ok(expectRpcError || !error, label + ' succeeds without a JSON-RPC error');
    check.ok(chars <= maxChars, label + ' result is ' + chars + ' characters, limit ' + maxChars);
    return result;
  }

  async function assertToolCall(endpoint, {token, name, arguments: args = {}, expectError = false, maxChars = resultLimit, protocolVersion = version} = {}) {
    const response = await call(endpoint, {token, method: 'tools/call', params: {name, arguments: args}, protocolVersion});
    const label = 'Tool ' + name;
    const result = assertRpc(response, label, {expectRpcError: expectError, maxChars});
    check.equal(Boolean(response.error || result?.isError === true), expectError, label + ' has the expected error status');
    return response;
  }

  async function assertTransport(endpoint, {token, protocolVersion}) {
    await Promise.all(['GET', 'DELETE'].map(async method => {
      const headers = {accept: 'text/event-stream', 'mcp-protocol-version': protocolVersion};
      const anonymous = await request(endpoint, {method, headers});
      await anonymous.body?.cancel();
      assertChallenge(anonymous, 'Unauthenticated MCP ' + method);
      const authenticated = await request(endpoint, {method, headers: {...headers, authorization: 'Bearer ' + token}});
      await authenticated.body?.cancel();
      check.equal(authenticated.status, 405, 'Authenticated MCP ' + method + ' is disabled');
      check.equal(authenticated.headers.get('allow'), 'POST', 'MCP ' + method + ' allows POST only');
    }));
    assertChallenge(await call(endpoint, {method: 'tools/list', protocolVersion}), 'Unauthenticated MCP POST');
    const forbidden = await call(endpoint, {token, method: 'tools/list', protocolVersion, headers: {origin: invalidOrigin}});
    check.equal(forbidden.status, 403, 'MCP rejects a foreign Origin even with a valid token');
  }

  async function assertServerContract(endpoint, {
    token, protocolVersion = version, requiredTools = [], requireProfileTool = false, requireIcons = false,
    verifyIconUrls = true, requireToolAnnotations = false, noExternalBundleRefs = true,
    requireWebsite = false, requireDescription = false, maxInstructionsParagraph = 512, maxResultChars = resultLimit,
    expectedAppHashes = {}, timeoutMs,
  } = {}) {
    check.ok(nonempty(token), 'Provide a QA bearer token for the authenticated MCP contract');
    await assertTransport(endpoint, {token, protocolVersion});
    const rpc = async (method, params, maxChars = maxResultChars) => assertRpc(
      await call(endpoint, {token, protocolVersion, method, params}), method, {maxChars},
    );
    const legacy = protocolVersion < version;
    const discovery = legacy
      ? await rpc('initialize', {protocolVersion, capabilities: {}, clientInfo: {name: 'project-qa', version: '1.0.0'}})
      : await rpc('server/discover');
    if (legacy) check.equal(discovery.protocolVersion, protocolVersion, 'MCP negotiates the requested legacy version');
    else check.ok(discovery.supportedVersions?.includes(protocolVersion), 'MCP advertises the requested protocol version');
    const serverInfo = legacy ? discovery.serverInfo : discovery._meta?.['io.modelcontextprotocol/serverInfo'];
    check.ok(nonempty(serverInfo?.name) && nonempty(serverInfo.version), 'MCP discovery returns serverInfo name and version');
    if (requireIcons) {
      check.ok(Array.isArray(serverInfo.icons) && serverInfo.icons.some(icon => nonempty(icon?.src)), 'MCP serverInfo contains icons');
      if (verifyIconUrls) {
        const endpointOrigin = new URL(endpoint).origin;
        for (const icon of serverInfo.icons) {
          if (!nonempty(icon?.src)) continue;
          const iconUrl = new URL(icon.src, endpoint);
          if (verifyIconUrls === 'all' || iconUrl.protocol === 'data:' || iconUrl.origin === endpointOrigin) {
            await verifyIcon(icon, endpoint, timeoutMs);
          }
        }
      }
    }
    if (requireWebsite) check.ok(nonempty(serverInfo.websiteUrl), 'MCP serverInfo contains websiteUrl');
    if (requireDescription) check.ok(nonempty(serverInfo.description), 'MCP serverInfo contains a description');
    const paragraph = (discovery.instructions ?? '').trim().split(/\r?\n[ \t]*\r?\n/, 1)[0];
    check.ok(paragraph.length <= maxInstructionsParagraph, 'MCP instructions first paragraph exceeds ' + maxInstructionsParagraph + ' characters');

    const tools = [];
    const cursors = new Set();
    let cursor;
    do {
      const page = await rpc('tools/list', cursor ? {cursor} : undefined);
      check.ok(Array.isArray(page.tools), 'MCP tools/list returns tools');
      tools.push(...page.tools);
      cursor = page.nextCursor;
      check.ok(!cursor || !cursors.has(cursor), 'MCP tools/list does not repeat a cursor');
      cursors.add(cursor);
    } while (cursor);
    for (const name of requiredTools) check.ok(tools.some(tool => tool.name === name), 'MCP tools/list includes ' + name);
    if (requireToolAnnotations) {
      for (const tool of tools) {
        check.ok(
          object(tool.annotations) && ['readOnlyHint', 'destructiveHint', 'openWorldHint'].some(key => typeof tool.annotations[key] === 'boolean'),
          `Tool ${tool.name} declares safety annotations`,
        );
      }
    }

    if (requireProfileTool) {
      const profiles = tools.filter(tool => tool._meta?.['openai/profile'] === true);
      check.equal(profiles.length, 1, 'MCP has one designated profile tool');
      const [profile] = profiles;
      check.ok(object(profile.outputSchema) && profile.annotations?.readOnlyHint === true, 'MCP profile tool is read-only and publishes an outputSchema');
      const {result} = await assertToolCall(endpoint, {token, name: profile.name, protocolVersion, maxChars: maxResultChars});
      check.ok(nonempty(result.structuredContent?.id), 'MCP profile returns a non-empty structured id');
    }

    const expectedApps = Object.entries(expectedAppHashes);
    const views = new Map();
    for (const tool of tools) {
      const uri = tool._meta?.ui?.resourceUri;
      const flat = tool._meta?.['ui/resourceUri'];
      if (uri === undefined && flat === undefined) continue;
      check.ok(typeof uri === 'string' && uri.startsWith('ui://') && uri === flat, 'Tool ' + tool.name + ' declares matching ui.resourceUri and ui/resourceUri');
      views.set(uri, undefined);
    }
    for (const uri of views.keys()) {
      const result = await rpc('resources/read', {uri}, Infinity);
      const view = result.contents?.find(item => item.uri === uri && item.mimeType === uiMime);
      check.ok(nonempty(view?.text), 'MCP app resource returns HTML with the MCP app MIME type');
      check.ok(object(view._meta?.ui?.csp), 'MCP app resource declares ui.csp');
      if (noExternalBundleRefs) {
        const strippedHtml = view.text.replace(/<script\b(?![^>]*\bsrc\s*=)[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
        check.ok(!externalBundleRef.test(strippedHtml), `MCP app resource ${uri} inlines scripts and stylesheets without external bundle tags`);
      }
      if (expectedApps.length) views.set(uri, createHash('sha256').update(view.text).digest('hex'));
    }
    for (const [name, hash] of expectedApps) {
      const uri = tools.find(tool => tool.name === name)?._meta?.ui?.resourceUri;
      check.ok(views.has(uri), name + ' advertises an MCP app');
      check.equal(views.get(uri), hash, name + ' serves the expected MCP app build');
    }
    return {serverInfo, instructions: discovery.instructions, tools};
  }

  async function assertOAuthNegativeBoundaries(baseUrl, {registerEndpoint, authorizeEndpoint, tokenEndpoint, protectedResource} = {}) {
    const resource = new URL(protectedResource, baseUrl).href;
    if (registerEndpoint) {
      const response = await request(new URL(registerEndpoint, baseUrl), {
        method: 'POST', headers: {'content-type': 'application/json'},
        body: JSON.stringify({client_name: 'Project QA invalid registration', redirect_uris: [invalidOrigin + '/callback#invalid']}),
      });
      check.equal(response.status, 400, 'OAuth registration rejects an invalid redirect URI');
      check.equal((await response.json()).error, 'invalid_redirect_uri', 'OAuth registration reports invalid_redirect_uri');
    }

    const authorizeUrl = new URL(authorizeEndpoint, baseUrl);
    for (const [key, value] of Object.entries({
      response_type: 'code', client_id: 'qa-invalid-client', redirect_uri: invalidOrigin + '/callback',
      resource,
    })) authorizeUrl.searchParams.set(key, value);
    const authorization = await request(authorizeUrl);
    await authorization.body?.cancel();
    check.ok(!authorization.headers.has('location'), 'OAuth authorization does not redirect to an unregistered URI');
    check.equal(authorization.status, 400, 'OAuth authorization rejects an unknown client and unregistered redirect');

    for (const [grant_type, credential, expectedError] of [
      ['password', {}, 'unsupported_grant_type'],
      ['authorization_code', {code: 'qa-invalid-code'}, 'invalid_grant'],
      ['refresh_token', {refresh_token: 'qa-invalid-refresh'}, 'invalid_grant'],
    ]) {
      const response = await request(new URL(tokenEndpoint, baseUrl), {
        method: 'POST', body: new URLSearchParams({grant_type, client_id: 'qa-invalid-client', resource, ...credential}),
      });
      check.ok([400, 401].includes(response.status), 'OAuth token endpoint rejects ' + grant_type);
      const body = await response.json();
      check.ok(body.error === 'invalid_client' || (response.status === 400 && body.error === expectedError), 'OAuth token endpoint reports invalid_client or ' + expectedError);
      check.ok(!body.access_token && !body.refresh_token, 'OAuth rejection issues no tokens');
    }
  }

  return {discoverOAuth, call, assertServerContract, assertToolCall, assertOAuthNegativeBoundaries};
}

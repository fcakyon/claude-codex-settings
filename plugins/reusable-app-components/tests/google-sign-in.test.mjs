import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
let browser, server, origin, temporary, ssr;
const submissions = [];
const accounts = new Map();
let pendingStarted, pendingClosed;

before(async () => {
  temporary = await mkdtemp(path.join(root, '.test-'));
  await build({entryPoints: [path.join(root, 'tests/fixture.tsx')], bundle: true, outfile: path.join(temporary, 'fixture.js'), jsx: 'automatic'});
  await build({
    stdin: {contents: `import {renderToString} from 'react-dom/server';
      import {GoogleSignIn} from './skills/app-auth/assets/GoogleSignIn';
      export const html = renderToString(<GoogleSignIn identity={null} clientId="fixture-client" locale="en"
        accountHint="" redirectEndpoint="/auth/google/login" returnTo="/en?filter=active#details"
        copy={{fallback:'Continue in this tab',anotherAccount:'Use another account',pending:'Signing in'}}
        onCredential={async()=>null} onAuthenticated={()=>{}} onFailure={()=>'Failed'} onUseAnotherAccount={()=>{}} />);`,
      resolveDir: root, loader: 'tsx'},
    bundle: true, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', outfile: path.join(temporary, 'ssr.cjs'),
  });
  ssr = createRequire(import.meta.url)(path.join(temporary, 'ssr.cjs')).html;
  server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname.startsWith('/email/')) {
      let raw = ''; for await (const chunk of request) raw += chunk;
      const input = JSON.parse(raw);
      if(url.searchParams.has('email-delay')){ pendingStarted(); response.on('close',()=>pendingClosed()); return; }
      let result = {}, status = 200;
      const account = accounts.get(input.email);
      if(url.pathname==='/email/register'){
        if(account){ status=409;result={reason:'email-exists'}; }
        else accounts.set(input.email,{password:input.password,verified:false,code:'123456'});
      }else if(url.pathname==='/email/send-code'){ account.code='654321'; }
      else if(url.pathname==='/email/verify'||url.pathname==='/email/verify-reset'){
        if(input.code!==account.code){status=400;}
        else{account.code='';account.verified=true;result=url.pathname.endsWith('verify-reset')?{ticket:input.email}:{email:input.email};}
      }else if(url.pathname==='/email/reset'){
        const saved=accounts.get(input.recovery.ticket);saved.password=input.password;result={email:input.recovery.ticket};
      }else if(url.pathname==='/email/login'){
        if(!account||account.password!==input.password){status=401;}
        else if(!account.verified){status=403;result={reason:'verification-needed'};}
        else result={email:input.email};
      }
      response.writeHead(status,{'Content-Type':'application/json'});response.end(JSON.stringify(result));
    } else if (url.pathname === '/session') {
      let body = ''; for await (const chunk of request) body += chunk;
      submissions.push(JSON.parse(body));
      if (url.searchParams.has('delay')) {
        pendingStarted();
        response.on('close', () => pendingClosed());
        return;
      }
      const status = Number(url.searchParams.get('status') ?? 200);
      response.writeHead(status, {'Content-Type': 'application/json'});
      response.end(status === 200 ? JSON.stringify({email: 'verified@example.test'}) : 'private provider diagnostics');
    } else if (url.pathname === '/auth/google/login') {
      response.writeHead(302, {Location: '/provider?' + url.searchParams}); response.end();
    } else if (url.pathname === '/provider') {
      response.end('Local provider fixture');
    } else if (url.pathname === '/example-logo.svg') {
      response.setHeader('Content-Type', 'image/svg+xml');
      response.end(await readFile(path.join(root, 'tests/example-logo.svg')));
    } else if (url.pathname === '/fixture.js' || url.pathname === '/fixture.css') {
      response.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css');
      response.end(await readFile(path.join(temporary, url.pathname.slice(1))));
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="stylesheet" href="/fixture.css"><style>body{margin:0;padding:24px;font:16px system-ui;color:#f5f5f7;background:#09090d}main{max-width:440px;margin:clamp(24px,10vh,100px) auto}.fixture-google-button{width:100%;min-height:44px;border:1px solid #777781;border-radius:6px;background:#24242d;color:#fff;font:500 14px system-ui}.fixture-note{color:#a3a3af;font-size:12px;text-align:center;margin:24px 0}details{margin-top:40px;color:#a3a3af;font-size:12px}details button{margin:12px 8px 0 0;min-height:44px}</style>
        <div id="root">${url.pathname === '/no-js' ? ssr : ''}</div>${url.pathname === '/no-js' ? '' : '<script src="/fixture.js"></script>'}</html>`);
    }
  }).listen(0, '127.0.0.1');
  await once(server, 'listening'); origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true});
});

after(async () => {
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if (temporary) await rm(temporary, {recursive: true, force: true});
});

test('server-rendered fallback works without JavaScript and preserves the root action', async () => {
  const context = await browser.newContext({javaScriptEnabled: false});
  try {
    const page = await context.newPage(); await page.goto(origin + '/no-js');
    await page.getByRole('link', {name: 'Continue in this tab'}).click();
    await page.waitForURL('**/provider?**');
    assert.equal(new URL(page.url()).searchParams.get('returnTo'), '/en?filter=active#details');
    assert.equal(context.pages().length, 1);
  } finally { await context.close(); }
});

test('missing SDK still offers account switching and same-tab navigation', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin + '/?sdk=missing');
    const link = page.getByRole('link', {name: 'Having trouble? Continue in this tab'});
    assert.equal(new URL(await link.getAttribute('href'), origin).searchParams.get('login_hint'), 'returning@example.test');
    await page.getByRole('button', {name: 'Use a different Google account'}).click();
    await link.click(); await page.waitForURL('**/provider?**');
    const query = new URL(page.url()).searchParams;
    assert.equal(query.has('login_hint'), false);
    assert.equal(query.get('prompt'), 'select_account');
    assert.equal(query.get('returnTo'), '/workspace?filter=active#details');
    assert.equal(page.context().pages().length, 1);
  } finally { await page.close(); }
});

test('credential transport reaches the host and resumes with its verified user', async () => {
  const page = await browser.newPage(); const initial = submissions.length;
  try {
    await page.goto(origin);
    await page.getByRole('button', {name: 'Test Google sign-in'}).click();
    await page.getByText('Signed in as verified@example.test', {exact: true}).waitFor();
    assert.deepEqual(submissions.slice(initial), [{credential: 'fixture-credential'}]);
  } finally { await page.close(); }
});

for (const status of [401, 429, 500]) test(`HTTP ${status} is visible, redacted and retryable`, async () => {
  const page = await browser.newPage();
  try {
    await page.goto(origin + '/?status=' + status);
    await page.getByRole('button', {name: 'Test Google sign-in'}).click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByRole('alert').innerText(), status === 429 ? 'Please wait before retrying.' : 'Sign-in failed. Try again.');
    assert.equal((await page.locator('body').innerText()).includes('private provider diagnostics'), false);
    await page.getByText('Failures reported: 1', {exact: true}).waitFor();
    assert.equal(await page.getByRole('link', {name: 'Having trouble? Continue in this tab'}).isVisible(), true);
    assert.equal(await page.getByRole('button', {name: 'Test Google sign-in'}).isEnabled(), true);
  } finally { await page.close(); }
});

for (const action of ['Close sign-in', 'Unload SDK']) test(`${action} cancels transport and restores usable UI`, {timeout: 10000}, async () => {
  const page = await browser.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(origin + '/?delay=1');
    const started = new Promise(resolve => { pendingStarted = resolve; });
    const closed = new Promise(resolve => { pendingClosed = resolve; });
    await page.getByRole('button', {name: 'Test Google sign-in'}).click();
    await started;
    await page.getByText('Signing in…', {exact: true}).waitFor();
    assert.equal(await page.getByRole('link', {name: 'Having trouble? Continue in this tab'}).count(), 0);
    const initial = submissions.length;
    await page.getByRole('button', {name: action, exact: true}).click();
    await page.getByText('Cancelled: true', {exact: true}).waitFor();
    await page.getByRole('button', {name: 'Deliver late SDK event'}).click();
    await page.getByText('Signed out', {exact: true}).waitFor();
    assert.equal(submissions.length, initial);
    await closed;
    assert.deepEqual(errors, []);
    if (action === 'Close sign-in') await page.getByRole('button', {name: 'Open sign-in'}).click();
    await page.getByRole('link', {name: 'Having trouble? Continue in this tab'}).waitFor({timeout: 5000});
  } finally { await page.close(); }
});

for (const [locale, width] of [['en', 1365], ['tr', 390]]) test(`${locale} at ${width}px keeps focus and controls usable`, async () => {
  const page = await browser.newPage({viewport: {width, height: 900}});
  try {
    await page.goto(origin + '/?lang=' + locale);
    const link = page.getByRole('link', {name: locale === 'en' ? 'Having trouble? Continue in this tab' : 'Sorun mu yaşıyorsun? Bu sekmede devam et'});
    await link.waitFor();
    assert.ok((await link.boundingBox()).height >= 44);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole('button', {name: 'Test Google sign-in'}).focus();
    await page.keyboard.press('Tab');
    assert.equal(await link.evaluate(element => element === document.activeElement && getComputedStyle(element).outlineStyle !== 'none'), true);
    if (process.env.COMPONENT_SCREENSHOT_DIR) {
      await mkdir(process.env.COMPONENT_SCREENSHOT_DIR, {recursive: true});
      await page.getByText('Test controls', {exact: true}).click();
      await page.screenshot({path: path.join(process.env.COMPONENT_SCREENSHOT_DIR, `${locale}-${width}.png`)});
      await page.locator(".app-auth-panel").screenshot({path:path.join(process.env.COMPONENT_SCREENSHOT_DIR,`google-${locale}-${width}-panel.png`)});
      if(locale === "en"){await page.setViewportSize({width:390,height:844});await page.locator(".app-auth-panel").screenshot({path:path.join(process.env.COMPONENT_SCREENSHOT_DIR,"google-en-390-panel.png")});}
    }
  } finally { await page.close(); }
});

for(const locale of ['en','tr'])test('email signup, existing-email login and recovery in '+locale,async()=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const email='viewer-'+locale+'@example.test'; const tr=locale==='tr';
  try{
    await page.goto(origin+'/?email=1&mode=signup&lang='+locale);
    const form=page.locator('.app-email-auth');
    assert.equal(await form.locator('input:not([type=checkbox])').count(),2);
    if(process.env.COMPONENT_SCREENSHOT_DIR){await mkdir(process.env.COMPONENT_SCREENSHOT_DIR,{recursive:true});await page.locator('.app-auth-panel').screenshot({path:path.join(process.env.COMPONENT_SCREENSHOT_DIR,`email-${locale}-390-panel.png`)});}
    await form.getByLabel(tr?'E-posta':'Email',{exact:true}).fill(email);
    await form.getByLabel(tr?'Şifre':'Password',{exact:true}).fill('first-password');
    await form.getByRole('button',{name:tr?'Göster':'Show',exact:true}).click();
    assert.equal(await form.locator('input[name=password]').getAttribute('type'),'text');
    await form.getByRole('checkbox').check();
    await form.getByRole('button',{name:tr?'Devam et':'Continue',exact:true}).click();
    await form.getByRole('heading',{name:tr?'E-postanı kontrol et':'Check your email'}).waitFor();
    await form.getByLabel(tr?'Kod':'Code',{exact:true}).fill('000000');
    await form.getByRole('button',{name:tr?'Devam et':'Continue',exact:true}).click();
    await form.getByRole('alert').waitFor();
    await form.getByRole('button',{name:tr?'Yeni kod gönder':'Send a new code',exact:true}).click();
    await form.getByLabel(tr?'Kod':'Code',{exact:true}).fill('654321');
    await form.getByRole('button',{name:tr?'Devam et':'Continue',exact:true}).click();
    await page.getByText('Signed in as '+email,{exact:true}).waitFor();
    await page.reload();
    await form.getByLabel(tr?'E-posta':'Email',{exact:true}).fill(email);
    await form.getByLabel(tr?'Şifre':'Password',{exact:true}).fill('first-password');
    await form.getByRole('checkbox').check();
    await form.getByRole('button',{name:tr?'Devam et':'Continue',exact:true}).click();
    await form.getByRole('alert').waitFor();
    await form.getByRole('button',{name:tr?'Giriş yap':'Log in',exact:true}).click();
    assert.equal(await form.locator('input[type=email]').inputValue(),email);
    await form.getByRole('button',{name:tr?'Şifremi unuttum?':'Forgot password?',exact:true}).click();
    assert.equal(await form.locator('input[type=email]').inputValue(),email);
    await form.getByRole('button',{name:tr?'Kod gönder':'Send code',exact:true}).click();
    await form.getByLabel(tr?'Kod':'Code',{exact:true}).fill('654321');
    await form.getByRole('button',{name:tr?'Devam et':'Continue',exact:true}).click();
    await form.getByLabel(tr?'Yeni şifre':'New password',{exact:true}).fill('new-password');
    await form.getByRole('button',{name:tr?'Şifreyi kaydet':'Save password',exact:true}).click();
    await page.getByText('Signed in as '+email,{exact:true}).waitFor();
    assert.equal(accounts.get(email).password,'new-password');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  }finally{await page.close()}
});

test('closing a pending email request cancels it without a stale completion',async()=>{
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.goto(origin+'/?email=1&email-delay=1');
    await page.getByLabel('Email',{exact:true}).fill('cancel@example.test');
    await page.getByLabel('Password',{exact:true}).fill('some-password');
    const started=new Promise(resolve=>{pendingStarted=resolve});const closed=new Promise(resolve=>{pendingClosed=resolve});
    await page.getByRole('button',{name:'Log in',exact:true}).click();await started;
    await page.getByRole('button',{name:'Close email form',exact:true}).click();await closed;
    await page.getByRole('button',{name:'Open email form',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Log in',exact:true}).isEnabled(),true);
    assert.equal(await page.getByText('Signed out',{exact:true}).isVisible(),true);
    assert.deepEqual(errors,[]);
  }finally{await page.close()}
});

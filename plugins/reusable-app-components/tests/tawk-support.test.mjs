import assert from 'node:assert/strict';
import {after,before,test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const root=path.dirname(path.dirname(new URL(import.meta.url).pathname));
let temporary,server,browser,origin,identityStarted;
before(async()=>{
  temporary=await mkdtemp(path.join(root,'.test-tawk-'));
  await build({entryPoints:[path.join(root,'tests/tawk-fixture.tsx')],bundle:true,outfile:path.join(temporary,'fixture.js'),jsx:'automatic'});
  server=createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/fixture.js'){res.setHeader('content-type','text/javascript');res.end(await readFile(path.join(temporary,'fixture.js')));return;}
    if(url.pathname==='/identity'){
      const account=/fixture-account=([ab])/.exec(req.headers.cookie||'')?.[1];
      if(account&&url.searchParams.has('delay')){identityStarted?.();await new Promise(resolve=>setTimeout(resolve,250));}
      if(url.searchParams.has('fail')){res.writeHead(503);res.end('private backend data');return;}
      res.setHeader('content-type','application/json');
      if(!account){res.writeHead(204);res.end();return;}
      res.end(JSON.stringify({userId:account,hash:'server-signed-'+account,name:'QA '+account,email:account+'@example.test'}));return;
    }
    res.setHeader('content-type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/fixture.js"></script>');
  }).listen(0,'127.0.0.1');
  await once(server,'listening');origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,headless:true});
});
after(async()=>{await browser?.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}if(temporary)await rm(temporary,{recursive:true,force:true});});

test('chat follows verified account switches, guest logout and text versions',async()=>{
  const page=await browser.newPage();try{
    await page.goto(origin);await page.getByRole('status').filter({hasText:'Guest'}).waitFor();
    await page.getByRole('button',{name:'Account A',exact:true}).click();await page.getByRole('status').filter({hasText:'a@example.test'}).waitFor();
    await page.getByRole('button',{name:'Open chat',exact:true}).click();await page.getByText('v156.0.0.0',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Account B',exact:true}).click();await page.getByRole('status').filter({hasText:'b@example.test'}).waitFor();
    await page.getByRole('button',{name:'Log out',exact:true}).click();await page.getByRole('status').filter({hasText:'Guest'}).waitFor();
    assert.equal(await page.getByLabel('Identity history').innerText(),'a@example.test,b@example.test');
  }finally{await page.close();}
});

for(const action of ['Log out','Close owner'])test('pending identity is cancelled on '+action.toLowerCase(),async()=>{
  const page=await browser.newPage();try{
    await page.goto(origin+'/?delay');
    const started=new Promise(resolve=>{identityStarted=resolve;});
    await page.getByRole('button',{name:'Account A',exact:true}).click();await started;
    await page.getByRole('button',{name:action,exact:true}).click();
    await page.waitForTimeout(400);
    assert.equal(await page.getByRole('status').innerText(),'Guest');
    assert.equal(await page.getByLabel('Identity history').innerText(),'');
    assert.equal(await page.getByRole('alert').count(),0);
  }finally{identityStarted=undefined;await page.close();}
});

test('transport errors reach the host and hidden state survives SDK re-entry',async()=>{
  const page=await browser.newPage();try{
    await page.goto(origin+'/?fail');await page.getByRole('alert').waitFor();
    assert.equal(await page.getByRole('alert').innerText(),'Support could not sync. Try again.');
    assert.equal((await page.locator('body').innerText()).includes('Private transport diagnostics'),false);
    await page.getByRole('button',{name:'Toggle hidden',exact:true}).click();await page.getByLabel('Chat widget').waitFor({state:'hidden'});
    await page.getByRole('button',{name:'Toggle SDK',exact:true}).click();await page.getByRole('button',{name:'Toggle SDK',exact:true}).click();await page.getByLabel('Chat widget').waitFor({state:'hidden'});
    await page.getByRole('button',{name:'Toggle hidden',exact:true}).click();await page.getByLabel('Chat widget').waitFor({state:'visible'});
  }finally{await page.close();}
});

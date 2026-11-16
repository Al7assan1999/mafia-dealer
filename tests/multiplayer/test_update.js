// Rematch (single phone + host), update banner, old-version warnings in the lobby.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const PY=process.platform==='win32'?'python':'python3';
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},keep(){},put(k,v){try{X('POST','/__put',JSON.stringify({k,v}))}catch(e){}},take(){try{const r=X('GET','/__take');return r==='\u0000'?null:r}catch(e){return null}},clear(){try{X('GET','/__clear')}catch(e){}},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const srv=spawn(PY,['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name,ver)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();
   p.on('pageerror',e=>errs.push(name+': '+e.message));
   await p.route('**/version.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(ver||{code:1,name:'1.0',url:'https://x.invalid/a.apk'})}));
   if(shim)await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;S.rules.skip=false;save();window.__open=[];window.open=u=>__open.push(u);},name);return p;};
 // update banner
 const u=await mk(null,'U',{code:99,name:'9.9',url:'https://mafia-relay.mafiadealer.workers.dev/MafiaDealer.apk',notes:'New voices'});
 await u.evaluate(()=>checkUpdate(true));await u.waitForSelector('.banner.upd',{timeout:8000});
 ok((await u.textContent('.banner.upd')).includes('9.9'),'newer version on the relay: "Update available: v9.9" on Home');
 await u.click('.banner.upd .btn');ok((await u.evaluate(()=>__open[0]))===('https://mafia-relay.mafiadealer.workers.dev/MafiaDealer.apk'),'Update opens the download link');
 const same=await mk(null,'S2');await same.evaluate(()=>checkUpdate(true));await same.waitForTimeout(800);
 ok(!(await same.$('.banner.upd')),'same or older version on the relay: no banner');
 ok((await same.textContent('.ver')).includes('v'+await same.evaluate(()=>APP.name)),'version shown on Home');
 // Check for updates button: up to date / newer / offline
 await same.evaluate(()=>nav('settings'));await same.click('#chk');
 ok(await same.waitForFunction(()=>/latest version/.test(document.getElementById('toast').textContent),null,{timeout:10000}).then(()=>true,()=>false),'Check for updates (same version): "You have the latest version"');
 await same.unroute('**/version.json');await same.route('**/version.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({code:999,name:'9.9.9',url:'https://x.invalid/b.apk'})}));
 await same.click('#chk');await same.waitForFunction(()=>V==='home'&&document.querySelector('.banner.upd'),null,{timeout:8000});
 ok((await same.textContent('.banner.upd')).includes('9.9.9'),'Check for updates (newer): goes Home and shows the Update banner');
 await same.unroute('**/version.json');await same.route('**/version.json',r=>r.abort());await same.waitForTimeout(2800);
 await same.click('.ver');await same.waitForFunction(()=>/connection/i.test(document.getElementById('toast').textContent),null,{timeout:15000});
 ok(true,'Check for updates offline: says there is no connection');
 await same.unroute('**/version.json');await same.route('**/version.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({code:1,name:'1.0',url:'https://x.invalid/a.apk'})}));
 await same.evaluate(()=>{S.latest=null;save();render();});
 // single-phone rematch
 await same.evaluate(()=>nav('setup'));await same.click('.cta .btn');
 const before=await same.evaluate(()=>({names:G.names.join(),log:S.log.length}));
 await same.evaluate(()=>{G.phase='end';G.winner='citizens';G.revealed=true;render();});await same.click('button:has-text("Valid")');
 await same.click('button:has-text("Play again")');
 const after=await same.evaluate(()=>({names:G&&G.names.join(),phase:G&&G.phase,log:S.log.length}));
 ok(after.names===before.names&&after.phase==='deal'&&after.log===before.log+1,'Play again: same players, straight to dealing, finished game saved');
 // lobby: an old app joins a new host, and a new app joins with an old one present
 const host=await mk(hostShim,'Alhassan');await host.click('text=Play Together');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const old=await mk(clientShim,'Dareer');await old.evaluate(()=>{APP.code=5;});await old.click('text=Play Together');await old.click('#mode-wifi');await old.click('.big2 .btn.ghost');
 const P=[old];for(const n of ['Sami','Hokan']){const c=await mk(clientShim,n);await c.click('text=Play Together');await c.click('#mode-wifi');await c.click('.big2 .btn.ghost');P.push(c);}
 for(const c of P)await c.waitForFunction(()=>MP.status==='ok',null,{timeout:20000});
 await host.waitForFunction(()=>document.querySelectorAll('.prs .oldv').length===1,null,{timeout:8000});
 ok((await host.textContent('.prs:has(.oldv)')).includes('Dareer'),'host lobby marks Dareer "old version"');
 await old.waitForSelector('.banner',{timeout:8000});ok((await old.textContent('.banner')).includes('newer version'),'old app is told the host is newer');
 ok(!(await P[1].$('.banner')),'up-to-date player gets no warning');
 // host rematch
 await host.evaluate(()=>{S.counts={mafia:1,doctor:0,detective:0};render();});await host.click('button:has-text("Deal roles")');
 for(const c of P){await c.waitForFunction(()=>MP.room&&MP.room.g,null,{timeout:8000});await c.dispatchEvent('#hold','mousedown');await c.dispatchEvent('#hold','mouseup');await c.click('#memo');}
 await host.dispatchEvent('#hold','mousedown');await host.dispatchEvent('#hold','mouseup');await host.click('#memo');await host.click('button:has-text("Start Night 1")');
 const deal1=await host.evaluate(()=>MP.game.deal);
 await host.evaluate(()=>{G.phase='end';G.winner='mafia';G.revealed=true;render();});await host.click('button:has-text("Valid")');await host.click('button:has-text("Play again")');
 await P[1].waitForFunction(d=>MP.room&&MP.room.g&&MP.room.g.deal!==d&&!MP.room.g.ph,deal1,{timeout:10000});
 ok(await host.evaluate(()=>!G&&!!MP.game&&MP.game.ids.length===4&&S.log.length>=1),'host Play again: new roles dealt to the same 4 phones, game saved');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

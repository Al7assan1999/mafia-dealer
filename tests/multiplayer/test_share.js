// Share room: Wi-Fi host (hotspot text: no own IP in the test), Wi-Fi player (host address), online host + player (room code).
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const PY=process.platform==='win32'?'python':'python3',RELAY=process.argv[2]||'wss://mafia-relay.mafiadealer.workers.dev';
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.__sh=[];window.Net={start(){},keep(){},share(t){__sh.push(t)},put(k,v){try{X('POST','/__put',JSON.stringify({k,v}))}catch(e){}},take(){try{const r=X('GET','/__take');return r==='\u0000'?null:r}catch(e){return null}},clear(){try{X('GET','/__clear')}catch(e){}},ip(){return '0,0'}};};
const clientShim=()=>{window.__sh=[];window.Net={start(){},share(t){__sh.push(t)},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const signup=(p,n)=>p.evaluate(n=>aReq('/acc/signup',{uname:(n.replace(/[^A-Za-z0-9]/g,'')+Math.random().toString(36).slice(2,8)).slice(0,20),pass:'secret12'}).then(r=>{signedIn(r);return aReq('/acc/profile',{display:n});}).then(j=>{S.acct.u=j.user;S.mpName=n;save();}),n);  // online play needs an account
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const srv=spawn(PY,['mock_srv.py']);await new Promise(r=>setTimeout(r,800));const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
   await p.addInitScript(shim);await p.goto(URL);await p.evaluate(([n,r])=>{S.mpName=n;S.relay=r;save();},[name,RELAY]);await signup(p,name);return p;};
 const h=await mk(hostShim,'Alhassan');await h.click('#mode-wifi');await h.click('.big2 .btn.primary');
 await h.click('button:has-text("Share room address")');ok((await h.evaluate(()=>__sh[0])).includes('hotspot'),'Wi-Fi host without an address shares the hotspot instructions');
 const c=await mk(clientShim,'Sami');await c.click('#mode-wifi');await c.click('.big2 .btn.ghost');
 await c.waitForFunction(()=>MP.status==='ok',null,{timeout:15000});await c.click('button:has-text("Share room address")');
 const ct=await c.evaluate(()=>__sh[0]);ok(ct==='Mafia Dealer room address: 127.0.0.1','Wi-Fi player shares just the host address');
 await h.evaluate(()=>leaveNow());await h.waitForTimeout(500);
 const oh=await mk(clientShim,'Hokan');await oh.click('#mode-online');await oh.click('button:has-text("Host online")');
 await oh.waitForFunction(()=>MP.online&&HN.ws&&HN.ws.readyState===1,null,{timeout:15000});const code=await oh.evaluate(()=>MP.online.code);
 await oh.click('button:has-text("Share room code")');ok((await oh.evaluate(()=>__sh[0])).replace(/\s/g,'').includes(code),'online host shares the room code '+code);
 const op=await mk(clientShim,'Farouq');await op.click('#mode-online');await op.fill('#ocode',code);await op.click('button:has-text("Join online")');
 await op.waitForFunction(()=>MP.status==='ok',null,{timeout:15000});await op.click('button:has-text("Share room code")');
 const pt=await op.evaluate(()=>__sh[0]);ok(pt==='Mafia Dealer room code: '+code,'online player shares just the room code');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

// v2.6: role limits and warnings before leaving / removing.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const PY=process.platform==='win32'?'python':'python3';
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},keep(){},put(k,v){try{X('POST','/__put',JSON.stringify({k,v}))}catch(e){}},take(){try{const r=X('GET','/__take');return r==='\u0000'?null:r}catch(e){return null}},clear(){try{X('GET','/__clear')}catch(e){}},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const srv=spawn(PY,['mock_srv.py']);await new Promise(r=>setTimeout(r,800));const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
   if(shim)await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();},name);return p;};
 const p=await mk(null,'A');
 const setup=async(n,c)=>{await p.evaluate(([n,c])=>{S.players=Array.from({length:n},(x,i)=>'P'+(i+1));S.counts=c;nav('setup');},[n,c]);};
 const st=()=>p.evaluate(()=>({c:Object.assign({},S.counts),err:deckErr(S.players.length,S.players),dis:document.querySelector('.cta .btn').disabled}));
 await setup(4,{mafia:1,doctor:1,detective:1});let r=await st();
 ok(r.c.doctor===1&&r.c.detective===0&&!r.err,'4 players, 1 Mafia: valid; Detective forced to 0 (needs 2+ Mafia), Doctor 1');
 ok(await p.isVisible('.role:has-text("Detective") >> text=needs 2+ Mafia')&&await p.isVisible('.role:has-text("Doctor") >> text=always one'),'Doctor shows "always one", Detective shows "needs 2+ Mafia"');
 ok(await p.isDisabled('.role:has-text("Mafia") .step button:has-text("+")')&&await p.isVisible('.role:has-text("Mafia") >> text=Max 1 Mafia for 4 players'),'4 players: Mafia + is off (2 Mafia would not be 2 fewer than the rest), the row says why');r=await st();ok(r.c.mafia===1&&!r.err,'still 1 Mafia, valid');
 await setup(5,{mafia:2,doctor:1,detective:0});r=await st();ok(r.c.mafia===1&&!r.err&&!r.dis,'5 players with 2 Mafia saved: pulled back to 1 (3 vs 2 is not allowed)');
 await setup(6,{mafia:2,doctor:3,detective:0});r=await st();ok(!r.err&&r.c.doctor===1,'6 players, 2 Mafia: valid; Doctor count can never be more than 1');
 await p.click('.role:has-text("Detective") .step button:has-text("+")');r=await st();
 ok(r.c.detective===1&&await p.isDisabled('.role:has-text("Detective") .step button:has-text("+")'),'with 2 Mafia the Detective can be added, but only one (+ turns off)');
 await p.click('.role:has-text("Mafia") .step button:has-text("−")');r=await st();ok(r.c.mafia===1&&r.c.detective===0,'back to 1 Mafia: Detective is removed automatically');
 await setup(5,{mafia:1,doctor:1,detective:0});ok(await p.evaluate(()=>recMafia(5)===1&&recMafia(10)===3&&recMafia(6)===2),'recommended Mafia always respects the rule');
 // removing a player asks first
 await setup(6,{mafia:1,doctor:1,detective:0});await p.click('.prow .x >> nth=0');ok(await p.isVisible('.sheet:has-text("Remove P1?")'),'removing a player asks first');
 await p.click('.sheet .btn.ghost');ok(await p.evaluate(()=>S.players.length===6),'Cancel keeps the player');
 await p.click('.prow .x >> nth=0');await p.click('.sheet .btn.primary');ok(await p.evaluate(()=>S.players.length===5&&S.players[0]==='P2'),'confirm removes the player');
 // rooms: closing / leaving always asks (button, header arrow, phone Back)
 const h=await mk(hostShim,'Host');await h.click('#mode-wifi');await h.click('.big2 .btn.primary');
 await h.click('button.danger:has-text("Close room")');ok(await h.isVisible('.sheet:has-text("Close")'),'Close room asks even with nobody in it');await h.click('.sheet .btn.ghost');
 await h.click('.top .pill');await h.waitForTimeout(500);ok(await h.isVisible('.sheet')&&await h.evaluate(()=>V==='host'&&MP.role==='host'),'header back arrow asks; room stays open');await h.click('.sheet .btn.ghost');
 await h.evaluate(()=>history.back());await h.waitForTimeout(500);ok(await h.isVisible('.sheet')&&await h.evaluate(()=>MP.role==='host'),'phone Back button asks; room stays open');
 const c=await mk(clientShim,'Pia');await c.click('#mode-wifi');await c.click('.big2 .btn.ghost');await c.waitForFunction(()=>MP.status==='ok',null,{timeout:15000});
 await c.click('button.danger:has-text("Leave")');ok(await c.isVisible('.sheet:has-text("You will leave the room")'),'player Leave in the lobby asks first');
 await c.click('.sheet .btn.primary');await c.waitForTimeout(600);ok(await c.evaluate(()=>MP.role===null&&V==='wifi'),'confirm leaves the room');
 await h.click('.sheet .btn.primary');await h.waitForTimeout(600);ok(await h.evaluate(()=>MP.role===null&&V==='wifi'),'host confirms: room closed');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

// v2.12 minimizing a room (lobby only), on Wi-Fi with the mock server: the bar back, the room keeps running, leaving first,
// pulled back when roles are dealt or when removed.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const srv=spawn(process.platform==='win32'?'python':'python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();},name);return p;};
 const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 const host=await mk(hostShim,'Alhassan');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const cl=[];for(const n of ['Dareer','Sami']){const p=await mk(clientShim,n);await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');await wait(p,()=>MP.status==='ok'&&MP.room&&MP.room.players.length>=2);cl.push(p);}
 const [d,s]=cl;await wait(host,()=>Object.keys(MP.players).length===2);
 // host minimizes
 ok(await host.isVisible('.top .ib[aria-label="Minimize"]'),'host lobby: a Minimize button');
 await host.click('.top .ib[aria-label="Minimize"]');ok(await host.evaluate(()=>V==='home'&&MP.role==='host'),'host minimizes: Home, still hosting');
 ok((await host.textContent('#rbar')).includes('Your room · 3 players'),'bar: "Your room · 3 players"');
 ok(await host.evaluate(()=>{const r=document.querySelector('.pfrow').getBoundingClientRect(),q=document.querySelector('#rbar .rbar').getBoundingClientRect();return r.top>=q.bottom-1;}),'the bar does not cover the Home buttons');
 const th=await host.evaluate(()=>S.theme);await host.click('.corner .ib[aria-label="Theme"], .corner .ib >> nth=1');ok(await host.evaluate(t=>S.theme!==t&&MP.role==='host',th),'change the theme while the room keeps running');
 const late=await mk(clientShim,'Hokan');await late.click('#mode-wifi');await late.click('.big2 .btn.ghost');await wait(late,()=>MP.status==='ok');
 await wait(host,()=>document.querySelector('#rbar').textContent.includes('4 players'));ok(true,'a player joins while minimized: the bar shows 4 players');
 await host.evaluate(()=>nav('settings'));ok(await host.isVisible('#rbar .rbar'),'the bar is on other menus too');
 await host.click('#rbar .rbar');ok(await host.evaluate(()=>V==='host'&&Object.keys(MP.players).length===3)&&!(await host.isVisible('#rbar .rbar')),'Back to room: the lobby with everyone, no bar');
 // a player minimizes
 await d.click('.top .ib[aria-label="Minimize"]');ok(await d.evaluate(()=>V==='home'&&MP.role==='client'&&MP.status==='ok'),'player minimizes: Home, still in the room');
 ok((await d.textContent('#rbar')).includes("In Alhassan's room")&&await d.isVisible('#fdock .fchat'),'bar "In Alhassan\'s room"; the chat button stays');
 // leaving first
 await d.click('#mode-wifi');await d.click('.big2 .btn.primary');ok(await d.isVisible('#modal .sheet:has-text("Leave this room?")'),'hosting while in a room asks to leave first');
 await d.click('#modal .btn.ghost');ok(await d.evaluate(()=>MP.role==='client'&&MP.status==='ok'),'Cancel: still in the room');
 await d.evaluate(()=>{S.players=['A','B','C','D'];nav('setup');});await d.click('.cta .btn');ok(await d.isVisible('#modal .sheet:has-text("Leave this room?")'),'an Offline game asks too');await d.click('#modal .btn.ghost');
 await d.evaluate(()=>nav('home'));
 // roles dealt: pulled back
 await host.evaluate(()=>{S.counts={mafia:1,doctor:1,detective:0};render();});await host.click('text=Deal roles');
 await wait(d,()=>V==='join'&&MP.room&&MP.room.g);ok(await d.evaluate(()=>!!document.querySelector('#hold')),'roles dealt: the minimized player is back in the room, role card on screen');
 ok(!(await host.isVisible('.top .ib[aria-label="Minimize"]'))&&!(await d.isVisible('.top .ib[aria-label="Minimize"]')),'once roles are dealt: no Minimize');
 // removed while minimized
 await host.evaluate(()=>hostBackRoom());await wait(s,()=>MP.room&&!MP.room.g);await s.click('.top .ib[aria-label="Minimize"]');
 await host.evaluate(()=>{const id=Object.keys(MP.players).find(k=>MP.players[k].name==='Sami');kick(id);});
 await wait(s,()=>V==='join'&&MP.status==='kicked');ok(await s.isVisible('text=removed')||await s.evaluate(()=>MP.status==='kicked'),'removed while minimized: back on the room screen with the message');
 // phone Back on Home while minimized keeps the room
 await late.click('.top .ib[aria-label="Minimize"]');await late.evaluate(()=>history.back());await late.waitForTimeout(400);ok(await late.evaluate(()=>MP.role==='client'),'phone Back on Home: still in the room');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

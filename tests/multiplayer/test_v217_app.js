// v2.17 invite from Home: Invite next to an online friend opens a room and invites them; an offline friend can only be invited from a room;
// an offline friend's invite says it went to Telegram.
// Needs a local relay: from relay/, npx wrangler dev --port 8787   then: node test_v217_app.js [ws://127.0.0.1:8787]
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787';
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(n,un,display)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));
   await p.goto(URL);await p.evaluate(([r,u,d])=>{S.relay=r;S.mpName='';save();return aReq('/acc/signup',{uname:u,pass:'secret12'}).then(x=>{signedIn(x);return aReq('/acc/profile',{display:d});}).then(j=>{S.acct.u=j.user;S.mpName=d;save();nav('home');});},[RELAY,un,display]);return p;};
 const tick=p=>p.evaluate(()=>inboxTick());const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:12000});
 const r=()=>Math.random().toString(36).slice(2,8),uA='ha'+r(),uB='hb'+r(),uC='hc'+r();
 const a=await mk('A',uA,'Alhassan'),bp=await mk('B',uB,'Dareer'),c=await mk('C',uC,'Sami');
 for(const [p,u] of [[bp,uB],[c,uC]]){await a.evaluate(u=>aReq('/acc/friend/request',{uname:u}),u);await tick(p);await p.evaluate(()=>{const id=Object.keys(FREL).find(k=>FREL[k]==='in');return aReq('/acc/friend/accept',{id});});}
 await c.close();  // Sami's app is closed: offline
 await tick(bp);await tick(a);
 await a.click('#fdock .ftab');await a.waitForSelector('.fdrawer .prs:has-text("Dareer") .stp.on',{timeout:12000});
 const off=()=>a.evaluate(()=>{FR.friends.find(f=>f.display==='Sami').on=false;fRedraw();});await off();  // seen a moment ago; the relay counts 'online' for a while after
 ok(await a.isVisible('.fdrawer .prs:has-text("Dareer") button.mini:has-text("Invite")'),'Home: Invite next to an online friend');
 ok(!(await a.isVisible('.fdrawer .prs:has-text("Sami") button.mini:has-text("Invite")')),'Home: no Invite next to an offline friend');
 await a.click('.fdrawer .prs:has-text("Dareer") button.mini:has-text("Invite")');
 await wait(a,()=>MP.role==='host'&&MP.online&&V==='host');ok(true,'Invite from Home: an online room opens');
 const code=await a.evaluate(()=>MP.online.code);
 await tick(bp);await bp.waitForSelector('#inv .invbar',{timeout:12000});ok((await bp.textContent('#inv .invbar')).includes(code.slice(0,3)+' '+code.slice(3)),'Dareer gets the invite to that room');
 await a.evaluate(()=>{render();dockOpen(true);});await a.waitForSelector('.fdrawer .prs:has-text("Sami")');await off();
 ok(await a.isVisible('.fdrawer .prs:has-text("Sami") button.mini:has-text("Invite")'),'in a room: Invite next to the offline friend');
 await a.evaluate(()=>{window.aReq0=aReq;aReq=(u,b)=>u==='/acc/invite'?Promise.resolve({ok:1,tg:1}):aReq0(u,b);});
 await a.click('.fdrawer .prs:has-text("Sami") button.mini:has-text("Invite")');
 ok(await a.waitForFunction(()=>/Sent to their Telegram \(they're offline\)/.test(document.getElementById('toast').textContent),null,{timeout:5000}).then(()=>true,()=>false),'offline friend: "Sent to their Telegram (they\'re offline)"');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

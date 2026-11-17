// v2.13: "X let you in" (joins by itself, even after the app restarts), no Invite for a friend already in the room,
// the screen behind the drawer / bell / chat does not scroll, "Updated to vX" once after an update.
// Needs a local relay: from relay/, npx wrangler dev --port 8787   then: node test_v213_app.js [ws://127.0.0.1:8787]
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787';
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(n,un,display)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));
   await p.goto(URL);await p.evaluate(([r,u,d])=>{S.relay=r;S.mpName='';save();return aReq('/acc/signup',{uname:u,pass:'secret12'}).then(x=>{signedIn(x);return aReq('/acc/profile',{display:d});}).then(j=>{S.acct.u=j.user;S.mpName=d;save();nav('home');});},[RELAY,un,display]);return p;};
 const tick=p=>p.evaluate(()=>inboxTick());const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 const r=()=>Math.random().toString(36).slice(2,8);
 const a=await mk('A','va'+r(),'Alhassan'),bp=await mk('B','vb'+r(),'Dareer');
 const idA=await a.evaluate(()=>S.acct.u.id),idB=await bp.evaluate(()=>S.acct.u.id);
 await a.evaluate(id=>aReq('/acc/friend/request',{id}),idB);await bp.evaluate(id=>aReq('/acc/friend/accept',{id}),idA);
 // 1. B asks to join A's room, restarts the app, A lets him in
 await a.click('#mode-online');await a.click('button:has-text("Host online")');await wait(a,()=>MP.online&&HN.ws&&HN.ws.readyState===1);const code=await a.evaluate(()=>MP.online.code);
 await tick(a);await bp.evaluate(()=>friendsLoad(true));await tick(bp);await bp.evaluate(()=>friendsLoad(true));
 await bp.evaluate(id=>joinAsk(id),idA);await bp.waitForTimeout(500);
 await bp.reload();await bp.waitForTimeout(800);ok(await bp.evaluate(()=>!Object.keys(jrAsked).length),'B restarted the app: it no longer remembers asking');
 await tick(a);await a.waitForSelector('#inv .invbar:has-text("wants to join your room")',{timeout:15000});await a.click('#inv .invbar .btn');
 await a.waitForSelector('#toast:has-text("Dareer can join now")',{timeout:8000});ok(true,'A taps Let in: "Dareer can join now" (not "Invite sent")');
 await tick(bp);await wait(bp,()=>MP.role==='client'&&MP.status==='ok');ok(await bp.evaluate(c=>MP.online.code===c,code),'B joins by itself, even after the restart');
 ok(await bp.evaluate(()=>(S.nlog||[]).some(n=>n.k==='inv'&&n.ans&&n.st==='joined')),'B\'s bell: "let you into room …", Joined');
 await bp.evaluate(()=>{const o=document.querySelector('#rbar');});await bp.evaluate(()=>bellOpen());ok(await bp.isVisible('#bellsh .prs:has-text("let you into room")'),'the bell row says "let you into room"');await bp.evaluate(()=>bellClose());
 // 2. no Invite for a friend already in the room
 await wait(a,()=>Object.values(MP.players).some(q=>q.name==='Dareer'&&q.uid));await tick(a);await a.evaluate(()=>dockOpen(true));
 await a.waitForSelector('.fdrawer .prs:has-text("Dareer") .stp.inroom:has-text("In your room")',{timeout:15000});
 ok(!(await a.isVisible('.fdrawer .prs:has-text("Dareer") button.mini:has-text("Invite")')),'host: Dareer is in the room, "In your room", no Invite');
 await bp.evaluate(()=>dockOpen(true));await bp.waitForSelector('.fdrawer .prs:has-text("Alhassan") .stp.inroom',{timeout:15000});ok(true,'player: the host shows "In your room" too');
 await bp.evaluate(()=>dockOpen(false));
 // 3. the screen behind does not scroll
 await a.evaluate(()=>{dockOpen(false);hostStop();nav('rules');scrollTo(0,0);});await a.waitForTimeout(200);
 const scrollAfterWheel=async()=>{await a.mouse.move(60,500);await a.mouse.wheel(0,600);await a.waitForTimeout(300);return a.evaluate(()=>scrollY);};
 ok((await scrollAfterWheel())>100,'Rules scrolls normally');await a.evaluate(()=>scrollTo(0,0));
 await a.evaluate(()=>dockOpen(true));await a.waitForTimeout(200);ok((await scrollAfterWheel())===0,'friends drawer open: the screen behind stays put');
 await a.evaluate(()=>dockOpen(false));ok((await scrollAfterWheel())>100,'drawer closed: it scrolls again');await a.evaluate(()=>scrollTo(0,0));
 await a.evaluate(()=>bellOpen());ok((await scrollAfterWheel())===0,'bell open: the screen behind stays put');await a.evaluate(()=>bellClose());
 // 4. "Updated to vX" once
 await a.evaluate(()=>{S.lastVer=APP.code-1;save();});await a.reload();await a.waitForSelector('#toast:has-text("Updated to v")',{timeout:5000});
 ok(await a.evaluate(()=>S.lastVer===APP.code),'after an update: "Updated to v'+await a.evaluate(()=>APP.name)+'" once');
 await a.reload();await a.waitForTimeout(1500);ok(!(await a.evaluate(()=>(document.querySelector('#toast').textContent||'').includes('Updated'))),'next start: no message');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

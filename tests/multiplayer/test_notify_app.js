// v2.11: the notification bell (friend request, accepted, invite, join request), Invite again after 5 s, the new Friends screen.
// Needs a local relay: from relay/, npx wrangler dev --port 8787   then: node test_notify_app.js [ws://127.0.0.1:8787]
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787';
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(n,un,display)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));
   await p.goto(URL);await p.evaluate(([r,u,d])=>{S.relay=r;S.mpName='';save();return aReq('/acc/signup',{uname:u,pass:'secret12'}).then(x=>{signedIn(x);return aReq('/acc/profile',{display:d});}).then(j=>{S.acct.u=j.user;S.mpName=d;save();nav('home');});},[RELAY,un,display]);return p;};
 const tick=p=>p.evaluate(()=>inboxTick());const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 const cnt=p=>p.evaluate(()=>{const c=document.querySelector('#bellb .cnt');return c?+c.textContent:0;});
 const r=()=>Math.random().toString(36).slice(2,8),uB='nb'+r();
 const a=await mk('A','na'+r(),'Alhassan'),bp=await mk('B',uB,'Dareer');
 const idA=await a.evaluate(()=>S.acct.u.id),idB=await bp.evaluate(()=>S.acct.u.id);
 ok(await a.isVisible('.pfrow #bellb')&&(await cnt(a))===0,'Home: the bell sits next to the profile, nothing new');
 // friend request -> bell
 await a.evaluate(id=>aReq('/acc/friend/request',{id}),idB);await tick(bp);await wait(bp,()=>document.querySelector('#bellb .cnt'));ok((await cnt(bp))===1,'B: a friend request makes the bell count 1');
 await bp.click('#bellb');await bp.waitForSelector('#bellsh .prs:has-text("Alhassan"):has-text("wants to be your friend")',{timeout:15000});ok(await cnt(bp)===1,'the bell lists the request (still counted until answered)');
 await bp.click('#bellsh button.mini:has-text("Accept")');await wait(bp,()=>FR&&FR.friends.length===1);await bp.waitForFunction(()=>!document.querySelector('#bellsh .prs'),null,{timeout:15000});ok(true,'Accept in the bell: friends, the item goes');
 await bp.click('#bellsh .btn.ghost');ok(!(await bp.isVisible('#bellsh'))&&(await cnt(bp))===0,'closed: count 0');
 // accepted -> note for A
 await tick(a);await wait(a,()=>document.querySelector('#bellb .cnt'));ok((await cnt(a))===1,'A: "accepted your request" counts on the bell');
 await a.click('#bellb');await a.waitForSelector('#bellsh .prs:has-text("Dareer"):has-text("accepted your friend request")');ok((await cnt(a))===0,'opened: listed, and no longer counted as new');
 await a.click('#bellsh .link:has-text("Clear")');await a.waitForFunction(()=>!document.querySelector('#bellsh .prs'));await a.click('#bellsh .btn.ghost');
 await tick(a);ok(await a.evaluate(()=>!NOTES.length),'Clear: the note is gone (also on the relay)');
 // the new Friends screen
 await bp.evaluate(()=>openFriends());await bp.waitForSelector('.mecard');ok((await bp.textContent('.mecard')).includes('@'+uB)&&await bp.isVisible('.mecard button:has-text("Share my username")'),'Friends: my card with @username and Share');
 ok(await bp.isVisible('.ftabs button.on:has-text("Friends")')&&await bp.isVisible('.flist .prs:has-text("Alhassan")'),'Friends tab: Alhassan');
 await bp.click('.ftabs button:has-text("Sent")');ok(await bp.isVisible('.flist .fempty'),'Sent tab: empty state');await bp.click('.ftabs button:has-text("Friends")');
 await bp.evaluate(()=>nav('home'));
 // invite, Invite again after 5 s, the bell shows it
 await a.evaluate(()=>{nav('home');});await a.click('#mode-online');await a.click('button:has-text("Host online")');await wait(a,()=>MP.online&&HN.ws&&HN.ws.readyState===1);const code=await a.evaluate(()=>MP.online.code);
 await tick(a);await a.click('button:has-text("Invite friends")');await a.waitForSelector('.fdrawer .prs:has-text("Dareer") button.mini:has-text("Invite")',{timeout:15000});
 await a.click('.fdrawer .prs:has-text("Dareer") button.mini');await a.waitForSelector('.fdrawer button.mini:has-text("Invited")[disabled]');ok(true,'Invite: Invited (off) for 5 s');
 await tick(bp);await bp.waitForSelector('#inv .invbar',{timeout:15000});await bp.click('#inv .invbar .x');ok(!(await bp.isVisible('#inv .invbar')),'B dismisses the banner');
 await a.waitForSelector('.fdrawer button.mini:has-text("Invite again"):not([disabled])',{timeout:8000});ok(true,'after 5 s: Invite again');
 await a.click('.fdrawer button.mini:has-text("Invite again")');await tick(bp);await bp.waitForSelector('#inv .invbar',{timeout:15000});ok(true,'Invite again: B gets a new banner');
 ok((await cnt(bp))===1,'and the invite counts on B\'s bell');
 await bp.click('#bellb');await bp.waitForSelector('#bellsh .prs:has-text("Dareer"),#bellsh .prs:has-text("Alhassan")');await bp.click('#bellsh button.mini:has-text("Join")');
 await wait(bp,()=>MP.role==='client'&&MP.status==='ok');ok(await bp.evaluate(c=>MP.online.code===c,code),'Join from the bell: B is in the room');
 // a join request lands in the bell too
 await bp.evaluate(()=>{clientStop(true);nav('home');});await tick(a);await tick(bp);await bp.evaluate(()=>friendsLoad(true));
 await bp.evaluate(id=>joinAsk(id),idA);await bp.waitForTimeout(300);ok(await bp.evaluate(id=>!!jrAsked[id],idA),'B asks to join');
 await tick(a);await a.evaluate(()=>{dockOpen(false);});ok(await a.evaluate(()=>JR.length===1)&&await a.evaluate(()=>bellN()>=1),'A: the join request counts on the bell');
 await a.evaluate(()=>{hostStop();nav('home');});await a.click('#bellb');ok(await a.isVisible('#bellsh .prs:has-text("wants to join your room") button.mini:has-text("Let in")'),'the bell lists it with Let in');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

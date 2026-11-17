// v2.10: profile Back loop fixed, profile menu + flag + theme icons, the side column drags up/down, Ask to join, online room chat
// (live, never in the relay's stored state), + Add in game history.
// Needs a local relay: from relay/, npx wrangler dev --port 8787   then: node test_social_app.js [ws://127.0.0.1:8787]
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787';
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(n,un,display)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce',hasTouch:true})).newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));
   await p.goto(URL);await p.evaluate(([r,u,d])=>{S.relay=r;S.mpName='';save();return aReq('/acc/signup',{uname:u,pass:'secret12'}).then(x=>{signedIn(x);return aReq('/acc/profile',{display:d});}).then(j=>{S.acct.u=j.user;S.mpName=d;save();nav('home');});},[RELAY,un,display]);return p;};
 const tick=p=>p.evaluate(()=>inboxTick());const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 const r=()=>Math.random().toString(36).slice(2,8);
 const a=await mk('A','sa'+r(),'Alhassan'),bp=await mk('B','sb'+r(),'Dareer'),c=await mk('C','sc'+r(),'Sami');
 const idB=await bp.evaluate(()=>S.acct.u.id),idA=await a.evaluate(()=>S.acct.u.id),idC=await c.evaluate(()=>S.acct.u.id);
 await a.evaluate(id=>aReq('/acc/friend/request',{id}),idB);await bp.evaluate(id=>aReq('/acc/friend/accept',{id}),idA);
 for(const p of [a,bp,c]){await tick(p);await p.evaluate(()=>friendsLoad(true));}
 // 1. profile -> drawer -> another profile -> Back used to loop on the profile
 await a.click('#fdock .ftab');await a.click('.fdrawer .prs:has-text("Dareer") .fl');await wait(a,()=>V==='profile');
 await a.click('#fdock .ftab');await a.click('.fdrawer .prs:has-text("Dareer") .fl');await wait(a,()=>V==='profile');
 await a.evaluate(()=>back());await a.waitForTimeout(500);ok(await a.evaluate(()=>V==='home'),'drawer > profile > drawer > profile > Back: back on Home (was stuck)');
 // 2. top icons
 ok(await a.evaluate(()=>{const p=document.querySelector('.pfrow .ib.pf').getBoundingClientRect(),g=document.querySelector('.corner .ib').getBoundingClientRect();return p.left<50&&p.width>g.width&&getComputedStyle(document.querySelector('.pfrow .ib.pf')).borderRadius==='50%';}),'profile: on the left, round, bigger');
 ok((await a.textContent('.ib.flag'))==='\u{1F1EC}\u{1F1E7}','language button shows the UK flag in English');
 await a.click('.ib.flag');ok((await a.textContent('.ib.flag'))==='\u{1F1F8}\u{1F1E6}'&&await a.evaluate(()=>S.lang==='ar'),'tap: Arabic, the Saudi flag');
 ok(await a.evaluate(()=>document.querySelector('.pfrow .ib.pf').getBoundingClientRect().right>300),'Arabic: profile moves to the right');await a.click('.ib.flag');
 await a.click('.pfrow .ib.pf');ok(await a.isVisible('#modal .sheet:has-text("Show profile")')&&await a.isVisible('#modal .sheet button:has-text("Sign out")'),'profile tap: menu with Show profile and Sign out');
 await a.click('#modal button:has-text("Show profile")');ok(await a.evaluate(()=>V==='account'),'Show profile opens my profile');await a.evaluate(()=>nav('home'));
 await a.click('.pfrow .ib.pf');await a.click('#modal button:has-text("Sign out")');ok(await a.isVisible('#modal .sheet:has-text("Sign out?")'),'Sign out from the menu asks first');await a.click('#modal .btn.ghost');
 // 3. drag the side column
 const y0=await a.evaluate(()=>document.querySelector('#fdock .fside').getBoundingClientRect().top);
 await a.evaluate(()=>{const el=document.querySelector('#fdock .ftab'),r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+20;
   const T=(t,y)=>{const touch=new Touch({identifier:1,target:el,clientX:x,clientY:y});el.dispatchEvent(new TouchEvent(t,{bubbles:true,cancelable:true,touches:t==='touchend'?[]:[touch],changedTouches:[touch]}));};
   T('touchstart',y);T('touchmove',y+40);T('touchmove',y+250);T('touchend',y+250);el.click();});
 const y1=await a.evaluate(()=>document.querySelector('#fdock .fside').getBoundingClientRect().top);
 ok(Math.abs(y1-y0-250)<3&&await a.evaluate(()=>!S.fpanel),'drag down 250 px: the tab moves, the tap after a drag does not open it');
 await a.reload();await a.waitForSelector('#fdock .fside');ok(Math.abs(await a.evaluate(()=>document.querySelector('#fdock .fside').getBoundingClientRect().top)-y1)<3,'the new place is remembered');
 // 4. Ask to join: Dareer hosts online, Alhassan asks
 await bp.click('#mode-online');await bp.click('button:has-text("Host online")');await wait(bp,()=>MP.online&&HN.ws&&HN.ws.readyState===1);const code=await bp.evaluate(()=>MP.online.code);
 await tick(bp);await tick(a);await a.evaluate(()=>dockOpen(true));
 await a.waitForSelector('.fdrawer .prs:has-text("Dareer") button.mini:has-text("Ask to join")',{timeout:15000});ok(true,'friend in an online lobby: Ask to join');
 await a.click('.fdrawer button.mini:has-text("Ask to join")');await a.waitForSelector('.fdrawer button.mini:has-text("Asked")[disabled]');ok(true,'Ask to join turns into Asked');
 await tick(bp);await bp.waitForSelector('#inv .invbar:has-text("wants to join your room")',{timeout:15000});ok((await bp.textContent('#inv .invbar')).includes('Alhassan'),'host: banner "Alhassan wants to join your room"');
 await bp.click('#inv .invbar .btn');await wait(a,()=>MP.role==='client'&&MP.status==='ok');ok(await a.evaluate(c=>MP.online.code===c,code),'Let in: Alhassan joins the room by himself');
 await wait(bp,()=>Object.values(MP.players).some(q=>q.name==='Alhassan'));
 // 5. online chat
 await c.click('#mode-online');await c.fill('#ocode',code);await c.click('button:has-text("Join online")');await wait(c,()=>MP.status==='ok'&&MP.room&&MP.room.cv);
 await wait(a,()=>MP.room&&MP.room.players.length===3);await a.evaluate(()=>dockOpen(false));
 await a.click('#fdock .fchat');await a.waitForSelector('#chat .prs:has-text("Sami") button.mini:has-text("+ Add")');ok(!(await a.isVisible('#chat .prs:has-text("Dareer") button.mini:has-text("+ Add")')),'chat list: + Add next to a non-friend only');
 await a.click('#chat .prs:has-text("Everyone") .fl');await a.fill('#chin','hello all');await a.press('#chin','Enter');
 await wait(c,()=>CH.some(m=>m.x==='hello all'));await wait(bp,()=>chMsgs().some(m=>m.x==='hello all'));ok(true,'online: Everyone reaches the host and Sami');
 await a.click('#chat .chh .ib >> nth=0');await a.click('#chat .prs:has-text("Sami") .fl');await a.fill('#chin','just you');await a.press('#chin','Enter');
 await wait(c,()=>CH.some(m=>m.x==='just you'));await bp.waitForTimeout(800);ok(!(await bp.evaluate(()=>chMsgs().some(m=>m.x==='just you'))),'online 1:1: Sami only');
 ok(!(await a.evaluate(()=>MP.last||'')).includes('hello all')&&!(await c.evaluate(()=>MP.last||'')).includes('just you'),'chat is not in the room state the relay stores');
 // reconnect: the chat comes back live
 await c.evaluate(()=>{MP.ws.close();});await c.waitForTimeout(400);await c.evaluate(()=>{CH=[];});await wait(c,()=>CH.some(m=>m.x==='just you'));ok(true,'after a reconnect the host sends the chat again');
 // the host cannot see out of it; player leaves
 await a.evaluate(()=>{chClose();clientStop(true);nav('home');});await c.evaluate(()=>{clientStop(true);nav('home');});
 // 6. + Add in game history (the host keeps it)
 await bp.evaluate(([a,c])=>{hostStop();S.log.unshift({id:Date.now(),names:['Dareer','Alhassan','Sami','X'],roles:['mafia','doctor','citizen','citizen'],alive:[true,true,false,true],winner:'citizens',days:2,hist:[],valid:true,ev:{first:null,saves:[],caught:[]},acc:[S.acct.u.id,a,c,null]});save();nav('game:'+S.log[0].id);},[idA,idC]);
 ok(await bp.isVisible('.endrow:has-text("Sami") button.mini:has-text("+ Add")')&&!(await bp.isVisible('.endrow:has-text("Alhassan") button.mini'))&&!(await bp.isVisible('.endrow:has-text("X") button.mini')),'history: + Add next to an account that is not a friend yet');
 await bp.click('.endrow:has-text("Sami") button.mini');await bp.waitForFunction(id=>FREL[id]==='out',idC,{timeout:10000});await tick(c);ok(await c.evaluate(()=>FREQ===1),'the request reaches Sami');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

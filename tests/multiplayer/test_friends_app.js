// v2.9 friends in the app: request + accept, online status, invite to an online room, + Add from the lobby, profile, remove.
// Needs a local relay: from relay/, npx wrangler dev --port 8787   then: node test_friends_app.js [ws://127.0.0.1:8787]
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787';
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(n,un,display)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));
   await p.goto(URL);await p.evaluate(([r,u,d])=>{S.relay=r;S.mpName='';save();return aReq('/acc/signup',{uname:u,pass:'secret12'}).then(x=>{signedIn(x);return aReq('/acc/profile',{display:d});}).then(j=>{S.acct.u=j.user;S.mpName=d;save();nav('home');});},[RELAY,un,display]);return p;};
 const tick=p=>p.evaluate(()=>inboxTick());const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:12000});
 const r=()=>Math.random().toString(36).slice(2,8),uA='fa'+r(),uB='fb'+r(),uC='fc'+r();
 const a=await mk('A',uA,'Alhassan'),bp=await mk('B',uB,'Dareer'),c=await mk('C',uC,'Sami');
 // request by @username from the Friends screen
 ok(await a.isVisible('.mode:has-text("Friends")'),'signed in: Friends on the home screen');
 await a.click('.mode:has-text("Friends")');await a.waitForSelector('#fun');await a.fill('#fun','@'+uB);await a.click('.prow .pill');
 await a.waitForSelector(`.sec:has-text("Requests you sent") :text("@${uB}")`,{timeout:12000});ok(true,'request sent: shows under "Requests you sent"');
 // B sees the request on Home, accepts it on the Friends screen
 await tick(bp);await wait(bp,()=>FREQ===1);await bp.evaluate(()=>render());ok(await bp.isVisible('.mode:has-text("Friends") .badge.new'),'B: request badge on the Friends button');
 await bp.click('.mode:has-text("Friends")');await bp.waitForSelector('.sec:has-text("Friend requests") :text("Alhassan")');await bp.click('button.mini:has-text("Accept")');
 await bp.waitForSelector('.sec:has-text("Friends (1)") :text("Alhassan")',{timeout:12000});ok(true,'B accepts: Alhassan is in the friends list');
 // online status
 await tick(bp);await a.evaluate(()=>friendsLoad());await a.waitForSelector('.sec:has-text("Friends (1)") .prs:has-text("Dareer") .dot.on',{timeout:12000});
 ok(await a.isVisible('.prs:has-text("Dareer") :text("Online")'),'A sees Dareer online');
 // A hosts online and invites B
 await a.evaluate(()=>nav('home'));await a.click('text=Play Together');await a.click('#mode-online');await a.click('button:has-text("Host online")');
 await wait(a,()=>MP.online&&HN.ws&&HN.ws.readyState===1);const code=await a.evaluate(()=>MP.online.code);
 await a.click('button:has-text("Invite friends")');await a.waitForSelector('#modal .flist .prs:has-text("Dareer")');await a.click('#modal .flist button.mini:has-text("Invite")');
 await a.waitForSelector('#modal .flist button.mini:has-text("Invited")[disabled]');ok(true,'invite sheet: Invite turns into Invited');
 await a.click('#modal button:has-text("Close")');
 // B gets the banner and joins
 await tick(bp);await bp.waitForSelector('#inv .invbar',{timeout:12000});
 ok((await bp.textContent('#inv .invbar')).includes(code.slice(0,3)+' '+code.slice(3))&&(await bp.textContent('#inv .invbar')).includes('Alhassan'),'B: banner "Alhassan invites you to room …"');
 await bp.click('#inv .invbar .btn');await wait(bp,()=>MP.status==='ok'&&MP.role==='client');ok(await bp.evaluate(c=>MP.online.code===c&&!document.querySelector('#inv .invbar'),code),'Join: B is in the room, banner gone');
 await wait(a,()=>Object.values(MP.players).some(q=>q.name==='Dareer'&&q.uid));
 // in a room: status shows to friends
 await tick(bp);await a.evaluate(()=>aReq('/acc/friends').then(j=>{FR=j;}));ok(await a.evaluate(()=>FR.friends[0].st==='room'),'Dareer shows "In a room"');
 // C (not a friend) joins: + Add next to C, not next to B
 await c.click('text=Play Together');await c.click('#mode-online');await c.fill('#ocode',code);await c.click('button:has-text("Join online")');await wait(c,()=>MP.status==='ok');
 await wait(a,()=>Object.values(MP.players).some(q=>q.name==='Sami'&&q.uid));await tick(a);await a.evaluate(()=>render());
 ok(await a.isVisible('.prs:has-text("Sami") button.mini:has-text("+ Add")')&&!(await a.isVisible('.prs:has-text("Dareer") button.mini:has-text("+ Add")')),'host lobby: + Add only next to a non-friend');
 await a.click('.prs:has-text("Sami") button.mini:has-text("+ Add")');await wait(a,()=>Object.values(FREL).includes('out'));
 ok(!(await a.isVisible('.prs:has-text("Sami") button.mini:has-text("+ Add")')),'+ Add sends a request and disappears');
 await tick(bp);await bp.evaluate(()=>render());ok(await bp.isVisible('.prs:has-text("Sami") button.mini:has-text("+ Add")'),'player lobby: + Add next to another signed-in player');
 ok(await bp.isVisible('button:has-text("Invite friends")'),'players in an online room can invite too');
 // a second invite while B is in a room asks first
 await tick(c);await c.evaluate(()=>{const id=Object.keys(FREL).find(k=>FREL[k]==='in');return aReq('/acc/friend/accept',{id});});
 await a.evaluate(c=>{const id=Object.keys(FREL).find(k=>FREL[k]==='out');return aReq('/acc/invite',{id,code:c});},'654321');
 await tick(c);await c.waitForSelector('#inv .invbar',{timeout:12000});await c.click('#inv .invbar .btn');
 ok(await c.isVisible('#modal .sheet:has-text("Join this room?")'),'joining an invite from inside a room asks first');await c.click('#modal .btn.ghost');
 ok(await c.evaluate(c=>MP.online&&MP.online.code===c,code),'Cancel: still in the room');
 // profile + remove
 await a.evaluate(()=>{hostStop();openFriends();});await a.waitForSelector('.prs:has-text("Dareer") .fl');await a.click('.prs:has-text("Dareer") .fl');
 await a.waitForSelector(`.pcard:has-text("@${uB}")`,{timeout:12000});ok(await a.isVisible('.pcard button:has-text("Remove friend")'),'friend profile: card with @username and Remove friend');
 await a.click('.pcard button:has-text("Remove friend")');ok(await a.isVisible('#modal .sheet:has-text("Remove Dareer?")'),'remove asks first');await a.click('#modal .btn.primary');
 await wait(a,()=>FP&&FP.rel==='');await a.waitForSelector('.pcard button:has-text("Add friend")');ok(true,'removed: the card offers Add friend again');
 await a.evaluate(()=>back());await a.waitForFunction(()=>V==='friends');ok(true,'Back from a friend profile returns to Friends');
 // Show me as online
 await bp.evaluate(()=>{clientStop(true);nav('settings');});await bp.click('.tg:has-text("Show me as online")');ok(await bp.evaluate(()=>S.hideOnline===true),'Settings: "Show me as online" switches off');
 // Arabic
 await a.evaluate(()=>{S.lang='ar';nav('friends');});ok(await a.isVisible('.top :text("الأصدقاء")'),'Friends screen in Arabic');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

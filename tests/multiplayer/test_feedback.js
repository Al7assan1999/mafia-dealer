// v2.8 feedback fixes (Wi-Fi mock): stale night choices after Play again (4), rejoin after leave/kick/"started" (1),
// recap + Back to lobby on every phone (2, 5), Doctor in the log (6), share/copy (3), ghost in Same room (8),
// host rules shown to players (9), live table vote (10), skip-vote rule (11), leaving returns to the right screen (7).
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const PY=process.platform==='win32'?'python':'python3';
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},keep(){},put(k,v){try{X('POST','/__put',JSON.stringify({k,v}))}catch(e){}},take(){try{const r=X('GET','/__take');return r==='\u0000'?null:r}catch(e){return null}},clear(){try{X('GET','/__clear')}catch(e){}},ip(){return '0,0'}};};
const clientShim=()=>{window.__sh=[];window.__cp=[];window.Net={start(){},share(t){__sh.push(t)},copy(t){__cp.push(t)},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const srv=spawn(PY,['mock_srv.py']);await new Promise(r=>setTimeout(r,800));const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
   await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;S.rules.ghost=true;S.rules.skip=false;save();},name);return p;};
 const join=async c=>{await c.evaluate(()=>{V='wifi';joinStart();});await c.waitForFunction(()=>MP.status==='ok',null,{timeout:20000});};
 const host=await mk(hostShim,'Alhassan');await host.click('text=Play Together');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const names=['Dareer','Sami','Hokan','Farouq'],P={Alhassan:host};
 for(const n of names){P[n]=await mk(clientShim,n);await join(P[n]);}
 // (9) rules shown to players, (3) share + copy
 ok(await P.Sami.isVisible('text=Rules for this room'),'(9) players see the host\'s rules in the lobby');
 await P.Sami.click('button:has-text("Share room address")');ok((await P.Sami.evaluate(()=>__sh[0]))==='Mafia Dealer room address: 127.0.0.1','(3) share sends just the address, no download link');
 await P.Sami.click('.copyrow .mini');ok((await P.Sami.evaluate(()=>__cp[0]))==='127.0.0.1','(3) Copy puts the address on the clipboard');
 // (1) leave and rejoin; kick and rejoin
 await P.Hokan.evaluate(()=>leaveNow());await P.Hokan.waitForTimeout(800);ok(await P.Hokan.evaluate(()=>V==='wifi'),'(7) leaving a Same room room returns to the Same room screen');
 await join(P.Hokan);ok(true,'(1) a player who left can join again');
 await host.click('.prs:has-text("Farouq") button:has-text("Kick")');await host.click('.sheet .btn.primary');
 await P.Farouq.waitForFunction(()=>MP.status==='kicked',null,{timeout:10000});await join(P.Farouq);ok(true,'(1) a kicked player can join again');
 await host.waitForFunction(()=>Object.values(MP.players).filter(q=>q.on).length===4,null,{timeout:10000});
 // game 1
 const deal=async()=>{await host.click('button:has-text("Deal roles")');
   for(const n of names){await P[n].waitForFunction(()=>MP.room&&MP.room.g&&!MP.room.g.ph&&MP.readyDeal!==MP.room.g.deal,null,{timeout:10000});await P[n].dispatchEvent('#hold','mousedown');await P[n].dispatchEvent('#hold','mouseup');await P[n].click('#memo');}
   await host.dispatchEvent('#hold','mousedown');await host.dispatchEvent('#hold','mouseup');await host.click('#memo');await host.click('button:has-text("Start Night 1")');};
 const act=async(n,target)=>{const p=P[n];if(n==='Alhassan')await p.click('button:has-text("Take my turn")');else await p.waitForFunction(()=>MP.room.g.ph==='night',null,{timeout:10000});
   if(target!=null)await p.click(`.opt:has(.num:text-is("${target+1}"))`);else{const o=await p.$('.opt:not([disabled])');if(o)await o.click();}
   await p.click('.btn.primary:has-text("Confirm")');if(n==='Alhassan')await p.click('button:has-text("Done")');};
 await deal();
 // a late phone is told "started"; it must be able to join after the game
 const late=await mk(clientShim,'Fater');await late.evaluate(()=>{V='wifi';joinStart();});await late.waitForFunction(()=>MP.status==='started',null,{timeout:20000});
 for(const n of ['Alhassan',...names])await act(n,null);
 await host.waitForFunction(()=>G.phase==='dawn',null,{timeout:10000});await host.click('.btn.gold');await host.click('text=Reveal now').catch(()=>{});
 ok(await host.evaluate(()=>G.hist[0].includes('Doctor protected')),'(6) the log shows who the Doctor protected: '+await host.evaluate(()=>G.hist[0]));
 await host.evaluate(()=>{G.phase='end';G.winner='citizens';G.revealed=true;hostPublish();render();});await host.click('button:has-text("Valid")');
 await P.Dareer.waitForSelector('.recap',{timeout:10000});ok(await P.Dareer.isVisible('.recap .rc-tl'),'(5) players get the full recap card with the timeline');
 ok(await host.isVisible('button:has-text("Back to lobby")')&&!(await host.$('button:has-text("Home")')),'(2) host end screen: Play again / Back to lobby');
 await P.Dareer.click('button:has-text("Back to lobby")');await P.Dareer.waitForTimeout(400);
 ok(await P.Dareer.isVisible('text=Players in the room')&&!(await P.Dareer.evaluate(()=>document.body.innerText)).includes('undefined'),'(2) a player can go back to the lobby from the end screen');
 // the late phone joins once the room is back in the lobby
 await host.click('button:has-text("Back to lobby")');await late.evaluate(()=>{V='wifi';joinStart();});await late.waitForFunction(()=>MP.status==='ok',null,{timeout:20000});
 ok(true,'(1) a phone rejected with "already started" can join after the game');P.Fater=late;names.push('Fater');
 // game 2 straight after: no night choice may carry over (the critical bug)
 await host.evaluate(()=>{S.counts={mafia:2,doctor:1,detective:1};});await deal();
 await host.waitForTimeout(3000);
 ok(await host.evaluate(()=>Object.keys(G.done).length===0),'(4) game 2, night 1: nobody is marked done before choosing');
 let allChoose=true;for(const n of names){const v=await P[n].evaluate(()=>MP.room.g.ph+'|'+!!document.querySelector('.act .btn.primary'));if(v!=='night|true')allChoose=false;}
 ok(allChoose,'(4) every player\'s phone shows the choice screen, not "locked"');
 const roles=await host.evaluate(()=>Object.fromEntries(G.names.map((n,i)=>[n,G.roles[i]])));const idx=n=>Object.keys(roles).indexOf(n);
 const victim=names.find(n=>roles[n]==='citizen');const mafs=Object.keys(roles).filter(n=>roles[n]==='mafia'),doc=Object.keys(roles).find(n=>roles[n]==='doctor');
 for(const n of ['Alhassan',...names]){const r=roles[n];await act(n,r==='mafia'?idx(victim):r==='doctor'?idx(mafs[0]):null);}
 await host.waitForFunction(()=>G.phase==='dawn',null,{timeout:12000});ok(await host.evaluate(()=>Object.keys(G.act.mafia).length===2),'(4) both Mafia got to choose in game 2');
 await host.click('.btn.gold');await host.click('text=Reveal now').catch(()=>{});
 if(victim){await P[victim].waitForFunction(()=>MP.room.g.ph==='dead',null,{timeout:10000});ok(await P[victim].evaluate(()=>Array.isArray(MP.room.g.roles))&&await P[victim].isVisible('.sec.ghost'),'(8) ghost view works in a Same room game');}
 // (10) live table vote
 await host.click('button:has-text("Start Day")');await host.click('.tabs button:has-text("Table vote")');await host.click('button:has-text("Start table vote")');
 const alive=await host.evaluate(()=>G.names.filter((n,i)=>G.alive[i]));const voters=names.filter(n=>alive.includes(n));
 await P[voters[0]].waitForFunction(()=>MP.room.g.ph==='vote'&&MP.room.g.open,null,{timeout:10000});
 await P[voters[0]].click('.opt.skip');await P[voters[0]].click('.btn.primary:has-text("Cast my vote")');
 await P[voters[1]].waitForFunction(n=>MP.room.g.board&&MP.room.g.board.some(x=>x.n===n&&x.v==='none'),voters[0],{timeout:10000});
 ok(await P[voters[1]].isVisible('.board'),'(10) table vote: other phones see each vote live');
 ok(await host.isVisible('#hboard .board'),'(10) the host sees the live board too');
 // (11) skip counts / does not count
 const verdict=await host.evaluate(()=>{const save1=JSON.stringify(G);const al=aliveIdx();const bal={};bal[al[0]]='none';bal[al[1]]='none';bal[al[2]]='none';bal[al[3]]=al[0];
   S.rules.skipVote=true;tallyVotes(bal);const a=G.verdict.kind;G=JSON.parse(save1);S.rules.skipVote=false;tallyVotes(bal);const bb=G.verdict.kind+':'+G.verdict.j;G=JSON.parse(save1);S.rules.skipVote=true;return a+' / '+bb+' / '+al[0];});
 const [k1,k2,who]=verdict.split(' / ');ok(k1==='skipped'&&k2==='out:'+who,'(11) 3 skips + 1 vote: skip counts -> nobody out; skip not counted -> that player out ('+verdict+')');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

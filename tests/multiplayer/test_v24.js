// v2.4 features end to end through the relay (default local wrangler dev):
// presets, recommended Mafia, volumes, online player screen, share, kick (lobby + game), buzz limit,
// night timer, ghost view, player timer, recap card, profile, shared group history.
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787';
const signup=(p,n)=>p.evaluate(n=>aReq('/acc/signup',{uname:(n.replace(/[^A-Za-z0-9]/g,'')+Math.random().toString(36).slice(2,8)).slice(0,20),pass:'secret12'}).then(r=>{signedIn(r);return aReq('/acc/profile',{display:n});}).then(j=>{S.acct.u=j.user;S.mpName=n;save();}),n);  // online play needs an account
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async name=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();
   p.on('pageerror',e=>errs.push(name+': '+e.message));await p.goto(URL);
   await p.evaluate(([n,r])=>{S.mpName=n;S.relay=r;save();window.__open=[];window.open=u=>__open.push(u);},[name,RELAY]);await signup(p,name);return p;};
 // ---- settings, presets, volumes
 const a=await mk('Alhassan');
 await a.evaluate(()=>nav('setup'));ok((await a.textContent('.rsum .badge')).trim()==='Classic','setup shows the rules card with preset Classic');
 await a.click('.rsum');ok(await a.evaluate(()=>V==='rules'),'rules card opens Game rules');
 await a.click('.preset button:has-text("Beginner")');ok(await a.evaluate(()=>S.rules.saverev&&!S.rules.skip&&S.rules.timer===240&&presetOf()==='beginner'),'Beginner preset applies its rules');
 await a.click('.tg:has-text("Reveal role")');ok(await a.evaluate(()=>presetOf()==='custom'),'changing a rule turns the preset into Custom');
 await a.click('.preset button:has-text("Classic")');await a.evaluate(()=>back());await a.waitForTimeout(400);ok(await a.evaluate(()=>V==='setup'),'back from Game rules returns to setup');
 await a.evaluate(()=>{S.players=Array.from({length:9},(x,i)=>'P'+(i+1));S.counts.mafia=1;render();});
 await a.click('.rec');ok(await a.evaluate(()=>S.counts.mafia===2),'recommended Mafia for 9 players (2) applies');
 await a.evaluate(()=>nav('settings'));await a.$eval('.tg.vol input',e=>{e.value=40;e.dispatchEvent(new Event('input'));});
 ok(await a.evaluate(()=>S.vol.voice===0.4),'narrator volume slider sets 40%');
 await a.evaluate(()=>{S.vol.voice=1;S.players=['P1','P2','P3','P4','P5','P6'];S.counts={mafia:1,doctor:1,detective:1};save();nav('home');});
 // ---- online room
 await a.evaluate(()=>{S.host.buzzMax=2;S.host.kick='any';S.rules.ghost=true;save();});
 await a.click('#mode-online');await a.click('button:has-text("Host online")');
 await a.waitForFunction(()=>MP.online&&HN.ws&&HN.ws.readyState===1);const code=await a.evaluate(()=>MP.online.code);
 ok(await a.isVisible('button:has-text("Share room code")'),'host lobby has Share room code');
 const names=['Dareer','Sami','Hokan','Farouq','Fater'];const P={};
 for(const n of names){const p=await mk(n);await p.click('#mode-online');await p.fill('#ocode',code);await p.click('button:has-text("Join online")');P[n]=p;}
 for(const n of names)await P[n].waitForFunction(()=>MP.status==='ok',null,{timeout:15000});
 ok((await P.Sami.textContent('.top .brand b')).includes("Alhassan's room"),'player header shows "Alhassan\'s room"');
 ok(!(await P.Sami.textContent('#lat')).trim(),'no fake "Signal: 0 ms" online');
 // buzz limit 2
 for(let k=0;k<4;k++){await P.Hokan.click('button:has-text("Buzz the host")').catch(()=>{});await P.Hokan.waitForTimeout(500);}
 await a.waitForFunction(()=>Object.values(MP.players).some(q=>q.name==='Hokan'&&q.buzz>=2),null,{timeout:8000});
 await P.Hokan.waitForFunction(()=>MP.room&&MP.room.mu,null,{timeout:8000});ok(await P.Hokan.isVisible('text=The host muted buzzes from you'),'after 2 buzzes Hokan is muted and told so');
 ok(await a.isVisible('.prs:has-text("Hokan") button:has-text("Unmute")'),'host can unmute Hokan');
 // kick in the lobby
 await a.click('.prs:has-text("Fater") button:has-text("Kick")');await a.click('.sheet .btn.primary');
 await P.Fater.waitForFunction(()=>MP.status==='kicked',null,{timeout:10000});ok(await P.Fater.isVisible('text=The host removed you'),'kicked player sees "The host removed you from the room"');
 await P.Fater.evaluate(c=>{joinOnline(c);},code);await P.Fater.waitForTimeout(3000);
 await P.Fater.waitForFunction(()=>MP.status==='ok',null,{timeout:15000});ok(await a.evaluate(()=>Object.values(MP.players).some(q=>q.name==='Fater')),'kicked player can join again (v2.8)');
 await a.click('.prs:has-text("Fater") button:has-text("Kick")');await a.click('.sheet .btn.primary');await P.Fater.waitForFunction(()=>MP.status==='kicked',null,{timeout:10000});
 // deal + night with a short night timer
 await a.click('button:has-text("Deal roles")');
 for(const n of names.slice(0,4)){await P[n].waitForFunction(()=>MP.room&&MP.room.g,null,{timeout:8000});await P[n].dispatchEvent('#hold','mousedown');await P[n].dispatchEvent('#hold','mouseup');await P[n].click('#memo');}
 await a.dispatchEvent('#hold','mousedown');await a.dispatchEvent('#hold','mouseup');await a.click('#memo');await a.click('button:has-text("Start Night 1")');
 const roles=await a.evaluate(()=>Object.fromEntries(G.names.map((n,i)=>[n,G.roles[i]])));
 await a.evaluate(()=>{G.nightEnd=Date.now()+4000;hostPublish();});
 await P.Dareer.waitForSelector('.ptimer',{timeout:6000});ok((await P.Dareer.textContent('.ptimer')).includes('Night timer'),'players see the night countdown');
 // only the Mafia acts; everyone else times out
 const maf=Object.keys(roles).find(n=>roles[n]==='mafia'),victim=Object.keys(roles).find(n=>roles[n]==='citizen'&&n!=='Alhassan')||Object.keys(roles).find(n=>roles[n]!=='mafia'&&n!=='Alhassan');
 const idx=n=>Object.keys(roles).indexOf(n);
 if(maf==='Alhassan'){await a.click('button:has-text("Take my turn")');await a.click(`.opt:has(.num:text-is("${idx(victim)+1}"))`);await a.click('.btn.primary:has-text("Confirm")');await a.click('button:has-text("Done")');}
 else{await P[maf].waitForFunction(()=>MP.room.g.ph==='night');await P[maf].click(`.opt:has(.num:text-is("${idx(victim)+1}"))`);await P[maf].click('.btn.primary:has-text("Confirm")');}
 await a.waitForFunction(()=>G.phase==='dawn',null,{timeout:12000});ok(await a.evaluate(()=>G.skipped>0),'night timer skipped the players who did not act ('+await a.evaluate(()=>G.skipped)+')');
 await a.click('.btn.gold');await a.click('text=Reveal now').catch(()=>{});
 // ghost view for the victim (if alive phone)
 if(victim!=='Alhassan'){await P[victim].waitForFunction(()=>MP.room.g&&MP.room.g.ph==='dead',null,{timeout:10000});
   ok(await P[victim].evaluate(()=>Array.isArray(MP.room.g.roles))&&await P[victim].isVisible('.sec.ghost'),victim+' (dead) sees everyone\'s role in ghost view');
   const alive=names.slice(0,4).find(n=>n!==victim);ok(await P[alive].evaluate(()=>!MP.room.g.roles),'living players do not get the roles');}
 // discussion timer on players
 await a.click('button:has-text("Start Day")');await a.click('.tb.go');
 const liv=names.slice(0,4).find(n=>n!==victim);await P[liv].waitForSelector('.ptimer',{timeout:6000});
 const t1=await P[liv].textContent('#ptt');await P[liv].waitForTimeout(2200);const t2=await P[liv].textContent('#ptt');
 ok(t1!==t2,'player phone counts the discussion timer down ('+t1+' -> '+t2+')');
 // leave asks for confirmation mid-game
 await P[liv].click('button.danger:has-text("Leave")');ok(await P[liv].isVisible('.sheet:has-text("Leave the game?")'),'Leave mid-game asks for confirmation');await P[liv].click('.sheet .btn.ghost');
 // mid-game kick via the players button
 const kicked=names.slice(0,4).find(n=>n!==victim&&n!==liv&&roles[n]!=='mafia');
 if(kicked){await a.click('.pfab');await a.click(`.sheet .prs:has-text("${kicked}") button:has-text("Kick")`);await a.click('.sheet .btn.primary');
   ok(await a.evaluate(n=>!G||(G.phase==='end')||(!G.alive[G.names.indexOf(n)]&&G.hist.some(h=>h.includes(n))),kicked),'mid-game kick eliminates '+kicked+' and is written in the game log');}
 // finish quickly and check the recap card
 await a.evaluate(()=>{if(G&&G.phase!=='end'){G.phase='end';G.winner='citizens';G.revealed=true;render();}});await a.waitForTimeout(500);
 ok(await a.isVisible('.recap .rc-mvp')&&await a.isVisible('.recap .rc-roles'),'end screen shows the recap card with player of the game');
 await a.click('button:has-text("Valid")');
 // profile
 await a.evaluate(()=>{finish();hostStop();nav('stats');});await a.waitForTimeout(400);
 await a.click('.lb.tap');ok(await a.evaluate(()=>V==='profile')&&await a.isVisible('.rbar'),'tapping a leaderboard row opens the player profile');
 // ---- shared group history
 const g1=await mk('G1'),g2=await mk('G2');
 const fake=(id,w)=>({id,names:['A','B','C','D'],roles:['mafia','doctor','citizen','detective'],alive:[true,true,false,true],winner:w,days:2,hist:['Night 1: x'],valid:true,ev:{first:2,saves:[],caught:[]}});
 await g1.evaluate(([x,y])=>{S.log=[x,y];save();},[fake(1000001,'mafia'),fake(1000002,'citizens')]);
 await g2.evaluate(x=>{S.log=[x];save();},fake(2000001,'citizens'));
 await g1.evaluate(()=>{nav('settings');gCreate();});await g1.waitForFunction(()=>S.gsync&&S.gcache.length===2,null,{timeout:10000});
 const gc=await g1.evaluate(()=>S.group.code);ok(/^[A-Z2-9]{8}$/.test(gc),'group created with code '+gc+' and the 2 old games uploaded');
 await g2.evaluate(c=>{nav('settings');gJoin(c);},gc);await g2.waitForFunction(()=>S.gcache&&S.gcache.length===3,null,{timeout:10000});
 ok(true,'second phone joined: its old game uploaded, sees all 3');
 await g1.evaluate(()=>gSync());await g1.waitForFunction(()=>S.gcache.length===3,null,{timeout:10000});ok(true,'first phone sees 3 after sync');
 await g2.evaluate(()=>nav('game:1000001'));ok(await g2.isVisible('text=Recorded by another phone'),'a game recorded by another phone cannot be edited');
 await g2.evaluate(()=>{const g=LOG().find(x=>x.id===1000001);g.mine=true;toggleValid(1000001);});await g2.waitForTimeout(1500);
 await g1.evaluate(()=>gSync());await g1.waitForTimeout(1200);ok(await g1.evaluate(()=>LOG().find(x=>x.id===1000001).valid===true),'the relay refuses an edit from another phone even if forced');
 await g1.evaluate(()=>nav('game:1000002'));await g1.click('button:has-text("Mark as invalid"),button:has-text("invalid")').catch(()=>{});await g1.waitForTimeout(1500);
 await g2.evaluate(()=>gSync());await g2.waitForFunction(()=>LOG().find(x=>x.id===1000002).valid===false,null,{timeout:10000});ok(true,'owner marks a game invalid; the other phone sees it after sync');
 await g1.evaluate(()=>delGame(1000001));await g1.waitForTimeout(1500);await g2.evaluate(()=>gSync());await g2.waitForFunction(()=>LOG().length===2,null,{timeout:10000});ok(true,'owner deletes a game; gone for everyone');
 await g2.evaluate(()=>nav('stats'));ok(await g2.isVisible('.lb'),'stats are built from the group history');
 const bad=await mk('G3');await bad.evaluate(()=>{nav('settings');gJoin('ZZZZ2222');});await bad.waitForTimeout(2500);ok(await bad.evaluate(()=>!S.group),'unknown group code is rejected');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

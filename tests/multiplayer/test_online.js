// Online mode end to end through the relay (default: local `wrangler dev` on 8787; pass a wss:// URL to test the deployed one).
// Plain browsers, no Android shims: online mode needs no native server.
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787';
const signup=(p,n)=>p.evaluate(n=>aReq('/acc/signup',{uname:(n.replace(/[^A-Za-z0-9]/g,'')+Math.random().toString(36).slice(2,8)).slice(0,20),pass:'secret12'}).then(r=>{signedIn(r);return aReq('/acc/profile',{display:n});}).then(j=>{S.acct.u=j.user;S.mpName=n;save();}),n);  // online play needs an account
const ok=(c,msg)=>{if(!c){console.log('FAIL',msg);process.exitCode=1;}else console.log('ok  ',msg);};
(async()=>{const b=await chromium.launch();const errs=[];const ctx={};
 const mk=async name=>{ctx[name]=await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'});const p=await ctx[name].newPage();
   p.on('pageerror',e=>errs.push(name+': '+e.message));await p.goto(URL);
   await p.evaluate(([n,r])=>{S.mpName=n;S.rules.skip=false;S.relay=r;save();
     window.__narr=[];for(const m in NARR){const f=NARR[m];NARR[m]=(...a)=>{__narr.push(m);return f(...a);};}},[name,RELAY]);await signup(p,name);return p;};
 const host=await mk('Alhassan');await host.click('#mode-online');await host.click('button:has-text("Host online")');
 await host.waitForFunction(()=>MP.online&&HN.ws&&HN.ws.readyState===1,null,{timeout:10000});
 const code=await host.evaluate(()=>MP.online.code);
 ok(/^\d{6}$/.test(code)&&(await host.textContent('.big')).replace(/\s/g,'').includes(code),'host shows a 6-digit room code: '+code);
 const names=['Dareer','Sami','Hokan','Farouq'];const P={Alhassan:host};
 for(const n of names){const p=await mk(n);await p.click('#mode-online');await p.fill('#ocode',code);await p.click('button:has-text("Join online")');P[n]=p;}
 for(const n of names)await P[n].waitForFunction(()=>MP.status==='ok',null,{timeout:15000});
 ok(true,'4 players joined by code');
 await host.waitForFunction(()=>Object.values(MP.players).filter(q=>q.on).length===4,null,{timeout:10000});
 await host.evaluate(()=>{S.counts={mafia:1,doctor:1,detective:1};render();});
 await host.click('button:has-text("Deal roles")');
 for(const n of names){await P[n].waitForFunction(()=>MP.room&&MP.room.g,null,{timeout:8000});await P[n].dispatchEvent('#hold','mousedown');await P[n].dispatchEvent('#hold','mouseup');await P[n].click('#memo');}
 ok(await P.Dareer.evaluate(()=>__narr.includes('welcome')),'the welcome narration plays on player phones too');
 await host.dispatchEvent('#hold','mousedown');await host.dispatchEvent('#hold','mouseup');await host.click('#memo');
 await host.click('button:has-text("Start Night 1")');
 const roles=await host.evaluate(()=>Object.fromEntries(G.names.map((n,i)=>[n,G.roles[i]])));
 const leak=await P.Sami.evaluate(()=>JSON.stringify(MP.room));
 ok(['mafia','doctor','detective','citizen'].filter(r=>r!==roles.Sami&&leak.includes('"'+r+'"')).length===0,'a player only receives their own role');
 const by=r=>Object.keys(roles).find(n=>roles[n]===r),idx=n=>Object.keys(roles).indexOf(n);
 let night=1;
 while(night<=6){
  await host.waitForFunction(()=>G&&G.phase==='mpNight',null,{timeout:10000});
  if(night===1)ok(await P.Hokan.waitForFunction(()=>__narr.includes('night'),null,{timeout:5000}).then(()=>true,()=>false),'night narration reaches player phones');
  const alive=await host.evaluate(()=>G.names.filter((n,i)=>G.alive[i]));
  const victim=alive.find(n=>roles[n]==='citizen')||alive.find(n=>roles[n]!=='mafia');
  for(const n of alive){const p=P[n],r=roles[n];
    const tgt=r==='mafia'?victim:r==='detective'?by('mafia'):null;
    if(n==='Alhassan')await p.click('button:has-text("Take my turn")');else await p.waitForFunction(()=>MP.room.g.ph==='night',null,{timeout:10000});
    if(tgt!=null)await p.click(`.opt:has(.num:text-is("${idx(tgt)+1}"))`);else{const o=await p.$('.opt:not([disabled])');if(o)await o.click();}
    await p.click('.btn.primary:has-text("Confirm")');if(n==='Alhassan')await p.click('button:has-text("Done")');}
  await host.waitForFunction(()=>G.phase==='dawn',null,{timeout:10000});
  await host.click('.btn.gold');await host.click('text=Reveal now').catch(()=>{});
  if(await host.evaluate(()=>G.phase==='end'))break;
  await host.click('button:has-text("Start Day")');await host.click('button:has-text("Start secret ballot")');
  const alive2=await host.evaluate(()=>G.names.filter((n,i)=>G.alive[i]));const out=by('mafia');
  if(night===1){// a player drops off mid-vote and comes back; the host app is killed and resumed
    const d=alive2.find(n=>n!=='Alhassan'&&n!==out);
    // Wi-Fi drop as phones see it: the socket still looks open but nothing gets through
    await P[d].evaluate(()=>{const w=window.__dead=MP.ws;w.onmessage=null;w.onclose=null;w.send=()=>{};});
    const t0=Date.now();await P[d].waitForFunction(()=>MP.ws&&MP.ws!==window.__dead&&MP.ws.readyState===1,null,{timeout:15000});
    ok(true,d+' silent dead connection replaced after '+((Date.now()-t0)/1000).toFixed(1)+' s');
    await P[d].waitForFunction(()=>MP.status==='ok'&&MP.room.g.ph==='vote',null,{timeout:20000});ok(true,d+' back online, still in the vote');
    await host.reload();
    const others=names.filter(n=>alive2.includes(n));
    await P[others[0]].waitForFunction(()=>MP.status==='lost',null,{timeout:15000});ok(true,'players see the host disconnect');
    await host.evaluate(r=>{S.relay=r;},RELAY);await host.click('button:has-text("Resume hosted game")');
    ok(await host.evaluate(()=>G&&G.phase==='mpVote'&&!!MP.online),'host resumed the online game into the vote');
    for(const n of others)await P[n].waitForFunction(()=>MP.status==='ok',null,{timeout:20000});ok(true,'players reconnected to the resumed host');}
  for(const n of alive2){const p=P[n];
    if(n==='Alhassan')await p.click('button:has-text("Cast my vote")');else await p.waitForFunction(()=>MP.room.g.ph==='vote',null,{timeout:15000});
    if(n===out)await p.click('.opt.skip');else await p.click(`.opt:has(.num:text-is("${idx(out)+1}"))`);
    await p.click('.btn.primary:has-text("Cast my vote")');}
  await host.waitForFunction(()=>G.phase==='verdict'||G.phase==='end',null,{timeout:15000});await host.click('text=Reveal now').catch(()=>{});
  if(await host.evaluate(()=>G.phase==='end'))break;
  await host.click('button:has-text("Go to Night")');night++;}
 await host.waitForTimeout(500);
 ok(await host.evaluate(()=>G&&G.phase==='end'&&G.winner==='citizens'),'game finished: '+await host.evaluate(()=>G&&G.winner+' / '+G.hist.join(' / ')));
 await P.Farouq.waitForFunction(()=>MP.room.g&&MP.room.g.ph==='end',null,{timeout:10000});
 ok((await P.Farouq.$eval('.recap .res',e=>e.textContent)).length>0,'end screen on a player phone: '+await P.Farouq.$eval('.recap .res',e=>e.textContent));
 ok(await P.Farouq.evaluate(()=>__narr.includes('citizensWin')),'winner narration on player phones');
 // a wrong code is rejected
 const x=await mk('Fater');await x.click('#mode-online');await x.fill('#ocode','000001');await x.click('button:has-text("Join online")');
 await x.waitForFunction(()=>MP.status==='noroom',null,{timeout:15000});ok(true,'wrong room code: "Room not found"');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

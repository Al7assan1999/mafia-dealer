// Stage 4 reconnection: during one secret vote, a player votes while offline, a player's app restarts,
// a player loses the host's address, and the host app is killed and resumed. All votes must count.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const PY=process.platform==='win32'?'python':'python3';
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.__keep=[];window.Net={start(){},keep(on){window.__keep.push(on)},put(k,v){try{X('POST','/__put',JSON.stringify({k,v}))}catch(e){}},
    take(){try{const r=X('GET','/__take');return r==='\u0000'?null:r}catch(e){return null}},clear(){try{X('GET','/__clear')}catch(e){}},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const ok=(c,msg)=>{if(!c){console.log('FAIL',msg);process.exitCode=1;}else console.log('ok  ',msg);};
const up=async()=>{const s=spawn(PY,['mock_srv.py']);await new Promise(r=>setTimeout(r,800));return s;};
(async()=>{let srv=await up();
 const b=await chromium.launch();const errs=[];const ctx={};
 const mk=async(shim,name)=>{ctx[name]=await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'});const p=await ctx[name].newPage();
   p.on('pageerror',e=>errs.push(name+': '+e.message));await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;S.rules.skip=false;save();},name);return p;};
 const host=await mk(hostShim,'Alhassan');await host.click('text=Play Together');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 ok((await host.evaluate(()=>__keep.join()))==='true','host start turns the background service on');
 const names=['Dareer','Sami','Hokan','Farouq','Khaddour'];const P={Alhassan:host};
 for(const n of names){const p=await mk(clientShim,n);await p.click('text=Play Together');await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');P[n]=p;}
 for(const n of names)await P[n].waitForFunction(()=>MP.status==='ok',null,{timeout:20000});
 await host.waitForTimeout(800);await host.evaluate(()=>{S.counts={mafia:1,doctor:1,detective:1};render();});
 await host.click('button:has-text("Deal roles")');
 for(const n of names){await P[n].waitForFunction(()=>MP.room&&MP.room.g,null,{timeout:8000});await P[n].dispatchEvent('#hold','mousedown');await P[n].dispatchEvent('#hold','mouseup');await P[n].click('#memo');}
 await host.dispatchEvent('#hold','mousedown');await host.dispatchEvent('#hold','mouseup');await host.click('#memo');
 await host.click('button:has-text("Start Night 1")');
 // night 1: everyone takes the first allowed option
 for(const n of ['Alhassan',...names]){const p=P[n];
   if(n==='Alhassan'){await p.click('button:has-text("Take my turn")');}else await p.waitForFunction(()=>MP.room.g.ph==='night',null,{timeout:10000});
   const o=await p.$('.opt:not([disabled])');if(o)await o.click();await p.click('.btn.primary:has-text("Confirm")');
   if(n==='Alhassan')await p.click('button:has-text("Done")');}
 await host.waitForFunction(()=>G.phase==='dawn',null,{timeout:10000});
 await host.click('.btn.gold');await host.click('text=Reveal now').catch(()=>{});
 await host.click('button:has-text("Start Day")');await host.click('button:has-text("Start secret ballot")');
 const alive=await host.evaluate(()=>G.names.filter((n,i)=>G.alive[i]));const cl=alive.filter(n=>n!=='Alhassan');
 console.log('alive for the vote:',alive.join(', '));
 const vote=async n=>{const p=P[n];await p.waitForFunction(()=>MP.status==='ok'&&MP.room.g&&MP.room.g.ph==='vote',null,{timeout:30000});
   await p.click('.opt.skip');await p.click('.btn.primary:has-text("Cast my vote")');};
 const votes=()=>host.evaluate(()=>Object.keys(G.votes).length);
 // a) Wi-Fi off, votes while offline, Wi-Fi back on
 const a=cl[0];await P[a].waitForFunction(()=>MP.room.g.ph==='vote',null,{timeout:10000});
 await ctx[a].setOffline(true);await P[a].click('.opt.skip');await P[a].click('.btn.primary:has-text("Cast my vote")');
 await P[a].waitForFunction(()=>MP.status==='lost',null,{timeout:15000});
 await host.waitForFunction(n=>Object.values(MP.players).some(q=>q.name===n&&!q.on),a,{timeout:15000});
 ok(await host.evaluate(n=>G.alive[G.names.indexOf(n)],a),a+' offline 10 s+: shown offline but still in the game');
 await P[a].waitForTimeout(4000);await ctx[a].setOffline(false);
 await host.waitForFunction(n=>G.votes[G.names.indexOf(n)]!==undefined,a,{timeout:15000});
 ok(true,a+' vote cast while offline arrives after Wi-Fi returns');
 // b) app restart -> rejoins by itself, role intact
 const bN=cl[1];const roleBefore=await P[bN].evaluate(()=>MP.room.g.role);await P[bN].reload();
 await P[bN].waitForFunction(()=>MP.status==='ok'&&MP.room&&MP.room.g&&MP.room.g.ph==='vote',null,{timeout:20000});
 ok(await P[bN].evaluate(()=>MP.room.g.role)===roleBefore,bN+' app restart: rejoined on its own with the same role');
 await vote(bN);
 // c) host address goes stale -> player searches again
 const c=cl[2];await P[c].evaluate(()=>{MP.host.ip='10.255.255.1';S.mpLastHost='10.255.255.1';});
 await P[c].waitForFunction(()=>MP.status==='ok'&&MP.host.ip!=='10.255.255.1',null,{timeout:40000});
 ok(true,c+' lost the host address: found it again at '+await P[c].evaluate(()=>MP.host.ip));
 await vote(c);
 const before=await votes();
 // d) host app killed (server and page gone), reopened, resumed
 srv.kill();await host.reload();
 const btn=await host.$('button:has-text("Resume hosted game")');ok(!!btn,'host reopened: Resume hosted game offered ('+(btn&&(await btn.innerText()).replace(/\n/g,' '))+')');
 srv=await up();await host.click('button:has-text("Resume hosted game")');
 ok(await host.evaluate(()=>G&&G.phase==='mpVote'),'host resumed into the vote');
 ok(await votes()===before,'votes kept across the host restart: '+before);
 ok((await host.evaluate(()=>__keep.join()))==='true','resume turns the background service back on');
 for(const n of cl.slice(3))await vote(n);
 if(alive.includes('Alhassan')){await host.click('button:has-text("Cast my vote")');await host.click('.opt.skip');await host.click('.btn.primary:has-text("Cast my vote")');}
 await host.waitForFunction(()=>G.phase==='verdict',null,{timeout:20000});
 ok(await host.evaluate(n=>Object.keys(G.votes).length===n,alive.length),'all '+alive.length+' votes counted, verdict reached');
 await host.click('text=Reveal now').catch(()=>{});await host.click('button:has-text("Go to Night")');
 for(const n of cl)await P[n].waitForFunction(()=>MP.room.g.ph==='night',null,{timeout:15000});
 ok(true,'night 2 reaches every phone');
 // leaving the room clears the snapshot and the service
 await host.evaluate(()=>{G=null;hostBackRoom();});await host.evaluate(()=>leaveNow());await host.waitForTimeout(600);
 ok(await host.evaluate(()=>!localStorage.getItem('mafiaDealer.mp')&&__keep[__keep.length-1]===false),'closing the room clears the saved game and stops the service');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

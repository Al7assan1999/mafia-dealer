const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const MODE=process.argv[2]||'cit';
(async()=>{const srv=spawn(process.platform==='win32'?'python':'python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const ctx=await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;S.rules.skip=false;save();},name);return p;};
 const host=await mk(hostShim,'Alhassan');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const names=['Dareer','Sami','Hokan','Farouq'];const P={Alhassan:host};
 for(const n of names){const p=await mk(clientShim,n);await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');P[n]=p;}
 for(const n of names)await P[n].waitForFunction(()=>MP.status==='ok',null,{timeout:20000});
 await host.waitForTimeout(800);await host.evaluate(()=>{S.counts={mafia:1,doctor:1,detective:1};render();});
 await host.click('button:has-text("Deal roles")');
 for(const n of names){await P[n].waitForFunction(()=>MP.room&&MP.room.g,null,{timeout:8000});await P[n].dispatchEvent('#hold','mousedown');await P[n].dispatchEvent('#hold','mouseup');await P[n].click('#memo');}
 await host.dispatchEvent('#hold','mousedown');await host.dispatchEvent('#hold','mouseup');await host.click('#memo');
 await host.waitForSelector('button:has-text("Start Night 1")',{timeout:10000});await host.click('button:has-text("Start Night 1")');
 const roles=await host.evaluate(()=>Object.fromEntries(G.names.map((n,i)=>[n,G.roles[i]])));console.log('roles',JSON.stringify(roles));
 const by=r=>Object.keys(roles).find(n=>roles[n]===r), cits=Object.keys(roles).filter(n=>roles[n]==='citizen');
 const idx=n=>Object.keys(roles).indexOf(n);
 const pickOn=async(name,target)=>{const p=P[name];
   if(name==='Alhassan'){await p.click('button:has-text("Take my turn")');}
   else await p.waitForFunction(()=>MP.room&&MP.room.g&&(MP.room.g.ph==='night'),null,{timeout:10000});
   if(target==null){const o=await p.$('.opt:not([disabled])');if(o)await o.click();}
   else await p.click(`.opt:has(.num:text-is("${idx(target)+1}"))`);
   await p.click('.btn.primary:has-text("Confirm")');
   if(name==='Alhassan'){await p.click('button:has-text("Done")');}};
 let night=1;
 while(true){
  console.log('--- night',night);
  await host.waitForFunction(()=>G&&G.phase==='mpNight',null,{timeout:10000});
  const alive=await host.evaluate(()=>G.names.filter((n,i)=>G.alive[i]));
  const victim=MODE==='maf'?alive.find(n=>roles[n]!=='mafia'&&n!==by('doctor')):cits.find(n=>alive.includes(n));
  for(const n of alive){const r=roles[n];
    const tgt=r==='mafia'?victim:r==='doctor'?(alive.includes(by('doctor'))?by('doctor'):null):r==='detective'?by('mafia'):null;
    await pickOn(n,tgt);
    if(r==='detective'&&n!=='Alhassan'){await P[n].waitForFunction(()=>MP.room.g.check,null,{timeout:8000});console.log('  detective',n,'sees:',await P[n].evaluate(()=>JSON.stringify(MP.room.g.check)),'(phase '+await P[n].evaluate(()=>MP.room.g.ph)+')');}}
  await host.waitForFunction(()=>G.phase==='dawn',null,{timeout:10000});
  await host.click('.btn.gold');await host.click('text=Reveal now').catch(()=>{});
  if(await host.evaluate(()=>G.phase==='end'))break;
  const someone=names.find(n=>alive.includes(n)&&roles[n]!=='mafia')||names[0];
  await P[someone].waitForFunction(()=>MP.room.g.msg,null,{timeout:8000});console.log('  morning on',someone+"'s phone:",await P[someone].$eval('.big',e=>e.innerText.replace(/\n+/g,' ').slice(0,90)));
  if(night===1)await P[someone].screenshot({path:'s3_morning.png'});
  await host.click('button:has-text("Start Day")');
  await host.click('button:has-text("Start secret ballot")');
  const alive2=await host.evaluate(()=>G.names.filter((n,i)=>G.alive[i]));
  const out=MODE==='cit'?by('mafia'):alive2.find(n=>roles[n]!=='mafia');
  for(const n of alive2){const p=P[n];
    if(n==='Alhassan')await p.click('button:has-text("Cast my vote")');else await p.waitForFunction(()=>MP.room.g.ph==='vote',null,{timeout:10000});
    if(n===out)await p.click('.opt.skip');else await p.click(`.opt:has(.num:text-is("${idx(out)+1}"))`);
    if(night===1&&n===names.find(x=>alive2.includes(x)))await p.screenshot({path:'s3_vote.png'});
    await p.click('.btn.primary:has-text("Cast my vote")');}
  await host.waitForFunction(()=>G.phase==='verdict'||G.phase==='end',null,{timeout:10000});await host.click('text=Reveal now').catch(()=>{});
  if(await host.evaluate(()=>G.phase==='end'))break;
  console.log('  verdict:',await host.evaluate(()=>G.verdict.tally));
  await host.click('button:has-text("Go to Night")');night++;if(night>6)break;}
 await host.waitForTimeout(500);
 console.log('WINNER',await host.evaluate(()=>G.winner),'hist',await host.evaluate(()=>G.hist.join(' / ')));
 const c=names[0];await P[c].waitForFunction(()=>MP.room.g&&MP.room.g.ph==='end',null,{timeout:8000});console.log(c,'end screen:',await P[c].$eval('.recap .res',e=>e.textContent));
 await P[c].screenshot({path:'s3_end.png'});
 await host.click('text=Valid game');await host.click('button:has-text("Back to lobby")');
 console.log('logged games',await host.evaluate(()=>S.log.length),'host view',await host.evaluate(()=>V+' G='+!!G+' game='+!!MP.game));
 await P[c].waitForFunction(()=>MP.room&&!MP.room.g,null,{timeout:8000});console.log('clients back in lobby');
 console.log('errs',errs);srv.kill();await b.close();})();

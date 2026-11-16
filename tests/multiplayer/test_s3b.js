const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
(async()=>{const srv=spawn(process.platform==='win32'?'python':'python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];const ctxs={};
 const mk=async(shim,name)=>{const ctx=await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'});ctxs[name]=ctx;const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();},name);return p;};
 const host=await mk(hostShim,'Alhassan');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const names=['Dareer','Sami','Hokan','Farouq','Halawy','Khaddour'];const P={Alhassan:host};
 for(const n of names){const p=await mk(clientShim,n);await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');P[n]=p;}
 for(const n of names)await P[n].waitForFunction(()=>MP.status==='ok',null,{timeout:20000});
 await host.waitForTimeout(800);await host.evaluate(()=>{S.counts={mafia:2,doctor:1,detective:0};render();});
 await host.click('button:has-text("Deal roles")');
 // force both Mafia onto client phones for this test
 await host.evaluate(()=>{const g=MP.game;const hi=g.ids.indexOf('host');g.roles=g.roles.map(()=> 'citizen');g.roles[1]='mafia';g.roles[2]='mafia';g.roles[3]='doctor';hostPublish();});
 for(const n of names){await P[n].waitForFunction(()=>MP.room&&MP.room.g,null,{timeout:8000});await P[n].waitForTimeout(800);await P[n].dispatchEvent('#hold','mousedown');await P[n].dispatchEvent('#hold','mouseup');await P[n].click('#memo');}
 console.log('Dareer mafia card mates:',await P.Dareer.evaluate(()=>JSON.stringify(MP.room.g.mates)));
 await host.dispatchEvent('#hold','mousedown');await host.dispatchEvent('#hold','mouseup');await host.click('#memo');
 await host.click('button:has-text("Start Night 1")');
 await P.Dareer.waitForFunction(()=>MP.room.g.ph==='night',null,{timeout:8000});
 await P.Dareer.click('.opt:has(.num:text-is("5"))');await P.Dareer.click('.btn.primary:has-text("Confirm")');
 await P.Sami.waitForFunction(()=>MP.room.g.opts&&MP.room.g.opts.some(o=>/teammate picked/.test(o.tag)),null,{timeout:8000});
 console.log('Sami sees teammate pick:',await P.Sami.evaluate(()=>MP.room.g.opts.filter(o=>o.tag).map(o=>o.name+'='+o.tag).join(', ')));
 await P.Sami.screenshot({path:'s3_mates.png'});
 await P.Sami.click('.opt:has(.num:text-is("5"))');await P.Sami.click('.btn.primary:has-text("Confirm")');
 // Khaddour's phone dies before acting
 await ctxs.Khaddour.close();
 for(const n of ['Hokan','Farouq','Halawy']){await P[n].waitForFunction(()=>MP.room.g.ph==='night',null,{timeout:8000});await P[n].click('.opt:not([disabled])');await P[n].click('.btn.primary:has-text("Confirm")');}
 await host.click('button:has-text("Take my turn")');await host.click('.opt:not([disabled])');await host.click('.btn.primary:has-text("Confirm")');await host.click('button:has-text("Done")');
 await host.waitForFunction(()=>$('mpprog')&&$('mpprog').innerText.includes('offline'),null,{timeout:15000});
 console.log('host shows:',await host.$eval('#mpprog',e=>e.innerText.replace(/\n+/g,' | ')));await host.screenshot({path:'s3_offline.png'});
 await host.click('button:has-text("Continue without them")');
 await host.waitForFunction(()=>G.phase==='dawn',null,{timeout:6000});await host.click('.btn.gold');await host.click('text=Reveal now').catch(()=>{});
 console.log('night result:',await host.evaluate(()=>G.hist.join(' / ')));
 console.log('errs',errs);srv.kill();await b.close();})();

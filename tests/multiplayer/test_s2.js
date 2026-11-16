const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
(async()=>{const srv=spawn(process.platform==='win32'?'python':'python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const ctx=await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();},name);return p;};
 const host=await mk(hostShim,'Alhassan');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const names=['Dareer','Sami','Hokan','Farouq'];const cl=[];
 for(const n of names){const p=await mk(clientShim,n);await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');cl.push(p);}
 for(const p of cl)await p.waitForFunction(()=>MP.status==='ok',null,{timeout:20000});
 await host.waitForTimeout(800);await host.evaluate(()=>{S.counts={mafia:1,doctor:1,detective:1};render();});
 console.log('host deal enabled:',await host.$eval('text=Deal roles',e=>!e.disabled));await host.screenshot({path:'s2a.png',fullPage:true});
 await host.click('text=Deal roles');
 for(const p of cl)await p.waitForFunction(()=>MP.room&&MP.room.g,null,{timeout:8000});
 const hostRoles=await host.evaluate(()=>MP.game.names.map((n,i)=>n+':'+MP.game.roles[i]).join(' '));console.log('host deck:',hostRoles);
 for(const [i,p] of cl.entries()){const st=await p.evaluate(()=>JSON.stringify(MP.room));const r=JSON.parse(st).g;
   const leaks=['mafia','doctor','detective','citizen'].filter(x=>x!==r.role&&st.includes('"'+x+'"'));
   console.log(names[i],'sees role',r.role,'mates',JSON.stringify(r.mates),'other roles leaked:',leaks.length?leaks:'none');}
 await cl[0].screenshot({path:'s2b.png'});
 // late joiner
 const late=await mk(clientShim,'Fater');await late.click('#mode-wifi');await late.click('.big2 .btn.ghost');
 await late.waitForFunction(()=>MP.status==='started',null,{timeout:20000});console.log('late joiner ->',await late.evaluate(()=>MP.status));
 // Sami's app restarts and rejoins mid-deal on its own (no taps)
 await cl[1].reload();
 await cl[1].waitForFunction(()=>MP.room&&MP.room.g,null,{timeout:20000});console.log('Sami after restart gets role again:',await cl[1].evaluate(()=>MP.room.g.role));
 // reveal & ready
 for(const p of cl){await p.dispatchEvent('#hold','mousedown');console.log('  card shows:',await p.$eval('.rv .rn',e=>e.textContent));await p.dispatchEvent('#hold','mouseup');await p.click('#memo');}
 await cl[3].waitForTimeout(1500);console.log('client waiting text:',await cl[3].$eval('.big.mt',e=>e.innerText.replace(/\n/g,' ')));
 await host.dispatchEvent('#hold','mousedown');await host.screenshot({path:'s2c.png',fullPage:true});await host.dispatchEvent('#hold','mouseup');await host.click('#memo');
 await host.waitForFunction(()=>$('rdy')&&$('rdy').innerText.includes('Everyone has seen'),null,{timeout:8000});
 console.log('host:',await host.$eval('#rdy .sh h3',e=>e.textContent));await host.screenshot({path:'s2d.png',fullPage:true});
 await cl[2].waitForFunction(()=>MP.room.g.readyN===5,null,{timeout:10000});await cl[2].screenshot({path:'s2e.png'});console.log('clients see 5 of 5');
 const d0=await host.evaluate(()=>MP.game.deal);
 console.log('DBG5',await host.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Deal again'));const r=b.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return b.outerHTML.slice(0,100)+' || top='+(top?top.outerHTML.slice(0,90):'none')+' || y='+Math.round(r.y)+' vh='+innerHeight;}));
 await host.click('button:has-text("Deal again")');await host.waitForTimeout(1500);console.log('deal changed after click:',await host.evaluate(d=>MP.game.deal!==d,d0));
 await cl[0].waitForFunction(()=>$('hold')!==null,null,{timeout:8000});console.log('deal again -> card shown again');
 // back to room
 await host.evaluate(()=>hostBackRoom());await cl[0].waitForFunction(()=>MP.room&&!MP.room.g,null,{timeout:8000});console.log('back to room -> clients in lobby:',await cl[0].evaluate(()=>!!document.body.innerText.match(/Waiting for the host/)));
 console.log('errs',errs);srv.kill();await b.close();})();

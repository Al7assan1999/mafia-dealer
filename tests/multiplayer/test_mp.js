const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},running(){return true},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};}; // 127.0.0.9, no gateway -> subnet scan
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errs=[];const mk=async(shim,name)=>{const ctx=await b.newContext({viewport:{width:390,height:780},reducedMotion:'reduce'});const p=await ctx.newPage();
   p.on('pageerror',e=>errs.push(name+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|ERR_|net::/.test(m.text()))errs.push(name+' console: '+m.text())});
   await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;S.mpLastHost=null;save();},name);return p;};
 const host=await mk(hostShim,'Alhassan');
 await host.click('text=Play Together');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');await host.waitForTimeout(300);
 console.log('host view:',await host.evaluate(()=>V+' role='+MP.role));
 const names=['Dareer','Sami','dareer'];const cl=[];
 for(const n of names){const p=await mk(clientShim,n);await p.click('text=Play Together');await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');cl.push(p);}
 const t0=Date.now();
 await cl[0].waitForFunction(()=>MP.status==='ok',null,{timeout:30000});console.log('client found host + joined in',(Date.now()-t0)/1000,'s, host ip',await cl[0].evaluate(()=>MP.host.ip));
 await cl[1].waitForFunction(()=>MP.status==='ok',null,{timeout:30000});
 await cl[2].waitForFunction(()=>MP.status==='taken',null,{timeout:30000});console.log('duplicate name ->',await cl[2].evaluate(()=>MP.status));
 await host.waitForTimeout(1200);
 console.log('host sees:',await host.$$eval('.prs',e=>e.map(x=>x.innerText.replace(/\n/g,' ')).join(' | ')));
 console.log('client sees:',await cl[1].$$eval('.prs',e=>e.map(x=>x.innerText.replace(/\n/g,' ')).join(' | ')), '|', await cl[1].$eval('#lat',e=>e.textContent));
 await host.screenshot({path:'m1.png'});await cl[0].screenshot({path:'m2.png'});await cl[2].screenshot({path:'m3.png'});
 // ping
 await host.click('text=Ping everyone');await cl[0].waitForFunction(()=>$('toast').classList.contains('show'),null,{timeout:5000});
 console.log('client got ping toast:',await cl[0].$eval('#toast',e=>e.textContent));
 // buzz
 await cl[1].click('text=Buzz the host');await host.waitForFunction(()=>$('toast').textContent.includes('buzzed'),null,{timeout:5000});
 console.log('host got:',await host.$eval('#toast',e=>e.textContent));
 // second client leaves
 await cl[1].click('text=Leave');await host.waitForTimeout(1200);
 console.log('after leave host sees:',await host.$$eval('.prs',e=>e.map(x=>x.innerText.replace(/\n/g,' ')).join(' | ')));
 // client 1 rejoins using remembered host address (fast path)
 const t1=Date.now();await cl[1].click('text=Join');await cl[1].waitForFunction(()=>MP.status==='ok',null,{timeout:10000});console.log('rejoin took',(Date.now()-t1)/1000,'s');
 // host closes room
 await host.click('text=Close room');await host.click('.sheet .btn.primary');await host.waitForTimeout(300);
 console.log('host after close:',await host.evaluate(()=>V+' role='+MP.role));
 await cl[0].waitForFunction(()=>MP.status==='closed',null,{timeout:8000});console.log('client sees closed:',await cl[0].evaluate(()=>MP.status));
 await cl[0].screenshot({path:'m4.png'});
 console.log('errs',errs);await b.close();})();

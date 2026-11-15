const {chromium}=require('playwright');const {execSync,spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){try{X('POST','/__put',JSON.stringify({k,v}))}catch(e){}},take(){try{const r=X('GET','/__take');return r==='\u0000'?null:r}catch(e){return null}},clear(){try{X('GET','/__clear')}catch(e){}},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
(async()=>{let srv=spawn('python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const p=await (await b.newContext({viewport:{width:390,height:780},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;S.mpLastHost=null;save();},name);return p;};
 const host=await mk(hostShim,'Alhassan');await host.click('text=Play Together');await host.click('.big2 .btn.primary');
 const c=await mk(clientShim,'Farouq');await c.click('text=Play Together');await c.click('.big2 .btn.ghost');
 await c.waitForFunction(()=>MP.status==='ok',null,{timeout:15000});console.log('joined');
 srv.kill();await c.waitForFunction(()=>MP.status==='lost',null,{timeout:15000});console.log('client shows lost');await c.screenshot({path:'m5.png'});
 srv=spawn('python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 // server restarted with empty store (like a host app restart): host page republishes on its timer
 await host.evaluate(()=>{Net.put('room',S.mpName);});
 await c.waitForFunction(()=>MP.status==='ok',null,{timeout:15000});console.log('client reconnected automatically');
 // client goes silent -> host marks offline
 await c.evaluate(()=>clearInterval(MP.timer));await host.waitForFunction(()=>Object.values(MP.players).some(p=>!p.on),null,{timeout:12000});
 console.log('host marks silent player offline:',await host.$$eval('.dot',e=>e.map(x=>x.className).join(',')));
 console.log('errs',errs);srv.kill();await b.close();})();

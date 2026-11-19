// v2.20 online host takeover through the relay, and the host's connection bar (in the room, and inside the minimized room bar).
// Needs a local relay: from relay/, npx wrangler dev --port 8787   then: node test_v220_app.js [ws://127.0.0.1:8787]
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787';
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async name=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
   await p.route('**/version.json',r=>r.fulfill({json:{code:1,name:'1'}}));
   await p.addInitScript(()=>{const R=window.WebSocket;  // v2.20.1: every connection opens 1.5 s late, like a phone reaching the internet relay
     window.WebSocket=function(u,pr){let r=null;const o={readyState:0,onopen:null,onmessage:null,onclose:null,onerror:null,send(d){if(r)r.send(d);},close(c,x){if(r)r.close(c,x);else o.readyState=3;}};
       setTimeout(()=>{if(o.readyState===3)return;r=new R(u,pr);r.onopen=(e)=>{o.readyState=1;o.onopen&&o.onopen(e);};r.onmessage=(e)=>o.onmessage&&o.onmessage(e);
         r.onclose=(e)=>{o.readyState=3;o.onclose&&o.onclose(e);};r.onerror=(e)=>o.onerror&&o.onerror(e);},1500);return o;};});
   await p.goto(URL);
   await p.evaluate(([n,r,u])=>{S.relay=r;S.mpName='';save();TK.lobby=3000;TK.game=6000;  // online needs an account (local relay only)
     return aReq('/acc/signup',{uname:u,pass:'secret12'}).then(x=>{signedIn(x);return aReq('/acc/profile',{display:n});}).then(j=>{S.acct.u=j.user;S.mpName=n;save();nav('home');});},[name,RELAY,'tk'+name.slice(0,2).toLowerCase()+Math.random().toString(36).slice(2,7)]);return p;};
 const wait=(p,fn,arg,ms)=>p.waitForFunction(fn,arg,{timeout:ms||20000});
 const H=await mk('Alhassan'),A=await mk('Sami'),B=await mk('Dareer');
 // v2.20.1: record every connection bar from now on (it flashed "Connection lost" each time a room was created)
 const watch=p=>p.evaluate(()=>{window.__bars=[];const f=()=>{for(const e of document.querySelectorAll('#cbar .cbar,#rbar .rbar.lost,#rbar .rbar.weak,#rbar .rbar.wait,#rbar .rbar.back'))__bars.push(e.className);};
   new MutationObserver(f).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});});
 for(const p of [H,A,B])await watch(p);
 await H.click('#mode-online');await H.click('button:has-text("Host online")');await wait(H,()=>MP.online&&HN.ws&&HN.ws.readyState===1);
 const code=await H.evaluate(()=>MP.online.code);
 for(const p of [A,B]){await p.click('#mode-online');await p.fill('#ocode',code);await p.click('button:has-text("Join online")');await wait(p,()=>MP.status==='ok');await p.waitForTimeout(500);}
 await wait(H,()=>Object.keys(MP.players).length===2);await wait(A,()=>!!MP.bk);
 await H.waitForTimeout(3000);
 for(const [p,n] of [[H,'host creating the room'],[A,'Sami joining'],[B,'Dareer joining']])ok(await p.evaluate(()=>!__bars.length),`v2.20.1: ${n}: no connection bar at any moment`);
 // a real outage for the bars below: reconnecting fails until the relay address is back (a blip of a second or two shows nothing)
 for(const p of [A,B])await p.evaluate(()=>{TK.lobby=TK.game=600e3;});  // nobody takes over during the host-bar checks below
 const cut=p=>p.evaluate(()=>{window.__relay=S.relay;S.relay='ws://127.0.0.1:9';HN.ws.close();}),mend=p=>p.evaluate(()=>{S.relay=__relay;});
 // the host's own connection: a bar in the room, the room bar itself when minimized
 await cut(H);await wait(H,()=>!!document.querySelector('#cbar .cbar.lost'),null,8000).then(()=>ok(true,'host: red "Connection lost · reconnecting…" bar in the room'),()=>ok(false,'host: red bar'));
 await mend(H);await wait(H,()=>!!document.querySelector('#cbar .cbar.back'),null,9000).then(()=>ok(true,'host: green "Connected again" once the relay is back'),()=>ok(false,'host: green bar'));
 await H.evaluate(()=>nav('home'));await cut(H);
 await wait(H,()=>{const r=document.querySelector('#rbar .rbar.lost');return r&&/Connection lost/.test(r.textContent);},null,8000).then(()=>ok(true,'minimized: the room bar itself turns red with the message (no second bar)'),()=>ok(false,'room bar turns red'));
 ok(await H.evaluate(()=>!document.querySelector('#cbar .cbar')),'and no separate bar on top of it');
 await mend(H);await wait(H,()=>HN.ws&&HN.ws.readyState===1&&!document.querySelector('#rbar .rbar.lost'),null,9000);await H.evaluate(()=>nav('host'));
 for(const p of [A,B])await p.evaluate(()=>{TK.lobby=3000;TK.game=6000;});
 // a game: Alhassan citizen, Sami mafia, Dareer doctor (+ an offline seat)
 await H.evaluate(()=>{const ids=['host',...Object.keys(MP.players)];MP.players.x1={name:'X1',on:true,seen:Date.now(),v:0,uid:null,uav:''};ids.push('x1');
   MP.game={deal:1,ids,names:ids.map(id=>id==='host'?S.mpName:MP.players[id].name),roles:['citizen','mafia','doctor','citizen'],ready:{}};hostStartGame();hostPublish();});
 await wait(A,()=>MP.bk&&MP.bk.G);await wait(B,()=>MP.room.g&&MP.room.g.role==='doctor');
 // the host loses the internet (its link to the relay is gone and stays gone)
 await B.evaluate(()=>{window.__toasts=[];new MutationObserver(()=>{const x=document.getElementById('toast').textContent;if(x)__toasts.push(x);}).observe(document.getElementById('toast'),{childList:true,subtree:true,characterData:true});});
 const hid=await H.evaluate(()=>myId());await H.evaluate(()=>{clearInterval(MP.timer);MP.timer=null;HN.close();});
 await wait(B,()=>{const c=document.querySelector('#cbar .cbar.wait');return c&&/Alhassan is offline/.test(c.textContent)&&/Sami hosts in/.test(c.textContent);},null,9000)
   .then(()=>ok(true,'Dareer: amber "Alhassan is offline · Sami hosts in 0:0x"'),()=>ok(false,'Dareer: amber bar with the countdown'));
 await wait(A,()=>MP.role==='host'&&HN.ws&&HN.ws.readyState===1,null,15000);
 ok(await A.evaluate(c=>MP.online.code===c&&MP.online.ep===1,code),'Sami took over the same room code (host generation 1)');
 ok(await A.evaluate(h=>G&&G.ids.indexOf('host')===1&&G.ids[0]===h&&G.roles.join()==='citizen,mafia,doctor,citizen',hid),'the same game: seats and roles kept');
 await wait(B,()=>MP.status==='ok'&&MP.room.host==='Sami'&&MP.room.g&&MP.room.g.role==='doctor');ok(true,'Dareer: Sami is the host, still the Doctor, the game goes on');
 ok(await B.evaluate(()=>__toasts.some(x=>/Sami is the host now/.test(x))&&!__toasts.some(x=>/pinged/.test(x))),'Dareer is told "Sami is the host now" (not a Ping)');
 // the old host's internet comes back: the relay refuses it as host ("replaced"); it rejoins as a player in its seat
 await H.evaluate(()=>{MP.timer=setInterval(hostTick,250);HN=onlineNet(MP.online);});
 await wait(H,c=>MP.role==='client'&&MP.status==='ok'&&MP.online.code===c&&MP.room.host==='Sami',code,20000).then(()=>ok(true,'Alhassan comes back: the relay says another host took over, he joins as a player'),()=>ok(false,'Alhassan rejoins as a player'));
 ok(await H.evaluate(()=>MP.room.g&&MP.room.g.role==='citizen'),'in his own seat: still a Citizen');
 ok(await A.evaluate(()=>MP.role==='host'&&HN.ws&&HN.ws.readyState===1),'Sami is still the host (the old one could not push him out)');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

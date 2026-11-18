// v2.20 Wi-Fi host takeover (two mock "phones": the host serves at 127.0.0.1, the first player at 127.0.0.2) and the connection bar.
// The host's phone dies mid-game: the first player to join becomes the host of the same game (roles kept), the others find them,
// and when the old host's app comes back it steps down and rejoins as a player in its own seat.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const shim=addr=>`(()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://${addr}:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '150995071,0'}};})()`;
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
const py=process.platform==='win32'?'python':'python3';
(async()=>{let m1=spawn(py,['mock_srv.py','127.0.0.1']);const m2=spawn(py,['mock_srv.py','127.0.0.2']);await new Promise(r=>setTimeout(r,900));
 const b=await chromium.launch();const errs=[];
 const mk=async(addr,name)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
   await p.route('**/version.json',r=>r.fulfill({json:{code:1,name:'1'}}));await p.addInitScript(shim(addr));await p.addInitScript(()=>{window.__tk=1;});
   await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();TK.lobby=3000;TK.game=6000;},name);return p;};
 const wait=(p,fn,arg,ms)=>p.waitForFunction(fn,arg,{timeout:ms||20000});
 const H=await mk('127.0.0.1','Alhassan'),A=await mk('127.0.0.2','Sami'),B=await mk('127.0.0.3','Dareer');
 await H.click('#mode-wifi');await H.click('.big2 .btn.primary');
 for(const p of [A,B]){await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');await wait(p,()=>MP.status==='ok'&&MP.room&&MP.room.cv);await p.waitForTimeout(400);}
 await wait(B,()=>MP.room.players.length===3);
 // the logic, said plainly
 await H.evaluate(()=>render());
 ok(await H.isVisible('.tkline:has-text("Sami (the first to join) takes over the room after 30 s")'),'host lobby: who takes over and when');
 await wait(A,()=>!!MP.bk);ok(await A.isVisible('.tkline:has-text("you take over the room")'),'Sami (first to join): "you take over"');
 ok(await B.isVisible('.tkline:has-text("Sami takes over the room")')&&await B.evaluate(()=>!MP.bk),'Dareer: "Sami takes over"; only Sami holds the backup');
 // a game: Alhassan citizen, Sami mafia, Dareer doctor (+ an offline seat)
 await H.evaluate(()=>{const ids=['host',...Object.keys(MP.players)];MP.players.x1={name:'X1',on:true,seen:Date.now(),v:0,uid:null,uav:''};ids.push('x1');
   MP.game={deal:1,ids,names:ids.map(id=>id==='host'?S.mpName:MP.players[id].name),roles:['citizen','mafia','doctor','citizen'],ready:{}};hostStartGame();hostPublish();});
 await wait(A,()=>MP.bk&&MP.bk.G&&MP.bk.G.roles.length===4);
 await wait(A,()=>MP.room&&MP.room.g&&MP.room.g.role);await wait(B,()=>MP.room&&MP.room.g&&MP.room.g.role);
 const roleA=await A.evaluate(()=>MP.room.g.role),roleB=await B.evaluate(()=>MP.room.g.role);
 ok(roleA==='mafia'&&roleB==='doctor','roles dealt (Sami mafia, Dareer doctor)');
 // the host's phone dies (its app stops, its server stops answering)
 const hid=await H.evaluate(()=>myId());await H.evaluate(()=>{clearInterval(MP.timer);MP.timer=null;});m1.kill();
 await wait(B,()=>{const c=document.querySelector('#cbar .cbar.lost');return c&&/Sami hosts in/.test(c.textContent);},null,9000).then(()=>ok(true,'Dareer: red bar "Connection lost · Sami hosts in 0:0x"'),()=>ok(false,'Dareer: red bar with the takeover countdown'));
 ok(await wait(A,()=>{const c=document.querySelector('#cbar .cbar');return c&&/you host in/.test(c.textContent);},null,5000).then(()=>true,()=>false),'Sami: "you host in …"');
 await wait(A,()=>MP.role==='host',null,15000);ok(true,'after the wait, Sami is the host');
 ok(await A.evaluate(h=>G&&G.mp&&G.ids.indexOf('host')===1&&G.ids[0]===h&&G.roles.join()==='citizen,mafia,doctor,citizen',hid),'the same game: seats and roles kept (Sami\'s seat is the host now, Alhassan\'s a player)');
 await wait(B,()=>MP.status==='ok'&&MP.host&&MP.host.name==='Sami'&&MP.room.host==='Sami',null,20000);ok(true,'Dareer found Sami\'s phone on the network and is back in');
 ok(await B.evaluate(()=>MP.room.g&&MP.room.g.role==='doctor'),'Dareer still the Doctor, the game goes on');
 ok(await B.evaluate(()=>!document.querySelector('#cbar .cbar.lost')),'Dareer: the red bar is gone');
 // the old host's app comes back: nobody uses its room, so it looks for Sami's room and joins it as a player
 m1=spawn(py,['mock_srv.py','127.0.0.1']);await H.waitForTimeout(900);
 await H.evaluate(()=>{MP.timer=setInterval(hostTick,250);});
 await wait(H,()=>MP.role==='client'&&MP.status==='ok'&&MP.room&&MP.room.host==='Sami',null,40000).then(()=>ok(true,'Alhassan\'s app steps down and joins Sami\'s room as a player'),()=>ok(false,'Alhassan steps down'));
 ok(await H.evaluate(()=>MP.room.g&&MP.room.g.role==='citizen'),'in his own seat: still a Citizen');
 ok(await A.evaluate(h=>MP.players[h]&&MP.players[h].on,hid),'Sami sees Alhassan back as a player');
 console.log('errs',errs);if(errs.length)process.exitCode=1;m1.kill();m2.kill();await b.close();})();

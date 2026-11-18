// v2.17 (Wi-Fi mock, no relay): the host's ping reaches players, leaving stops the voice, Settings > profile > Back, Back on Home asks,
// the chat's Back / Minimize, reactions, replies, @mentions (and the out-player rules), the drawer avatars' solid backing.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const srv=spawn(process.platform==='win32'?'python':'python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));if(shim)await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();},name);return p;};
 const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 // Settings > profile > Back, and Back on Home
 const solo=await mk(null,'Solo');
 await solo.evaluate(()=>{nav('settings');nav('account');});await solo.evaluate(()=>history.back());await solo.waitForTimeout(400);ok(await solo.evaluate(()=>V==='settings'),'Settings > profile > Back: Settings');
 await solo.evaluate(()=>history.back());await solo.waitForTimeout(400);ok(await solo.evaluate(()=>V==='home'),'then Back: Home (was stuck on Settings)');
 await solo.evaluate(()=>{nav('settings');nav('rules');});await solo.evaluate(()=>history.back());await solo.waitForTimeout(300);await solo.evaluate(()=>history.back());await solo.waitForTimeout(300);ok(await solo.evaluate(()=>V==='home'),'Settings > Rules > Back > Back: Home');
 await solo.evaluate(()=>history.back());await solo.waitForTimeout(400);ok(await solo.isVisible('#modal .sheet:has-text("Close Mafia Dealer?")'),'Back on Home: "Close Mafia Dealer?"');
 await solo.evaluate(()=>{window.__quit=0;window.Net=Object.assign(window.Net||{},{quit:()=>{__quit++;}});});await solo.click('#modal .btn.primary');ok(await solo.evaluate(()=>__quit===1),'Close: the app closes (Net.quit)');
 await solo.evaluate(()=>history.back());await solo.waitForTimeout(400);await solo.click('#modal .btn.ghost');ok(await solo.evaluate(()=>V==='home'&&!$('modal').innerHTML&&__quit===1),'Cancel: stays on Home');
 // a room: host + two players
 const host=await mk(hostShim,'Alhassan');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const d=await mk(clientShim,'Dareer'),s=await mk(clientShim,'Sami');
 for(const p of [d,s]){await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');await wait(p,()=>MP.status==='ok'&&MP.room&&MP.room.cv&&MP.room.players.length>=2);}
 await wait(d,()=>MP.room.players.length===3);
 // 1. the host's ping
 await host.click('button:has-text("Ping everyone")');
 ok(await d.waitForFunction(()=>/pinged you/.test(document.getElementById('toast').textContent),null,{timeout:8000}).then(()=>true,()=>false),'the host\'s ping reaches the player ("The host pinged you!")');
 // the chat: Back / Minimize
 await d.click('#fdock .fchat');ok(await d.isVisible('#chat .chh button[aria-label="Back"]')&&await d.isVisible('#chat .chh button[aria-label="Minimize the chat"]')&&!(await d.$('#chat .chh :text("✕")')),'chat list: Back and Minimize, no ✕');
 await d.click('#chat .chr:has(.t1 b:text-is("Everyone")) .fl');ok(await d.isVisible('#chat .cht :text("Everyone")'),'a conversation: the title with who it is');
 await d.evaluate(()=>history.back());await d.waitForTimeout(300);ok(await d.evaluate(()=>chView&&chConv==null),'phone Back in a conversation: the list');
 await d.click('#chat .chh button[aria-label="Minimize the chat"]');ok(await d.evaluate(()=>!chView&&V==='join'),'Minimize: back to the room');
 // mentions
 await d.click('#fdock .fchat');await d.click('#chat .chr:has(.t1 b:text-is("Everyone")) .fl');
 await d.fill('#chin','hey @S');await d.dispatchEvent('#chin','input');ok(await d.isVisible('#chmn button:has-text("Sami")')||await d.isVisible('#chmen button:has-text("Sami")'),'typing @S lists Sami');
 await d.click('#chmen button:has-text("Sami")');ok((await d.inputValue('#chin'))==='hey @Sami ','picking fills in @Sami');
 await s.evaluate(()=>{window.__bz=0;const f=buzzFx;buzzFx=()=>{__bz++;f();};});
 await d.fill('#chin','hey @Sami who is it?');await d.press('#chin','Enter');
 await wait(s,()=>CH.some(m=>m.x==='hey @Sami who is it?'&&m.mt&&m.mt.length===1));ok(await s.evaluate(()=>__bz>=1),'Sami is mentioned: buzz');
 ok(await s.evaluate(()=>document.querySelector('#fdock .fchat .cnt.at')&&document.querySelector('#fdock .fchat .cnt.at').textContent==='@'),'Sami\'s chat button shows @');
 await s.click('#fdock .fchat');ok(await s.isVisible('#chat .chr:has(.t1 b:text-is("Everyone")) .atb'),'the list marks the conversation with @');
 await s.click('#chat .chr:has(.t1 b:text-is("Everyone")) .fl');ok(await s.isVisible('#chm .ment.me:has-text("@Sami")'),'the mention is highlighted in the message');
 await s.waitForTimeout(200);ok(await s.evaluate(()=>!chMentN()),'read: the @ goes');
 // reactions (long-press)
 const mid=await s.evaluate(()=>CH.find(m=>m.x==='hey @Sami who is it?').i);
 const bubble=`#chm .cmr[data-i="${mid}"] .cm`;const bb=await s.$(bubble).then(e=>e.boundingBox());
 await s.mouse.move(bb.x+20,bb.y+12);await s.mouse.down();await s.waitForTimeout(600);await s.mouse.up();
 ok(await s.isVisible('#chact .rxp'),'long-press a message: reactions');
 await s.click('#chact .rxp button:nth-child(5)');await wait(d,id=>{const m=CH.find(x=>x.i===id);return m&&m.r&&m.r['4']&&m.r['4'].length===1;},mid);
 ok(await d.isVisible(`#chm .cmr[data-i="${mid}"] .rx:has-text("🔪 1")`),'🔪 shows under the message for everyone');
 await s.click(`#chm .cmr[data-i="${mid}"] .rx`);await wait(d,id=>{const m=CH.find(x=>x.i===id);return m&&!m.r;},mid);ok(true,'tapping my reaction again removes it');
 // reply
 await s.evaluate(i=>chReplyStart(i),mid);  // v2.19.1: Reply is the swipe (test_v219)
 ok(await s.isVisible('#chrep :text("Replying to Dareer")'),'Reply: a bar with what I reply to');
 await s.fill('#chin','not me!');await s.press('#chin','Enter');await wait(d,()=>CH.some(m=>m.x==='not me!'&&m.re));
 ok(await d.isVisible('#chm .cmr:has-text("not me!") .rq:has-text("who is it?")'),'the reply shows the quoted message');
 await d.click('#chm .cmr:has-text("not me!") .rq');await d.waitForTimeout(300);ok(await d.evaluate(()=>!!document.querySelector('#chm .cmr.flash')),'tapping the quote jumps to the original');
 // avatars next to messages, grouped
 ok(await d.evaluate(()=>{const r=[...document.querySelectorAll('#chm .cmr:not(.me)')];return r.length&&r.every(x=>x.querySelector('.cav'));}),'other people\'s messages have their avatar column');
 // the out-player rules for reactions and mentions
 await host.evaluate(()=>{const ids=['host',...Object.keys(MP.players)];MP.players.x1={name:'X1',on:true,seen:Date.now(),v:0,uid:null,uav:''};ids.push('x1');
   MP.game={deal:1,ids,names:ids.map(id=>id==='host'?S.mpName:MP.players[id].name),roles:['mafia','doctor','citizen','citizen'],ready:{}};hostStartGame();
   const di=G.ids.findIndex(id=>id!=='host'&&MP.players[id].name==='Dareer');G.alive[di]=false;hostPublish();});
 await wait(d,()=>MP.room.players.find(q=>q.c===chMe).out===true);
 const hm=await host.evaluate(()=>{chRate={};chPost(0,-1,'alive talk');hostPublish();return CH[CH.length-1].i;});await wait(d,i=>CH.some(m=>m.i===i),hm);
 await d.evaluate(i=>send({t:'react',i,e:4}),hm);await d.waitForTimeout(1500);ok(await host.evaluate(i=>!CH.find(m=>m.i===i).r,hm),'out: a reaction on a message players still in see is refused');
 await d.evaluate(()=>{chOpenList();chGo(-1);});await d.evaluate(()=>chActs(CH[CH.length-1].i));ok(!(await d.isVisible('#chact .rxp')),'out: no reactions offered there');
 await d.evaluate(()=>chActs(0));
 const sc=await d.evaluate(()=>MP.room.players.find(q=>q.name==='Sami').c);
 await d.evaluate(c=>send({t:'chat',to:-1,x:'boo @Sami',k:'mz1',mt:[c]}),sc);await wait(host,()=>CH.some(m=>m.x==='boo @Sami'));
 ok(await host.evaluate(()=>!CH.find(m=>m.x==='boo @Sami').mt),'out: mentioning a player still in is dropped');
 // 3. leaving stops the voice
 await s.evaluate(()=>{window.__hush=0;const f=VOX.stop;VOX.stop=(...a)=>{__hush++;return f.apply(VOX,a);};});await s.evaluate(()=>{chClose();leaveNow();});ok(await s.evaluate(()=>__hush>=1&&!MP.role),'a player leaving the room: the narrator stops');
 await host.evaluate(()=>{window.__hush=0;const f=VOX.stop;VOX.stop=(...a)=>{__hush++;return f.apply(VOX,a);};hostStop();});ok(await host.evaluate(()=>__hush>=1),'the host closing the room: the narrator stops');
 // 10. avatars in the drawer tab have a solid backing
 ok(await solo.evaluate(()=>{const w=document.createElement('div');w.id='fdock';w.innerHTML='<div class="ftab"><i class="avt"></i></div>';document.body.appendChild(w);
   const c=getComputedStyle(w.querySelector('.avt'),'::before');const r=c.content!=='none'&&c.position==='absolute'&&c.backgroundColor!=='rgba(0, 0, 0, 0)';w.remove();return r;}),'drawer tab avatars: a solid backing under see-through avatars');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

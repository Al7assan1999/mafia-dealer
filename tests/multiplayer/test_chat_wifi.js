// v2.10 room chat on Wi-Fi (mock native server, no relay): Everyone + 1:1, privacy, out players reach only out players, rate limit, nothing saved.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const srv=spawn(process.platform==='win32'?'python':'python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const ctx=await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();},name);return p;};
 const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:12000});
 const has=(p,x)=>p.evaluate(x=>chMsgs().some(m=>m.x===x),x);
 const host=await mk(hostShim,'Alhassan');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const d=await mk(clientShim,'Dareer'),s=await mk(clientShim,'Sami');
 for(const p of [d,s]){await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');await wait(p,()=>MP.status==='ok'&&MP.room&&MP.room.cv);}
 ok(await host.isVisible('#fdock .fchat')&&await d.isVisible('#fdock .fchat'),'chat button in the host and player lobbies (signed out too)');
 await d.click('#fdock .fchat');await d.waitForSelector('#chat .chw');
 const names=await d.$$eval('#chat .prs .fn b',e=>e.map(x=>x.textContent));ok(names.join()==='Everyone,Alhassan,Sami','list: Everyone, the host, the other player ('+names+')');
 // Everyone
 await d.click('#chat .prs:has-text("Everyone") .fl');await d.fill('#chin','hi all');await d.press('#chin','Enter');
 await wait(host,()=>chMsgs().some(m=>m.x==='hi all'));await wait(s,()=>CH.some(m=>m.x==='hi all'));ok(true,'Everyone: the host and Sami get it');
 await wait(d,()=>!document.querySelector('#chm .cm.pend')&&!!document.querySelector('#chm .cm.me'));ok(true,'my message is confirmed by the host (no longer pending)');
 // 1:1, private
 await d.click('#chat .chh .ib >> nth=0');await d.click('#chat .prs:has-text("Sami") .fl');await d.fill('#chin','psst');await d.click('#chat .chf .pill');
 await wait(s,()=>CH.some(m=>m.x==='psst'));await host.waitForTimeout(800);ok(!(await has(host,'psst')),'1:1 Dareer to Sami: Sami gets it, the host does not see it');
 ok(await s.evaluate(()=>document.querySelector('#fdock .fchat .cnt').textContent==='2'),'Sami: unread count on the chat button');
 await s.click('#fdock .fchat');await s.click('#chat .prs:has-text("Dareer") .fl');ok((await s.textContent('#chm')).includes('psst'),'Sami opens the 1:1 and reads it');
 await s.fill('#chin','hey');await s.press('#chin','Enter');await wait(d,()=>CH.some(m=>m.x==='hey'));ok(await d.isVisible('#chm .cm:has-text("hey")'),'reply shows in Dareer\'s open 1:1');
 // the host writes
 await host.click('#fdock .fchat');await host.click('#chat .prs:has-text("Everyone") .fl');await host.fill('#chin','welcome');await host.press('#chin','Enter');
 await wait(d,()=>CH.some(m=>m.x==='welcome'&&m.f===0));ok(true,'the host writes to Everyone');await host.evaluate(()=>chClose());
 // v2.10.1: long chats scroll, open at the newest message, the keyboard stays up, Arabic types right to left
 await host.evaluate(()=>{for(let i=0;i<40;i++){chRate={};chPost(0,-1,'line '+i);}hostPublish();});await wait(d,()=>CH.some(m=>m.x==='line 39'));
 await d.evaluate(()=>chOpenList());await d.click('#chat .prs:has-text("Everyone") .fl');
 const atEnd=()=>d.evaluate(()=>{const b=document.querySelector('#chm');return b.scrollHeight>b.clientHeight+50&&b.scrollHeight-b.scrollTop-b.clientHeight<5;});
 ok(await atEnd(),'a long chat scrolls and opens at the newest message');
 await d.evaluate(()=>{document.querySelector('#chm').scrollTop=0;});ok(await d.evaluate(()=>document.querySelector('#chm').scrollTop===0),'older messages: scrolled to the top');
 await d.evaluate(()=>chClose());await d.click('#fdock .fchat');await d.click('#chat .prs:has-text("Everyone") .fl');ok(await atEnd(),'closed and opened again: at the newest message');
 await d.click('#chin');await d.fill('#chin','one');await d.click('#chat .chf .pill');ok(await d.evaluate(()=>document.activeElement&&document.activeElement.id==='chin'),'Send keeps the typing box focused (keyboard stays up)');
 await d.press('#chin','x');await d.press('#chin','Enter');ok(await d.evaluate(()=>document.activeElement.id==='chin'),'Enter keeps it focused too');await wait(d,()=>!chPend.length);ok(await atEnd(),'my new message scrolls into view');
 ok(await d.evaluate(()=>document.querySelector('#chin').getAttribute('dir')==='auto'&&document.querySelector('#chm .cm span').getAttribute('dir')==='auto'),'box and bubbles use dir=auto (Arabic right to left)');
 await d.fill('#chin','مرحبا');ok(await d.evaluate(()=>getComputedStyle(document.querySelector('#chin')).direction==='rtl'),'typing Arabic: the box turns right to left');await d.fill('#chin','');
 // screen updates (room changes, game ticks) must not redraw the chat or pull it back down while reading older messages
 await d.evaluate(()=>{const b=document.querySelector('#chm');b.scrollTop=b.scrollHeight-b.clientHeight-30;b.dispatchEvent(new Event('scroll'));window.__mut=0;new MutationObserver(()=>__mut++).observe(b,{childList:true,subtree:true});});
 await d.waitForTimeout(100);await d.evaluate(()=>{for(let i=0;i<5;i++){render();dockDraw();chDraw();}});await host.evaluate(()=>hostPublish());await d.waitForTimeout(1500);
 ok(await d.evaluate(()=>__mut===0),'nothing new: the messages are not redrawn ('+await d.evaluate(()=>__mut)+' changes)');
 await d.evaluate(()=>{document.querySelector('#chm').scrollTop=100;document.querySelector('#chm').dispatchEvent(new Event('scroll'));});await d.evaluate(()=>{for(let i=0;i<5;i++)render();});
 await host.evaluate(()=>{chRate={};chPost(0,-1,'while reading');hostPublish();});await wait(d,()=>CH.some(m=>m.x==='while reading'));await d.waitForTimeout(300);
 ok(await d.evaluate(()=>document.querySelector('#chm').scrollTop===100),'reading older messages: a new message does not pull the view down');
 await d.evaluate(()=>{chEnd();});await host.evaluate(()=>{chRate={};chPost(0,-1,'at the end');hostPublish();});await wait(d,()=>CH.some(m=>m.x==='at the end'));await d.waitForTimeout(300);ok(await atEnd(),'at the newest message: a new one stays in view');
 await d.setViewportSize({width:390,height:450});await d.waitForTimeout(300);ok(await atEnd(),'the keyboard opens (screen shorter): still at the newest message');await d.setViewportSize({width:390,height:800});
 await d.evaluate(()=>chOpenList());await d.click('#chat .prs:has-text("Sami") .fl');
 // typing is kept while messages arrive
 await d.fill('#chin','half typed');await host.evaluate(()=>{chPost(0,-1,'new one');hostPublish();});await wait(d,()=>CH.some(m=>m.x==='new one'));
 ok(await d.inputValue('#chin')==='half typed','a new message does not wipe what is being typed');await d.fill('#chin','');
 // a game: Dareer is out
 await host.evaluate(()=>{const ids=['host',...Object.keys(MP.players)];MP.players.x1={name:'X1',on:true,seen:Date.now(),v:0,uid:null,uav:''};ids.push('x1');
   MP.game={deal:1,ids,names:ids.map(id=>id==='host'?S.mpName:MP.players[id].name),roles:['mafia','doctor','citizen','citizen'],ready:{}};hostStartGame();G.alive[1]=false;hostPublish();render();});
 await wait(d,()=>MP.room.players.find(q=>q.c===chMe).out===true);
 await d.evaluate(()=>chOpenList());await d.click('#chat .prs:has-text("Sami") .fl');
 ok(!(await d.$('#chin'))&&(await d.textContent('#chat')).includes('only message players who are out'),'out: no box to message a player still in');
 const sc=await d.evaluate(()=>MP.room.players.find(q=>q.name==='Sami').c);await d.evaluate(c=>send({t:'chat',to:c,x:'cheat',k:'forged1'}),sc);await d.waitForTimeout(1500);
 ok(!(await s.evaluate(()=>CH.some(m=>m.x==='cheat')))&&!(await has(host,'cheat')),'a forged 1:1 from an out player is refused by the host');
 await d.evaluate(()=>chOpenList());await d.click('#chat .prs:has-text("Everyone") .fl');ok((await d.textContent('#chat')).includes('only message players who are out'),'out: Everyone shows the note');
 await d.fill('#chin','boo');await d.press('#chin','Enter');await wait(d,()=>CH.some(m=>m.x==='boo'));await s.waitForTimeout(1200);
 ok(!(await s.evaluate(()=>CH.some(m=>m.x==='boo')))&&!(await has(host,'boo')),'out player to Everyone: players still in do not see it');
 await host.evaluate(()=>{G.alive[2]=false;hostPublish();});await wait(s,()=>CH.some(m=>m.x==='boo'&&m.d));ok(true,'once Sami is out too, he sees it (tagged out)');
 ok(!!(await s.$('#chin'))||await s.evaluate(()=>{chGo(MP.room.players.find(q=>q.name==='Dareer').c);return !!document.querySelector('#chin');}),'two out players can message each other');
 // rate limit
 await host.evaluate(()=>{G=null;MP.game=null;delete MP.players.x1;chRate={};hostPublish();});
 await d.evaluate(()=>{for(let i=0;i<10;i++)send({t:'chat',to:-1,x:'spam'+i,k:'sp'+i});});await d.waitForTimeout(1500);
 const n=await host.evaluate(()=>CH.filter(m=>/^spam/.test(m.x)).length);ok(n===8,'rate limit: 8 messages per 10 s ('+n+')');
 // nothing saved
 const saved=await host.evaluate(()=>JSON.stringify(localStorage));ok(!saved.includes('psst')&&!saved.includes('hi all'),'host saves no chat (resume snapshot and settings)');
 ok(!(await d.evaluate(()=>JSON.stringify(localStorage))).includes('psst'),'player saves no chat');
 // phone Back closes the chat first
 await d.evaluate(()=>chOpenList());await d.evaluate(()=>history.back());await wait(d,()=>!chView);ok(await d.evaluate(()=>V==='join'&&MP.role==='client'),'phone Back closes the chat and stays in the room');
 // leaving empties it
 await d.evaluate(()=>{clientStop(true);nav('home');});ok(await d.evaluate(()=>CH.length===0&&!document.querySelector('#fdock .fchat')),'left the room: chat gone, no button');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

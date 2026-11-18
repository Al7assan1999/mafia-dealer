// v2.18 (Wi-Fi mock, no relay): sending status (clock, tick, Not sent + retry), edit (own, 15 minutes, host-checked), the long-press menu
// beside the message, the chat's slides, mentions in the bell, the smaller bell panel, update alerts (native calls, /u links, checks on open).
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const nativeShim=()=>{window.__nat={alarm:[],clear:0,ask:0};window.Net={updAlarm(on){__nat.alarm.push(on);},updClear(){__nat.clear++;},askNotif(){__nat.ask++;}};};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
const VJ={code:99,name:'9.9',url:'https://example.invalid/MafiaDealer.apk',notes:'',bullets:['Something new'],history:[{code:99,name:'9.9',date:'2026-11-18',notes:['Something new']}]};
(async()=>{const srv=spawn(process.platform==='win32'?'python':'python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name,motion)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:motion||'reduce'})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
   let vj=0;await p.route('**/version.json',r=>{vj++;r.fulfill({json:VJ});});p.vj=()=>vj;
   if(shim)await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();},name);return p;};
 const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 // ---- update alerts: the app side (the alarm itself is native)
 const solo=await mk(nativeShim,'Solo');
 ok(await solo.evaluate(()=>__nat.alarm[0]===true&&__nat.clear>=1),'start: the 11:00-17:00 checks are switched on and the update notification cleared');
 await solo.waitForTimeout(6800);ok(await solo.evaluate(()=>__nat.ask===1&&!!S.notifAsked),'Android 13+ notification permission: asked once');
 await solo.reload();await solo.waitForTimeout(6800);ok(await solo.evaluate(()=>__nat.ask===0),'not asked again after a restart');
 const n0=solo.vj();await solo.evaluate(()=>checkUpdate());await solo.waitForTimeout(300);ok(solo.vj()===n0,'checks on open: at most every 10 minutes');
 await solo.evaluate(()=>{S.latest.at=Date.now()-11*60e3;document.dispatchEvent(new Event('visibilitychange'));});await solo.waitForTimeout(500);ok(solo.vj()===n0+1,'back to the app after 10 minutes: checks again');
 await solo.evaluate(()=>nav('settings'));await solo.click('.tg:has-text("New version alerts")');ok(await solo.evaluate(()=>S.updAlerts===false&&__nat.alarm[__nat.alarm.length-1]===false),'Settings: New version alerts off cancels the checks');
 await solo.click('.tg:has-text("New version alerts")');ok(await solo.evaluate(()=>S.updAlerts===true&&__nat.alarm[__nat.alarm.length-1]===true),'and on again');
 await solo.evaluate(()=>nav('home'));await solo.evaluate(()=>deepLink('https://mafia-relay.mafiadealer.workers.dev/u'));
 ok(await solo.waitForSelector('#modal .rnsh:has-text("v9.9")',{timeout:5000}).then(()=>true,()=>false),'the update link (Telegram / notification): What\'s new with Update');
 ok(await solo.isVisible('#modal .rnsh button:has-text("Update · v9.9")'),'with its Update button');
 await solo.evaluate(()=>{$('modal').innerHTML='';});
 // ---- a room: host + two players
 const host=await mk(hostShim,'Alhassan');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const d=await mk(clientShim,'Dareer'),s=await mk(clientShim,'Sami');
 for(const p of [d,s]){await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');await wait(p,()=>MP.status==='ok'&&MP.room&&MP.room.cv&&MP.room.players.length>=2);}
 await wait(d,()=>MP.room.players.length===3);
 // sending: clock, then a tick; nothing faded
 await d.click('#fdock .fchat');await d.click('#chat .chr:has(.t1 b:text-is("Everyone")) .fl');
 await d.evaluate(()=>{window.__send=send;send=o=>{if(o.t!=='chat')__send(o);};});  // the host doesn't get it yet
 await d.fill('#chin','first try');await d.press('#chin','Enter');
 ok(await d.isVisible('#chm .cmr.me:has-text("first try") .cm.pend time svg.cst'),'sending: shows right away, with a clock');
 ok(await d.evaluate(()=>getComputedStyle(document.querySelector('#chm .cm.pend')).opacity==='1'),'sending: full colour (no fade)');
 await d.waitForTimeout(9500);ok(await d.isVisible('#chm .cmr.nsent .cfail:has-text("Not sent · Tap to retry")'),'not confirmed in 8 s: "Not sent · Tap to retry"');
 await d.evaluate(()=>{send=__send;});await d.click('#chm .cfail');
 await wait(host,()=>CH.some(m=>m.x==='first try'));await wait(d,()=>!chPend.length);
 ok(await d.isVisible('#chm .cmr.me:has-text("first try") time svg.cst')&&!(await d.$('#chm .cm.pend'))&&!(await d.$('#chm .cfail')),'Retry: delivered, the clock becomes a tick');
 // edit
 await d.fill('#chin','who is the doctr?');await d.press('#chin','Enter');await wait(d,()=>CH.some(m=>m.x==='who is the doctr?'));
 const mid=await d.evaluate(()=>CH.find(m=>m.x==='who is the doctr?').i);
 await d.evaluate(i=>chActs(i),mid);ok(await d.isVisible('#chact .chmenu button:has-text("Edit")'),'my message: Edit in the menu');
 await d.click('#chact .chmenu button:has-text("Edit")');ok(await d.isVisible('#chrep .crp.ed:has-text("Editing message")')&&(await d.inputValue('#chin'))==='who is the doctr?','Edit: the text in the box, "Editing message" above it');
 await d.fill('#chin','who is the doctor?');await d.press('#chin','Enter');
 await wait(s,i=>{const m=CH.find(x=>x.i===i);return m&&m.x==='who is the doctor?'&&m.e;},mid);ok(true,'the new text reaches everyone, marked edited');
 await s.click('#fdock .fchat');await s.click('#chat .chr:has(.t1 b:text-is("Everyone")) .fl');
 ok(await s.isVisible(`#chm .cmr[data-i="${mid}"] time:has-text("edited")`),'"edited" shows on the message');
 const smid=await s.evaluate(()=>{$('chin').value='hello';chSend();return 0;});await wait(host,()=>CH.some(m=>m.x==='hello'));
 const hid=await host.evaluate(()=>CH.find(m=>m.x==='hello').i);await s.waitForTimeout(300);
 await s.evaluate(i=>chActs(i),mid);ok(!(await s.isVisible('#chact .chmenu button:has-text("Edit")')),'someone else\'s message: no Edit');await s.evaluate(()=>chActs(0));
 await d.evaluate(i=>send({t:'edit',i,x:'hacked'}),hid);await d.waitForTimeout(1500);ok(await host.evaluate(i=>CH.find(m=>m.i===i).x==='hello',hid),'the host refuses editing someone else\'s message');
 await host.evaluate(i=>{CH.find(m=>m.i===i).at=Date.now()-16*60e3;hostPublish();},mid);await wait(d,i=>CH.find(m=>m.i===i).at<Date.now()-15*60e3,mid);
 await d.evaluate(i=>chActs(i),mid);ok(!(await d.isVisible('#chact .chmenu button:has-text("Edit")')),'after 15 minutes: no Edit');await d.evaluate(()=>chActs(0));
 await d.evaluate(i=>send({t:'edit',i,x:'too late'}),mid);await d.waitForTimeout(1500);ok(await host.evaluate(i=>CH.find(m=>m.i===i).x==='who is the doctor?',mid),'the host refuses an edit after 15 minutes');
 // the long-press menu sits on the message
 const r0=await s.evaluate(i=>{const r=document.querySelector(`#chm .cmr[data-i="${i}"] .cm`).getBoundingClientRect();return {top:r.top,left:r.left,right:r.right};},hid);
 await s.evaluate(i=>chActs(i),hid);
 const pop=await s.evaluate(()=>{const c=document.querySelector('#chact .chlift .cm').getBoundingClientRect(),x=document.querySelector('#chact .rxp').getBoundingClientRect(),m=document.querySelector('#chact .chmenu').getBoundingClientRect();return {top:c.top,right:c.right,bottom:c.bottom,rxB:x.bottom,mT:m.top,H:innerHeight};});
 ok(Math.abs(pop.top-r0.top)<3&&Math.abs(pop.right-r0.right)<3,'long-press: the message stays where it was, lifted over the dimmed chat');
 ok(pop.rxB<=pop.top&&pop.mT>=pop.bottom&&pop.mT+40<pop.H,'reactions just above it, Reply / Edit just below, on screen');
 ok(await s.isVisible('#chact .chmenu button:has-text("Edit")')&&await s.isVisible('#chact .chmenu button:has-text("Reply")'),'my message: Reply and Edit');
 await s.click('#chact .chact',{position:{x:10,y:10}});ok(!(await s.isVisible('#chact .chpop')),'tapping outside closes it');
 // the slides (motion on)
 await s.emulateMedia({reducedMotion:'no-preference'});
 await s.evaluate(()=>chBack());ok(await s.evaluate(()=>!!document.querySelector('#chat .chw.a-back')),'Back to the list: slides');
 const same=await s.evaluate(()=>{document.querySelector('#chat .chw').__k=1;return 1;});
 await host.evaluate(()=>{chPost(0,-1,'new one');hostPublish();});await wait(s,()=>CH.some(m=>m.x==='new one'));await s.waitForTimeout(300);
 ok(await s.evaluate(()=>document.querySelector('#chat .chw').__k===1&&/new one/.test(document.querySelector('#chat .chb').textContent)),'a new message on the list: the rows change, no flash');
 await s.evaluate(()=>chGo(-1));ok(await s.evaluate(()=>!!document.querySelector('#chat .chw.a-in')),'into a conversation: slides in');
 ok(await s.evaluate(()=>{const w=document.querySelector('#chat .chw');return getComputedStyle(w).animationName==='none'&&getComputedStyle(w).opacity==='1'&&getComputedStyle(w.querySelector('.chh')).animationName==='chRise';}),
   'v2.18.1: the panel stays solid (no flash of the room behind); its content rises in like opening the chat');
 // v2.18.2: with motion on (as on a phone) the long-press menu was placed in a 0 px box below the screen
 await s.waitForTimeout(450);{const bb=await s.$(`#chm .cmr[data-i="${hid}"] .cm`).then(e=>e.boundingBox());
   await s.mouse.move(bb.x+20,bb.y+12);await s.mouse.down();await s.waitForTimeout(600);await s.mouse.up();await s.waitForTimeout(300);}
 ok(await s.evaluate(()=>{const a=document.querySelector('#chact .chact'),p=document.querySelector('#chact .chpop');if(!a||!p)return false;const ra=a.getBoundingClientRect(),rp=p.getBoundingClientRect();
   return ra.top===0&&ra.height===innerHeight&&rp.top>=0&&rp.bottom<=innerHeight&&rp.height>100;}),'v2.18.2: long-press with motion on: the dimmed layer covers the screen and the menu is on it');
 await s.evaluate(()=>chActs(0));
 await s.evaluate(()=>chClose());ok(await s.evaluate(()=>!!document.querySelector('#chat .chw.a-down')),'Minimize: slides down');
 await s.waitForTimeout(300);ok(await s.evaluate(()=>!document.querySelector('#chat .chw')),'then it is gone');
 await s.evaluate(()=>chOpenList());ok(await s.evaluate(()=>!!document.querySelector('#chat .chw.a-up')),'opening the chat: slides up');await s.evaluate(()=>chClose());await s.waitForTimeout(300);
 await s.emulateMedia({reducedMotion:'reduce'});
 // v2.18.1: the host's "Hosting a game" notification opens the room
 await host.evaluate(()=>{nav('home');chOpenList();});ok(await host.evaluate(()=>roomMinned()),'host on Home with the room minimized (chat open)');
 await host.evaluate(()=>deepLink('md:room'));ok(await host.evaluate(()=>V==='host'&&!chView),'tapping the hosting notification: back in the room');
 ok(await host.evaluate(()=>{const g=G;G={phase:'day'};const v=V;deepLink('md:room');const same=V===v;G=g;return same;}),'during a game it leaves the game on screen');
 // mentions in the bell
 await d.evaluate(()=>{chOpenList();chGo(-1);$('chin').value='@Sami are you mafia?';chSend();});
 await wait(s,()=>(S.nlog||[]).some(n=>n.k==='ment'));
 await s.evaluate(()=>bellOpen());ok(await s.isVisible('#bellsh .prs:has-text("Dareer"):has-text("mentioned you") q:has-text("are you mafia?")'),'the bell: "Dareer mentioned you" with the message');
 ok(await s.evaluate(()=>{const b=document.querySelector('#bellsh .bl');return getComputedStyle(b).overflowY==='auto'&&document.querySelector('#bellsh').getBoundingClientRect().height<=innerHeight*0.63;}),'the bell is a compact panel; only the list scrolls');
 await s.click('#bellsh .prs:has-text("mentioned you") button:has-text("Open")');
 ok(await s.evaluate(()=>chView&&chConv===-1&&!$('bellsh')),'Open: the conversation with the mention');
 await s.evaluate(()=>{chClose();leaveNow();});await s.evaluate(()=>bellOpen());
 ok(await s.isVisible('#bellsh .prs.ro:has-text("mentioned you") .nst:has-text("Chat closed")')&&!(await s.isVisible('#bellsh button:has-text("Open")')),'after leaving the room: read-only "Chat closed"');
 await s.click('#bellsh button.link:has-text("Clear")');ok(await s.evaluate(()=>!(S.nlog||[]).some(n=>n.k==='ment')),'Clear removes it');
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

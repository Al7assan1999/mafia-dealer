// v2.19 (Wi-Fi mock, no relay): swipe to reply (both directions by language), the + reaction grid (host-checked), RTL arrows and alignment.
// Runs with motion ON (as on a phone), since v2.18.1 showed reduced motion can hide layout bugs.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const hostShim=()=>{const X=(m,u,b)=>{const x=new XMLHttpRequest();x.open(m,'http://127.0.0.1:8765'+u,false);x.send(b||null);return x.responseText;};
  window.Net={start(){},put(k,v){X('POST','/__put',JSON.stringify({k,v}))},take(){const r=X('GET','/__take');return r==='\u0000'?null:r},clear(){X('GET','/__clear')},ip(){return '0,0'}};};
const clientShim=()=>{window.Net={start(){},put(){},take(){return null},clear(){},ip(){return '150995071,0'}};};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const srv=spawn(process.platform==='win32'?'python':'python3',['mock_srv.py']);await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch();const errs=[];
 const mk=async(shim,name)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'no-preference'})).newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
   await p.route('**/version.json',r=>r.fulfill({json:{code:1,name:'1'}}));if(shim)await p.addInitScript(shim);await p.goto(URL);await p.evaluate(n=>{S.mpName=n;save();},name);return p;};
 const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:15000});
 const host=await mk(hostShim,'Alhassan');await host.click('#mode-wifi');await host.click('.big2 .btn.primary');
 const d=await mk(clientShim,'Dareer'),s=await mk(clientShim,'Sami');
 for(const p of [d,s]){await p.click('#mode-wifi');await p.click('.big2 .btn.ghost');await wait(p,()=>MP.status==='ok'&&MP.room&&MP.room.cv&&MP.room.players.length>=2);}
 await wait(s,()=>MP.room.players.length===3);
 await host.evaluate(()=>{chPost(0,-1,'who is the mafia?');hostPublish();});
 await s.evaluate(()=>{chOpenList();chGo(-1);$('chin').value='not me';chSend();});await wait(s,()=>CH.length===2);await s.waitForTimeout(500);
 const [hi,si]=await s.evaluate(()=>[CH[0].i,CH[1].i]);
 const drag=async(p,i,dx,dy,steps=8)=>{const bb=await p.$(`#chm .cmr[data-i="${i}"] .cm`).then(e=>e.boundingBox());const x=bb.x+bb.width/2,y=bb.y+bb.height/2;
   await p.mouse.move(x,y);await p.mouse.down();for(let k=1;k<=steps;k++){await p.mouse.move(x+dx*k/steps,y+dy*k/steps);await p.waitForTimeout(16);}
   const mid=await p.evaluate(i=>{const r=document.querySelector(`#chm .cmr[data-i="${i}"]`);const ic=r.querySelector('.swr');return {t:r.style.transform,ic:!!ic,on:!!(ic&&ic.classList.contains('on'))};},i);
   await p.mouse.up();await p.waitForTimeout(260);return mid;};
 // 1. swipe to reply
 let m=await drag(s,hi,80,0);ok(m.ic&&m.on&&/translateX\(80px\)/.test(m.t),'swipe right on someone\'s message: it follows the finger, the reply icon lights up');
 ok(await s.isVisible('#chrep :text("Replying to Alhassan")'),'let go: replying to it');
 ok(await s.evaluate(i=>!document.querySelector(`#chm .cmr[data-i="${i}"]`).style.transform&&!document.querySelector('#chm .swr'),hi),'the message slides back');
 await s.evaluate(()=>{chReply=0;chRepDraw();});
 m=await drag(s,si,80,0);ok(await s.isVisible('#chrep :text("Replying to Sami")'),'swipe right on my own message: reply too');await s.evaluate(()=>{chReply=0;chRepDraw();});
 m=await drag(s,hi,35,0);ok(!m.on&&!(await s.isVisible('#chrep .crp')),'a short swipe: nothing');
 m=await drag(s,hi,8,90);ok(!m.ic&&!(await s.isVisible('#chrep .crp')),'moving up or down: left to scrolling');
 m=await drag(s,hi,-80,0);ok(m.on&&/translateX\(-80px\)/.test(m.t)&&await s.isVisible('#chrep .crp'),'v2.19.1: swiping left replies too');await s.evaluate(()=>{chReply=0;chRepDraw();});
 ok(!(await s.isVisible('#chact .chpop')),'a swipe never opens the long-press menu');
 // 2. the + grid
 const bb=await s.$(`#chm .cmr[data-i="${hi}"] .cm`).then(e=>e.boundingBox());await s.mouse.move(bb.x+20,bb.y+12);await s.mouse.down();await s.waitForTimeout(600);await s.mouse.up();await s.waitForTimeout(300);
 ok(await s.evaluate(()=>document.querySelectorAll('#chact .rxp button:not(.rxm)').length===6&&!!document.querySelector('#chact .rxp .rxm')),'long-press: the 6 quick reactions and +');
 await s.click('#chact .rxp .rxm');await s.waitForTimeout(250);
 ok(await s.evaluate(()=>{const g=document.querySelector('#chact .rxp.all'),p=document.querySelector('#chact .chpop').getBoundingClientRect();
   return g&&g.querySelectorAll('button').length===30&&getComputedStyle(g).display==='grid'&&p.top>=0&&p.bottom<=innerHeight&&p.left>=0&&p.right<=innerWidth;}),'+: the bar grows into a grid of all 30, on screen');
 ok(await s.evaluate(()=>/🖕/.test(document.querySelector('#chact .rxp.all').textContent)&&/🐀/.test(document.querySelector('#chact .rxp.all').textContent)),'with the extra ones (🖕 🐀 ...)');
 await s.click('#chact .rxp.all button[aria-label="🖕"]');await wait(host,i=>{const m=CH.find(x=>x.i===i);return m.r&&m.r['11'];},hi);
 await wait(d,i=>{const m=CH.find(x=>x.i===i);return m&&m.r&&m.r['11'];},hi);ok(true,'an extra reaction reaches the host and everyone');
 await d.evaluate(()=>{chOpenList();chGo(-1);});await d.waitForTimeout(400);ok(await d.isVisible(`#chm .cmr[data-i="${hi}"] .rx:has-text("🖕 1")`),'it shows under the message');
 for(const e of [30,1.5,-1]){await d.evaluate(([i,e])=>send({t:'react',i,e}),[hi,e]);}await d.waitForTimeout(1500);
 ok(await host.evaluate(i=>Object.keys(CH.find(x=>x.i===i).r).join()==='11',hi),'the host refuses reactions outside the list (30, 1.5, -1)');
 await d.evaluate(()=>{MP.room.hv=39;});await d.evaluate(i=>chActs(i),hi);ok(!(await d.isVisible('#chact .rxp .rxm'))&&await d.isVisible('#chact .rxp'),'host on an older app: no + (it would refuse them)');await d.evaluate(()=>chActs(0));
 // 3. Arabic
 await s.evaluate(()=>{S.lang='ar';save();chClose();render();chOpenList();chGo(-1);});await s.waitForTimeout(500);
 m=await drag(s,hi,80,0);ok(m.on&&/translateX\(80px\)/.test(m.t)&&await s.isVisible('#chrep .crp'),'v2.19.1 Arabic: swiping right replies (it did nothing in v2.19)');await s.evaluate(()=>{chReply=0;chRepDraw();});
 m=await drag(s,hi,-80,0);ok(m.on&&/translateX\(-80px\)/.test(m.t)&&await s.isVisible('#chrep .crp'),'Arabic: swiping left replies too');
 await s.evaluate(()=>{chReply=0;chRepDraw();});
 const flip=(p,sel)=>p.evaluate(sel=>{const e=document.querySelector(sel);return e?getComputedStyle(e).transform:'missing';},sel);
 ok((await flip(s,'#chat .chh .ib svg.flip')).startsWith('matrix(-1'),'Arabic: the chat Back arrow is flipped once (points right)');
 ok(await s.evaluate(()=>!/[‹›]/.test(document.body.innerText)),'no text arrows left (phones mirror them on their own)');
 await s.evaluate(()=>{chClose();nav('settings');S.acct={tok:'0'.repeat(64),u:{id:'u1',uname:'sami',display:'سامي',avatar:'p:3',fav:''}};S.relay='ws://127.0.0.1:9';render();});await s.waitForTimeout(400);
 ok((await flip(s,'.top .pill:first-child svg.flip')).startsWith('matrix(-1'),'Arabic: the top Back arrow is flipped once');
 ok(await s.evaluate(()=>{const a=document.querySelector('.tg.wide bdi').getBoundingClientRect(),g=document.querySelector('.tg.wide .go').getBoundingClientRect();return a.left>=g.right;}),'Arabic Settings: @username sits clear of the arrow');
 ok(await s.evaluate(()=>!/[‹›]/.test(document.body.innerText)),'Settings: no text arrows');
 await s.evaluate(()=>{S.lang='en';save();render();});await s.waitForTimeout(300);
 ok((await flip(s,'.top .pill:first-child svg.flip'))==='none','English: the same arrow is not flipped');
 // v2.19.1: real touch input on a phone-like page (the mouse checks above passed while the phone failed)
 {const ctx=await b.newContext({viewport:{width:390,height:800},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});const t=await ctx.newPage();t.on('pageerror',e=>errs.push('touch: '+e.message));
  await t.route('**/version.json',r=>r.fulfill({json:{code:1,name:'1'}}));await t.addInitScript(clientShim);await t.goto(URL);await t.evaluate(()=>{S.mpName='Touch';save();});
  await t.tap('#mode-wifi');await t.tap('.big2 .btn.ghost');await wait(t,()=>MP.status==='ok'&&MP.room&&MP.room.cv&&CH.length>=1);
  const cdp=await ctx.newCDPSession(t);
  const swipe=async(dx,hold,outside)=>{const bb=await t.$(`#chm .cmr[data-i="${hi}"] .cm`).then(e=>e.boundingBox()),rb=await t.$(`#chm .cmr[data-i="${hi}"]`).then(e=>e.boundingBox());
    const y=bb.y+bb.height/2,x=!outside?bb.x+bb.width/2:(bb.x-rb.x>rb.x+rb.width-bb.x-bb.width?rb.x+12:rb.x+rb.width-12);  // outside: the empty part of the message's line
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});if(hold){await t.waitForTimeout(650);}
    else for(let k=1;k<=10;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*k/10,y:y+(k%3)}]});await t.waitForTimeout(16);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await t.waitForTimeout(350);
    const r=await t.evaluate(()=>chReply);await t.evaluate(()=>{chReply=0;chRepDraw();});return r;};
  for(const lang of ['en','ar']){await t.evaluate(l=>{S.lang=l;save();if(chView)chClose();render();chOpenList();chGo(-1);},lang);await t.waitForTimeout(600);
    ok(await swipe(85)===hi,`touch (${lang}): a finger swipe to the right replies`);
    ok(await swipe(-85)===hi,`touch (${lang}): a finger swipe to the left replies`);
    ok(await swipe(30)===0,`touch (${lang}): a short swipe does not`);
    ok(await swipe(85,false,true)===hi&&await swipe(-85,false,true)===hi,`touch (${lang}): a swipe that starts beside the bubble, on its line, replies too`);}
  await swipe(0,true);ok(await t.isVisible('#chact .rxp')&&!(await t.isVisible('#chact button:has-text("Reply")')),'touch: long-press shows the reactions, no Reply');
  await ctx.close();}
 console.log('errs',errs);if(errs.length)process.exitCode=1;srv.kill();await b.close();})();

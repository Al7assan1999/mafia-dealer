// v2.11 screens (no relay): Noir tutorial background, Rules presets stay on screen, Home fits without scrolling,
// role counts stop at their limits, an invite link (https://<relay>/j/<code>) joins that room.
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(w,h)=>{const p=await (await b.newContext({viewport:{width:w,height:h},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(URL);return p;};
 const p=await mk(393,780);
 // 2. the welcome (v2.14 replaced the tutorial) covers Home in both looks
 for(const th of ['noir','neon']){await p.evaluate(th=>{S.theme=th;render();showWelcome();},th);await p.waitForTimeout(300);
   ok(await p.evaluate(()=>{const c=getComputedStyle(document.querySelector('#welcome .wl'));return c.backgroundColor!=='rgba(0, 0, 0, 0)'&&c.position==='fixed';}),th+': the welcome has a background (Home does not show through)');
   await p.evaluate(()=>welcomeEnd());await p.waitForTimeout(600);}
 // 3. rules presets stay on screen
 await p.evaluate(()=>nav('rules'));await p.evaluate(()=>scrollTo(0,600));await p.waitForTimeout(200);
 ok(await p.evaluate(()=>{const r=document.querySelector('.preset').getBoundingClientRect();return scrollY>300&&r.top>=-1&&r.top<5&&r.height>40;}),'Rules: scrolled down, Classic / Beginner / Custom still at the top');
 await p.click('.preset button:has-text("Beginner")');ok(await p.evaluate(()=>presetOf()==='beginner'),'and they still work there');await p.click('.preset button:has-text("Classic")');
 // 8. Home fits
 for(const [w,h] of [[393,780],[412,800],[384,720],[360,700]]){const q=await mk(w,h);
   for(const acc of [0,1]){await q.evaluate(a=>{S.acct=a?{tok:'x'.repeat(64),u:{id:'u1',uname:'al',display:'Al',avatar:'p:3',fav:''}}:null;nav('home');},acc);await q.waitForTimeout(100);
     const over=await q.evaluate(()=>document.documentElement.scrollHeight-innerHeight);ok(over<=0,`Home ${w}x${h} ${acc?'signed in':'signed out'}: no scroll (${over}px)`);}
   await q.close();}
 // 7. role counts
 await p.evaluate(()=>{S.players=['A','B','C','D','E','F'];S.counts={mafia:2,doctor:1,detective:0};nav('setup');});
 const plus=r=>p.evaluate(r=>{const row=[...document.querySelectorAll('.role')].find(x=>x.textContent.includes(r));const bs=row.querySelectorAll('.step button');return bs.length?{minus:bs[0].disabled,plus:bs[1].disabled,lim:(row.querySelector('.lim')||{}).textContent||''}:null;},r);
 let m=await plus('Mafia');ok(m.plus&&m.lim.includes('Max 2 Mafia for 6 players'),'6 players, 2 Mafia: + is off, the row says "Max 2 Mafia for 6 players"');
 await p.evaluate(()=>{const row=[...document.querySelectorAll('.role')].find(x=>x.textContent.includes('Mafia'));row.querySelectorAll('.step button')[1].click();});ok(await p.evaluate(()=>S.counts.mafia===2),'tapping the disabled + changes nothing');
 let d=await plus('Detective');ok(!d.plus&&d.minus,'Detective: + on, - off at 0');await p.evaluate(()=>cnt('detective',1));d=await plus('Detective');ok(d.plus&&!d.minus,'Detective at 1: + off (one at most), - on');
 await p.evaluate(()=>{S.counts={mafia:1,doctor:1,detective:0};render();});m=await plus('Mafia');ok(m.minus&&!m.plus&&!m.lim,'1 Mafia: - off, + on, no note');
 await p.evaluate(()=>{S.counts={mafia:2,doctor:1,detective:1};S.players=['A','B','C','D'];render();});
 ok(await p.evaluate(()=>S.counts.mafia===1&&S.counts.detective===0&&!document.querySelector('.cta .btn').disabled),'players removed: the counts come back inside the limits, Deal works');
 ok(!(await p.evaluate(()=>document.body.innerText.includes('Too many special roles')||document.body.innerText.includes('at least 2 fewer'))),'no count error at the bottom');
 await p.evaluate(()=>{S.players=['A','B','C'];render();});ok(await p.isVisible('text=Need at least 4 players'),'"Need at least 4 players" still shows by Deal');
 // 6. invite link
 await p.evaluate(()=>{S.acct={tok:'x'.repeat(64),u:{id:'u1',uname:'al',display:'Al',avatar:'p:3',fav:''}};S.relay='ws://127.0.0.1:9';window.Net=Object.assign(window.Net||{},{link:()=>window.__link||null});nav('home');});
 await p.evaluate(()=>{window.__link='https://mafia-relay.mafiadealer.workers.dev/j/482913';deepLink();});ok(await p.evaluate(()=>MP.role==='client'&&MP.online.code==='482913'&&V==='join'),'opened by https://…/j/482913: joins room 482913');
 await p.evaluate(()=>{window.__link='https://mafia-relay.mafiadealer.workers.dev/j/111222';deepLink();});ok(await p.isVisible('#modal .sheet:has-text("Join this room?")'),'already in a room: asks first');
 await p.click('#modal .btn.primary');ok(await p.evaluate(()=>MP.online.code==='111222'),'Join: moves to the new room');
 await p.evaluate(()=>{clientStop(true);nav('home');for(const u of ['https://x/j/12345','https://x/j/1234567','https://x/g/123456',null]){window.__link=u;deepLink();}});ok(await p.evaluate(()=>!MP.role),'other links do nothing');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

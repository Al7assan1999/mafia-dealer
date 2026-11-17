// v2.14 the welcome: six scenes then the title, tap = next, Skip / Back = Home, Neon / Noir, English / Arabic,
// every start unless switched off or opening into a room / an invite link, What's new waits for it, replay from Settings and How to Play.
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
const human=()=>Object.defineProperty(navigator,'webdriver',{get:()=>false});  // a normal browser: the welcome plays at start
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(o={})=>{const ctx=await b.newContext({viewport:{width:390,height:800},reducedMotion:o.motion||'no-preference'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
   if(o.ver)await p.route('**/version.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(o.ver)}));
   if(o.human)await p.addInitScript(human);if(o.init)await p.addInitScript(o.init);await p.goto(URL);return p;};
 const scene=p=>p.evaluate(()=>{const w=document.querySelector('#welcome .wl');return w?w.className.replace('wl ',''):'';});
 // plays scene by scene, by itself
 // v2.15 the first time: no Skip, Back does nothing, tap still moves on; then it counts as seen
 const fr=await mk();await fr.evaluate(()=>showWelcome());await fr.waitForTimeout(600);
 ok(!(await fr.$('#welcome .wl-skip'))&&await fr.isVisible('#welcome .wl-mute'),'first time: no Skip (the mute button is there)');
 await fr.evaluate(()=>history.back());await fr.waitForTimeout(500);ok(await fr.evaluate(()=>WL.on),'first time: phone Back does not end it');
 await fr.click('#welcome .wl');ok((await scene(fr))==='s2','first time: tap still moves on');
 ok(await fr.evaluate(()=>WSFX.playing()),'each scene plays its sound');
 await fr.click('#welcome .wl-mute');ok(await fr.evaluate(()=>S.wlMute===true)&&(await fr.getAttribute('#welcome .wl-mute','aria-label'))==='Turn the sound on','mute button: sound off (remembered)');
 await fr.click('#welcome .wl-mute');ok(await fr.evaluate(()=>S.wlMute===false),'and on again');
 // the killing: blood, a longer scene
 await fr.click('#welcome .wl');ok((await scene(fr))==='s3'&&await fr.evaluate(()=>!!document.querySelector('#welcome .wl-blood svg filter')),'the killing: the blood is there');
 await fr.waitForTimeout(3600);ok((await scene(fr))==='s3'&&await fr.evaluate(()=>[...document.querySelectorAll('#welcome .bl-s')].some(e=>e.getBoundingClientRect().height>150)),'blood runs down, and the scene lasts long enough (4.4 s)');
 for(let i=0;i<4;i++){await fr.click('#welcome .wl');await fr.waitForTimeout(200);}
 await fr.waitForFunction(()=>!WL.on,null,{timeout:6000});ok(await fr.evaluate(()=>S.wlSeen===true),'watched to the end: counts as seen');
 await fr.waitForTimeout(600);await fr.evaluate(()=>showWelcome());await fr.waitForTimeout(400);ok(await fr.isVisible('#welcome .wl-skip'),'next time: Skip is there');await fr.evaluate(()=>welcomeEnd());
 const p=await mk();await p.evaluate(()=>{S.wlSeen=true;save();showWelcome();});await p.waitForTimeout(900);
 ok((await scene(p))==='s1'&&(await p.textContent('#wlCap')).includes('A quiet town'),'scene 1: the town, "A quiet town…"');
 ok((await p.$$('#welcome .wl-prog i')).length===6&&await p.isVisible('#welcome .wl-skip'),'six progress marks and Skip');
 await p.waitForFunction(()=>document.querySelector('#welcome .wl').classList.contains('s2'),null,{timeout:6000});ok(true,'moves on by itself to scene 2');
 // tap = next
 await p.click('#welcome .wl');ok((await scene(p))==='s3','tap: next scene');
 await p.click('#welcome .wl');await p.waitForFunction(()=>document.querySelector('#welcome .wl-bub').textContent.includes('safe tonight'),null,{timeout:5000});
 ok((await p.textContent('#welcome .wl-who'))==='The Doctor','the Doctor speaks (typed out)');
 await p.click('#welcome .wl');await p.waitForTimeout(400);await p.click('#welcome .wl');await p.waitForFunction(()=>document.querySelector('#wlHa').classList.contains('on'),null,{timeout:4000});
 ok((await p.textContent('#welcome .wl-who'))==='The Mafia','the Mafia laughs');
 await p.click('#welcome .wl');ok((await scene(p))==='end'&&await p.isVisible('#welcome .wl-title h1'),'the title');
 await p.waitForFunction(()=>!WL.on,null,{timeout:5000});await p.waitForTimeout(600);ok(await p.evaluate(()=>!document.querySelector('#welcome').innerHTML&&V==='home'),'then Home by itself');
 // Skip and Back
 await p.evaluate(()=>showWelcome());await p.waitForTimeout(300);await p.click('#welcome .wl-skip');await p.waitForTimeout(600);ok(await p.evaluate(()=>!WL.on&&!document.querySelector('#welcome .wl')),'Skip: straight to Home');
 await p.evaluate(()=>showWelcome());await p.waitForTimeout(300);await p.evaluate(()=>history.back());await p.waitForTimeout(700);ok(await p.evaluate(()=>!WL.on&&V==='home'),'phone Back: Home');
 // looks and language
 await p.evaluate(()=>{S.theme='noir';S.lang='ar';render();showWelcome();});await p.waitForTimeout(900);
 ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#welcome')).getPropertyValue('--wink').trim()==='#080706'),'Noir colours');
 ok((await p.textContent('#wlCap')).includes('بلدة هادئة')&&await p.evaluate(()=>{const r=document.querySelector('#welcome .wl-skip').getBoundingClientRect();return r.left<100;}),'Arabic: the words, Skip on the left');
 await p.evaluate(()=>{welcomeEnd();S.theme='neon';S.lang='en';render();});await p.waitForTimeout(600);
 // replay
 await p.evaluate(()=>nav('settings'));await p.click('.tg:has-text("Watch the welcome")');ok(await p.evaluate(()=>WL.on),'Settings: Watch the welcome');await p.evaluate(()=>welcomeEnd());await p.waitForTimeout(600);
 await p.evaluate(()=>nav('guide'));await p.click('button:has-text("Watch the welcome")');ok(await p.evaluate(()=>WL.on),'How to Play: Watch the welcome');await p.evaluate(()=>welcomeEnd());await p.waitForTimeout(600);
 ok(await p.evaluate(()=>typeof showIntro==='undefined'),'the old 3-card tutorial is gone');
 // at start
 const h=await mk({human:true});await h.waitForTimeout(500);ok(await h.evaluate(()=>WL.on&&!!document.querySelector('#welcome .wl')),'app start: the welcome plays');
 await h.evaluate(()=>{S.wlSeen=true;welcomeEnd();nav('settings');});await h.waitForTimeout(600);await h.click('.tg:has-text("Show the welcome at start")');ok(await h.evaluate(()=>S.welcome===false),'Settings: switch it off');
 await h.reload();await h.waitForTimeout(800);ok(await h.evaluate(()=>!WL.on),'switched off: no welcome at start');
 const r=await mk({human:true,init:()=>{localStorage.setItem('mafiaDealer.join',JSON.stringify({online:{code:'123456'},at:Date.now()}));}});await r.waitForTimeout(500);
 ok(await r.evaluate(()=>!WL.on),'opening back into a room: no welcome');
 const l=await mk({human:true,init:()=>{window.Net={link:()=>'https://mafia-relay.mafiadealer.workers.dev/j/482913',start(){},put(){},take(){return null},clear(){},ip(){return '0,0'}};}});await l.waitForTimeout(500);
 ok(await l.evaluate(()=>!WL.on),'opened from an invite link: no welcome');
 // What's new after an update waits for the welcome
 const code=await p.evaluate(()=>APP.code),name=await p.evaluate(()=>APP.name);
 const u=await mk({human:true,ver:{code,name,url:'https://x.invalid/a.apk',notes:'',bullets:['x'],history:[{code,name,date:'2026-11-18',notes:['x']}]},init:c=>{try{const k='mafiaDealer.v1',s=JSON.parse(localStorage.getItem(k)||'null');if(s&&!s.__t){s.lastVer=s.lastVer||1;s.__t=1;localStorage.setItem(k,JSON.stringify(s));}}catch(e){}}});
 await u.evaluate(c=>{S.lastVer=c-1;save();},code);await u.reload();await u.waitForTimeout(2600);
 ok(await u.evaluate(()=>WL.on)&&!(await u.isVisible('.rnsh')),'just updated: the welcome plays first, What\'s new waits');
 await u.evaluate(()=>welcomeEnd());await u.waitForSelector('.rnsh',{timeout:4000});ok(true,'after it: What\'s new');
 // watched in v2.14: Skip right away
 const v14=await mk({human:true,init:()=>{try{const k='mafiaDealer.v1';if(!localStorage.getItem('__v14')){localStorage.setItem('__v14','1');localStorage.setItem(k,JSON.stringify({lang:'en',lastVer:33,players:['A','B','C','D']}));}}catch(e){}}});
 await v14.waitForTimeout(600);ok(await v14.evaluate(()=>WL.on&&S.wlSeen===true)&&await v14.isVisible('#welcome .wl-skip'),'updated from v2.14 (already watched it): Skip is there');
 // reduced motion still works
 const m=await mk({motion:'reduce'});await m.evaluate(()=>{S.wlSeen=true;showWelcome();});await m.waitForTimeout(500);await m.click('#welcome .wl');ok((await scene(m))==='s2','reduced motion: scenes still change');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

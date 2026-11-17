// v2.14 release notes: bullets in the update banner, the What's new screen (history, scrolls), shown once after an update,
// and older version.json files (one line of notes) still work. No relay: version.json is answered by the test.
const {chromium}=require('playwright');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async(ver,init)=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(e.message));
   await p.route('**/version.json',r=>ver?r.fulfill({contentType:'application/json',body:JSON.stringify(ver(p))}):r.abort());
   if(init)await p.addInitScript(init);await p.goto(URL);await p.evaluate(()=>{window.__open=[];window.open=u=>__open.push(u);});return p;};
 const cur=await (await (await b.newContext()).newPage()).goto(URL).then(r=>r.frame().evaluate(()=>APP));
 const hist=n=>Array.from({length:n},(x,i)=>({code:cur.code+2-i,name:'9.'+(9-i),date:'2026-11-'+String(17-i).padStart(2,'0'),notes:['Point A of '+(9-i),'Point B of '+(9-i),'Point C of '+(9-i)]}));
 const newer={code:cur.code+2,name:'9.9',url:'https://x.invalid/a.apk',notes:'old style line',bullets:['First thing','Second thing','Third thing','Fourth thing'],history:hist(8)};
 // banner
 const p=await mk(()=>newer);await p.evaluate(()=>checkUpdate(true));await p.waitForSelector('.banner.upd');
 ok((await p.textContent('.banner.upd b')).includes("What's new in v9.9"),'banner: "What\'s new in v9.9"');
 ok((await p.$$('.banner.upd .rn li')).length===3&&(await p.textContent('.banner.upd .rn')).includes('Third thing')&&!(await p.textContent('.banner.upd')).includes('Fourth'),'banner: the first three points as bullets');
 ok(await p.isVisible('.banner.upd .link:has-text("See all")')&&await p.isVisible('.banner.upd .btn:has-text("Update")'),'banner: See all and Update');
 // What's new
 await p.click('.banner.upd .link');await p.waitForSelector('.rnsh');
 ok((await p.$$('.rnsh .rel')).length===8&&(await p.$$('.rnsh .rel:first-child li')).length===3,'What\'s new: 8 releases, each with its points');
 ok(await p.isVisible('.rnsh .rel:has-text("v9.9") .badge:has-text("Available")'),'the newer version is marked Available');
 ok(await p.evaluate(()=>{const l=document.querySelector('.rnl');return l.scrollHeight>l.clientHeight&&getComputedStyle(l).overflowY==='auto';}),'the list scrolls');
 ok(await p.isVisible('.rnsh .btn.primary:has-text("Update · v9.9")'),'and offers the update');
 await p.click('.rnsh .btn.ghost');ok(!(await p.isVisible('.rnsh')),'OK closes it');
 // Home: What's new link next to the version
 ok(await p.isVisible('.verrow .vnew:has-text("What\'s new")')&&(await p.textContent('.verrow .ver')).includes('v'+cur.name),'Home: version, Check for updates, What\'s new');
 // just updated: opens by itself once, marks the version installed
 const mine={code:cur.code,name:cur.name,url:'https://x.invalid/a.apk',notes:'',bullets:['This version'],history:[{code:cur.code,name:cur.name,date:'2026-11-18',notes:['This version']},{code:cur.code-1,name:'old',date:'2026-11-17',notes:['Before']}]};
 const u=await mk(()=>mine,c=>{try{const s=JSON.parse(localStorage.getItem('mafiaDealer')||'{}');}catch(e){}});
 await u.evaluate(c=>{S.lastVer=c-1;save();},cur.code);await u.reload();await u.waitForSelector('.rnsh',{timeout:8000});
 ok(await u.isVisible('.rnsh .rel:has-text("v'+cur.name+'") .badge:has-text("Installed")'),'after an update: What\'s new opens by itself, this version marked Installed');
 await u.click('.rnsh .btn.ghost');await u.reload();await u.waitForTimeout(2500);ok(!(await u.isVisible('.rnsh')),'next start: it does not open again');
 // offline after an update: the short message instead
 const off=await mk(null);await off.evaluate(c=>{S.lastVer=c-1;save();},cur.code);await off.reload();
 ok(await off.waitForFunction(()=>/Updated to v/.test(document.getElementById('toast').textContent),null,{timeout:12000}).then(()=>true,()=>false),'after an update with no connection: "Updated to v…" instead');
 // an old-style version.json (one line of notes) still works
 const old=await mk(()=>({code:cur.code+1,name:'9.0',url:'https://x.invalid/a.apk',notes:'One line of notes'}));await old.evaluate(()=>checkUpdate(true));await old.waitForSelector('.banner.upd');
 ok((await old.textContent('.banner.upd small')).includes('One line of notes')&&!(await old.$('.banner.upd .rn')),'old version.json: the one line still shows');
 // Arabic
 await p.evaluate(()=>{S.lang='ar';render();});ok((await p.textContent('.banner.upd b')).includes('ما الجديد'),'Arabic');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

// v2.7 accounts in the app (local wrangler dev with .dev.vars TG_SECRET=localtestsecret).
const {chromium}=require('playwright');const zlib=require('zlib');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const RELAY=process.argv[2]||'ws://127.0.0.1:8787',HTTP=RELAY.replace(/^ws/,'http'),SECRET=process.argv[3]||'localtestsecret';
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
const tg=(text,from)=>fetch(`${HTTP}/tg/${SECRET}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:{text,from:{id:from},chat:{id:from}}})});
// a real 64x64 PNG for the upload
function png(w,h){const crc=b=>{let c,k,t=[];for(let n=0;n<256;n++){c=n;for(k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}c=0xffffffff;for(const x of b)c=t[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const ch=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c]);};
  const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const o=y*(w*3+1)+1+x*3;raw[o]=x*4;raw[o+1]=y*4;raw[o+2]=200;}
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw)),ch('IEND',Buffer.alloc(0))]);}
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async n=>{const p=await (await b.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));
   await p.goto(URL);await p.evaluate(r=>{S.relay=r;S.mpName='';save();window.__open=[];window.open=u=>__open.push(u);},RELAY);return p;};
 const uA='al'+Math.random().toString(36).slice(2,9),uB='da'+Math.random().toString(36).slice(2,9);
 const a=await mk('A');
 // online blocked without an account
 await a.click('#mode-online');await a.click('button:has-text("Host online")');
 ok(await a.evaluate(()=>V==='account'),'Host online without an account opens the sign-in screen');
 // sign up through the screens
 await a.click('.seg button:has-text("Create account")');await a.fill('#aun',uA);await a.fill('#apw','secret12');await a.fill('#apw2','secret12');await a.click('.sec .btn.primary');
 await a.waitForFunction(()=>!!S.acct,null,{timeout:10000});ok(await a.isVisible('text=My profile'),'account created and the profile screen opens');
 await a.fill('#apw','x').catch(()=>{});
 // profile: name, preset avatar, favourite role
 await a.fill('#adn','Alhassan');await a.click('.avgrid button >> nth=3');await a.click('.chips .chipb:has-text("Detective")');await a.click('button:has-text("Save profile")');
 await a.waitForFunction(()=>S.acct.u.display==='Alhassan'&&S.acct.u.avatar==='p:3'&&S.acct.u.fav==='detective',null,{timeout:10000});ok(true,'profile saved: name, preset avatar, favourite role');
 // photo upload
 await a.setInputFiles('.avup input',{name:'me.png',mimeType:'image/png',buffer:png(64,64)});await a.waitForFunction(()=>AF.av&&AF.av.indexOf('data:image/jpeg')===0,null,{timeout:8000});
 await a.click('button:has-text("Save profile")');await a.waitForFunction(()=>S.acct.u.avatar.indexOf('i:')===0,null,{timeout:10000});
 await a.evaluate(()=>nav('home'));await a.waitForFunction(()=>{const i=document.querySelector('.ib.acc img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:10000});
 ok(true,'uploaded photo is resized, saved and shown in the corner');
 // name comes from the profile
 await a.click('#mode-wifi');ok(await a.isVisible('.meline:has-text("Alhassan")')&&!(await a.$('.sec input.search')),'Local Network uses the profile name (no name to type)');await a.evaluate(()=>nav('home'));
 // second account, online room with avatars
 const bp=await mk('B');await bp.evaluate(u=>aReq('/acc/signup',{uname:u,pass:'secret12'}).then(r=>{signedIn(r);return aReq('/acc/profile',{display:'Dareer',avatar:'p:1'});}).then(j=>{S.acct.u=j.user;save();}),uB);
 await a.click('#mode-online');await a.click('button:has-text("Host online")');await a.waitForFunction(()=>MP.online&&HN.ws&&HN.ws.readyState===1,null,{timeout:10000});
 const code=await a.evaluate(()=>MP.online.code);
 await bp.evaluate(()=>{S.mpName='Somebody else';save();});await bp.click('#mode-online');await bp.fill('#ocode',code);await bp.click('button:has-text("Join online")');
 await bp.waitForFunction(()=>MP.status==='ok',null,{timeout:15000});
 await a.waitForFunction(()=>Object.values(MP.players).some(q=>q.name==='Dareer'&&q.uid),null,{timeout:10000});
 ok(await a.evaluate(()=>{const q=Object.values(MP.players)[0];return q.name==='Dareer'&&q.uid===q.uid&&q.uav==='p:1';}),'host sees the verified profile name and avatar (typed name ignored)');
 ok((await a.$$('.prs .avt')).length>=2,'avatars show in the host lobby');
 await bp.waitForFunction(()=>document.querySelectorAll('.prs .avt').length>=2,null,{timeout:10000});ok(true,'avatars show in the player lobby');
 // a game records accounts per seat
 const ids=await a.evaluate(()=>({h:S.acct.u.id}));const idB=await bp.evaluate(()=>S.acct.u.id);
 await a.evaluate(()=>{const n=['Alhassan','Dareer','X1','X2'];MP.game={deal:1,ids:['host',Object.keys(MP.players)[0],'x1','x2'],names:n,roles:['mafia','doctor','citizen','citizen'],ready:{}};
   MP.players.x1={name:'X1',on:true};MP.players.x2={name:'X2',on:true};hostStartGame();G.phase='end';G.winner='citizens';G.revealed=true;G.logId=null;render();});
 await a.click('button:has-text("Valid")');
 const acc=await a.evaluate(()=>S.log[0].acc);ok(acc[0]===ids.h&&acc[1]===idB&&acc[2]===null,'the saved game records each seat\'s account (null without one)');
 // stats follow the account across a rename
 await a.evaluate(([h])=>{const g=JSON.parse(JSON.stringify(S.log[0]));g.id=Date.now()+5;g.names=['Al Hassan','Dareer','X1','X2'];S.log.unshift(g);save();},[ids.h]);
 await a.evaluate(()=>{finish();hostStop();nav('stats');});
 const rows=await a.evaluate(()=>BOARD.filter(p=>p.key.indexOf('a:')===0).map(p=>p.name+':'+p.g));
 ok(rows.some(r=>r.endsWith(':2')),'stats merge a renamed player by account ('+rows.join(', ')+')');
 // Telegram link (simulated bot)
 await a.evaluate(()=>{AF={mode:'in',av:null,busy:false};nav('account');});await a.click('button:has-text("Link Telegram")');
 await a.waitForFunction(()=>__open.some(u=>/t\.me\/\w+\?start=L/.test(u)),null,{timeout:8000});
 const lc=(await a.evaluate(()=>__open.find(u=>/start=L/.test(u)))).split('start=')[1];await tg('/start '+lc,5551);
 await a.waitForFunction(()=>S.acct.u.tg,null,{timeout:12000});ok(true,'Link Telegram: bot /start links the account');
 // forgot password
 await a.click('button.btn.ghost:has-text("Sign out")');ok(await a.isVisible('.sheet:has-text("Sign out?")'),'sign out asks first');await a.click('.sheet .btn.primary');
 await a.waitForFunction(()=>!S.acct,null,{timeout:5000});await a.click('text=Forgot password?');await a.fill('#run',uA);await a.click('button:has-text("Verify with Telegram")');
 await a.waitForFunction(()=>__open.some(u=>/start=R/.test(u)),null,{timeout:8000});const rc=(await a.evaluate(()=>__open.filter(u=>/start=R/.test(u)).pop())).split('start=')[1];
 await tg('/start '+rc,5551);await a.waitForSelector('#rpw',{timeout:15000});await a.fill('#rpw','brandnew1');await a.fill('#rpw2','brandnew1');await a.click('button:has-text("Set new password")');
 await a.waitForFunction(()=>!!S.acct,null,{timeout:10000});ok(true,'forgot password: verified in Telegram, new password set, signed in');
 const r=await fetch(HTTP+'/acc/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({uname:uA,pass:'brandnew1'})});ok(r.status===200,'the new password works');
 // delete account
 await a.evaluate(()=>nav('account'));await a.click('button.danger:has-text("Delete account")');await a.fill('#dpw','wrongpass');await a.click('.sheet .btn.primary');await a.waitForTimeout(1500);
 ok(await a.evaluate(()=>!!S.acct),'wrong password: account kept');await a.fill('#dpw','brandnew1');await a.click('.sheet .btn.primary');
 await a.waitForFunction(()=>!S.acct,null,{timeout:10000});ok(true,'delete account with the password: signed out and gone');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

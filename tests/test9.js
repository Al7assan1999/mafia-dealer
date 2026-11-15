const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},reducedMotion:'reduce'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(''+require('url').pathToFileURL(require('path').resolve(__dirname,'../app/assets/index.html')).href+'');await p.click('text=New game');
await p.click('text=Mafia can\'t target the same player');await p.click('text=Announce who the Doctor saved');
await p.evaluate(()=>{S.players=['Dareer','Halawy','Farouq','Sami','Hokan','Khaddour'];window.__pl=[];const o=VOX.play;VOX.play=(k,d,c)=>{__pl.push(k.filter(Boolean).join('+'));o(k,d,c);};render();});
console.log('rules',await p.evaluate(()=>S.rules.norep+','+S.rules.saverev));
await p.click('text=Shuffle & Deal Roles');
for(let k=0;k<6;k++){await p.click('.btn.primary');await p.dispatchEvent('#hold','mousedown');await p.dispatchEvent('#hold','mouseup');await p.click('#memo');}
const tgt=await p.evaluate(()=>G.roles.indexOf('citizen'));
for(let night=0;night<2;night++){
 for(let k=0;k<6;k++){await p.click('.btn.primary');const r=await p.evaluate(()=>G.roles[G.order[G.i]]);
  if(r==='mafia'&&night==1){console.log('night2 target disabled:',await p.$eval(`.opt:has(.num:text-is("${tgt+1}"))`,e=>e.disabled+' / '+e.innerText.replace(/\n/g,' ')));await p.click('.opt:not([disabled]):not(.skip)');}
  else if(r==='mafia'||r==='doctor')await p.click(`.opt:has(.num:text-is("${tgt+1}"))`);else await p.click('.opt:not([disabled])');
  await p.click('.btn.primary');await p.click('.btn.ghost');}
 await p.click('.btn.gold');await p.click('text=Reveal now');
 if(night==0){await p.screenshot({path:'s_saved.png'});console.log(await p.$eval('.big',e=>e.innerText.replace(/\n+/g,' | ').slice(0,120)));
  await p.click('.btn.primary');await p.click('.opt.skip');await p.click('text=Confirm decision');await p.click('text=Reveal now');await p.click('.btn.primary');}}
console.log((await p.evaluate(()=>__pl)).join('\n'));console.log('errs',errs);await b.close();})();

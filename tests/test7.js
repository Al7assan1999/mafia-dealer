const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},reducedMotion:'reduce'});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto(''+require('url').pathToFileURL(require('path').resolve(__dirname,'../app/assets/index.html')).href+'');await p.screenshot({path:'h1.png'});
async function game(names,valid,i){
 await p.click('text=New game');
 await p.evaluate(n=>{S.players=n;render();},names);
 if(i==0)await p.screenshot({path:'h2.png',fullPage:false});
 await p.click('text=Shuffle & Deal Roles');
 for(let k=0;k<names.length;k++){await p.click('.btn.primary');await p.dispatchEvent('#hold','mousedown');await p.dispatchEvent('#hold','mouseup');await p.click('#memo');}
 for(let night=0;night<8;night++){
  const n=await p.evaluate(()=>G.order.length);
  for(let k=0;k<n;k++){await p.click('.btn.primary');const r=await p.evaluate(()=>G.roles[G.order[G.i]]);
   const opts=await p.$$('.opt:not([disabled]):not(.skip)');const pick=r==='detective'?await p.evaluate(()=>G.roles.indexOf('mafia')):-1;
   if(pick>=0&&i%2==0)await p.click(`.opt:has(.num:text-is("${pick+1}"))`);else await opts[(i+night+k)%opts.length].click();
   await p.click('.btn.primary');await p.click('.btn.ghost');}
  await p.click('.btn.gold');await p.click('text=Reveal now');
  if(await p.evaluate(()=>G.phase==='end'))break;
  await p.click('.btn.primary');
  const tgt=await p.evaluate(i=>i%2?G.roles.findIndex((r,x)=>r!=='mafia'&&G.alive[x]):G.roles.indexOf('mafia'),i);
  await p.click(`.opt:has(.num:text-is("${tgt+1}"))`);await p.click('text=Confirm decision');await p.click('text=Reveal now');
  if(await p.evaluate(()=>G.phase==='end'))break;
  await p.click('.btn.primary');}
 if(i==0){await p.evaluate(()=>window.scrollTo(0,9999));await p.screenshot({path:'h3.png'});}
 await p.click(valid?'text=Valid game':'text=Invalid game');await p.click('text=Home');}
const N=['Dareer','Halawy','Farouq','Sami','Hokan','Khaddour'];
for(let i=0;i<7;i++)await game(N,i!==3,i);
console.log('log',await p.evaluate(()=>S.log.map(g=>g.winner+(g.valid?'':'(inv)')).join(',')),'roster',await p.evaluate(()=>S.roster.join(',')));
await p.screenshot({path:'h4.png'});
await p.click('text=Player Stats');await p.screenshot({path:'h5.png',fullPage:true});await p.goBack();await p.waitForTimeout(200);
await p.click('text=Game History');await p.fill('.search','sam');await p.click('.chipb:text-is("Mafia")');await p.waitForTimeout(100);await p.screenshot({path:'h6.png',fullPage:true});
console.log('filtered',await p.$$eval('.gcard',e=>e.length));
await p.fill('.search','');await p.click('.gcard');await p.waitForTimeout(200);await p.screenshot({path:'h7.png',fullPage:true});
await p.click('text=Delete this game');await p.click('.sheet .btn.primary');await p.waitForTimeout(200);console.log('after delete',await p.evaluate(()=>S.log.length+' V='+V));
await p.goBack();await p.waitForTimeout(200);console.log('V',await p.evaluate(()=>V));
await p.click('text=How to Play');await p.screenshot({path:'h8.png'});await p.click('[aria-label=back]');await p.waitForTimeout(500);console.log('V',await p.evaluate(()=>V));
await p.reload();console.log('persist',await p.evaluate(()=>S.log.length),'errs',errs);await b.close();})();

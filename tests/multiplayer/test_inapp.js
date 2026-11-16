// In-app update: progress, bytes handed to the native side intact, installer opened; browser fallback on failure.
const {chromium}=require('playwright');const fs=require('fs');const crypto=require('crypto');
const URL=require('url').pathToFileURL(require('path').resolve(__dirname,'../../app/assets/index.html')).href;
const APK=fs.readFileSync(require('path').resolve(__dirname,'../../build/out/MafiaDealer.apk'));
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async saveOk=>{const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();p.on('pageerror',e=>errs.push(e.message));
   await p.addInitScript(ok=>{window.__saved=null;window.__inst=0;window.__open=[];window.Net={saveApk(b64){window.__saved=b64;return ok;},install(){window.__inst++;},keep(){}};
     // the APK arrives in 100 KB pieces, like a real download (a routed body comes in one piece)
     const f0=window.fetch;window.fetch=(u,o)=>!String(u).endsWith('.apk')?f0(u,o):f0(u,o).then(r=>r.arrayBuffer().then(a=>{const b=new Uint8Array(a);let i=0;
       return new Response(new ReadableStream({pull(c){return new Promise(res=>setTimeout(()=>{if(i>=b.length)c.close();else{c.enqueue(b.subarray(i,i+102400));i+=102400;}res();},5));}}),{status:200,headers:{'content-length':String(b.length)}});}));},saveOk);
   await p.route('**/version.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({code:999,name:'9.9',url:'https://updates.example/MafiaDealer.apk'})}));
   await p.route('https://updates.example/MafiaDealer.apk',r=>r.fulfill({status:200,contentType:'application/vnd.android.package-archive',headers:{'content-length':String(APK.length),'access-control-allow-origin':'*'},body:APK}));
   await p.goto(URL);await p.evaluate(()=>{window.open=u=>__open.push(u);checkUpdate(true);});await p.waitForSelector('.banner.upd',{timeout:8000});return p;};
 const p=await mk(true);
 await p.evaluate(()=>{window.__dl=0;window.__w=[];new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.querySelector&&n.querySelector('.dl'))__dl++;
   const i=document.querySelector('#modal .dl .pbar i');if(i&&__w[__w.length-1]!==i.style.width)__w.push(i.style.width);}).observe($('modal'),{childList:true,subtree:true,attributes:true});});
 await p.click('.banner.upd .btn');
 await p.waitForFunction(()=>window.__inst>0,null,{timeout:20000});
 const dl=await p.evaluate(()=>({n:__dl,w:__w}));
 ok(dl.n===1&&dl.w.length>=3&&dl.w[dl.w.length-1]==='100%','progress sheet is built once and only the bar moves ('+dl.w.join(' ')+')');
 const b64=await p.evaluate(()=>__saved);const got=Buffer.from(b64,'base64');
 ok(got.length===APK.length&&crypto.createHash('sha256').update(got).digest('hex')===crypto.createHash('sha256').update(APK).digest('hex'),'the native side received the APK byte for byte ('+got.length+' bytes)');
 ok(await p.evaluate(()=>__inst===1&&__open.length===0),'Android installer opened once, no browser');
 const f=await mk(false);await f.click('.banner.upd .btn');await f.waitForFunction(()=>__open.length>0,null,{timeout:20000});
 ok((await f.evaluate(()=>__open[0]))==='https://updates.example/MafiaDealer.apk'&&await f.evaluate(()=>__inst===0),'if saving fails, it falls back to the browser download');
 console.log('errs',errs);if(errs.length)process.exitCode=1;await b.close();})();

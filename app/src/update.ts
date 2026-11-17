/* update check: the relay serves version.json; the app compares it with APP.code */
function checkUpdate(force?: boolean){const L: Partial<Settings['latest']>=S.latest||{};if(!force&&Date.now()-(L.at||0)<6*3600e3)return Promise.resolve(S.latest);
  const c=new AbortController();setTimeout(()=>c.abort(),8000);
  return fetch(relayUrl().replace(/^ws/,'http')+'/version.json',{cache:'no-store',signal:c.signal}).then(r=>r.json()).then(j=>{
    if(j&&j.code){S.latest={code:j.code,name:j.name,url:j.url,notes:j.notes||'',at:Date.now(),bullets:Array.isArray(j.bullets)?j.bullets:null,history:Array.isArray(j.history)?j.history:null};save();if((V==='home'||V==='settings')&&!G)render();}return S.latest;}).catch(()=>null);}
function checkNow(){toast(t('checking'));checkUpdate(true).then(L=>{if(!L||!L.at||Date.now()-L.at>5000)toast(t('gOffline'));else if(L.code>APP.code){nav('home');toast(t('updAvail',{v:L.name}));}else toast(t('upToDate',{v:APP.name}));});}
/** Update banner (v2.14): the new version's first three points, See all, Update. */
const updBanner=()=>{const L=S.latest;if(!(L&&L.code>APP.code))return '';const B=L.bullets||[];
  return `<div class="banner upd"><div><b>${t('rnNewIn',{v:esc(L.name)})}</b>${B.length?`<ul class="rn">${B.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:L.notes?`<small>${esc(L.notes)}</small>`:''}</div>
    <div class="rnrow">${B.length>3||L.history?`<button class="link" onclick="whatsNew()">${t('rnAll')}</button>`:''}<button class="btn primary" onclick="doUpdate()">${t('update')}</button></div></div>`;};
/** What's new: every recent release, newest first, as bullet points (scrolls). */
function whatsNew(){const L=S.latest;if(!L||!L.history){checkUpdate(true).then(()=>{if(S.latest&&S.latest.history)whatsNew();else toast(t('gOffline'));});return;}
  const day=(d: string)=>{try{return new Date(d+'T12:00:00').toLocaleDateString(S.lang==='ar'?'ar':'en-GB',{day:'numeric',month:'short',year:'numeric'});}catch(e){return d;}};
  const rel=(r: Release)=>`<div class="rel"><div class="rh"><b>v${esc(r.name)}</b>${r.code>APP.code?`<span class="badge new">${t('rnAvail')}</span>`:r.code===APP.code?`<span class="badge ok">${t('rnYours')}</span>`:''}<small>${day(r.date)}</small></div>
    <ul class="rn">${(r.notes||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;
  const x="$('modal').innerHTML=''";
  $('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)${x}"><div class="sheet rnsh"><h3>${t('rnT')}</h3><div class="rnl">${L.history.map(rel).join('')}</div>
    ${L.code>APP.code?`<button class="btn primary mt" onclick="${x};doUpdate()">${t('update')} · v${esc(L.name)}</button>`:''}<button class="btn ghost mt" onclick="${x}">${t('ok')}</button></div></div>`;}
/* in-app update: download with progress, hand the APK to the app (cache/update.apk), open Android's install screen.
   Android always asks "Update this app?" and only accepts an APK signed with the same key. Falls back to the browser. */
async function doUpdate(){const L=S.latest;if(!L||!/^https:\/\//.test(L.url))return;
  if(!(window.Net&&Net.saveApk&&Net.install)){openUrl(L.url);return;}
  // the sheet is built once; later calls only move the bar (rebuilding it restarted its fade-in, so it flickered)
  const show=(f: number)=>{let m=document.querySelector('#modal .dl');
    if(!m){$('modal').innerHTML=`<div class="modal"><div class="sheet dl"><h3>${t('dlT',{v:esc(L.name)})}</h3><div class="pbar"><i></i></div><p style="margin:8px 0 0"></p></div></div>`;m=document.querySelector('#modal .dl');}
    (m.querySelector('.pbar i') as HTMLElement).style.width=Math.round(f*100)+'%';m.querySelector('p').textContent=f<1?Math.round(f*100)+'%':t('dlReady');};
  show(0);
  try{const r=await fetch(L.url,{cache:'no-store'});if(!r.ok)throw 0;const total=+r.headers.get('content-length')||0,rd=r.body.getReader(),parts=[];let got=0,last=0;
    for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;if(total&&got-last>65536){last=got;show(got/total);}}
    if(got<100000)throw 0;
    const buf=new Uint8Array(got);let o=0;for(const x of parts){buf.set(x,o);o+=x.length;}
    let bin='';for(let i=0;i<buf.length;i+=0x8000)bin+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000));
    show(1);if(!Net.saveApk(btoa(bin)))throw 0;
    setTimeout(()=>{$('modal').innerHTML='';Net.install();},400);
  }catch(e){$('modal').innerHTML='';toast(t('dlFail'));openUrl(L.url);}}
function openUrl(u){if(!/^https:\/\//.test(u))return;try{if(window.Net&&Net.open){Net.open(u);return;}}catch(e){}window.open(u,'_blank');}

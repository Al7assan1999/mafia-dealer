/* ---------- shared group history: one Durable Object per 8-letter group code on the relay ---------- */
if(!S.devKey){S.devKey=rnd(24);save();}  // secret per phone: only the phone that uploaded a game may edit it
const GAL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOG=()=>S.group?(S.gcache||[]):S.log;
const gUrl=p=>relayUrl().replace(/^ws/,'http')+'/g/'+S.group.code+(p||'');
function gReq(path: string,body?: object): Promise<any>{const c=new AbortController();setTimeout(()=>c.abort(),12000);
  return fetch(gUrl(path),{method:body?'POST':'GET',headers:Object.assign({'x-dev':S.devKey},body?{'content-type':'application/json'}:{}),body:body?JSON.stringify(body):undefined,cache:'no-store',signal:c.signal})
   .then(r=>r.ok?r.json():Promise.reject(r.status));}
let gBusy: Promise<void>=null;
function gSync(){if(!S.group)return Promise.resolve();if(gBusy)return gBusy;
  const pend=S.log.filter(g=>!(S.gsent||[]).includes(g.id));
  return gBusy=(pend.length?gReq('/add',{games:pend}).then(()=>{S.gsent=(S.gsent||[]).concat(pend.map(g=>g.id)).slice(-3000);save();}):Promise.resolve())
   .then(()=>gReq('')).then(j=>{if(!j.exists)return;S.gcache=j.games;S.gsync=Date.now();save();
     const typing=document.activeElement&&document.activeElement.tagName==='INPUT';
     if(!G&&!typing&&(['home','history','stats','profile','settings'].includes(V)||V.indexOf('game:')===0))render();})
   .catch(()=>{}).finally(()=>{gBusy=null;});}
function gCreate(){let c='';for(const x of crypto.getRandomValues(new Uint8Array(8)))c+=GAL[x%32];
  S.group={code:c};S.gsent=[];S.gcache=S.log.map(g=>Object.assign({mine:true},g));save();render();gSync().then(()=>{toast(t('gCreated'));render();});}
function gJoin(code){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(!/^[A-Z2-9]{8}$/.test(code)){toast(t('gBad'));return;}
  const old=S.group;S.group={code};
  gReq('').then(j=>{if(!j.exists){S.group=old;toast(t('gNotFound'));render();return;}S.gsent=[];S.gcache=j.games;save();render();gSync().then(()=>{toast(t('gJoined'));render();});})
   .catch(()=>{S.group=old;toast(t('gOffline'));render();});}
function gLeave(){ask(t('gLeaveQ'),t('gLeaveD'),t('gLeave'),()=>{S.group=null;S.gcache=null;S.gsent=[];save();render();});}
function gShare(){const txt=t('gShareTxt',{c:S.group.code});try{if(window.Net&&Net.share){Net.share(txt);return;}}catch(e){}
  if(navigator.share)navigator.share({text:txt}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toast(t('copied')),()=>{});}
function groupBlock(){
  if(!S.group)return `<p class="mpinfo" style="margin:0 0 12px">${t('gIntro')}</p><button class="btn primary" onclick="gCreate()">${IC.users}${t('gCreate')}</button>
   <div class="flbl" style="margin-top:14px">${t('gHave')}</div><div class="prow"><input id="gcode" maxlength="9" placeholder="ABCD2345" autocapitalize="characters" style="letter-spacing:3px;text-transform:uppercase;font-size:17px;direction:ltr"><button class="pill" onclick="gJoin($('gcode').value)">${t('gJoinBtn')}</button></div>`;
  const pend=S.log.filter(g=>!(S.gsent||[]).includes(g.id)).length;
  return `<div class="code gcode">${S.group.code}</div><p class="hint" style="text-align:center;margin-bottom:12px">${t('gShareHint')}</p>
   <div class="row2"><button class="btn ghost" onclick="gShare()">${IC.share}${t('gShare')}</button><button class="btn ghost" onclick="gSync().then(()=>toast(t('gSynced')))">${t('gSyncNow')}</button></div>
   <p class="mpinfo" style="margin:10px 0 0;text-align:center">${t('gStatus',{n:(S.gcache||[]).length})}${pend?' · '+t('gPending',{n:pend}):''}${S.gsync?' · '+fdate(S.gsync):''}</p>
   <button class="danger" onclick="gLeave()">${t('gLeave')}</button>`;}

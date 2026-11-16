/* ---------- accounts (relay /acc/*): username + password; Telegram for a forgotten password ---------- */
function aReq(path: string,body?: object): Promise<any>{const c=new AbortController();setTimeout(()=>c.abort(),15000);
  return fetch(relayHttp()+path,{method:body?'POST':'GET',headers:Object.assign(body?{'content-type':'application/json'}:{},S.acct?{authorization:'Bearer '+S.acct.tok}:{}),body:body?JSON.stringify(body):undefined,cache:'no-store',signal:c.signal})
   .then(r=>r.json().catch(()=>({})).then(j=>{if(!r.ok){if(r.status===401&&j.err==='auth'&&S.acct){S.acct=null;save();}throw Object.assign(new Error(j.err||r.status),{code:j.err||String(r.status)});}return j;}));}
const AVP=[['#ff4d7d','mafia'],['#3ce0a0','doctor'],['#5aa2ff','detective'],['#ffc65a','citizen'],['#b98bff','moon'],['#ff8a3d','crown'],['#4dd4e0','eye'],['#e05a5a','skull'],['#9adf5a','trophy'],['#c9c3d6','users']];
function avatarHtml(av,uid,size){size=size||40;av=av||'p:0';
  if(av.indexOf('i:')===0&&uid)return `<span class="avt" style="width:${size}px;height:${size}px"><img src="${relayHttp()}/a/${uid}?v=${av.slice(2)}" alt="" onerror="this.parentNode.outerHTML=avatarHtml('p:0','',${size})"></span>`;
  const d=AVP[+av.slice(2)]||AVP[0];return `<span class="avt" style="width:${size}px;height:${size}px;background:${d[0]}26;color:${d[0]}">${IC[d[1]]}</span>`;}
const me=()=>S.acct&&S.acct.u;
function signedIn(r){S.acct={tok:r.tok,u:r.user};S.mpName=r.user.display;save();}
function acctRefresh(){if(S.acct)aReq('/acc/me').then(j=>{S.acct.u=j.user;S.mpName=j.user.display;save();if(V==='account'||V==='home')render();}).catch(()=>{});}
const AERR={uname:'aErrUname',pass:'aErrPass',taken:'aErrTaken',wrong:'aErrWrong',locked:'aErrLocked',nouser:'aErrNouser',notg:'aErrNotg',code:'aErrCode',avatar:'aErrAvatar'};
const aErr=e=>toast(t(AERR[e&&e.code]||'gOffline'));
let AF: {mode:string;av:string;busy:boolean;dn?:string;fav?:string}={mode:'in',av:null,busy:false};  // account form
function acctSubmit(){if(AF.busy)return;const un=$('aun').value.trim(),pw=$('apw').value;
  if(AF.mode==='up'&&pw!==$('apw2').value){toast(t('aErrMatch'));return;}
  AF.busy=true;aReq(AF.mode==='up'?'/acc/signup':'/acc/login',{uname:un,pass:pw}).then(r=>{signedIn(r);toast(t(AF.mode==='up'?'aWelcome':'aHello',{n:esc(r.user.display)}));render();}).catch(aErr).finally(()=>{AF.busy=false;});}
function setAv(v){AF.av=v;render();}
function pickPhoto(inp){const f=inp.files&&inp.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=()=>{const im=new Image();im.onload=()=>{const z=192,c=document.createElement('canvas');c.width=c.height=z;const m=Math.min(im.width,im.height);
    c.getContext('2d').drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,z,z);AF.av=c.toDataURL('image/jpeg',0.82);render();};im.src=rd.result as string;};rd.readAsDataURL(f);}
function saveProfile(){const u=me();if(!u)return;const body: {display:string;fav:string;avatar?:string}={display:(AF.dn!=null?AF.dn:$('adn').value).trim()||u.uname,fav:AF.fav!=null?AF.fav:u.fav};if(AF.av)body.avatar=AF.av;
  aReq('/acc/profile',body).then(j=>{S.acct.u=j.user;S.mpName=j.user.display;AF.av=null;AF.fav=null;AF.dn=null;save();toast(t('aSaved'));render();}).catch(aErr);}
function pollUntil(fn,ms){const t0=Date.now();return new Promise(res=>{const tick=()=>fn().then(x=>{if(x)res(true);else if(Date.now()-t0>ms)res(false);else setTimeout(tick,2500);}).catch(()=>setTimeout(tick,2500));tick();});}
function openTg(bot,code){openUrl('https://t.me/'+bot+'?start='+code);}
function linkTg(){aReq('/acc/tglink',{}).then(j=>{if(!j.bot){toast(t('aNoBot'));return;}openTg(j.bot,j.code);toast(t('aTgGo'));
  pollUntil(()=>aReq('/acc/me').then(x=>{S.acct.u=x.user;save();return x.user.tg;}),180000).then(okk=>{if(okk){toast(t('aTgDone'));render();}});}).catch(aErr);}
function signOut(){ask(t('aOutQ'),t('aOutD'),t('aOut'),()=>{aReq('/acc/logout',{}).catch(()=>{});S.acct=null;save();render();});}
function delAcct(){$('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)$('modal').innerHTML=''"><div class="sheet"><h3>${t('aDelQ')}</h3><p>${t('aDelD')}</p>
  <div class="flbl">${t('aDelPw')}</div><input id="dpw" class="search" type="password" style="direction:ltr">
  <button class="btn ghost" onclick="$('modal').innerHTML=''">${t('cancel')}</button><button class="btn primary mt" style="background:var(--red)" onclick="delAcctGo()">${t('aDel')}</button></div></div>`;}
function delAcctGo(){const pw=$('dpw').value;if(!pw)return;aReq('/acc/delete',{pass:pw}).then(()=>{$('modal').innerHTML='';S.acct=null;save();toast(t('aDeleted'));render();}).catch(aErr);}
let RS: {code:string;ok:boolean}=null;  // password reset in progress
function resetStart(){const un=$('run').value.trim();if(!un)return;aReq('/acc/reset/start',{uname:un}).then(j=>{if(!j.bot){toast(t('aNoBot'));return;}RS={code:j.code,ok:false};render();openTg(j.bot,j.code);
  pollUntil(()=>aReq('/acc/reset/status?code='+RS.code).then(x=>x.ok),15*60e3).then(okk=>{if(okk&&RS){RS.ok=true;render();}});}).catch(aErr);}
function resetFinish(){const pw=$('rpw').value;if(pw!==$('rpw2').value){toast(t('aErrMatch'));return;}
  aReq('/acc/reset/finish',{code:RS.code,pass:pw}).then(r=>{RS=null;signedIn(r);toast(t('aResetDone'));V='account';render();}).catch(aErr);}
function accountView(){const u=me();
  if(!u){const up=AF.mode==='up';
    return head(t('acctT'))+`<p class="mpinfo">${t('aWhy')}</p><div class="seg wide2">${['in','up'].map(m=>`<button class="${AF.mode===m?'on':''}" onclick="AF.mode='${m}';render()">${t(m==='in'?'aIn':'aUp')}</button>`).join('')}</div>
     <div class="sec mt"><div class="flbl" style="margin-top:0">${t('aUser')}</div><input id="aun" class="search" maxlength="20" autocapitalize="none" autocomplete="username" style="direction:ltr" placeholder="${up?t('aUserHint'):''}">
      <div class="flbl">${t('aPass')}</div><input id="apw" class="search" type="password" maxlength="100" autocomplete="${up?'new-password':'current-password'}" style="direction:ltr">
      ${up?`<div class="flbl">${t('aPass2')}</div><input id="apw2" class="search" type="password" maxlength="100" style="direction:ltr">`:''}
      <button class="btn primary mt" onclick="acctSubmit()">${t(up?'aUp':'aIn')}</button>
      ${up?'':`<button class="link discard" onclick="RS=null;nav('forgot')">${t('aForgot')}</button>`}</div>`;}
  const av=AF.av||u.avatar,fav=AF.fav!=null?AF.fav:u.fav;
  return head(t('profT'))+`<div class="big pro"><div class="pav">${AF.av&&AF.av.indexOf('data:')===0?`<span class="avt" style="width:96px;height:96px"><img src="${AF.av}" alt=""></span>`:avatarHtml(av,u.id,96)}</div>
     <div class="who" style="font-size:26px">${esc(u.display)}</div><p class="hint" style="margin:0;direction:ltr">@${esc(u.uname)}</p></div>
   <div class="sec mt"><div class="flbl" style="margin-top:0">${t('aAvatar')}</div><div class="avgrid">${AVP.map((x,i)=>`<button class="${av==='p:'+i?'on':''}" onclick="setAv('p:${i}')">${avatarHtml('p:'+i,'',40)}</button>`).join('')}
     <label class="avup">${IC.share}<span>${t('aPhoto')}</span><input type="file" accept="image/*" onchange="pickPhoto(this)" style="display:none"></label></div>
    <div class="flbl">${t('aName')}</div><input id="adn" class="search" maxlength="18" value="${esc(AF.dn!=null?AF.dn:u.display)}" oninput="AF.dn=this.value">
    <div class="flbl">${t('aFav')}</div><div class="chips">${['','mafia','doctor','detective','citizen'].map(r=>`<button class="chipb ${fav===r?'on':''}" onclick="AF.fav='${r}';render()">${r?t(r):t('aNone')}</button>`).join('')}</div>
    <button class="btn primary mt" onclick="saveProfile()">${t('aSave')}</button></div>
   <div class="sec"><div class="sh"><h3>Telegram</h3>${u.tg?`<span class="badge ok">${t('aLinked')}</span>`:''}</div><p class="mpinfo" style="margin:0 0 10px">${t(u.tg?'aTgOk':'aTgWhy')}</p>
    ${u.tg?'':`<button class="btn ghost" onclick="linkTg()">${t('aTgLink')}</button>`}</div>
   <button class="btn ghost" onclick="signOut()">${t('aOut')}</button><button class="danger" onclick="delAcct()">${t('aDel')}</button>`;}
function forgotView(){
  if(RS&&RS.ok)return head(t('aForgot'))+`<div class="sec"><p class="mpinfo" style="margin-top:0">${t('aNewPw')}</p><div class="flbl">${t('aPass')}</div><input id="rpw" class="search" type="password" maxlength="100" style="direction:ltr">
     <div class="flbl">${t('aPass2')}</div><input id="rpw2" class="search" type="password" maxlength="100" style="direction:ltr"><button class="btn primary mt" onclick="resetFinish()">${t('aSetPw')}</button></div>`;
  if(RS)return head(t('aForgot'))+`<div class="big"><div class="spin"></div><p class="hint">${t('aWaitTg')}</p><button class="btn ghost" onclick="RS=null;render()">${t('cancel')}</button></div>`;
  return head(t('aForgot'))+`<p class="mpinfo">${t('aForgotD')}</p><div class="sec"><div class="flbl" style="margin-top:0">${t('aUser')}</div><input id="run" class="search" maxlength="20" autocapitalize="none" style="direction:ltr">
   <button class="btn primary mt" onclick="resetStart()">${t('aViaTg')}</button></div>`;}

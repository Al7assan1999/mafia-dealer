/* ---------- friends (relay /acc/friends, /acc/friend/*, /acc/invite, /acc/inbox): signed-in accounts only ---------- */
let FR: {friends: Friend[]; inc: Friend[]; out: Friend[]}=null;  // the full lists, loaded for the Friends screen and the invite sheet
let FREL: Record<string,string>={},FON=0,FREQ=0;  // from the inbox check: relation per account, friends online, requests waiting
let INV: Invite[]=[];const INVOFF: number[]=[];  // invites waiting; ones already joined or dismissed here
const invSent: Record<string,boolean>={};  // friend id + room code already invited
let FP: Friend=null;  // the account card on the profile screen
let inboxSig='';

const fmtCode=(c: string)=>`<bdi dir="ltr" style="white-space:nowrap">${c.slice(0,3)} ${c.slice(3)}</bdi>`;  // HTML: reads 482 913 in Arabic too, never wraps
/** What friends see about me: '' | 'room' | 'game'. */
const myStatus=()=>G||(MP.role==='host'&&MP.game)||(MP.role==='client'&&MP.room&&MP.room.g)?'game':MP.role?'room':'';
const stTxt=(f: Friend)=>f.on?t(f.st==='game'?'fInGame':f.st==='room'?'fInRoom':'fOnline'):t('fOffline');

/** Every 10 s while the app is open: tells the relay I'm here, picks up invites and friend requests. */
function inboxTick(): Promise<void>{if(!S.acct||document.hidden)return Promise.resolve();
  return aReq('/acc/inbox',{st:myStatus(),hide:!!S.hideOnline}).then(j=>{FREL=j.rel||{};FON=j.on||0;FREQ=j.req||0;
    INV=(j.inv||[]).filter(v=>!INVOFF.includes(v.id));invBar();
    const sig=JSON.stringify([FREL,FON,FREQ]);if(sig===inboxSig)return;inboxSig=sig;
    const typing=document.activeElement&&document.activeElement.tagName==='INPUT';
    if(!G&&!typing&&!$('modal').innerHTML&&(['home','friends'].includes(V)||V==='host'&&!MP.game||V==='join'&&!(MP.room&&MP.room.g)))render();}).catch(()=>{});}

/* the invite banner (#inv sits outside #app, so screens can change under it) */
function invBar(){const el=$('inv');if(!el)return;
  for(const v of INV.slice())if(MP.online&&MP.online.code===v.code)invDone(v.id);  // already in that room
  const v=INV[0];
  el.innerHTML=v?`<div class="invbar">${avatarHtml(v.from.avatar,v.from.id,40)}<div><b>${esc(v.from.display)}</b><small>${t('fInvites',{c:fmtCode(v.code)})}</small></div>
    <button class="btn primary" onclick="invJoin(${v.id})">${t('fJoin')}</button><button class="x" aria-label="${t('cancel')}" onclick="invDone(${v.id})">✕</button></div>`:'';}
function invDone(id: number){INVOFF.push(id);INV=INV.filter(v=>v.id!==id);aReq('/acc/invite/done',{id}).catch(()=>{});invBar();}
function invJoin(id: number){const v=INV.find(x=>x.id===id);if(!v)return;invDone(id);
  const go=()=>{hush();if(G){stopTimer();if(!G.mp)save();G=null;}if(MP.role==='host')hostStop();else if(MP.role==='client')clientStop(true);
    $('modal').innerHTML='';MP.lastMode='online';V='mp';joinOnline(v.code);};
  if(G||MP.role)ask(t('fLeaveQ'),t('fLeaveD'),t('fJoin'),go);else go();}

/* lists and actions */
function friendsLoad(){return aReq('/acc/friends').then(j=>{FR=j;for(const l of [j.friends,j.inc,j.out])for(const f of l)FREL[f.id]=f.rel;if(V==='friends')render();})
  .catch(e=>{if(!FR){FR={friends:[],inc:[],out:[]};if(V==='friends')render();}aErr(e);});}
function openFriends(){nav('friends');if(me())friendsLoad();}
function friendAdd(){const u=($('fun').value||'').trim().replace(/^@/,'');if(u)friendReq({uname:u});}
function friendReq(body: {uname?: string; id?: string}){aReq('/acc/friend/request',body).then(j=>{FREL[j.user.id]=j.rel;if(FP&&FP.id===j.user.id)FP.rel=j.rel;
  toast(t(j.rel==='ok'?'fNowFriends':'fReqSent',{n:j.user.display}));if($('fun'))$('fun').value='';if(V==='friends')friendsLoad();render();}).catch(aErr);}
function friendDo(act: string,id: string){
  const run=()=>aReq('/acc/friend/'+act,{id}).then(j=>{FREL[id]=j.rel;if(FP&&FP.id===id)FP.rel=j.rel;if(act==='accept')toast(t('fAccepted'));if(V==='friends')friendsLoad();render();}).catch(aErr);
  if(act!=='remove'||FREL[id]!=='ok'){run();return;}
  const f=FP&&FP.id===id?FP:FR&&FR.friends.find(x=>x.id===id);ask(t('fRemoveQ',{n:esc(f?f.display:'')}),t('fRemoveD'),t('fRemove'),run);}
function openFriend(id: string){const f=FR&&[...FR.friends,...FR.inc,...FR.out].find(x=>x.id===id);openAcct(id,f?f.display:'',f);}
/** A profile for an account: stats from the games here plus its card from the relay. */
function openAcct(id: string,name: string,f?: Friend){PROF='a:'+id;PROFN=name;FP=f||null;profRet=V;nav('profile');
  if(me())aReq('/acc/user/'+id).then(j=>{if(PROF!=='a:'+id)return;FP=j.user;PROFN=j.user.display;if(V==='profile')render();}).catch(()=>{});}

/* screens */
const fRow=(f: Friend,btns: string,noLink?: boolean)=>`<div class="prs">${f.rel==='ok'?`<span class="dot ${f.on?'on':''}"></span>`:''}
  <${noLink?'div':'button'} class="fl" ${noLink?'':`onclick="openFriend('${f.id}')"`}>${avatarHtml(f.avatar,f.id,32)}<div class="fn"><b>${esc(f.display)}</b><span>${f.rel==='ok'?stTxt(f):'<bdi dir="ltr">@'+esc(f.uname)+'</bdi>'}</span></div></${noLink?'div':'button'}>${btns}</div>`;
/** "+ Add" next to a signed-in player in a room, until there is a request either way. */
const plusBtn=(uid: string)=>uid&&me()&&uid!==me().id&&!FREL[uid]?`<button class="mini" onclick="friendReq({id:'${uid}'})" aria-label="${t('fAddFriend')}">+ ${t('fAddBtn')}</button>`:'';
function friendsView(){
  if(!me())return head(t('friendsT'))+`<p class="mpinfo">${t('fWhy')}</p><button class="btn primary" onclick="nav('account')">${t('aIn')} / ${t('aUp')}</button>`;
  const add=`<div class="sec"><div class="flbl" style="margin-top:0">${t('fAdd')}</div><div class="prow" style="margin:0"><input id="fun" maxlength="21" autocapitalize="none" autocomplete="off" placeholder="@username" style="direction:ltr" onkeydown="if(event.key==='Enter')friendAdd()"><button class="pill" onclick="friendAdd()">${t('fAddBtn')}</button></div></div>`;
  const F=FR;if(!F)return head(t('friendsT'))+add+`<div class="big"><div class="spin"></div></div>`;
  const inc=F.inc.length?`<div class="sec"><div class="sh"><h3>${t('fRequests')}</h3><span class="badge new">${F.inc.length}</span></div>${F.inc.map(f=>fRow(f,`<button class="mini" onclick="friendDo('accept','${f.id}')">${t('fAccept')}</button><button class="mini bad" onclick="friendDo('decline','${f.id}')">${t('fDecline')}</button>`)).join('')}</div>`:'';
  const list=`<div class="sec"><div class="sh"><h3>${t('fList',{n:F.friends.length})}</h3></div>${F.friends.length?F.friends.map(f=>fRow(f,'')).join(''):`<p class="mpinfo" style="margin:0">${t('fNone')}</p>`}</div>`;
  const out=F.out.length?`<div class="sec"><div class="sh"><h3>${t('fSent')}</h3></div>${F.out.map(f=>fRow(f,`<button class="mini" onclick="friendDo('remove','${f.id}')">${t('cancel')}</button>`)).join('')}</div>`:'';
  return head(t('friendsT'))+add+inc+list+out;}
/** The account card at the top of a profile, with Add / Accept / Cancel / Remove. */
function acctCard(id: string){const mine=me()&&me().id===id,f: Friend=mine?Object.assign({rel:'me'},me()):FP&&FP.id===id?FP:null;
  const btn=!me()||mine||!f?'':f.rel==='ok'?`<button class="btn ghost" onclick="friendDo('remove','${id}')">${t('fRemove')}</button>`
    :f.rel==='out'?`<button class="btn ghost" onclick="friendDo('remove','${id}')">${t('fCancelReq')}</button>`
    :f.rel==='in'?`<button class="btn primary" onclick="friendDo('accept','${id}')">${t('fAccept')}</button>`
    :`<button class="btn primary" onclick="friendReq({id:'${id}'})">${IC.friend}${t('fAddFriend')}</button>`;
  return `<div class="sec pcard"><div class="meline">${avatarHtml(f?f.avatar:'p:0',id,56)}<div><b>${esc(f?f.display:PROFN)}</b><small style="direction:ltr">${f?'@'+esc(f.uname):t('verifiedAcct')}</small>
    ${f&&f.rel==='ok'?`<small><span class="dot ${f.on?'on':''}"></span>${stTxt(f)}</small>`:''}${f&&f.fav?`<small>${t('aFav')}: <span style="color:${RC[f.fav]};font-weight:800">${t(f.fav)}</span></small>`:''}</div></div>${btn?`<div class="mt">${btn}</div>`:''}</div>`;}
/** Lobby of an online room: pick friends to invite. */
function inviteSheet(){if(!me()){toast(t('needAcct'));return;}invSheetDraw(true);friendsLoad().then(()=>invSheetDraw());}
function invSheetDraw(open?: boolean){if(!MP.online||!open&&!document.querySelector('#modal .flist'))return;const code=MP.online.code,F=FR;
  const rows=!F?`<div class="spin" style="margin:18px auto"></div>`:F.friends.length?F.friends.map(f=>{const sent=invSent[f.id+code];
    return fRow(f,`<button class="mini" ${sent?'disabled':''} onclick="inviteGo('${f.id}')">${t(sent?'fInvited':'fInviteBtn')}</button>`,true);}).join(''):`<p class="mpinfo">${t('fNoneInv')}</p>`;
  $('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)$('modal').innerHTML=''"><div class="sheet"><h3>${t('fInviteT')}</h3><p>${t('fInviteD',{c:fmtCode(code)})}</p>
    <div class="flist">${rows}</div><button class="btn ghost mt" onclick="$('modal').innerHTML=''">${t('fClose')}</button></div></div>`;}
function inviteGo(id: string){const code=MP.online&&MP.online.code;if(!code)return;invSent[id+code]=true;invSheetDraw();
  aReq('/acc/invite',{id,code}).then(j=>toast(t(j.tg?'fInvTg':'fInvSent'))).catch(e=>{delete invSent[id+code];invSheetDraw();aErr(e);});}

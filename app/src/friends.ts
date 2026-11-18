/* ---------- friends (relay /acc/friends, /acc/friend/*, /acc/invite, /acc/inbox): signed-in accounts only ---------- */
let FR: {friends: Friend[]; inc: Friend[]; out: Friend[]}=null;  // the full lists, for the drawer and the Friends screen
let FREL: Record<string,string>={},FON=0,FREQ=0;  // from the inbox check: relation per account, friends online, requests waiting
let INV: Invite[]=[];const INVOFF: number[]=[];  // invites waiting; ones already joined or dismissed here
const invSent: Record<string,number>={};  // friend id + room code: when I invited (Invite again after 5 s)
let NOTES: Note[]=[];  // notes from the relay: 'X accepted your request' (7 days)
let FTAB='f';  // Friends screen tab: f friends, r requests, s sent
const AGAIN=5000;
let FP: Friend=null;  // the account card on the profile screen
let inboxSig='';
let JR: Invite[]=[];const JROFF: number[]=[];  // friends asking to join my room (code is empty); ones answered here
const jrAsked: Record<string,number>={};  // friends I asked to let me in: their invite back joins by itself
let jrTimer: any;

const fmtCode=(c: string)=>`<bdi dir="ltr" style="white-space:nowrap">${c.slice(0,3)} ${c.slice(3)}</bdi>`;  // HTML: reads 482 913 in Arabic too, never wraps
/** What friends see about me: '' | 'room' | 'game'. */
const myStatus=()=>G||(MP.role==='host'&&MP.game)||(MP.role==='client'&&MP.room&&MP.room.g)?'game':MP.role?'room':'';
/** In an online lobby before a game: friends may ask to join. */
const myOpen=()=>!!(MP.online&&!G&&(MP.role==='host'&&!MP.game||MP.role==='client'&&MP.status==='ok'&&!(MP.room&&MP.room.g)));
const stTxt=(f: Friend)=>f.on?t(f.st==='game'?'fInGame':f.st==='room'?'fInRoom':'fOnline'):t('fOffline');

/** Every 10 s while the app is open: tells the relay I'm here, picks up invites and friend requests. */
function inboxTick(): Promise<void>{if(!S.acct||document.hidden)return Promise.resolve();
  return aReq('/acc/inbox',{st:myStatus(),op:myOpen()?1:0,hide:!!S.hideOnline}).then(j=>{FREL=j.rel||{};FON=j.on||0;FREQ=j.req||0;
    INV=(j.inv||[]).filter(v=>!INVOFF.includes(v.id));JR=(j.jr||[]).filter(v=>!JROFF.includes(v.id));NOTES=j.nt||[];nInbox(j.inv||[],j.jr||[]);
    const back=INV.find(v=>v.ans);if(back){delete jrAsked[back.from.id];toast(t('fLetYouIn',{n:back.from.display}));invJoin(back.id);}  // the friend I asked let me in
    invBar();
    const sig=JSON.stringify([FREL,FON,FREQ,j.sg||'']);if(sig===inboxSig)return;inboxSig=sig;
    if(dockShown()||V==='friends')friendsLoad(true);else dockDraw();  // someone came online, a request arrived...
    const typing=document.activeElement&&document.activeElement.tagName==='INPUT';
    if(!G&&!typing&&!$('modal').innerHTML&&(V==='host'&&!MP.game||V==='join'&&!(MP.room&&MP.room.g)))render();}).catch(()=>{});}  // "+ Add" in lobbies

/* the invite banner (#inv sits outside #app, so screens can change under it) */
function invBar(){bellDraw();const el=$('inv');if(!el)return;
  for(const v of INV.slice())if(MP.online&&MP.online.code===v.code)invDone(v.id,'joined');  // already in that room
  const r=JR[0];
  if(r){el.innerHTML=`<div class="invbar">${avatarHtml(r.from.avatar,r.from.id,40)}<div><b>${esc(r.from.display)}</b><small>${t('fWantsJoin')}</small></div>
    <button class="btn primary" onclick="jrLet(${r.id})">${t('fLetIn')}</button><button class="x" aria-label="${t('cancel')}" onclick="jrDone(${r.id})">✕</button></div>`;return;}
  const v=INV[0];
  el.innerHTML=v?`<div class="invbar">${avatarHtml(v.from.avatar,v.from.id,40)}<div><b>${esc(v.from.display)}</b><small>${t(v.ans?'fLetYou':'fInvites',{c:fmtCode(v.code)})}</small></div>
    <button class="btn primary" onclick="invJoin(${v.id})">${t('fJoin')}</button><button class="x" aria-label="${t('cancel')}" onclick="invDone(${v.id})">✕</button></div>`:'';}
function invDone(id: number,st='dismissed'){nSet('inv',id,st);INVOFF.push(id);INV=INV.filter(v=>v.id!==id);aReq('/acc/invite/done',{id}).catch(()=>{});invBar();}
/* asking to join a friend's online lobby: they answer with a normal invite */
function jrDone(id: number,st='dismissed'){nSet('jr',id,st);JROFF.push(id);JR=JR.filter(v=>v.id!==id);aReq('/acc/invite/done',{id}).catch(()=>{});invBar();}
/** Let in = an invite back; the relay marks it 'let you in' and removes the request itself (deleting it here first would race that). */
function jrLet(id: number){const r=JR.find(x=>x.id===id);if(!r)return;
  if(!myOpen()){jrDone(id);toast(t('fLetGone'));return;}
  nSet('jr',id,'letin');JROFF.push(id);JR=JR.filter(v=>v.id!==id);invBar();inviteGo(r.from.id,r.from.display);}
function joinAsk(id: string){const f=FR&&FR.friends.find(x=>x.id===id);jrAsked[id]=Date.now();fRedraw();setTimeout(fRedraw,AGAIN+50);
  aReq('/acc/joinreq',{id}).then(()=>{toast(t('fAskSent',{n:f?f.display:''}));
    clearInterval(jrTimer);const end=Date.now()+120e3;jrTimer=setInterval(()=>{if(Date.now()>end||!Object.keys(jrAsked).length)clearInterval(jrTimer);else inboxTick();},3000);})  // answer quickly
  .catch(e=>{delete jrAsked[id];fRedraw();aErr(e);});}
function invJoin(id: number){const v=INV.find(x=>x.id===id);if(!v)return;invDone(id,'joined');joinCode(v.code);}
/** Join an online room from an invite or an invite link; leaving a room or game asks first. */
function joinCode(code: string){if(MP.online&&MP.online.code===code&&MP.role)return;
  const go=()=>{hush();if(G){stopTimer();if(!G.mp)save();G=null;}if(MP.role==='host')hostStop();else if(MP.role==='client')clientStop(true);
    $('modal').innerHTML='';MP.lastMode='online';V='home';joinOnline(code);};
  if(G||MP.role)ask(t('fLeaveQ'),t('fLeaveD'),t('fJoin'),go);else go();}
/** The app was opened (or brought back) by an invite link https://<relay>/j/<code> (Android app link, v2.11). */
function deepLink(u?: string){if(u==null)try{u=(window.Net&&Net.link&&Net.link())||'';}catch(e){u='';}if(u&&WL.on)welcomeEnd();  // a link while the welcome plays: straight in
  const m=/\/j\/(\d{6})(?:[/?#]|$)/.exec(u);if(m)joinCode(m[1]);else if(/\/u(?:[/?#]|$)/.test(u))updLink();else if(u==='md:room'&&roomMinned()){if(chView)chClose();roomBack();}}  // the host's notification (in a game the game is already on screen)

/* lists and actions */
function friendsLoad(quiet?: boolean){if(!me())return Promise.resolve();
  return aReq('/acc/friends').then(j=>{FR=j;FREQ=j.inc.length;nReqs(j.inc);for(const l of [j.friends,j.inc,j.out])for(const f of l)FREL[f.id]=f.rel;fListsDraw();dockDraw();bellDraw();})
  .catch(e=>{if(!FR){FR={friends:[],inc:[],out:[]};fListsDraw();dockDraw();}if(!quiet)aErr(e);});}
function openFriends(){if(S.fpanel){S.fpanel=false;save();}nav('friends');friendsLoad();}
function friendAdd(){const u=($('fun').value||'').trim().replace(/^@/,'');if(u)friendReq({uname:u});}
function friendReq(body: {uname?: string; id?: string}){aReq('/acc/friend/request',body).then(j=>{FREL[j.user.id]=j.rel;if(j.rel==='ok')nSet('req',j.user.id,'accepted');if(FP&&FP.id===j.user.id)FP.rel=j.rel;
  toast(t(j.rel==='ok'?'fNowFriends':'fReqSent',{n:j.user.display}));if($('fun'))$('fun').value='';friendsLoad(true);render();}).catch(aErr);}
function friendDo(act: string,id: string){
  const run=()=>aReq('/acc/friend/'+act,{id}).then(j=>{FREL[id]=j.rel;if(act==='accept'||act==='decline')nSet('req',id,act==='accept'?'accepted':'declined');if(FP&&FP.id===id)FP.rel=j.rel;if(act==='accept')toast(t('fAccepted'));friendsLoad(true);render();}).catch(aErr);
  if(act!=='remove'||FREL[id]!=='ok'){run();return;}
  const f=FP&&FP.id===id?FP:FR&&FR.friends.find(x=>x.id===id);ask(t('fRemoveQ',{n:esc(f?f.display:'')}),t('fRemoveD'),t('fRemove'),run);}
function openFriend(id: string){const f=FR&&[...FR.friends,...FR.inc,...FR.out].find(x=>x.id===id);openAcct(id,f?f.display:'',f);}
/** A profile for an account: stats from the games here plus its card from the relay. */
function openAcct(id: string,name: string,f?: Friend){if(S.fpanel){S.fpanel=false;save();}PROF='a:'+id;PROFN=name;FP=f||null;if(V!=='profile')profRet=V;nav('profile');
  if(me())aReq('/acc/user/'+id).then(j=>{if(PROF!=='a:'+id)return;FP=j.user;PROFN=j.user.display;if(V==='profile')render();}).catch(()=>{});}

/* screens */
/** Status for the avatar ring and the pill: on | room | game | off ('' when not a friend). */
const stCls=(f: Friend)=>f.rel!=='ok'?'':!f.on?'off':f.st==='game'?'game':f.st==='room'?'room':'on';
const fAv=(f: Friend,size: number)=>`<span class="fav ${stCls(f)}">${avatarHtml(f.avatar,f.id,size)}</span>`;
const fSub=(f: Friend)=>f.rel==='ok'?`<span class="stp ${stCls(f)}">${stTxt(f)}</span>`:`<bdi dir="ltr" class="un">@${esc(f.uname)}</bdi>`;
const fRow=(f: Friend,btns: string,noLink?: boolean)=>`<div class="prs fr">
  <${noLink?'div':'button'} class="fl" ${noLink?'':`onclick="openFriend('${f.id}')"`}>${fAv(f,40)}<div class="fn"><b>${esc(f.display)}</b>${fSub(f)}</div></${noLink?'div':'button'}>${btns}</div>`;
/** "+ Add" next to a signed-in player in a room, until there is a request either way. */
const plusBtn=(uid: string)=>uid&&me()&&uid!==me().id&&!FREL[uid]?`<button class="mini" onclick="friendReq({id:'${uid}'})" aria-label="${t('fAddFriend')}">+ ${t('fAddBtn')}</button>`:'';
/** In an online lobby: Invite; a friend in one: Ask to join. After a tap: Invited/Asked for 5 s, then Invite/Ask again. */
const roomCode=()=>myOpen()?MP.online.code:'';
/** Accounts in my room right now (host: the players; player: everyone the host lists). */
const roomUids=()=>MP.role==='host'?Object.values(MP.players).filter(q=>q.on).map(q=>q.uid):((MP.room&&MP.room.players)||[]).map((q: RoomPlayer)=>q.uid);
function fAct(f: Friend){if(f.rel!=='ok')return '';const code=roomCode(),now=Date.now();
  const b=(at: number,fn: string,k: string[])=>{const wait=now-at<AGAIN;return `<button class="mini${wait?'':' pri'}" ${wait?'disabled':''} onclick="${fn}">${t(wait?k[1]:at?k[2]:k[0])}</button>`;};
  if(code&&roomUids().includes(f.id))return `<span class="stp inroom">${t('fInYourRoom')}</span>`;
  if(code)return b(invSent[f.id+code]||0,`inviteGo('${f.id}')`,['fInviteBtn','fInvited','fInviteAgain']);
  if(f.op)return b(jrAsked[f.id]||0,`joinAsk('${f.id}')`,['fAskJoin','fAsked','fAskAgain']);
  if(!MP.role&&f.on&&!f.st)return b(0,`inviteNew('${f.id}')`,['fInviteBtn','fInvited','fInviteAgain']);  // not in a room: Invite opens one (online friends only)
  return '';}
const reqBtns=(f: Friend)=>`<button class="mini pri" onclick="friendDo('accept','${f.id}')">${t('fAccept')}</button><button class="mini bad" onclick="friendDo('decline','${f.id}')">${t('fDecline')}</button>`;
/** Friends grouped Online / Offline, each with its main action. */
function fGroups(list: Friend[]){const on=list.filter(f=>f.on),off=list.filter(f=>!f.on);
  const g=(k: string,l: Friend[])=>l.length?`<div class="flbl">${t(k)} · ${l.length}</div>${l.map(f=>fRow(f,fAct(f))).join('')}`:'';
  return g('fOnlineG',on)+g('fOfflineG',off);}
const fEmpty=(icon: string,txt: string)=>`<div class="fempty">${icon}<p>${txt}</p></div>`;
function friendsView(){
  if(!me())return head(t('friendsT'))+`<p class="mpinfo">${t('fWhy')}</p><button class="btn primary" onclick="nav('account')">${t('aIn')} / ${t('aUp')}</button>`;
  const u=me();
  const card=`<div class="sec mecard"><div class="meline">${avatarHtml(u.avatar,u.id,56)}<div><b>${esc(u.display)}</b><small><bdi>@${esc(u.uname)}</bdi></small></div></div>
    <button class="btn ghost" onclick="shareMe()">${IC.share}${t('fShareMe')}</button></div>`;
  const add=`<div class="prow fadd">${IC.search}<input id="fun" maxlength="21" autocapitalize="none" autocomplete="off" placeholder="@username" style="direction:ltr" onkeydown="if(event.key==='Enter')friendAdd()"><button class="btn primary" onclick="friendAdd()">${t('fAddBtn')}</button></div>`;
  return head(t('friendsT'))+card+add+`<div id="flists">${fListsHtml()}</div>`;}
function shareMe(){const u=me();if(u)shareText(t('fShareTxt',{u:u.uname,l:relayHttp()+'/MafiaDealer.apk'}));}
/** Only the lists are redrawn when they load, so the username box keeps what is being typed. */
function fListsDraw(){if(V!=='friends')return;const el=$('flists');if(el)el.innerHTML=fListsHtml();else render();}
const fRedraw=()=>{dockDraw();fListsDraw();};
function fTab(k: string){FTAB=k;fListsDraw();}
function fListsHtml(){const F=FR;if(!F)return `<div class="big"><div class="spin"></div></div>`;
  const n=(x: number)=>x?` <i class="cnt">${x}</i>`:'';
  const tabs=`<div class="seg ftabs">${[['f',t('fTabF')+n(F.friends.length)],['r',t('fTabR')+n(F.inc.length)],['s',t('fTabS')+n(F.out.length)]]
    .map(([k,l])=>`<button class="${FTAB===k?'on':''}${k==='r'&&F.inc.length?' hot':''}" onclick="fTab('${k}')">${l}</button>`).join('')}</div>`;
  const body=FTAB==='r'?(F.inc.length?F.inc.map(f=>fRow(f,reqBtns(f))).join(''):fEmpty(IC.friend,t('fNoReq')))
    :FTAB==='s'?(F.out.length?F.out.map(f=>fRow(f,`<button class="mini" onclick="friendDo('remove','${f.id}')">${t('cancel')}</button>`)).join(''):fEmpty(IC.friend,t('fNoSent')))
    :(F.friends.length?fGroups(F.friends):fEmpty(IC.users,t('fNone')));
  return tabs+`<div class="sec flist">${body}</div>`;}
/** The account card at the top of a profile, with Add / Accept / Cancel / Remove. */
function acctCard(id: string){const mine=me()&&me().id===id,f: Friend=mine?Object.assign({rel:'me'},me()):FP&&FP.id===id?FP:null;
  const btn=!me()||mine||!f?'':f.rel==='ok'?`<button class="btn ghost" onclick="friendDo('remove','${id}')">${t('fRemove')}</button>`
    :f.rel==='out'?`<button class="btn ghost" onclick="friendDo('remove','${id}')">${t('fCancelReq')}</button>`
    :f.rel==='in'?`<button class="btn primary" onclick="friendDo('accept','${id}')">${t('fAccept')}</button>`
    :`<button class="btn primary" onclick="friendReq({id:'${id}'})">${IC.friend}${t('fAddFriend')}</button>`;
  return `<div class="sec pcard"><div class="meline">${avatarHtml(f?f.avatar:'p:0',id,56)}<div><b>${esc(f?f.display:PROFN)}</b><small><bdi>${f?'@'+esc(f.uname):t('verifiedAcct')}</bdi></small>
    ${f&&f.rel==='ok'?`<small><span class="dot ${f.on?'on':''}"></span>${stTxt(f)}</small>`:''}${f&&f.fav?`<small>${t('aFav')}: <span style="color:${RC[f.fav]};font-weight:800">${t(f.fav)}</span></small>`:''}</div></div>${btn?`<div class="mt">${btn}</div>`:''}</div>`;}
/* the friends drawer (#fdock, outside #app): a tab on the screen edge, slides out over menus and room lobbies, never during a game */
const DOCKV=['home','wifi','online','history','stats','profile','guide','settings','rules'];
const dockShown=()=>!!me()&&!G&&(DOCKV.includes(V)||V.indexOf('game:')===0||V==='host'&&MP.role==='host'&&!MP.game||V==='join'&&!(MP.room&&MP.room.g));
let dockAnim=false;  // slide in only when it opens (redrawing must not replay the animation)
function dockOpen(open: boolean){if(!!S.fpanel===open)return;S.fpanel=open;save();
  if(open){dockAnim=true;try{history.pushState({v:1},'');}catch(e){}friendsLoad(true);}  // phone Back minimizes it first
  dockDraw();}
let dockDrag=0;  // when the side column was last dragged: that touch is not a tap
const tabTap=(f: string)=>`if(Date.now()-dockDrag>400)${f}`;
/** The side column: the friends tab (menus, lobbies) and the chat button (rooms, games). Dragged up and down together. */
function sideHtml(tab: boolean,cb: boolean){const F=FR,on=tab&&F?F.friends.filter(f=>f.on).slice(0,3):[],y=S.ftabY!=null?`top:${Math.min(S.ftabY,innerHeight-170)}px`:'';
  return `<div class="fside" style="${y}">${tab?`<button class="ftab" onclick="${tabTap('dockOpen(true)')}" ontouchstart="dockSwipe(event,1)" aria-label="${t('friendsT')}">${IC.friend}${on.map(f=>avatarHtml(f.avatar,f.id,26)).join('')}<b>${FON}</b>${FREQ?'<i class="rdot"></i>':''}</button>`:''}
    ${cb?`<button class="ftab fchat" onclick="${tabTap('chOpenList()')}" ontouchstart="dockSwipe(event,2)" aria-label="${t('chatT')}">${IC.chat}${chMentN()?'<i class="cnt at">@</i>':chUnread()?`<i class="cnt">${chUnread()}</i>`:''}</button>`:''}</div>`;}
function dockDraw(){scrollLock();const el=$('fdock');if(!el)return;
  const tab=dockShown(),cb=chatShown();if(!cb&&chView)chClose();else if(chView)chDraw();  // out of the game now: the chat rules change
  if(!tab&&!cb){el.innerHTML='';return;}
  if(!tab||!S.fpanel){el.innerHTML=sideHtml(tab,cb);return;}
  const F=FR,code=roomCode(),a=dockAnim?' anim':'';dockAnim=false;
  const rows=!F?`<div class="spin" style="margin:18px auto"></div>`
    :(F.inc.length?`<div class="flbl">${t('fRequests')} · ${F.inc.length}</div>${F.inc.map(f=>fRow(f,reqBtns(f))).join('')}`:'')
     +(F.friends.length?fGroups(F.friends):`<p class="mpinfo" style="margin:4px 0">${t(code?'fNoneInv':'fNone')}</p>`);
  el.innerHTML=`<div class="fdim${a}" onclick="dockOpen(false)"></div><aside class="fdrawer${a}" ontouchstart="dockSwipe(event,0)">
    <div class="fdh"><b>${t('friendsT')}</b><button class="ib" onclick="openFriends()" aria-label="${t('fAddFriend')}" title="${t('fAddFriend')}">${IC.friend}</button><button class="ib" onclick="dockOpen(false)" aria-label="${t('fMin')}" title="${t('fMin')}">${IC.fwd}</button></div>
    ${code?`<p class="mpinfo" style="margin:0 0 4px">${t('fInviteD',{c:fmtCode(code)})}</p>`:''}${rows}</aside>`;}
/** Side column: drag up/down to move it (remembered), swipe the tab inward to open. Drawer: swipe outward to minimize.
 *  (Edge swipes belong to Android's Back gesture.) kind: 0 drawer, 1 friends tab, 2 chat button. */
function dockSwipe(e: TouchEvent,kind: number){const p=e.touches[0],x0=p.clientX,y0=p.clientY,rtl=S.lang==='ar';
  const col=kind?(e.currentTarget as HTMLElement).parentElement:null,top0=col?col.getBoundingClientRect().top:0;let drag=false,y=top0;
  const move=(ev: TouchEvent)=>{if(!col)return;const q=ev.touches[0],dy=q.clientY-y0;
    if(!drag&&Math.abs(dy)>10&&Math.abs(dy)>Math.abs(q.clientX-x0))drag=true;
    if(drag){ev.preventDefault();y=Math.round(Math.max(8,Math.min(top0+dy,innerHeight-col.offsetHeight-8)));col.style.top=y+'px';}};
  const end=(ev: TouchEvent)=>{document.removeEventListener('touchmove',move);document.removeEventListener('touchend',end);
    if(drag){dockDrag=Date.now();S.ftabY=y;save();return;}
    const dx=ev.changedTouches[0].clientX-x0,inward=rtl?dx>40:dx<-40,outward=rtl?dx<-50:dx>50;
    if(kind===1&&inward)dockOpen(true);else if(kind===0&&outward)dockOpen(false);};
  document.addEventListener('touchmove',move,{passive:false});document.addEventListener('touchend',end);}
/** Invite from Home (v2.17): no room yet, so an online room opens with me as host and the invite goes straight away. */
function inviteNew(id: string){if(MP.role)return;hostStart(true);if(MP.role==='host'&&MP.online)inviteGo(id);}
function inviteGo(id: string,name?: string){const code=MP.online&&MP.online.code;if(!code)return;invSent[id+code]=Date.now();fRedraw();setTimeout(fRedraw,AGAIN+50);
  const f=FR&&FR.friends.find(x=>x.id===id);name=name||(f?f.display:'');
  aReq('/acc/invite',{id,code}).then(j=>toast(j.ans?t('fLetInSent',{n:name}):t(j.tg?'fInvTg':'fInvSent'))).catch(e=>{delete invSent[id+code];fRedraw();aErr(e);});}

/* the notification bell (Home, next to the profile): invites, join requests, friend requests, 'X accepted your request' */
const bellN=()=>INV.length+JR.length+FREQ+(S.nlog||[]).filter(n=>(n.k==='acc'||n.k==='ment')&&n.at>(S.bellSeen||0)).length;
const bellBtn=()=>me()?`<button class="ib bell" id="bellb" onclick="bellOpen()" aria-label="${t('notifT')}" title="${t('notifT')}">${IC.bell}${bellN()?`<i class="cnt">${bellN()}</i>`:''}</button>`:'';
function bellBtnDraw(){const b=$('bellb');if(b)b.outerHTML=bellBtn();}
function bellOpen(){S.bellSeen=Date.now();save();friendsLoad(true);
  $('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)bellClose()"><div class="sheet bellsh" id="bellsh">${bellHtml()}</div></div>`;bellBtnDraw();scrollLock();}
function bellClose(){if($('bellsh'))$('modal').innerHTML='';bellBtnDraw();scrollLock();}
function bellDraw(){const el=$('bellsh');if(el)el.innerHTML=bellHtml();bellBtnDraw();}
const ago=(ts: number)=>{const s=(Date.now()-ts)/1000,[v,u]=s<3600?[Math.max(1,Math.round(s/60)),'minute']:s<86400?[Math.round(s/3600),'hour']:[Math.round(s/86400),'day'];
  try{return new (Intl as any).RelativeTimeFormat(S.lang,{style:'short',numeric:'auto'}).format(-v,u);}catch(e){return '';}};
function bellHtml(){const x=(fn: string)=>`<button class="mini nx" aria-label="${t('cancel')}" onclick="${fn}">✕</button>`;
  const L=(S.nlog||[]).slice().sort((p,q)=>(p.st?1:0)-(q.st?1:0)||q.at-p.at);  // waiting for an answer first, then the newest
  const row=(n: NLog)=>{const f=n.from;
    if(n.k==='ment'){const live=nMentLive(n);  // a chat mention: Open while that room is still on, then read-only
      return `<div class="prs bi${live?'':' ro'}">${f.id?avatarHtml(f.avatar,f.id,40):chAv({name:f.display} as RoomPlayer,40)}<div class="fn"><b>${esc(f.display)}</b><span>${t('nMent')} · ${ago(n.at)}</span><q dir="auto">${esc(n.x||'')}</q></div>
        ${live?`<button class="mini pri" onclick="bellClose();chOpenAt(${n.conv},${n.id})">${t('nOpen')}</button>`:`<span class="nst gone">${t('ns_ended')}</span>`}</div>`;}
    const txt=n.k==='inv'?t(n.ans?'fLetYou':'fInvites',{c:fmtCode(n.code||'')}):n.k==='jr'?t('fWantsJoin'):n.k==='req'?t('nReq'):t('nAcc');
    const btns=n.st?`<span class="nst ${n.st}">${t('ns_'+n.st)}</span>`
      :n.k==='inv'?`<button class="mini pri" onclick="bellClose();invJoin(${n.id})">${t('fJoin')}</button>`+x(`invDone(${n.id})`)
      :n.k==='jr'?`<button class="mini pri" onclick="bellClose();jrLet(${n.id})">${t('fLetIn')}</button>`+x(`jrDone(${n.id})`)
      :n.k==='req'?reqBtns(f):'';
    return `<div class="prs bi${n.st?' ro':''}">${avatarHtml(f.avatar,f.id,40)}<div class="fn"><b>${esc(f.display)}</b><span>${txt} · ${ago(n.at)}</span></div>${btns}</div>`;};
  return `<div class="sh"><h3>${t('notifT')}</h3>${L.some(n=>n.st||n.k==='acc'||n.k==='ment')?`<button class="link" onclick="nClear()">${t('nClear')}</button>`:''}</div>
    <div class="bl">${L.map(row).join('')||`<div class="fempty">${IC.bell}<p>${t('nNone')}</p></div>`}</div><p class="mpinfo" style="margin:8px 2px 0">${t('nKept')}</p><button class="btn ghost mt" onclick="bellClose()">${t('ok')}</button>`;}
/* the bell's history (v2.12): kept 24 h on this phone; once answered (or gone) an item stays as a read-only row */
const NDAY=24*3600e3,INV_TTL=30*60e3;
function nSave(fn: (L: NLog[])=>boolean){const L=S.nlog||(S.nlog=[]);if(fn(L)){save();bellDraw();}}
/** New invites, join requests and notes from the inbox check; ones the relay no longer has are expired (or gone). */
function nInbox(inv: Invite[],jr: Invite[]){const now=Date.now();
  nSave(L=>{let ch=false;
    const add=(k: string,v: Invite)=>{const key=k+':'+v.id;if(L.some(n=>n.key===key))return;
      for(let i=L.length-1;i>=0;i--)if(L[i].k===k&&!L[i].st&&L[i].from.id===v.from.id&&(L[i].code||'')===(v.code||''))L.splice(i,1);  // sent again: the new one replaces it
      L.push({key,k,id:v.id,from:v.from,at:v.at||now,code:v.code||'',st:'',ans:v.ans?1:0});ch=true;};
    for(const v of inv)add('inv',v);for(const v of jr)add('jr',v);
    for(const v of NOTES){if(!L.some(n=>n.key==='acc:'+v.id)){L.push({key:'acc:'+v.id,k:'acc',id:v.id,from:v.from,at:v.at||now,st:''});ch=true;}
      aReq('/acc/note/done',{id:v.id}).catch(()=>{});}  // kept here from now on
    NOTES=[];
    for(const n of L)if(!n.st&&(n.k==='inv'||n.k==='jr')&&!(n.k==='inv'?inv:jr).some(v=>v.id===n.id)){n.st=now-n.at>=INV_TTL?'expired':'gone';n.done=now;ch=true;}
    const keep=L.filter(n=>(!n.st&&n.k!=='acc'&&n.k!=='ment')||now-n.at<NDAY);if(keep.length!==L.length){L.length=0;L.push(...keep);ch=true;}
    return ch;});}
/** Friend requests waiting (from the friends list); answered elsewhere they turn read-only. */
function nReqs(inc: Friend[]){const now=Date.now();
  nSave(L=>{let ch=false;
    for(const f of inc)if(!L.some(n=>n.key==='req:'+f.id&&!n.st)){for(let i=L.length-1;i>=0;i--)if(L[i].key==='req:'+f.id)L.splice(i,1);L.push({key:'req:'+f.id,k:'req',id:f.id,from:f,at:now,st:''});ch=true;}
    for(const n of L)if(n.k==='req'&&!n.st&&!inc.some(f=>f.id===n.id)){n.st=FREL[n.id]==='ok'?'accepted':'gone';n.done=now;ch=true;}
    return ch;});}
function nSet(k: string,id: any,st: string){nSave(L=>{const n=L.find(x=>x.key===k+':'+id&&!x.st);if(!n)return false;n.st=st;n.done=Date.now();return true;});}
/** Clear: the answered items and the notes go; ones still waiting for an answer stay. */
function nClear(){nSave(L=>{const keep=L.filter(n=>!n.st&&n.k!=='acc'&&n.k!=='ment');L.length=0;L.push(...keep);return true;});}
/** While the friends drawer, the bell or the chat is open, only that panel scrolls (not the screen behind it). */
function scrollLock(){document.documentElement.classList.toggle('lock',!!(S.fpanel&&dockShown()||chView||$('bellsh')));}

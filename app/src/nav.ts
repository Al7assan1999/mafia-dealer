const RET: Record<string,string>={};  // per screen: where Back returns (account, rules, settings)
function nav(v: string){if(['account','rules','settings'].includes(v)&&V!==v&&!(v==='account'&&V==='forgot'))RET[v]=V;if(S.group&&['history','stats','settings'].includes(v))setTimeout(gSync,0);V=v;try{history.pushState({v:1},'');}catch(e){}render();window.scrollTo(0,0);}
function popNav(){if(V==='rules'||V==='settings'){V=RET[V]||'home';render();return;}MP.lastMode=MP.online?'online':(MP.lastMode||'wifi');if(V==='forgot'){V='account';render();return;}if(V==='account'){V=RET.account||'home';render();return;}if(V==='profile'){V=profRet;render();return;}const was=MP.online?'online':(MP.lastMode||'wifi');if(V==='host')hostStop();if(V==='join')clientStop(true);
V=V.indexOf('game:')===0?'history':(V==='host'||V==='join')?was:'home';render();window.scrollTo(0,0);}
function back(){const v=V;try{history.back();}catch(e){}setTimeout(()=>{if(V===v&&!G&&!inRoom())popNav();},300);}
/* leaving a room always asks first (buttons, header arrow and the phone's Back button) */
/* minimizing a room (v2.12, lobby only): the room keeps running while you use the menus; a bar at the top brings you back */
const roomLobby=()=>MP.role==='host'?!MP.game&&!G:MP.role==='client'&&MP.status==='ok'&&!(MP.room&&MP.room.g);
const roomMinned=()=>(MP.role==='host'||MP.role==='client'&&['ok','lost','joining','search'].includes(MP.status))&&!G&&V!=='host'&&V!=='join';  // a live room only (not one that ended: kicked, closed...)
function roomMin(){if(roomLobby())nav('home');}
function roomBack(){if(MP.role)nav(MP.role==='host'?'host':'join');}
/** Starting something else while a room is minimized asks to leave it first. */
function leaveFirst(fn: ()=>void){if(!roomMinned()){fn();return;}
  ask(t('lfQ'),t('lfD'),t('leave'),()=>{if(MP.role==='host')hostStop();else clientStop(true);rbarDraw();fn();});}
function rbarDraw(){const el=$('rbar');if(!el)return;const on=roomMinned();document.body.classList.toggle('rmin',on);
  if(!on){if(el.innerHTML)el.innerHTML='';return;}
  const txt=MP.role==='host'?t('rbHost',{n:1+Object.values(MP.players).filter(q=>q.on).length}):t(MP.status==='ok'?'rbIn':'rbLost',{n:esc((MP.host&&MP.host.name)||'')});
  const h=`<button class="rbar" onclick="roomBack()"><i class="dot ${MP.role==='host'||MP.status==='ok'?'on':''}"></i><span>${txt}</span><b>${t('rbBack')} ${IC.fwd}</b></button>`;
  if(el.innerHTML!==h)el.innerHTML=h;}
const inRoom=()=>(V==='host'&&MP.role==='host')||(V==='join'&&MP.role==='client'&&['ok','lost','joining','search'].includes(MP.status));
function askLeaveRoom(){if(V==='host')ask(t('closeQ'),t('closeD'),t('closeRoom'),leaveNow);else ask(t('leaveQ'),t(MP.room&&MP.room.g?'leaveD':'leaveLobbyD'),t('leave'),leaveNow);}
function leaveNow(){MP.lastMode=MP.online?'online':'wifi';if(V==='host')hostStop();else if(V==='join')clientStop(true);back();}

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
  const c=connInfo();  // v2.20: a connection problem shows in the room bar itself (no second bar)
  const txt=c.cls?c.txt:MP.role==='host'?t('rbHost',{n:1+Object.values(MP.players).filter(q=>q.on).length}):t(MP.status==='ok'?'rbIn':'rbLost',{n:esc((MP.host&&MP.host.name)||'')});
  const h=`<button class="rbar ${c.cls}" onclick="roomBack()"><i class="dot ${c.cls?c.cls:MP.role==='host'||MP.status==='ok'?'on':''}"></i><span>${txt}</span><b>${t('rbBack')} ${IC.fwd}</b></button>`;
  if(el.innerHTML!==h)el.innerHTML=h;}
/** v2.20 connection: lost (my link), wait (the host's link: with the takeover countdown), weak (slow answers), back (2 s after a problem). */
function connInfo(): {cls: string; txt: string}{const now=Date.now();let c={cls:'',txt:''};
  if(MP.role==='client'&&MP.room&&['ok','lost','joining'].includes(MP.status)){const gone=now-(MP.lastOk||now),sn=MP.room.succ,left=Math.max(0,Math.ceil((tkLimit()-gone)/1000));
    const tk=sn?(MP.bk?t('tkYouIn',{s:fmt(left)}):t('tkIn',{n:esc(sn),s:fmt(left)})):'',hn=esc((MP.host&&MP.host.name)||MP.room.host||'');
    if(MP.status==='lost'&&MP.online&&MP.ws&&MP.ws.readyState===1&&!MP.hostOn)c={cls:'wait',txt:t('connHost',{n:hn})+(tk?' · '+tk:'')};
    else if(MP.status==='lost')c={cls:'lost',txt:t('connLost')+(tk&&!MP.online?' · '+tk:'')};
    else if(MP.lat>1200||gone>2500)c={cls:'weak',txt:t('connWeak')};}
  else if(MP.role==='host'&&MP.online&&HN){const N=HN as OnlineNet;
    if(!(N.ws&&N.ws.readyState===1)||now-(N.at||0)>4500)c={cls:'lost',txt:t('connLost')};else if((N.lat||0)>1200||now-(N.at||0)>3000)c={cls:'weak',txt:t('connWeak')};}
  if(c.cls){MP.cPrev=c.cls;MP.cOkAt=0;return c;}
  if(MP.cPrev){MP.cPrev='';MP.cOkAt=now;}
  return MP.cOkAt&&now-MP.cOkAt<2000&&MP.role?{cls:'back',txt:t('connBack')}:c;}
/** The bar at the top while in a room (the room bar carries it when the room is minimized). */
function cbarDraw(){const el=$('cbar');if(!el)return;const c=MP.role&&!roomMinned()&&(inRoom()||(G&&G.mp)||MP.role==='client'&&V==='join')?connInfo():{cls:'',txt:''};
  if(roomMinned())rbarDraw();
  document.body.classList.toggle('cbon',!!c.cls);const h=c.cls?`<div class="cbar ${c.cls}" role="status"><i></i><span>${c.txt}</span></div>`:'';if(el.innerHTML!==h){el.innerHTML=h;
    if(h)document.body.style.setProperty('--cbh',(el.firstElementChild as HTMLElement).offsetHeight+'px');}}  // the page moves down by the bar's real height (2 lines for long names)
const inRoom=()=>(V==='host'&&MP.role==='host')||(V==='join'&&MP.role==='client'&&['ok','lost','joining','search'].includes(MP.status));
function askLeaveRoom(){if(V==='host')ask(t('closeQ'),t('closeD'),t('closeRoom'),leaveNow);else ask(t('leaveQ'),t(MP.room&&MP.room.g?'leaveD':'leaveLobbyD'),t('leave'),leaveNow);}
function leaveNow(){MP.lastMode=MP.online?'online':'wifi';if(V==='host')hostStop();else if(V==='join')clientStop(true);back();}

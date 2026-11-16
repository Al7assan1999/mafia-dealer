let navRet='home';
function nav(v: string){if(v==='account'&&V!=='forgot')navRet=V;if(S.group&&['history','stats','settings'].includes(v))setTimeout(gSync,0);if(v==='rules'||v==='settings')navRet=V;V=v;try{history.pushState({v:1},'');}catch(e){}render();window.scrollTo(0,0);}
function popNav(){if(V==='rules'||V==='settings'){V=navRet;render();return;}MP.lastMode=MP.online?'online':(MP.lastMode||'wifi');if(V==='forgot'){V='account';render();return;}if(V==='account'){V=navRet;render();return;}if(V==='profile'){V=profRet;render();return;}const was=MP.online?'online':(MP.lastMode||'wifi');if(V==='host')hostStop();if(V==='join')clientStop(true);
V=V.indexOf('game:')===0?'history':(V==='host'||V==='join')?was:(V==='wifi'||V==='online')?'mp':'home';render();window.scrollTo(0,0);}
function back(){const v=V;try{history.back();}catch(e){}setTimeout(()=>{if(V===v&&!G&&!inRoom())popNav();},300);}
/* leaving a room always asks first (buttons, header arrow and the phone's Back button) */
const inRoom=()=>(V==='host'&&MP.role==='host')||(V==='join'&&MP.role==='client'&&['ok','lost','joining','search'].includes(MP.status));
function askLeaveRoom(){if(V==='host')ask(t('closeQ'),t('closeD'),t('closeRoom'),leaveNow);else ask(t('leaveQ'),t(MP.room&&MP.room.g?'leaveD':'leaveLobbyD'),t('leave'),leaveNow);}
function leaveNow(){MP.lastMode=MP.online?'online':'wifi';if(V==='host')hostStop();else if(V==='join')clientStop(true);back();}
